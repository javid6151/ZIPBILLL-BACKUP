'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  LayoutDashboard,
  Store,
  Users,
  UserCheck,
  CreditCard,
  Layers,
  Box,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/lib/state';

const ADMIN_NAV_ITEMS = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Restaurants', href: '/admin/restaurants', icon: Store },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Staff Management', href: '/admin/staff', icon: UserCheck },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Plans & Tiers', href: '/admin/plans', icon: Layers },
  { name: 'Platform Modules', href: '/admin/modules', icon: Box },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, setSession } = useApp();

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  const isTarunRoute = pathname?.startsWith('/tarun/admin');
  const loginPath = isTarunRoute ? '/tarun/admin/login' : '/admin/login';
  const adminBasePath = isTarunRoute ? '/tarun/admin' : '/admin';

  useEffect(() => {
    // 1. PUBLIC ROUTE EXEMPTION: /admin/login requires NO sidebar or auth checks
    if (pathname === '/admin/login' || pathname === '/tarun/admin/login') {
      setAuthorized(true);
      return;
    }

    // 2. ROUTE PROTECTION CHECK
    const checkAdminAuth = () => {
      try {
        const stored = localStorage.getItem('saas_admin_session');
        if (!stored) {
          setAuthorized(false);
          router.replace(loginPath);
          return;
        }

        const parsed = JSON.parse(stored);
        const isAdmin =
          parsed &&
          (parsed.isSuperAdmin === true ||
            parsed.roleName === 'SUPER_ADMIN' ||
            parsed.roleName === 'ADMIN');

        if (!isAdmin) {
          setAuthorized(false);
          router.replace(loginPath);
          return;
        }

        setAdminUser(parsed);
        setAuthorized(true);
      } catch (e) {
        setAuthorized(false);
        router.replace(loginPath);
      }
    };

    checkAdminAuth();
  }, [pathname, router, loginPath]);

  // Public login route: render children directly without admin layout
  if (pathname === '/admin/login' || pathname === '/tarun/admin/login') {
    return <>{children}</>;
  }

  // Pre-Authentication / Verifying Session State: Render clean neutral screen without content flash
  if (authorized === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans">
        <div className="flex items-center space-x-3 text-secondary text-sm">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Verifying Admin Authorization...</span>
        </div>
      </div>
    );
  }

  // Unauthorized: Return null while router completes redirect
  if (!authorized) {
    return null;
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('saas_admin_session');
    setAdminUser(null);
    router.replace('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background text-main flex font-sans">
      {/* ADMIN SIDEBAR */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div>
          {/* LOGO */}
          <div className="h-16 px-6 border-b border-border flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-heading tracking-tight block leading-none">
                SaaS Control Plane
              </span>
              <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">
                Super Admin
              </span>
            </div>
          </div>

          {/* NAV ITEMS */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const targetHref = item.href.replace('/admin', adminBasePath);
              const isActive = pathname === targetHref || pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={targetHref}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-primary-light text-primary font-semibold'
                      : 'text-secondary hover:text-heading hover:bg-surfaceMuted'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-placeholder'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ADMIN USER FOOTER & LOGOUT */}
        <div className="p-3 border-t border-border bg-surface">
          <div className="p-2.5 rounded-lg bg-surfaceMuted border border-border flex items-center justify-between mb-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-heading truncate">
                {adminUser?.fullName || 'Super Admin'}
              </p>
              <p className="text-[10px] text-secondary truncate">{adminUser?.email || 'admin@platform.com'}</p>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
              ADMIN
            </span>
          </div>

          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition border border-transparent hover:border-red-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Admin Session</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ADMIN TOP BAR */}
        <header className="h-16 border-b border-border bg-surface px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2 text-xs text-secondary">
            <span className="font-medium">SaaS Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-placeholder" />
            <span className="font-semibold text-heading capitalize">
              {pathname.replace('/admin/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Control Plane Active</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-8 flex-1 bg-background overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
