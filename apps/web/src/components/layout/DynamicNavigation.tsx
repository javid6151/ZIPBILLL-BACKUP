'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/state';
import {
  generateDynamicNavigation,
  checkPermission,
  ROLE_DEFAULT_PERMISSIONS,
  ROUTE_PERMISSION_MAP,
  SECTION_MODULE_REQUIREMENTS,
} from '@/lib/permission-engine';
import { ArchitectureSection } from '@/lib/portal-architecture';
import {
  LayoutDashboard,
  Calculator,
  LayoutGrid,
  ClipboardList,
  ChefHat,
  BookOpen,
  Receipt,
  CreditCard,
  Package,
  Users,
  ShieldCheck,
  TrendingDown,
  BarChart3,
  QrCode,
  Printer,
  LineChart,
  Settings,
  RefreshCw,
  Bell,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  LogOut,
  Store,
  HelpCircle,
  Search,
  User,
  ShieldAlert,
  Smartphone,
  Key,
  X,
  Home,
  MoreHorizontal,
  ChevronUp,
  Lock,
  Sliders,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { BusinessType } from '@platform/types';
import { ZipBillLogo } from '@/components/brand/ZipBillLogo';
import { supabase } from '@/lib/supabase';

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-[18px] h-[18px]" />,
  Calculator: <Calculator className="w-[18px] h-[18px]" />,
  LayoutGrid: <LayoutGrid className="w-[18px] h-[18px]" />,
  ClipboardList: <ClipboardList className="w-[18px] h-[18px]" />,
  ChefHat: <ChefHat className="w-[18px] h-[18px]" />,
  BookOpen: <BookOpen className="w-[18px] h-[18px]" />,
  Receipt: <Receipt className="w-[18px] h-[18px]" />,
  CreditCard: <CreditCard className="w-[18px] h-[18px]" />,
  Package: <Package className="w-[18px] h-[18px]" />,
  Users: <Users className="w-[18px] h-[18px]" />,
  ShieldCheck: <ShieldCheck className="w-[18px] h-[18px]" />,
  TrendingDown: <TrendingDown className="w-[18px] h-[18px]" />,
  BarChart3: <BarChart3 className="w-[18px] h-[18px]" />,
  QrCode: <QrCode className="w-[18px] h-[18px]" />,
  Printer: <Printer className="w-[18px] h-[18px]" />,
  LineChart: <LineChart className="w-[18px] h-[18px]" />,
  Settings: <Settings className="w-[18px] h-[18px]" />,
  RefreshCw: <RefreshCw className="w-[18px] h-[18px]" />,
};

