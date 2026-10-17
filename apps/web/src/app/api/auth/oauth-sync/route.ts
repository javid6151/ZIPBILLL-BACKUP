import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@platform/database';
import { seedTenantStarterData } from '@/lib/seed-starter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, email, fullName, tableCount } = await req.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required for OAuth synchronization.' },
        { status: 400 }
      );
    }

    const cleanName = fullName || email.split('@')[0] || 'User';

    // 1. Check if user already exists in PostgreSQL
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { authUserId: userId }, { email }],
      },
      include: {
        tenant: {
          include: {
            businessProfile: true,
            modules: true,
          },
        },
      },
    });

    if (user && user.tenant) {
      const hasCompletedOnboarding = user.tenant.businessProfile?.onboardingCompleted ?? false;

      // 1. Check if user's restaurant application is pending admin review
      if (user.tenant.status === 'PENDING') {
        if (!hasCompletedOnboarding) {
          return NextResponse.json({
            success: true,
            status: 'PENDING',
            tenantId: user.tenant.id,
            tenant: user.tenant,
            profile: user.tenant.businessProfile,
            onboardingCompleted: false,
            redirect: `/onboarding?tenantId=${user.tenant.id}&email=${encodeURIComponent(user.email)}`,
            user: {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
              roleType: user.roleType,
              tenantId: user.tenantId,
            },
          });
        }

        return NextResponse.json({
          success: true,
          status: 'PENDING',
          tenantId: user.tenant.id,
          tenant: user.tenant,
          profile: user.tenant.businessProfile,
          onboardingCompleted: true,
          redirect: `/pending-approval?tenantId=${user.tenant.id}&email=${encodeURIComponent(user.email)}`,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            roleType: user.roleType,
            tenantId: user.tenantId,
          },
        });
      }

      // 2. Check if rejected
      if (user.tenant.status === 'REJECTED') {
        return NextResponse.json(
          {
            error: 'Your restaurant registration was not approved. Please contact platform support.',
            status: 'REJECTED',
            redirect: `/pending-approval?tenantId=${user.tenant.id}&email=${encodeURIComponent(user.email)}`,
          },
          { status: 403 }
        );
      }

      // 3. Tenant is APPROVED by administrator:
      // Check whether user has completed the Setup Wizard
      const targetRedirect = hasCompletedOnboarding
        ? '/dashboard'
        : `/onboarding?tenantId=${user.tenant.id}&email=${encodeURIComponent(user.email)}`;

      // Only configure tables if custom table count was explicitly requested
      if (tableCount && Number(tableCount) > 0) {
        try {
          await seedTenantStarterData(
            user.tenant.id,
            user.tenant.businessType || 'RESTAURANT',
            Number(tableCount)
          );
        } catch {}
      }

      const response = NextResponse.json({
        success: true,
        isNew: false,
        status: user.tenant.status,
        tenant: user.tenant,
        profile: user.tenant.businessProfile,
        onboardingCompleted: hasCompletedOnboarding,
        redirect: targetRedirect,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roleType: user.roleType,
          tenantId: user.tenantId,
        },
      });

      response.cookies.set('saas_session_active', 'true', {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
        httpOnly: false,
      });

      return response;
    }

    // 2. First-time Google login: Create clean restaurant workspace with PENDING status for Super Admin review
    const restaurantName = `${cleanName}'s Restaurant`;
    const baseSlug = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant with PENDING status (awaiting platform verification)
      const tenant = await tx.tenant.create({
        data: {
          slug,
          name: restaurantName,
          businessType: 'RESTAURANT',
          status: 'PENDING',
        },
      });

      // 2. Create BusinessProfile with onboardingCompleted: false (awaits Setup Wizard after approval)
      const profile = await tx.businessProfile.create({
        data: {
          tenantId: tenant.id,
          businessName: restaurantName,
          phone: '',
          email,
          address: 'Main Street',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'IN',
          currencyCode: 'INR',
          currencySymbol: '₹',
          timezone: 'Asia/Kolkata',
          onboardingCompleted: false,
        },
      });

      // 3. Create the 3 linked roles for this restaurant: OWNER, WAITER, KITCHEN
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

      // 4. Create or link Owner User
      let newUser = await tx.user.findFirst({ where: { email } });
      if (newUser) {
        newUser = await tx.user.update({
          where: { id: newUser.id },
          data: {
            authUserId: userId,
            tenantId: tenant.id,
            roleType: 'OWNER',
            roleId: ownerRole.id,
            fullName: cleanName,
          },
        });
      } else {
        newUser = await tx.user.create({
          data: {
            authUserId: userId,
            tenantId: tenant.id,
            email,
            fullName: cleanName,
            roleType: 'OWNER',
            roleId: ownerRole.id,
            isActive: true,
          },
        });
      }

      // Note: Floor Waiter and Kitchen Chef users are strictly created on-demand
      // when configured in Onboarding Step 7 or Staff management, not auto-seeded.

      // 7. Enable default platform modules for clean restaurant workspace
      const defaultModules = [
        'pos.dine_in', 'pos.quick_counter', 'operations.tables', 'operations.kitchen_kds',
        'catalog.modifiers_variants', 'billing.thermal_receipts', 'payments.upi_qr',
        'staff.shared_access', 'inventory.raw_materials', 'reports.sales_analytics'
      ];
      for (const token of defaultModules) {
        await tx.tenantModule.upsert({
          where: { tenantId_moduleToken: { tenantId: tenant.id, moduleToken: token } },
          update: { isEnabled: true },
          create: { tenantId: tenant.id, moduleToken: token, isEnabled: true },
        });
      }

      // 8. Create RegistrationRequest (PENDING approval for platform review)
      await tx.registrationRequest.create({
        data: {
          tenantId: tenant.id,
          applicantName: cleanName,
          applicantEmail: email,
          applicantPhone: '',
          businessType: 'RESTAURANT',
          status: 'PENDING',
          tableCountEst: tableCount ? Number(tableCount) : 8,
          intendedModules: defaultModules,
        },
      });

      return { tenant, profile, user: newUser, ownerRole };
    });

    // 9. Outside transaction: Non-blocking Supabase auth schema links
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO public.profiles (id, full_name, phone, created_at, updated_at)
         VALUES ($1::uuid, $2, '', NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name`,
        userId,
        cleanName
      );
    } catch (e: any) {
      console.warn('Profiles table sync skipped:', e.message);
    }

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE public."Tenant" SET owner_user_id = $1::uuid WHERE id = $2`,
        userId,
        result.tenant.id
      );
    } catch (e: any) {
      console.warn('Tenant owner_user_id update skipped:', e.message);
    }

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE public."BusinessProfile" SET user_id = $1::uuid WHERE id = $2`,
        userId,
        result.profile.id
      );
    } catch (e: any) {
      console.warn('BusinessProfile user_id update skipped:', e.message);
    }

    try {
      await prisma.restaurantMember.upsert({
        where: {
          tenantId_userId: {
            tenantId: result.tenant.id,
            userId,
          },
        },
        update: { role: 'OWNER' },
        create: {
          tenantId: result.tenant.id,
          userId,
          role: 'OWNER',
          roleId: result.ownerRole.id,
          isActive: true,
        },
      });
    } catch (e: any) {
      console.warn('RestaurantMember sync skipped:', e.message);
    }

    if (tableCount && Number(tableCount) > 0) {
      try {
        await seedTenantStarterData(
          result.tenant.id,
          result.tenant.businessType || 'RESTAURANT',
          Number(tableCount)
        );
      } catch (e: any) {
        console.warn('Starter tables setup skipped:', e.message);
      }
    }

    const response = NextResponse.json({
      success: true,
      isNew: true,
      status: 'PENDING',
      tenantId: result.tenant.id,
      tenant: result.tenant,
      profile: result.profile,
      onboardingCompleted: false,
      redirect: `/onboarding?tenantId=${result.tenant.id}&email=${encodeURIComponent(email)}`,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        roleType: result.user.roleType,
        tenantId: result.user.tenantId,
      },
    });

    return response;
  } catch (error: any) {
    console.error('OAuth sync error:', error);
    return NextResponse.json(
      { error: 'Failed to synchronize OAuth user profile.', details: error.message },
      { status: 500 }
    );
  }
}
