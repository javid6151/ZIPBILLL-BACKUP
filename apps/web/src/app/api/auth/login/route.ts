import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@platform/database';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // 1. Authenticate with Supabase Auth
    let supabaseToken: string | null = null;
    let authUserId: string | null = null;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: password || 'DefaultSecurePassword123!',
    });

    if (!authError && authData.session) {
      supabaseToken = authData.session.access_token;
      authUserId = authData.user.id;
    } else {
      // If user exists in application database but not yet in auth.users, sync them
      const dbUser = await prisma.user.findUnique({ where: { email } });
      if (dbUser) {
        // Create in auth.users via admin client
        const { data: newAuth, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: password || 'DefaultSecurePassword123!',
          email_confirm: true,
          user_metadata: { full_name: dbUser.fullName },
        });

        if (!createErr && newAuth.user) {
          authUserId = newAuth.user.id;
          const { data: signedIn } = await supabase.auth.signInWithPassword({
            email,
            password: password || 'DefaultSecurePassword123!',
          });
          supabaseToken = signedIn.session?.access_token || null;
        }
      }
    }

    // 2. Find user in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        tenant: {
          include: {
            businessProfile: true,
            modules: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Check tenant registration status
    if (user.tenant) {
      if (user.tenant.status === 'PENDING') {
        return NextResponse.json({
          status: 'PENDING_APPROVAL',
          message: 'Your restaurant registration is currently pending Super Admin review and approval.',
          redirect: '/pending-approval',
          tenantId: user.tenant.id,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            roleType: user.roleType,
          },
        });
      }

      if (user.tenant.status === 'REJECTED') {
        return NextResponse.json(
          { error: 'Your restaurant registration was not approved. Please contact platform support.' },
          { status: 403 }
        );
      }

      if (user.tenant.status === 'SUSPENDED') {
        return NextResponse.json(
          { error: 'This restaurant workspace has been suspended by the platform administrator.' },
          { status: 403 }
        );
      }
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Check if onboarding is completed
    const onboardingCompleted = user.tenant?.businessProfile?.onboardingCompleted ?? false;

    // Extract enabled modules
    const enabledModules = user.tenant?.modules
      .filter((m) => m.isEnabled)
      .map((m) => m.moduleToken) || [
      'POS', 'TABLES', 'ORDERS', 'KITCHEN', 'MENU', 'BILLING',
      'PAYMENTS', 'INVENTORY', 'CUSTOMERS', 'STAFF', 'EXPENSES', 'REPORTS'
    ];

    // Extract permissions
    const permissions = (user.role?.permissions as string[]) || [];

    // Fetch user isolated settings from Supabase
    let userSettings = null;
    let userPreferences = null;
    try {
      const targetUid = authUserId || user.id;
      const settingsRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM public.user_settings WHERE user_id = $1::uuid LIMIT 1`,
        targetUid
      );
      userSettings = settingsRows[0] || null;

      const prefRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM public.user_preferences WHERE user_id = $1::uuid LIMIT 1`,
        targetUid
      );
      userPreferences = prefRows[0] || null;
    } catch (e) {
      // Non-blocking
    }

    // Generate or use Supabase token
    const sessionToken = supabaseToken || `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const response = NextResponse.json({
      success: true,
      token: sessionToken,
      supabaseToken,
      userId: authUserId || user.id,
      user: {
        id: authUserId || user.id,
        email: user.email,
        fullName: user.fullName,
        roleType: user.roleType,
        avatarUrl: user.avatarUrl,
        tenantId: user.tenantId,
      },
      tenant: user.tenant ? {
        id: user.tenant.id,
        slug: user.tenant.slug,
        name: user.tenant.name,
        businessType: user.tenant.businessType,
        status: user.tenant.status,
      } : null,
      profile: user.tenant?.businessProfile || null,
      userSettings,
      onboardingCompleted: true,
      enabledModules,
      redirect: '/dashboard',
    });

    response.cookies.set('saas_session_active', 'true', {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
      httpOnly: false,
    });

    return response;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Authentication failed.', details: error.message },
      { status: 500 }
    );
  }
}