export function DynamicNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    profile,
    businessType,
    setBusinessType,
    enabledModules,
    toggleModule,
    session,
    setSession,
    isOnline,
    setIsOnline,
    staff,
    currentTenant,
    setCurrentTenant,
    availableTenants,
  } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'PROFILE' | 'DEVICES' | 'SECURITY'>('PROFILE');

  const isPublicPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/pending-approval' ||
    pathname === '/verify-email' ||
    pathname === '/onboarding' ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/tarun/admin');

  // Direct clean route resolution (Next.js routes are top-level /dashboard, /pos, /tables, etc.)
  const currentSection = pathname || '/dashboard';

  const getSectionHref = (baseHref: string) => {
    return baseHref === '/' ? '/dashboard' : baseHref;
  };

  // Onboarding awareness (soft check without locking the user out of the dashboard)
  React.useEffect(() => {
    // Kept non-blocking so the dashboard, POS, and all features remain immediately accessible
  }, []);

  // Load effective modules from context or localStorage
  let effectiveModules = (enabledModules as string[]) || [];
  if (effectiveModules.length === 0 && typeof window !== 'undefined') {
    try {
      const savedMods = localStorage.getItem('saas_active_modules');
      if (savedMods) effectiveModules = JSON.parse(savedMods);
    } catch {}
  }

  // STEP 4 & 5: Load User Role & Permissions from authenticated backend session
  const effectivePermissions =
    session.permissions && session.permissions.length > 0
      ? session.permissions
      : ROLE_DEFAULT_PERMISSIONS[session.roleName] || ROLE_DEFAULT_PERMISSIONS.WAITER;

  // Dynamic staff & persona resolution: Strictly inspect configured staff records
  const waiterStaff = (staff || []).filter(
    (s: any) => (s.roleType === 'WAITER' || s.role === 'WAITER') && s.isActive !== false
  );
  const kitchenStaff = (staff || []).filter(
    (s: any) => (s.roleType === 'KITCHEN' || s.role === 'KITCHEN') && s.isActive !== false
  );
  const employeeStaff = (staff || []).filter(
    (s: any) => s.roleType !== 'OWNER' && s.email !== session.email && s.isActive !== false
  );
  const hasWaiters = waiterStaff.length > 0;
  const hasKitchen = kitchenStaff.length > 0;
  const totalAccountCount = 1 + employeeStaff.length;

  const availablePersonas: Array<{ id: string; label: string; icon: string }> = [
    { id: 'OWNER', label: 'Owner', icon: '👑' },
  ];
  if (hasWaiters) {
    availablePersonas.push({
      id: 'WAITER',
      label: waiterStaff.length > 1 ? `Waiter (${waiterStaff.length})` : 'Waiter',
      icon: '🍽️',
    });
  }
  if (hasKitchen) {
    availablePersonas.push({
      id: 'KITCHEN',
      label: kitchenStaff.length > 1 ? `Kitchen (${kitchenStaff.length})` : 'Kitchen',
      icon: '👨‍🍳',
    });
  }

  // DYNAMIC SIDEBAR RESOLUTION RULE:
  // TENANT + RESTAURANT CONFIGURATION + ENABLED MODULES + USER ROLE + USER PERMISSIONS = Visible Navigation
  const visibleSections: ArchitectureSection[] = generateDynamicNavigation({
    tenantId: profile.tenantId || session.tenantId || '',
    businessType,
    enabledModules: effectiveModules,
    userRole: session.roleName,
    userPermissions: effectivePermissions,
  });

  // ROUTE ACCESS GUARD (Backend & Layout Authorization check on normalized section)
  const matchedRouteEntry = Object.entries(ROUTE_PERMISSION_MAP).find(([route]) => {
    if (currentSection === route) return true;
    if (route !== '/' && currentSection.startsWith(`${route}/`)) return true;
    return false;
  });

  const requiredPermission = matchedRouteEntry ? matchedRouteEntry[1] : null;
  const isAuthorizedForCurrentRoute = requiredPermission
    ? checkPermission(effectivePermissions, requiredPermission)
    : true;

  const currentSectionId = currentSection.replace(/^\//, '').split('/')[0] || 'dashboard';
  const requiredSectionModules = SECTION_MODULE_REQUIREMENTS[currentSectionId];
  const isModuleDisabledForCurrentRoute = Boolean(
    requiredSectionModules &&
    requiredSectionModules.length > 0 &&
    !requiredSectionModules.some((token) => {
      const t = token.toLowerCase().trim();
      return effectiveModules.some((m) => {
        const em = String(m).toLowerCase().trim();
        return em === t || em.startsWith(t + '.') || t.startsWith(em + '.');
      });
    })
  );

  // Check if unauthenticated with hydration grace period & Supabase check
  React.useEffect(() => {
    if (!isPublicPage) {
      const savedSession = typeof window !== 'undefined' ? localStorage.getItem('saas_active_session') : null;
      if (savedSession) return;
      if (session?.userId && session?.email) return;

      // Allow 400ms for state/storage hydration and check Supabase auth session before redirecting
      const timer = setTimeout(async () => {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            return; // Supabase session is active
          }
        } catch {}
        
        const lateSession = typeof window !== 'undefined' ? localStorage.getItem('saas_active_session') : null;
        const hasSessionCookie = typeof document !== 'undefined' && document.cookie.includes('saas_session_active=true');
        if (!lateSession && !hasSessionCookie && (!session?.userId || !session?.email)) {
          router.push('/login');
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [isPublicPage, session?.userId, session?.email, router]);

  // STRICT WORKFLOW GUARD:
  // Register -> Wizard (/onboarding) -> Admin Review (/pending-approval) -> Admin Approves -> Dashboard (/dashboard)
  // Dashboard is strictly inaccessible until Super Admin reviews and approves on port 9000!
  React.useEffect(() => {
    if (!isPublicPage && (session?.userId || session?.email)) {
      let storedTenant: any = null;
      try {
        const raw = localStorage.getItem('saas_active_tenant');
        if (raw) storedTenant = JSON.parse(raw);
      } catch {}

      let storedPending: any = null;
      try {
        const raw = localStorage.getItem('saas_pending_registration');
        if (raw) storedPending = JSON.parse(raw);
      } catch {}

      let storedProfile: any = null;
      try {
        const raw = localStorage.getItem('saas_active_profile');
        if (raw) storedProfile = JSON.parse(raw);
      } catch {}

      const activeStatus = (currentTenant as any)?.status || storedTenant?.status || (storedPending ? 'PENDING' : null);
      const activeTenantId = profile.tenantId || session.tenantId || currentTenant?.id || storedTenant?.id || storedPending?.tenantId;
      const activeEmail = session.email || storedPending?.email;
      const isComplete = profile.onboardingCompleted || storedProfile?.onboardingCompleted || storedPending?.onboardingCompleted;

      if (activeStatus === 'PENDING' && !session.isSuperAdmin) {
        if (!isComplete) {
          router.replace(`/onboarding?tenantId=${activeTenantId || ''}&email=${encodeURIComponent(activeEmail || '')}`);
        } else {
          router.replace(`/pending-approval?tenantId=${activeTenantId || ''}&email=${encodeURIComponent(activeEmail || '')}`);
        }
      }
    }
  }, [isPublicPage, session?.userId, session?.email, session?.tenantId, session?.isSuperAdmin, profile.tenantId, profile.onboardingCompleted, currentTenant?.id, (currentTenant as any)?.status, router]);

  if (isPublicPage) {
    return <div className="min-h-screen w-full bg-background text-main overflow-x-hidden font-sans">{children}</div>;
  }

  // STRICT WORKFLOW & ONBOARDING ENFORCER:
  // Register / Google Login -> Setup Wizard (/onboarding) -> Admin Review (/pending-approval) -> Admin Approves -> Dashboard (/dashboard)
  // Dashboard is strictly inaccessible and preview is completely blocked until BOTH:
  // 1. Setup Wizard is completed (onboardingCompleted === true)
  // 2. Administrator has approved the registration (status !== 'PENDING')
  let isAwaitingWizardOrApproval = false;
  let guardRedirectUrl: string | null = null;

  if (!session?.isSuperAdmin) {
    let storedTenant: any = null;
    let storedPending: any = null;
    let storedProfile: any = null;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('saas_active_tenant');
        if (raw) storedTenant = JSON.parse(raw);
      } catch {}
      try {
        const raw = localStorage.getItem('saas_pending_registration');
        if (raw) storedPending = JSON.parse(raw);
      } catch {}
      try {
        const raw = localStorage.getItem('saas_active_profile');
        if (raw) storedProfile = JSON.parse(raw);
      } catch {}
    }

    const activeStatus = (currentTenant as any)?.status || storedTenant?.status || (storedPending ? 'PENDING' : null);
    const activeTenantId = profile?.tenantId || session?.tenantId || currentTenant?.id || storedTenant?.id || storedPending?.tenantId;
    const activeEmail = session?.email || storedPending?.email;
    const isComplete = profile?.onboardingCompleted ?? storedProfile?.onboardingCompleted ?? storedPending?.onboardingCompleted;

    if (activeStatus === 'PENDING' || isComplete === false) {
      isAwaitingWizardOrApproval = true;
      if (isComplete === false) {
        guardRedirectUrl = `/onboarding?tenantId=${activeTenantId || ''}&email=${encodeURIComponent(activeEmail || '')}`;
      } else {
        guardRedirectUrl = `/pending-approval?tenantId=${activeTenantId || ''}&email=${encodeURIComponent(activeEmail || '')}`;
      }
    }
  }

  if (isAwaitingWizardOrApproval && guardRedirectUrl) {
    if (typeof window !== 'undefined') {
      window.location.replace(guardRedirectUrl);
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB] font-sans">
        <div className="flex flex-col items-center space-y-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#EA580C]" />
          <div>
            <h2 className="text-base font-bold text-[#1C1917]">
              {guardRedirectUrl.includes('/onboarding') ? 'Opening Restaurant Setup Wizard...' : 'Awaiting Administrator Approval...'}
            </h2>
            <p className="text-xs text-[#78716C] mt-1">
              {guardRedirectUrl.includes('/onboarding')
                ? 'Please complete your restaurant setup before accessing the dashboard.'
                : 'Your restaurant registration is under review by the platform administrator.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase sign out error:', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saas_active_session');
      localStorage.removeItem('saas_active_profile');
      localStorage.removeItem('saas_active_business_type');
      localStorage.removeItem('saas_active_tenant');
      document.cookie = 'saas_session_active=; path=/; max-age=0; SameSite=Lax';
    }
    setSession({
      userId: '',
      tenantId: '',
      email: '',
      fullName: '',
      roleName: 'OWNER',
      permissions: ['*'],
      deviceId: 'dev-terminal-01',
      isSuperAdmin: false,
    });
    router.push('/login?logged_out=1');
  };

  const displayedBusinessName = profile.businessName || currentTenant?.name || (session.fullName ? `${session.fullName}'s Store` : 'Restaurant Portal');

  const handleDevSwitchRole = (role: string) => {
    const roleDefaultPerms = ROLE_DEFAULT_PERMISSIONS[role] || [];
    const activeTenantId = profile.tenantId || session.tenantId;
    const currentRestName = profile.businessName || currentTenant?.name || 'Restaurant';

    // Find linked staff record for this exact tenant
    const matchedStaff = staff?.find((s: any) => s.roleType === role);

    let roleFullName = matchedStaff?.fullName;
    let roleEmail = matchedStaff?.email;
    let roleUserId = matchedStaff?.id;

    if (!roleFullName) {
      if (role === 'OWNER') {
        roleFullName = `${currentRestName} Owner`;
      } else if (role === 'WAITER') {
        roleFullName = `Floor Waiter (${currentRestName})`;
      } else if (role === 'KITCHEN') {
        roleFullName = `Kitchen Chef (${currentRestName})`;
      } else {
        roleFullName = session.fullName;
      }
    }

    const updatedSession = {
      ...session,
      userId: roleUserId || session.userId,
      email: roleEmail || session.email,
      tenantId: activeTenantId,
      roleName: role,
      fullName: roleFullName,
      permissions: roleDefaultPerms,
    };

    setSession(updatedSession);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saas_active_session', JSON.stringify(updatedSession));
    }

    // Auto-navigate to valid route if current becomes unauthorized
    if (role === 'KITCHEN') router.push(getSectionHref('/kitchen'));
    else if (role === 'WAITER') router.push(getSectionHref('/pos'));
    else router.push(getSectionHref('/dashboard'));
  };

  // Determine authorized bottom navigation items for mobile
  const candidateMobileItems = [
    { id: 'dashboard', name: 'Home', href: '/dashboard', icon: Home, perm: 'dashboard.view' },
    { id: 'pos', name: 'POS', href: '/pos', icon: Calculator, perm: 'pos.view' },
    { id: 'tables', name: 'Tables', href: '/tables', icon: LayoutGrid, perm: 'tables.view' },
    { id: 'orders', name: 'Orders', href: '/orders', icon: ClipboardList, perm: 'orders.view' },
    { id: 'kitchen', name: 'Kitchen', href: '/kitchen', icon: ChefHat, perm: 'kitchen.view' },
    { id: 'billing', name: 'Billing', href: '/billing', icon: Receipt, perm: 'billing.view' },
  ];

  const authorizedMobileItems = candidateMobileItems
    .filter((item) => checkPermission(effectivePermissions, item.perm) && visibleSections.some((s) => s.id === item.id))
    .slice(0, 4);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-main font-sans">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          DESKTOP SIDEBAR (280-300px fixed per spec)
          Background: #FFFFFF, Border-right: 1px solid #E8E6E4
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <aside
        className={`hidden lg:flex flex-col bg-surface border-r border-border select-none transition-all duration-200 ${
          sidebarCollapsed ? 'w-20' : 'w-[290px]'
        }`}
      >
        {/* TOP: ZipBill Platform Logo, Active Restaurant Outlet & Collapse */}
        <div className="py-3 px-4 border-b border-border flex flex-col justify-center space-y-2">
          <div className="flex items-center justify-between">
            <Link href={visibleSections[0]?.href || '/dashboard'} className="flex items-center space-x-2.5 overflow-hidden">
              {sidebarCollapsed ? (
                <ZipBillLogo size="sm" variant="badge" className="w-10 h-10" />
              ) : (
                <ZipBillLogo size="md" variant="full" />
              )}
            </Link>

            {!sidebarCollapsed && (
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1 rounded-lg text-placeholder hover:text-heading hover:bg-surfaceMuted transition"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-surfaceMuted border border-borderLight overflow-hidden">
              <div className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Store className="w-3.5 h-3.5" />
              </div>
              <div className="truncate flex-1">
                <span className="font-bold text-[12px] text-heading truncate block leading-tight">
                  {displayedBusinessName}
                </span>
                <span className="text-[10px] text-secondary font-medium capitalize block">
                  {businessType.toLowerCase().replace('_', ' ')} Outlet
                </span>
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE: Role-Based + Permission-Based Dynamic Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {!sidebarCollapsed && (
            <div className="px-3 pb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-placeholder">
              <span>Authorized Sections ({visibleSections.length})</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surfaceMuted text-primary font-bold">
                {session.roleName}
              </span>
            </div>
          )}

          {visibleSections.map((sec) => {
            const targetHref = getSectionHref(sec.href);
            const isSectionActive =
              pathname === targetHref ||
              pathname === sec.href ||
              currentSection === sec.href ||
              (sec.href !== '/' && currentSection.startsWith(sec.href));

            return (
              <Link
                key={sec.id}
                href={targetHref}
                className={`group relative flex items-center rounded-xl font-medium text-[14px] transition-colors duration-150 ${
                  sidebarCollapsed ? 'justify-center p-2.5' : 'space-x-3 px-3.5 py-2.5'
                } ${
                  isSectionActive
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'text-secondary hover:text-main hover:bg-surfaceMuted'
                }`}
              >
                {/* Active vertical orange indicator per CRM spec: 4px x 24px, 0 4px 4px 0 radius */}
                {isSectionActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r" />
                )}

                <span className={isSectionActive ? 'text-primary' : 'text-placeholder group-hover:text-secondary'}>
                  {ICON_MAP[sec.iconName] || <LayoutDashboard className="w-[18px] h-[18px]" />}
                </span>

                {!sidebarCollapsed && (
                  <span className="flex-1 truncate">{sec.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PRODUCTION PROFILE AREA
            Per Specification:
            Display: User Avatar, User Name, User Role, Restaurant Name
            Actions: Profile, My Devices, Security, Logout
            NO role-switching dropdown in real production UI!
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="p-3 border-t border-border bg-surface">
          {!sidebarCollapsed ? (
            <div className="p-3 rounded-xl bg-surfaceMuted border border-borderLight space-y-2.5">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center text-xs flex-shrink-0 border border-primary/20">
                    {session.fullName ? session.fullName.charAt(0) : 'U'}
                  </div>
                  <span className="w-2.5 h-2.5 bg-success rounded-full absolute bottom-0 right-0 border-2 border-surface" />
                </div>
                <div className="truncate flex-1">
                  <div className="text-[13px] font-semibold text-heading truncate">{session.fullName}</div>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider bg-primary-light text-primary">
                      {session.roleName}
                    </span>
                    <span className="text-[11px] text-muted truncate">
                      {displayedBusinessName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Roles: Dynamic persona switcher strictly based on configured staff */}
              {(session.roleName === 'OWNER' || hasWaiters || hasKitchen) && (
                <div className="pt-2 border-t border-borderLight">
                  <div className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Active Persona</span>
                    <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-mono font-medium">
                      {totalAccountCount === 1 ? '1 Account' : `${totalAccountCount} Accounts`}
                    </span>
                  </div>

                  {availablePersonas.length <= 1 ? (
                    // Solo Operator: No Waiter or Kitchen configured in the form
                    <div className="py-1.5 px-2.5 rounded-lg bg-surface border border-borderLight flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-heading">
                        <span>👑</span>
                        <span>Owner (Solo Operator)</span>
                      </div>
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                  ) : (
                    // Multiple Personas: dynamically render only configured roles
                    <div
                      className={`grid ${
                        availablePersonas.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                      } gap-1 bg-surface p-1 rounded-lg border border-borderLight`}
                    >
                      {availablePersonas.map((r) => {
                        const isCurrent = session.roleName === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => handleDevSwitchRole(r.id)}
                            className={`py-1 px-1 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition ${
                              isCurrent
                                ? 'bg-primary text-white font-bold shadow-xs'
                                : 'text-secondary hover:text-heading hover:bg-surfaceMuted'
                            }`}
                            title={`Switch persona: ${r.label}`}
                          >
                            <span className="text-[10px]">{r.icon}</span>
                            <span className="truncate">{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Profile Area Action Buttons */}
              <div className="pt-2 border-t border-borderLight flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveProfileTab('PROFILE');
                    setProfileModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface transition font-medium"
                  title="Profile Information"
                >
                  <User className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-bg transition font-medium"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5 stroke-[2]" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="w-9 h-9 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center text-xs"
              >
                {session.fullName ? session.fullName.charAt(0) : 'U'}
              </button>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 rounded-lg text-placeholder hover:text-heading hover:bg-surfaceMuted"
                title="Expand Sidebar"
              >
                <PanelLeft className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MAIN VIEWPORT & GLOBAL TOPBAR
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        <header className="h-16 border-b border-border bg-surface px-4 sm:px-6 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1 rounded-lg text-secondary hover:text-main hover:bg-surfaceMuted flex items-center space-x-1"
              title="Open Navigation"
            >
              <ZipBillLogo size="sm" variant="badge" className="w-8 h-8" />
            </button>

            {/* Restaurant Brand Title */}
            <div className="flex items-center space-x-2">
              <span className="text-base">🍽️</span>
              <span className="font-semibold text-sm text-heading tracking-tight truncate max-w-[240px]">
                {currentTenant?.name || profile.businessName || displayedBusinessName}
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                ZipBill POS
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Quick Search */}
            <div className="hidden md:flex relative items-center">
              <Search className="w-3.5 h-3.5 text-placeholder absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search orders, tables, items..."
                className="search-input h-[36px] text-xs pl-8 pr-3 w-52 lg:w-64"
              />
            </div>

            {/* Connection & Sync Status */}
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border transition ${
                isOnline
                  ? 'bg-success-bg text-success border-emerald-200'
                  : 'bg-danger-bg text-danger border-red-200'
              }`}
              title="Click to toggle Network Simulation"
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success' : 'bg-danger'}`} />
              <span className="hidden sm:inline">{isOnline ? 'Cloud Synced' : 'Offline Mode'}</span>
            </button>

            {/* Notifications */}
            <button
              type="button"
              className="p-2 rounded-xl text-placeholder hover:text-heading hover:bg-surfaceMuted transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4 stroke-[1.9]" />
            </button>

            {/* Architecture Overview */}
            <Link
              href={getSectionHref('/screens')}
              className="p-2 rounded-xl text-placeholder hover:text-heading hover:bg-surfaceMuted transition"
              title="Portal Architecture"
            >
              <HelpCircle className="w-4 h-4 stroke-[1.9]" />
            </Link>

            {/* POS Fast CTA (Only shown if user has POS permission) */}
            {checkPermission(effectivePermissions, 'pos.view') && (
              <Link href={getSectionHref('/pos')} className="btn-primary text-xs py-2 px-3.5 hidden sm:inline-flex">
                <Calculator className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>POS</span>
              </Link>
            )}
          </div>
        </header>

        {/* PAGE CONTENT OR 403 FORBIDDEN / ACCESS GUARD */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {isModuleDisabledForCurrentRoute ? (
            <div className="min-h-[80vh] flex items-center justify-center p-6 font-sans">
              <div className="card max-w-lg w-full p-8 text-center space-y-5 border-warning/40 shadow-card">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-warning-bg text-warning flex items-center justify-center">
                  <Sliders className="w-7 h-7 stroke-[2]" />
                </div>
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-warning-bg text-warning">
                    Feature Inactive
                  </span>
                  <h2 className="text-2xl font-bold text-heading">
                    {currentSectionId.toUpperCase()} Is Currently Disabled
                  </h2>
                  <p className="text-secondary text-sm leading-relaxed">
                    This module is currently toggled OFF in your system preferences. When disabled, it is hidden from the sidebar navigation and routes.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {requiredSectionModules && requiredSectionModules[0] && (
                    <button
                      type="button"
                      onClick={() => toggleModule(requiredSectionModules[0] as any)}
                      className="btn-primary w-full sm:w-auto text-xs py-2.5 px-6"
                    >
                      Enable {currentSectionId.toUpperCase()} Module
                    </button>
                  )}
                  <Link
                    href={getSectionHref('/dashboard')}
                    className="btn-secondary w-full sm:w-auto text-xs py-2.5 px-5"
                  >
                    Back to Dashboard
                  </Link>
                  <Link
                    href={getSectionHref('/settings?tab=modules')}
                    className="w-full sm:w-auto text-xs py-2.5 px-3 text-muted hover:text-heading"
                  >
                    System Modules
                  </Link>
                </div>
              </div>
            </div>
          ) : !isAuthorizedForCurrentRoute ? (
            <div className="min-h-[80vh] flex items-center justify-center p-6 font-sans">
              <div className="card max-w-lg w-full p-8 text-center space-y-5 border-danger/30 shadow-card">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-danger-bg text-danger flex items-center justify-center">
                  <ShieldAlert className="w-7 h-7 stroke-[2]" />
                </div>
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-danger-bg text-danger">
                    403 Forbidden - Access Restricted
                  </span>
                  <h2 className="text-2xl font-bold text-heading">
                    Unauthorized Route
                  </h2>
                  <p className="text-secondary text-sm leading-relaxed">
                    Your role (<strong className="text-heading">{session.roleName}</strong>) does not have
                    permission to access this section (<code className="text-xs bg-surfaceMuted px-1.5 py-0.5 rounded">{pathname}</code>).
                  </p>
                </div>

                <div className="p-3.5 bg-surfaceMuted rounded-xl border border-borderLight text-xs text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted">Required Permission:</span>
                    <span className="font-mono text-heading font-semibold">{requiredPermission}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Authenticated Worker:</span>
                    <span className="text-heading font-medium">{session.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Active Tenant:</span>
                    <span className="text-heading font-medium">{profile.businessName}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href={getSectionHref(visibleSections[0]?.href || '/pos')}
                    className="btn-primary w-full sm:w-auto text-xs py-2.5 px-6"
                  >
                    Return to Authorized Workspace ({visibleSections[0]?.name || 'Home'})
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto text-xs py-2.5 px-4 text-muted hover:text-heading"
                  >
                    Switch User Login
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MOBILE NAVIGATION BAR (Bottom Nav)
            Strictly permission-filtered!
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border flex items-center justify-around h-16 z-30 px-2">
          {authorizedMobileItems.map((item) => {
            const Icon = item.icon;
            const targetHref = getSectionHref(item.href);
            const isActive = pathname === targetHref || pathname === item.href || currentSection === item.href;
            return (
              <Link
                key={item.id}
                href={targetHref}
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition ${
                  isActive ? 'text-primary font-bold' : 'text-secondary hover:text-main'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5 stroke-[1.8]" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreDrawerOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium text-secondary hover:text-main"
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5 stroke-[1.8]" />
            <span>More</span>
          </button>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            MOBILE MORE MENU DRAWER
            Permission-filtered: NEVER show unauthorized modules!
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {moreDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs lg:hidden flex flex-col justify-end">
            <div className="bg-surface rounded-t-[24px] border-t border-border p-5 max-h-[80vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-borderLight">
                <div>
                  <h3 className="font-semibold text-lg text-heading">Authorized Modules</h3>
                  <p className="text-xs text-muted">Role: {session.roleName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreDrawerOpen(false)}
                  className="p-1 rounded-lg text-placeholder hover:text-heading"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {visibleSections.map((sec) => (
                  <Link
                    key={sec.id}
                    href={getSectionHref(sec.href)}
                    onClick={() => setMoreDrawerOpen(false)}
                    className="p-3 rounded-xl bg-surfaceMuted border border-borderLight flex flex-col items-center text-center space-y-1.5 hover:border-primary/40 transition"
                  >
                    <span className="text-primary">{ICON_MAP[sec.iconName]}</span>
                    <span className="text-xs font-semibold text-heading truncate w-full">{sec.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PROFILE AREA MODAL
          (Profile, My Devices, Security)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-borderLight flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center text-sm">
                  {session.fullName ? session.fullName.charAt(0) : 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-heading text-[15px]">{session.fullName}</h3>
                  <span className="text-xs text-primary font-semibold uppercase">{session.roleName}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-lg text-placeholder hover:text-heading"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Tabs */}
            <div className="flex border-b border-borderLight bg-surfaceMuted px-5">
              {(['PROFILE', 'DEVICES', 'SECURITY'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveProfileTab(tab)}
                  className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition ${
                    activeProfileTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-secondary hover:text-heading'
                  }`}
                >
                  {tab === 'PROFILE' && 'Profile'}
                  {tab === 'DEVICES' && 'My Devices'}
                  {tab === 'SECURITY' && 'Security'}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4 text-xs">
              {activeProfileTab === 'PROFILE' && (
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-muted block mb-0.5">Email Address</span>
                      <span className="font-semibold text-heading">{session.email || 'user@restaurant.com'}</span>
                    </div>
                    <div>
                      <span className="text-muted block mb-0.5">Restaurant</span>
                      <span className="font-semibold text-heading">{displayedBusinessName}</span>
                    </div>
                    <div>
                      <span className="text-muted block mb-0.5">Active Role Persona</span>
                      <span className="inline-flex px-2 py-0.5 rounded font-semibold bg-primary-light text-primary">
                        {session.roleName}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-borderLight">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-heading text-[12px]">
                        Linked Restaurant Accounts ({totalAccountCount})
                      </span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-mono">
                        1 Restaurant
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {/* Primary Owner Account */}
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                        session.roleName === 'OWNER'
                          ? 'bg-primary-soft/30 border-primary/40'
                          : 'bg-surfaceMuted border-borderLight hover:border-border'
                      }`}>
                        <div className="flex items-center space-x-2.5">
                          <span className="text-base">👑</span>
                          <div>
                            <div className="font-semibold text-heading text-[12px] flex items-center gap-1.5">
                              <span>{session.fullName || 'Restaurant Owner'}</span>
                              <span className="text-[9px] bg-primary text-white px-1.5 py-0.2 rounded font-bold uppercase">
                                {session.roleName === 'OWNER' ? 'Active' : 'Owner'}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted">Primary Administrator • Full Management & Reports</div>
                          </div>
                        </div>
                        {session.roleName !== 'OWNER' && (
                          <button
                            type="button"
                            onClick={() => {
                              handleDevSwitchRole('OWNER');
                              setProfileModalOpen(false);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-surface border border-borderLight text-primary hover:bg-primary hover:text-white transition"
                          >
                            Switch
                          </button>
                        )}
                      </div>

                      {/* Configured Staff Accounts */}
                      {employeeStaff.map((emp: any) => {
                        const isCurrent = session.roleName === emp.roleType;
                        const roleIcon = emp.roleType === 'KITCHEN' ? '👨‍🍳' : '🍽️';
                        const roleLabel = emp.roleType === 'KITCHEN' ? 'Kitchen Chef' : 'Floor Waiter';
                        const roleDesc = emp.roleType === 'KITCHEN' ? 'Live KDS Ticket Preparation' : 'Table POS, Orders & Guest Billing';

                        return (
                          <div
                            key={emp.id || emp.email}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                              isCurrent
                                ? 'bg-primary-soft/30 border-primary/40'
                                : 'bg-surfaceMuted border-borderLight hover:border-border'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="text-base">{roleIcon}</span>
                              <div>
                                <div className="font-semibold text-heading text-[12px] flex items-center gap-1.5">
                                  <span>{emp.fullName || emp.name}</span>
                                  <span className="text-[9px] text-muted font-normal">({roleLabel})</span>
                                  {isCurrent && (
                                    <span className="text-[9px] bg-primary text-white px-1.5 py-0.2 rounded font-bold uppercase">Active</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-muted">{emp.phone || emp.email || roleDesc}</div>
                              </div>
                            </div>
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => {
                                  handleDevSwitchRole(emp.roleType);
                                  setProfileModalOpen(false);
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-surface border border-borderLight text-primary hover:bg-primary hover:text-white transition"
                              >
                                Switch
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {/* Solo Owner Message when no employees configured */}
                      {employeeStaff.length === 0 && (
                        <div className="p-3 bg-surface rounded-xl border border-dashed border-borderLight text-center">
                          <p className="text-[11px] font-medium text-heading">Solo Restaurant Operation</p>
                          <p className="text-[10px] text-muted mt-0.5">
                            No waiter or kitchen employee accounts were added during onboarding. The owner manages all floor & counter operations directly.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'DEVICES' && (
                <div className="space-y-2.5">
                  <div className="p-3 bg-surfaceMuted rounded-xl border border-borderLight flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-heading">Counter Terminal (This Device)</div>
                      <div className="text-[11px] text-muted">Platform: Web App / Windows</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-bg text-success">
                      AUTHORIZED
                    </span>
                  </div>
                  <div className="p-3 bg-surfaceMuted rounded-xl border border-borderLight flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-heading">Floor Tablet (Waiter POS)</div>
                      <div className="text-[11px] text-muted">Platform: Android 14</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-bg text-success">
                      ACTIVE
                    </span>
                  </div>
                </div>
              )}

              {activeProfileTab === 'SECURITY' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-heading">Session Authenticated</div>
                      <div className="text-[11px] text-muted">Backend verified JWT session token</div>
                    </div>
                    <span className="text-success font-semibold">Active</span>
                  </div>
                  <div className="pt-2 border-t border-borderLight">
                    <span className="text-muted block mb-1">Effective Level 1/2 Permissions</span>
                    <div className="max-h-24 overflow-y-auto p-2 bg-surfaceMuted rounded-lg font-mono text-[10px] text-heading space-y-0.5">
                      {effectivePermissions.map((p, idx) => (
                        <div key={idx}>• {p}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-borderLight bg-surfaceMuted flex items-center justify-between">
              <Link
                href="/login"
                className="text-danger hover:underline text-xs font-semibold flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Link>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="btn-primary text-xs py-1.5 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
