import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@platform/database';
import { supabaseAdmin } from '@/lib/supabase';
import { seedTenantStarterData } from '@/lib/seed-starter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      password,
      restaurantName,
      businessType = 'RESTAURANT',
      phone,
      address,
      city,
      state,
      country = 'India',
      tableCount,
    } = body;

    if (!email || !restaurantName || !fullName) {
      return NextResponse.json(
        { error: 'Full name, email, and restaurant name are required.' },
        { status: 400 }
      );
    }

    // 1. Create User in Supabase Auth (auth.users)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'DefaultSecurePassword123!',
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || '',
      },
    });

    if (authError || !authData.user) {
      console.warn('Supabase auth creation note:', authError?.message);
      // If user already exists in auth.users, check if they exist in DB
      if (authError?.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please login instead.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: authError?.message || 'Failed to create authentication account.' },
        { status: 400 }
      );
    }

    const authUserId = authData.user.id;

    // 2. Generate tenant slug
    const baseSlug = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // 3. Create Tenant, BusinessProfile, User record, and RegistrationRequest in PostgreSQL
    const result = await prisma.$transaction(async (tx) => {
      // Create Tenant with PENDING status awaiting Admin approval
      const tenant = await tx.tenant.create({
        data: {
          slug,
          name: restaurantName,
          businessType: businessType as any,
          status: 'PENDING',
        },
      });

      // Update owner_user_id on Tenant
      await tx.$executeRawUnsafe(
        `UPDATE public."Tenant" SET owner_user_id = $1::uuid WHERE id = $2`,
        authUserId,
        tenant.id
      );

      // Create BusinessProfile
      const profile = await tx.businessProfile.create({
        data: {
          tenantId: tenant.id,
          businessName: restaurantName,
          phone: phone || '',
          email,
          address: address || '',
          city: city || 'Bengaluru',
          state: state || 'Karnataka',
          country: country || 'IN',
          currencyCode: 'INR',
          currencySymbol: '₹',
          timezone: 'Asia/Kolkata',
          onboardingCompleted: false,
        },
      });

      // Update user_id on BusinessProfile
      await tx.$executeRawUnsafe(
        `UPDATE public."BusinessProfile" SET user_id = $1::uuid WHERE id = $2`,
        authUserId,
        profile.id
      );

      // Create the 3 linked roles for this restaurant: OWNER, WAITER, KITCHEN
      const ownerRole = await tx.role.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: 'OWNER' } },
        update: {},
        create: {
          tenantId: tenant.id,
          name: 'OWNER',
          description: 'Restaurant Owner with full administrative control',
          isSystem: true,
          permissions: ['*'],
        },
      });

      const waiterRole = await tx.role.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: 'WAITER' } },
        update: {},
        create: {
          tenantId: tenant.id,
          name: 'WAITER',
          description: 'Floor Waiter with POS and order management privileges',
          isSystem: true,
          permissions: [
            'dashboard.view',
            'dashboard.tables',
            'dashboard.orders',
            'pos.*',
            'tables.*',
            'orders.*',
            'menu.view',
            'customers.view',
            'sync.*',
          ],
        },
      });

      const kitchenRole = await tx.role.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: 'KITCHEN' } },
        update: {},
        create: {
          tenantId: tenant.id,
          name: 'KITCHEN',
          description: 'Kitchen preparation staff with KDS queue access',
          isSystem: true,
          permissions: [
            'kitchen.*',
            'orders.view',
            'orders.details',
            'sync.*',
          ],
        },
      });

      // 1. Create Owner User (linked to Supabase auth user)
      const user = await tx.user.create({
        data: {
          id: authUserId,
          tenantId: tenant.id,
          email,
          passwordHash: password || 'DefaultSecurePassword123!',
          fullName,
          phone: phone || null,
          roleType: 'OWNER',
          roleId: ownerRole.id,
          isActive: true,
        },
      });

      // 2. Create Linked Floor Waiter User for this Restaurant
      await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: `waiter@${slug}.pos`,
          fullName: `Floor Waiter (${restaurantName})`,
          phone: phone || null,
          roleType: 'WAITER',
          roleId: waiterRole.id,
          isActive: true,
        },
      });

      // 3. Create Linked Kitchen Chef User for this Restaurant
      await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: `kitchen@${slug}.pos`,
          fullName: `Kitchen Chef (${restaurantName})`,
          phone: phone || null,
          roleType: 'KITCHEN',
          roleId: kitchenRole.id,
          isActive: true,
        },
      });

      // Ensure Profile exists for Supabase Auth UUID
      await tx.$executeRawUnsafe(
        `INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
         VALUES ($1::uuid, $2, $3, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name`,
        authUserId,
        fullName,
        phone || ''
      );

      // Create RestaurantMember relationship
      await tx.restaurantMember.upsert({
        where: {
          tenantId_userId: {
            tenantId: tenant.id,
            userId: authUserId,
          },
        },
        update: { role: 'OWNER' },
        create: {
          tenantId: tenant.id,
          userId: authUserId,
          role: 'OWNER',
          roleId: ownerRole.id,
          isActive: true,
        },
      });

      // Create RegistrationRequest with details filled by the applicant
      const registration = await tx.registrationRequest.create({
        data: {
          tenantId: tenant.id,
          applicantName: fullName,
          applicantEmail: email,
          applicantPhone: phone || '',
          businessType: businessType as any,
          status: 'PENDING',
          intendedModules: body.intendedModules || null,
          tableCountEst: tableCount ? Number(tableCount) : 8,
        },
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          userName: fullName,
          action: 'REGISTER_RESTAURANT',
          entityType: 'TENANT',
          entityId: tenant.id,
          metadataJson: {
            restaurantName,
            businessType,
            email,
            authUserId,
            status: 'PENDING',
            tableCount: tableCount ? Number(tableCount) : 8,
          },
        },
      });

      return { tenant, profile, user, registration };
    });

    try {
      await seedTenantStarterData(result.tenant.id, businessType as any, tableCount ? Number(tableCount) : 8);
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Registration submitted successfully. Waiting for Platform Admin approval.',
      userId: authUserId,
      tenantId: result.tenant.id,
      tenant: result.tenant,
      profile: result.profile,
      user: result.user,
      registrationId: result.registration.id,
      status: 'PENDING',
      redirect: '/pending-approval',
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Failed to process registration request.', details: error.message },
      { status: 500 }
    );
  }
}
