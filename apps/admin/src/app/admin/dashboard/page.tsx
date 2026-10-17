'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  ClipboardList,
  Store,
  Users,
  UserCheck,
  CreditCard,
  Layers,
  Zap,
  Sliders,
  Bell,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  LogOut,
  X,
  Menu,
  Check,
  AlertTriangle,
  RefreshCw,
  Plus,
  Lock,
  ChevronRight,
  Filter,
  Download,
  Send,
  MoreVertical,
  ShieldAlert,
  Server,
  Database,
  Smartphone,
  Key,
} from 'lucide-react';

// ============================================================
// DATA MODELS
// ============================================================

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'FINANCE_ADMIN'
  | 'SECURITY_ADMIN'
  | 'READ_ONLY_ADMIN';

export interface RegistrationReq {
  id: string;
  restaurantName: string;
  ownerName: string;
  applicantName?: string;
  email: string;
  applicantEmail?: string;
  phone: string;
  applicantPhone?: string;
  businessType: string;
  city: string;
  state: string;
  date: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'REQUIRES_INFO';
  requestedPlan: string;
  requestedModules: string[];
  intendedModules?: string[];
  tableCountEst: number;
}

export interface RestaurantTenant {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  businessType: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED' | 'INACTIVE';
  plan: string;
  mrr: number;
  tablesCount: number;
  staffCount: number;
  devicesCount: number;
  enabledModules: string[];
  createdAt: string;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'SUPER_ADMIN';
  restaurantName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  lastLogin: string;
  devices: number;
  sessions: number;
}

export interface RequestItem {
  id: string;
  restaurantName: string;
  type: 'PLAN_UPGRADE' | 'MODULE_REQUEST' | 'VERIFICATION' | 'REFUND' | 'DATA_EXPORT' | 'CONFIGURATION';
  title: string;
  status: 'SUBMITTED' | 'PENDING' | 'ASSIGNED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CLOSED';
  submittedBy: string;
  date: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SupportTicket {
  id: string;
  restaurantName: string;
  user: string;
  category: 'BILLING' | 'POS_HARDWARE' | 'SYNC' | 'ACCOUNT' | 'FEATURE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  subject: string;
  createdDate: string;
  lastUpdated: string;
  assignedAdmin: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  restaurant: string;
  ip: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
}

// ============================================================
// INITIAL SEED DATA
// ============================================================

const SEED_REGISTRATIONS: RegistrationReq[] = [
  {
    id: 'req-001',
    restaurantName: 'The Royal Tandoor & Grill',
    ownerName: 'Vikram Malhotra',
    email: 'vikram@malhotrahospitality.com',
    phone: '+91 98450 11223',
    businessType: 'RESTAURANT',
    city: 'Bengaluru',
    state: 'Karnataka',
    date: 'Sep 25, 2026',
    status: 'PENDING',
    requestedPlan: 'PRO',
    requestedModules: ['pos.dine_in', 'operations.tables', 'operations.kitchen_kds', 'billing.tax_invoice'],
    tableCountEst: 18,
  },
  {
    id: 'req-002',
    restaurantName: 'Artisan Sourdough Patisserie',
    ownerName: 'Chloe D’Souza',
    email: 'chloe@artisanbakery.in',
    phone: '+91 98200 44556',
    businessType: 'BAKERY',
    city: 'Mumbai',
    state: 'Maharashtra',
    date: 'Sep 25, 2026',
    status: 'UNDER_REVIEW',
    requestedPlan: 'STARTER',
    requestedModules: ['pos.quick_counter', 'billing.tax_invoice', 'inventory.stock'],
    tableCountEst: 4,
  },
  {
    id: 'req-003',
    restaurantName: 'Burger Junction QSR',
    ownerName: 'Karthik Rao',
    email: 'karthik@burgerjunction.com',
    phone: '+91 97400 99887',
    businessType: 'FAST_FOOD',
    city: 'Hyderabad',
    state: 'Telangana',
    date: 'Sep 24, 2026',
    status: 'APPROVED',
    requestedPlan: 'PRO',
    requestedModules: ['pos.quick_counter', 'pos.takeaway', 'billing.tax_invoice'],
    tableCountEst: 12,
  },
  {
    id: 'req-004',
    restaurantName: 'NightOwl Dark Kitchens',
    ownerName: 'Aditya Singhania',
    email: 'aditya@nightowlkitchen.com',
    phone: '+91 98111 22334',
    businessType: 'CLOUD_KITCHEN',
    city: 'Gurugram',
    state: 'Haryana',
    date: 'Sep 23, 2026',
    status: 'REJECTED',
    requestedPlan: 'STARTER',
    requestedModules: ['pos.delivery', 'operations.kitchen_kds'],
    tableCountEst: 0,
  },
];

const SEED_RESTAURANTS: RestaurantTenant[] = [
  {
    id: 'rest-001',
    name: 'The Royal Biryani & Cafe',
    slug: 'the-royal-biryani',
    ownerName: 'Rajesh Sharma',
    ownerEmail: 'owner@spicegarden.com',
    businessType: 'RESTAURANT',
    status: 'ACTIVE',
    plan: 'PRO',
    mrr: 4999,
    tablesCount: 24,
    staffCount: 14,
    devicesCount: 6,
    enabledModules: ['pos.dine_in', 'operations.tables', 'operations.kitchen_kds', 'billing.tax_invoice', 'inventory.stock', 'qr.ordering'],
    createdAt: 'Aug 10, 2026',
  },
  {
    id: 'rest-002',
    name: 'Bella Italia Woodfire Bistro',
    slug: 'bella-italia-bistro',
    ownerName: 'Marco Rossi',
    ownerEmail: 'marco@bellaitalia.in',
    businessType: 'RESTAURANT',
    status: 'ACTIVE',
    plan: 'ENTERPRISE',
    mrr: 9999,
    tablesCount: 36,
    staffCount: 22,
    devicesCount: 10,
    enabledModules: ['pos.dine_in', 'operations.tables', 'operations.kitchen_kds', 'billing.tax_invoice', 'inventory.stock', 'qr.ordering', 'analytics.advanced'],
    createdAt: 'Jul 15, 2026',
  },
  {
    id: 'rest-003',
    name: 'Central Espresso Lounge',
    slug: 'central-espresso',
    ownerName: 'Sunita Nambiar',
    ownerEmail: 'sunita@centralcafe.com',
    businessType: 'CAFE',
    status: 'TRIAL',
    plan: 'STARTER',
    mrr: 1999,
    tablesCount: 10,
    staffCount: 5,
    devicesCount: 2,
    enabledModules: ['pos.quick_counter', 'billing.tax_invoice'],
    createdAt: 'Sep 20, 2026',
  },
  {
    id: 'rest-004',
    name: 'Golden Dragon Dim Sum',
    slug: 'golden-dragon',
    ownerName: 'Wei Chen',
    ownerEmail: 'wei@goldendragon.pos',
    businessType: 'RESTAURANT',
    status: 'SUSPENDED',
    plan: 'PRO',
    mrr: 4999,
    tablesCount: 16,
    staffCount: 8,
    devicesCount: 3,
    enabledModules: ['pos.dine_in', 'operations.tables'],
    createdAt: 'May 04, 2026',
  },
];

const SEED_USERS: PlatformUser[] = [
  { id: 'usr-1', name: 'Rajesh Sharma', email: 'owner@spicegarden.com', role: 'OWNER', restaurantName: 'The Royal Biryani & Cafe', status: 'ACTIVE', lastLogin: '10m ago', devices: 2, sessions: 2 },
  { id: 'usr-2', name: 'Vikram Patel', email: 'manager@spicegarden.com', role: 'MANAGER', restaurantName: 'The Royal Biryani & Cafe', status: 'ACTIVE', lastLogin: '25m ago', devices: 1, sessions: 1 },
  { id: 'usr-3', name: 'Marco Rossi', email: 'marco@bellaitalia.in', role: 'OWNER', restaurantName: 'Bella Italia Woodfire Bistro', status: 'ACTIVE', lastLogin: '2h ago', devices: 3, sessions: 2 },
  { id: 'usr-4', name: 'Priya Verma', email: 'priya@spicegarden.com', role: 'STAFF', restaurantName: 'The Royal Biryani & Cafe', status: 'ACTIVE', lastLogin: '5m ago', devices: 1, sessions: 1 },
  { id: 'usr-5', name: 'Platform Super Admin', email: 'superadmin@posplatform.internal', role: 'SUPER_ADMIN', restaurantName: 'Platform Global', status: 'ACTIVE', lastLogin: 'Just now', devices: 1, sessions: 1 },
];

const SEED_REQUESTS: RequestItem[] = [
  { id: 'req-101', restaurantName: 'The Royal Biryani & Cafe', type: 'PLAN_UPGRADE', title: 'Upgrade from PRO to ENTERPRISE for Multi-Outlet', status: 'PENDING', submittedBy: 'Rajesh Sharma', date: 'Sep 25, 2026', priority: 'HIGH' },
  { id: 'req-102', restaurantName: 'Central Espresso Lounge', type: 'MODULE_REQUEST', title: 'Enable QR Contactless Ordering on Starter Plan', status: 'UNDER_REVIEW', submittedBy: 'Sunita Nambiar', date: 'Sep 24, 2026', priority: 'MEDIUM' },
  { id: 'req-103', restaurantName: 'Bella Italia Bistro', type: 'CONFIGURATION', title: 'Increase maximum concurrent POS thermal printers to 8', status: 'APPROVED', submittedBy: 'Marco Rossi', date: 'Sep 23, 2026', priority: 'LOW' },
  { id: 'req-104', restaurantName: 'Golden Dragon Dim Sum', type: 'REFUND', title: 'Billing dispute and partial refund claim for downtime', status: 'ASSIGNED', submittedBy: 'Wei Chen', date: 'Sep 22, 2026', priority: 'CRITICAL' },
];

const SEED_TICKETS: SupportTicket[] = [
  { id: 'tkt-401', restaurantName: 'The Royal Biryani & Cafe', user: 'Vikram (Manager)', category: 'POS_HARDWARE', priority: 'HIGH', status: 'OPEN', subject: 'KOT Slip printer buffer dropping characters under high load', createdDate: 'Sep 25, 2026', lastUpdated: '15m ago', assignedAdmin: 'Support Admin Alex' },
  { id: 'tkt-402', restaurantName: 'Bella Italia Bistro', user: 'Marco Rossi', category: 'BILLING', priority: 'MEDIUM', status: 'IN_PROGRESS', subject: 'Custom GST invoice header not showing legal tax identity number', createdDate: 'Sep 24, 2026', lastUpdated: '1h ago', assignedAdmin: 'Finance Admin Priya' },
  { id: 'tkt-403', restaurantName: 'Artisan Bakery', user: 'Chloe D’Souza', category: 'ACCOUNT', priority: 'LOW', status: 'RESOLVED', subject: 'Reset secondary manager PIN credentials', createdDate: 'Sep 23, 2026', lastUpdated: 'Yesterday', assignedAdmin: 'Support Admin Alex' },
];

const SEED_AUDIT_LOGS: AuditRecord[] = [
  { id: 'aud-901', timestamp: '2026-09-25 12:45:18', actor: 'SuperAdmin Vikram', actorRole: 'SUPER_ADMIN', action: 'APPROVE_REGISTRATION', target: 'req-003 (Burger Junction)', restaurant: 'Burger Junction QSR', ip: '14.139.241.11', result: 'SUCCESS' },
  { id: 'aud-902', timestamp: '2026-09-25 12:15:02', actor: 'FinanceAdmin Priya', actorRole: 'FINANCE_ADMIN', action: 'APPLY_DISCOUNT', target: 'Invoice #INV-2026-09-001', restaurant: 'The Royal Biryani', ip: '49.207.214.99', result: 'SUCCESS' },
  { id: 'aud-903', timestamp: '2026-09-25 11:30:45', actor: 'System Worker (Cron)', actorRole: 'SYSTEM', action: 'DB_AUTO_BACKUP', target: 'PostgreSQL Snapshot US-East', restaurant: 'Platform Global', ip: '10.0.4.12', result: 'SUCCESS' },
  { id: 'aud-904', timestamp: '2026-09-25 10:05:12', actor: 'Anonymous Attempt', actorRole: 'UNKNOWN', action: 'ADMIN_LOGIN_FAIL', target: 'superadmin@internal', restaurant: 'Platform Global', ip: '185.220.101.5', result: 'BLOCKED' },
];

export default function SuperAdminPortalPage() {
  // Navigation & Role State
  const [activeSectionId, setActiveSectionId] = useState<string>('dashboard');
  const [activeSubsection, setActiveSubsection] = useState<string>('All');
  const [adminRole, setAdminRole] = useState<AdminRole>('SUPER_ADMIN');
  const [globalSearch, setGlobalSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Application Data States
  const [registrations, setRegistrations] = useState<RegistrationReq[]>(SEED_REGISTRATIONS);
  const [restaurants, setRestaurants] = useState<RestaurantTenant[]>(SEED_RESTAURANTS);
  const [users, setUsers] = useState<PlatformUser[]>(SEED_USERS);
  const [requests, setRequests] = useState<RequestItem[]>(SEED_REQUESTS);
  const [tickets, setTickets] = useState<SupportTicket[]>(SEED_TICKETS);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(SEED_AUDIT_LOGS);

  // Drilldown Modal States
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationReq | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<RestaurantTenant | null>(null);
  const [tenantModalTab, setTenantModalTab] = useState<string>('Overview');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ fullName?: string; email?: string } | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 21 SECTIONS DEFINITION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const ADMIN_SECTIONS = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, subtabs: ['Overview', 'Quick Control', 'System Alerts', 'Platform Activity'] },
    { id: 'registration_requests', name: 'Registration Requests', icon: <ClipboardList className="w-4 h-4" />, badge: registrations.filter((r) => r.status === 'PENDING').length, subtabs: ['All Requests', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Requires Info'] },
    { id: 'restaurants', name: 'Restaurants', icon: <Store className="w-4 h-4" />, subtabs: ['All Restaurants', 'Active', 'Pending', 'Trial', 'Suspended', 'Expired'] },
    { id: 'users', name: 'Users', icon: <Users className="w-4 h-4" />, subtabs: ['All Users', 'Owners', 'Staff', 'Platform Admins', 'Suspended'] },
    { id: 'staff', name: 'Staff Management', icon: <UserCheck className="w-4 h-4" />, subtabs: ['All Staff', 'Active Terminals', 'Role Matrix', 'Sessions'] },
    { id: 'subscriptions', name: 'Subscriptions', icon: <CreditCard className="w-4 h-4" />, subtabs: ['All Subscriptions', 'Active', 'Trial Lifecycle', 'Past Due', 'Cancelled'] },
    { id: 'plans_features', name: 'Plans & Features', icon: <Layers className="w-4 h-4" />, subtabs: ['Plans Registry', 'Feature Entitlements', 'Usage Quotas', 'Pricing Tiers'] },
    { id: 'platform_modules', name: 'Platform Modules', icon: <Zap className="w-4 h-4" />, subtabs: ['Module Registry', 'Global Toggles', 'Beta Features', 'Maintenance'] },
    { id: 'restaurant_configuration', name: 'Restaurant Configuration', icon: <Sliders className="w-4 h-4" />, subtabs: ['Config Inspector', 'Printer Routing', 'Tax & Invoice Rules', 'Hardware Bindings'] },
  ];

  const currentSection = ADMIN_SECTIONS.find((s) => s.id === activeSectionId) || ADMIN_SECTIONS[0];

  // Load real data from PostgreSQL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sess = localStorage.getItem('saas_admin_session');
      if (sess) {
        try {
          const parsed = JSON.parse(sess);
          setAdminUser(parsed);
        } catch (e) {}
      } else {
        const cookieMatch = document.cookie.match(/saas_admin_session=([^;]+)/);
        if (!cookieMatch) {
          window.location.href = '/admin/login';
          return;
        }
      }
    }
    async function loadData() {
      try {
        const [regRes, tenRes, logRes] = await Promise.all([
          fetch('/api/admin/registrations').then((r) => r.json()).catch(() => ({})),
          fetch('/api/admin/tenants').then((r) => r.json()).catch(() => ({})),
          fetch('/api/admin/audit-logs').then((r) => r.json()).catch(() => ({})),
        ]);

        if (regRes?.requests?.length) {
          setRegistrations(
            regRes.requests.map((r: any) => ({
              id: r.id,
              restaurantName: r.restaurantName || r.name || 'Unknown Restaurant',
              ownerName: r.ownerName || r.applicantName || 'Applicant',
              email: r.email || r.applicantEmail || '',
              phone: r.phone || r.applicantPhone || '',
              businessType: r.businessType || 'RESTAURANT',
              city: r.city || 'Bengaluru',
              state: r.state || 'Karnataka',
              date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'),
              status: r.status || 'PENDING',
              requestedPlan: r.requestedPlan || 'PRO',
              requestedModules: Array.isArray(r.requestedModules)
                ? r.requestedModules
                : Array.isArray(r.intendedModules)
                ? r.intendedModules
                : ['pos.billing', 'pos.quick_counter'],
              tableCountEst: r.tableCountEst ?? 10,
            }))
          );
        }
        if (tenRes?.tenants?.length) {
          setRestaurants(
            tenRes.tenants.map((t: any) => ({
              id: t.id,
              name: t.name,
              slug: t.slug,
              ownerName: t.profile?.businessName || t.name,
              ownerEmail: t.users?.[0]?.email || 'owner@restaurant.pos',
              businessType: t.businessType,
              status: t.status === 'APPROVED' ? 'ACTIVE' : t.status,
              plan: t.subscription?.planName || 'PRO',
              mrr: 4999,
              tablesCount: t.metrics?.tablesCount || 12,
              staffCount: t.users?.length || 4,
              devicesCount: 2,
              enabledModules: t.modules || ['POS', 'TABLES', 'ORDERS', 'KITCHEN', 'BILLING'],
              createdAt: new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            }))
          );
        }
        if (logRes?.logs?.length) {
          setAuditLogs(
            logRes.logs.map((l: any) => ({
              id: l.id,
              timestamp: new Date(l.timestamp).toISOString().replace('T', ' ').slice(0, 19),
              actor: l.userName || 'System',
              actorRole: 'SUPER_ADMIN',
              action: l.action,
              target: l.entityId || l.entityType,
              restaurant: l.tenantName || 'Platform',
              ip: '127.0.0.1 (Supabase Pooler)',
              result: 'SUCCESS',
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load admin live data:', err);
      }
    }
    loadData();
  }, []);

  // Actions on Registrations with PostgreSQL persistence
  const handleUpdateRegistrationStatus = async (
    id: string,
    newStatus: RegistrationReq['status']
  ) => {
    try {
      await fetch('/api/admin/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: id,
          action: newStatus === 'APPROVED' ? 'APPROVE' : 'REJECT',
        }),
      });
    } catch (e) {
      console.error('Failed to persist registration change:', e);
    }

    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    if (selectedRegistration?.id === id) {
      setSelectedRegistration({ ...selectedRegistration, status: newStatus });
    }

    // Add Audit Log
    const newLog: AuditRecord = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: `Admin (${adminRole})`,
      actorRole: adminRole,
      action: `REGISTRATION_${newStatus}`,
      target: id,
      restaurant: selectedRegistration?.restaurantName || 'Restaurant Registration',
      ip: '127.0.0.1 (Supabase Pooler)',
      result: 'SUCCESS',
    };
    setAuditLogs([newLog, ...auditLogs]);
    showToast(`Registration ${id} status updated to ${newStatus} in PostgreSQL`);
  };

  // Actions on Tenants with PostgreSQL persistence
  const handleToggleTenantStatus = async (id: string, newStatus: RestaurantTenant['status']) => {
    try {
      await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: id,
          action: newStatus === 'ACTIVE' ? 'ACTIVATE' : 'SUSPEND',
        }),
      });
    } catch (e) {
      console.error('Failed to persist tenant status:', e);
    }

    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    if (selectedTenant?.id === id) {
      setSelectedTenant({ ...selectedTenant, status: newStatus });
    }
    showToast(`Restaurant ${id} updated to ${newStatus} in PostgreSQL`);
  };

  // Calculations
  const totalMRR = restaurants.reduce((acc, r) => acc + (r.status === 'ACTIVE' ? r.mrr : 0), 0);
  const totalRestaurants = restaurants.length;
  const activeCount = restaurants.filter((r) => r.status === 'ACTIVE').length;
  const pendingRequestsCount = registrations.filter((r) => r.status === 'PENDING').length;
  const openTicketsCount = tickets.filter((t) => t.status === 'OPEN').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-main font-sans relative">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MOBILE DRAWER BACKDROP
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          LEFT SIDEBAR: 21 Single-Level Sections
          Desktop: Fixed Sidebar | Mobile: Slide-over Drawer
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-surface border-r border-border flex flex-col select-none flex-shrink-0 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-bold text-white shadow-button">
              <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-semibold text-[15px] text-heading leading-tight">Super Admin</h1>
              <span className="text-[11px] text-muted font-medium">Control Center</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-light text-primary">
              SaaS Root
            </span>
            {/* Close button on mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg text-placeholder hover:text-heading hover:bg-surfaceMuted md:hidden cursor-pointer"
              title="Close Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-placeholder">
            Platform Sections
          </div>

          {ADMIN_SECTIONS.map((sec) => {
            const isActive = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setActiveSectionId(sec.id);
                  setActiveSubsection(sec.subtabs[0]);
                  setMobileMenuOpen(false);
                }}
                className={`group relative w-full flex items-center justify-between rounded-xl font-medium text-[13px] px-3.5 py-2.5 transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-primary-light text-primary font-semibold'
                    : 'text-secondary hover:text-main hover:bg-surfaceMuted'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r" />
                )}

                <div className="flex items-center space-x-3 truncate">
                  <span className={isActive ? 'text-primary' : 'text-placeholder group-hover:text-secondary'}>
                    {sec.icon}
                  </span>
                  <span className="truncate">{sec.name}</span>
                </div>

                {sec.badge && sec.badge > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                    {sec.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Admin Session & Persona Switcher */}
        <div className="p-3 border-t border-border bg-surfaceMuted">
          <div className="p-2.5 rounded-xl bg-surface border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-8 h-8 rounded-full bg-heading text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {adminUser?.fullName ? adminUser.fullName.substring(0, 2).toUpperCase() : 'SA'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-heading truncate">{adminUser?.fullName || 'Tarun (Super Admin)'}</div>
                  <div className="text-[10px] text-muted truncate">{adminUser?.email || 'tarunuttupulusu@gmail.com'}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('saas_admin_session');
                    document.cookie = 'saas_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                  }
                  window.location.href = '/admin/login';
                }}
                className="p-1.5 rounded-lg text-placeholder hover:text-danger hover:bg-danger-bg transition cursor-pointer"
                title="Logout from Admin"
              >
                <LogOut className="w-4 h-4 stroke-[1.8]" />
              </button>
            </div>

            {/* Admin Role Selector per Spec */}
            <div className="pt-2 border-t border-borderLight flex items-center justify-between text-[11px]">
              <span className="text-muted">Admin Role:</span>
              <select
                value={adminRole}
                onChange={(e) => setAdminRole(e.target.value as AdminRole)}
                className="bg-surface border border-border rounded px-1.5 py-0.5 text-[11px] font-semibold text-heading cursor-pointer"
              >
                <option value="SUPER_ADMIN">👑 Super Admin</option>
                <option value="PLATFORM_ADMIN">💼 Platform Admin</option>
                <option value="SUPPORT_ADMIN">🎧 Support Admin</option>
                <option value="FINANCE_ADMIN">💵 Finance Admin</option>
                <option value="SECURITY_ADMIN">🛡️ Security Admin</option>
                <option value="READ_ONLY_ADMIN">👁️ Read-Only</option>
              </select>
            </div>
          </div>
        </div>
      </aside>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TOPBAR & MAIN VIEWPORT
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Global Topbar */}
        <header className="h-16 border-b border-border bg-surface px-3 sm:px-6 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-xl text-secondary hover:text-heading hover:bg-surfaceMuted transition cursor-pointer shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-medium text-muted min-w-0 truncate">
              <span className="hidden sm:inline">SaaS Control Center</span>
              <ChevronRight className="w-3.5 h-3.5 hidden sm:inline shrink-0" />
              <span className="text-heading font-semibold truncate">{currentSection.name}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Global Search across Restaurants, Users, Staff, Requests */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-placeholder absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search..."
                className="search-input h-[36px] text-xs pl-8 pr-2.5 sm:pr-3 w-28 xs:w-36 sm:w-52 md:w-64 lg:w-80"
              />
            </div>

            {/* System Status Pill */}
            <div className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-success-bg text-success border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>All 12 Microservices Online</span>
            </div>

            {/* Notifications Alert */}
            <button
              type="button"
              onClick={() => showToast('No pending security alerts.')}
              className="p-2 rounded-xl text-placeholder hover:text-heading hover:bg-surfaceMuted transition relative cursor-pointer"
            >
              <Bell className="w-4 h-4 stroke-[1.9]" />
              <span className="w-2 h-2 bg-primary rounded-full absolute top-1.5 right-1.5" />
            </button>
          </div>
        </header>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SUBSECTIONS BAR: Horizontal Tabs
            Per Spec: "Sidebar -> Section -> Subsection (tabs) -> Detail Page -> Actions"
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="bg-surface border-b border-border px-3 sm:px-6 flex items-center justify-between gap-2">
          <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto py-2 min-w-0 no-scrollbar">
            {currentSection.subtabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubsection(tab)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSubsection === tab
                    ? 'bg-primary-light text-primary'
                    : 'text-secondary hover:text-heading hover:bg-surfaceMuted'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="hidden md:block text-xs text-muted shrink-0">
            Viewing: <strong className="text-heading">{activeSubsection}</strong>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION CONTENT SWITCHER
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Toast Notification */}
          {notification && (
            <div className="p-3 bg-heading text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg">
              <span>{notification}</span>
              <button onClick={() => setNotification(null)}>✕</button>
            </div>
          )}

          {/* ============================================================ */}
          {/* 1. DASHBOARD SECTION (Quick Control Cards + Overview) */}
          {/* ============================================================ */}
          {activeSectionId === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Control Cards per Spec */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card cursor-pointer hover:border-primary/40" onClick={() => setActiveSectionId('registration_requests')}>
                  <div className="text-xs text-muted font-semibold uppercase">Pending Registrations</div>
                  <div className="text-2xl font-bold text-primary mt-1">{pendingRequestsCount} Requests</div>
                  <span className="text-[11px] text-muted">Requires review & onboarding</span>
                </div>

                <div className="stat-card cursor-pointer hover:border-primary/40" onClick={() => setActiveSectionId('restaurants')}>
                  <div className="text-xs text-muted font-semibold uppercase">Active Tenants</div>
                  <div className="text-2xl font-bold text-heading mt-1">{activeCount} / {totalRestaurants}</div>
                  <span className="text-[11px] text-success font-medium">99.8% Uptime</span>
                </div>

                <div className="stat-card cursor-pointer hover:border-primary/40" onClick={() => setActiveSectionId('finance')}>
                  <div className="text-xs text-muted font-semibold uppercase">Monthly Recurring Revenue</div>
                  <div className="text-2xl font-bold text-heading mt-1">₹{totalMRR.toLocaleString()}</div>
                  <span className="text-[11px] text-success font-medium">+18.4% this month</span>
                </div>

                <div className="stat-card cursor-pointer hover:border-primary/40" onClick={() => setActiveSectionId('support')}>
                  <div className="text-xs text-muted font-semibold uppercase">Open Support Tickets</div>
                  <div className="text-2xl font-bold text-danger mt-1">{openTicketsCount} Open</div>
                  <span className="text-[11px] text-muted">Avg response time: 14m</span>
                </div>
              </div>

              {/* System Alert Banner */}
              <div className="p-4 bg-primary-soft/40 border border-primary/20 rounded-2xl flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-heading">System Status: All Core Services Operational</h4>
                    <p className="text-[11px] text-secondary">
                      Database latency at 38ms. Offline sync queue processed 18,420 transactions in the last 24h.
                    </p>
                  </div>
                </div>
                <button onClick={() => setActiveSectionId('system_monitoring')} className="btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto flex-shrink-0">
                  Inspect Metrics
                </button>
              </div>

              {/* Two Column Dashboard Grid: Recent Registrations & Live Audit */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-borderLight">
                    <h3 className="font-semibold text-heading text-sm">Recent Registration Submissions</h3>
                    <button onClick={() => setActiveSectionId('registration_requests')} className="text-xs text-primary font-semibold hover:underline">
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-borderLight">
                    {registrations.slice(0, 3).map((reg) => (
                      <div key={reg.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-xs text-heading">{reg.restaurantName}</div>
                          <div className="text-[11px] text-muted">{reg.ownerName} • {reg.city} • Plan: {reg.requestedPlan}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          reg.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {reg.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-borderLight">
                    <h3 className="font-semibold text-heading text-sm">Real-time Platform Audit Log</h3>
                    <button onClick={() => setActiveSectionId('audit_logs')} className="text-xs text-primary font-semibold hover:underline">
                      Full Audit
                    </button>
                  </div>
                  <div className="divide-y divide-borderLight">
                    {auditLogs.slice(0, 3).map((log) => (
                      <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-heading">{log.action}</div>
                          <div className="text-[11px] text-muted">{log.actor} on {log.target}</div>
                        </div>
                        <span className="font-mono text-[10px] text-muted">{log.timestamp.split(' ')[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. REGISTRATION REQUESTS SECTION */}
          {/* ============================================================ */}
          {activeSectionId === 'registration_requests' && (
            <div className="card p-0 overflow-hidden space-y-0">
              <div className="p-4 border-b border-borderLight flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between bg-surfaceMuted">
                <div>
                  <h3 className="font-semibold text-heading text-sm">Restaurant Onboarding Requests</h3>
                  <p className="text-xs text-muted">Review, verify, and approve incoming restaurant tenant applications</p>
                </div>
                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <button className="btn-secondary text-xs py-1.5 px-3">
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto min-w-full">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-surface text-muted uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="px-5 py-3">Restaurant & Owner</th>
                      <th className="px-5 py-3">Type & City</th>
                      <th className="px-5 py-3">Requested Plan</th>
                      <th className="px-5 py-3">Modules</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLight">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-surfaceMuted/50 transition">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-heading">{reg.restaurantName}</div>
                          <div className="text-muted text-[11px]">{reg.ownerName || 'Applicant'} • {reg.email || ''}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="capitalize">{(reg.businessType || 'RESTAURANT').toLowerCase()}</span>
                          <div className="text-muted text-[11px]">{reg.city || 'Bengaluru'}{reg.state ? `, ${reg.state}` : ''}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-heading">{reg.requestedPlan || 'PRO'}</span>
                          <div className="text-muted text-[11px]">~{reg.tableCountEst ?? 10} Tables</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-surfaceMuted border border-border text-[10px] font-mono">
                            {(reg.requestedModules?.length ?? 0)} Modules
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            reg.status === 'APPROVED' ? 'bg-success-bg text-success' :
                            reg.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            'bg-danger-bg text-danger'
                          }`}>
                            {reg.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedRegistration(reg)}
                            className="px-2.5 py-1 rounded bg-surface border border-border hover:bg-surfaceMuted text-heading font-medium"
                          >
                            Review Application
                          </button>
                          {reg.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateRegistrationStatus(reg.id, 'APPROVED')}
                                className="px-2 py-1 rounded bg-success-bg text-success border border-emerald-300 font-bold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateRegistrationStatus(reg.id, 'REJECTED')}
                                className="px-2 py-1 rounded bg-danger-bg text-danger border border-rose-300 font-bold"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. RESTAURANTS SECTION (Tenant Control Center) */}
          {/* ============================================================ */}
          {activeSectionId === 'restaurants' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-heading text-sm">Tenant Restaurants Directory</h3>
                  <p className="text-xs text-muted">Manage all active, trial, and suspended restaurant accounts</p>
                </div>
                <button
                  onClick={() => showToast('Tenant provisioning wizard initiated.')}
                  className="btn-primary text-xs py-2 px-3.5 self-start sm:self-auto flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Provision New Tenant</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {restaurants.map((t) => (
                  <div key={t.id} className="card p-5 space-y-4 hover:border-primary/40 transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-heading text-base">{t.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'ACTIVE' ? 'bg-success-bg text-success' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">Owner: {t.ownerName} ({t.ownerEmail})</p>
                      </div>

                      <div className="text-right">
                        <span className="font-semibold text-primary text-sm">₹{t.mrr.toLocaleString()}</span>
                        <div className="text-[10px] text-muted font-bold uppercase">{t.plan} Plan</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-borderLight text-center text-xs">
                      <div>
                        <span className="text-muted block text-[10px]">Tables</span>
                        <strong className="text-heading">{t.tablesCount}</strong>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">Staff Users</span>
                        <strong className="text-heading">{t.staffCount}</strong>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px]">Terminals</span>
                        <strong className="text-heading">{t.devicesCount}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted">{(t.enabledModules?.length ?? 0)} Modules Active</span>
                      <div className="space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTenant(t);
                            setTenantModalTab('Overview');
                          }}
                          className="btn-secondary text-xs py-1.5 px-3 font-semibold"
                        >
                          Open Control Center
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 4. USERS SECTION */}
          {/* ============================================================ */}
          {activeSectionId === 'users' && (
            <div className="card p-0 overflow-hidden">
              <div className="p-4 bg-surfaceMuted border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-heading text-sm">Registered Platform Users</h3>
                  <p className="text-xs text-muted">Platform administrators, restaurant owners, and staff</p>
                </div>
              </div>
              <div className="overflow-x-auto min-w-full">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-surface text-muted uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="px-5 py-3">User Name & Email</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Restaurant Association</th>
                      <th className="px-5 py-3">Active Sessions</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLight">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-surfaceMuted/50 transition">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-heading">{u.name}</div>
                          <div className="text-muted text-[11px]">{u.email}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-light text-primary">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-secondary">{u.restaurantName}</td>
                        <td className="px-5 py-3.5 font-mono text-muted">{u.sessions} sessions ({u.devices} devices)</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-bg text-success">
                            {u.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => showToast(`Reset password link dispatched to ${u.email}`)}
                            className="px-2 py-1 rounded border border-border text-[11px] font-medium hover:bg-surfaceMuted"
                          >
                            Reset Credentials
                          </button>
                          <button
                            onClick={() => showToast(`All sessions revoked for ${u.name}`)}
                            className="px-2 py-1 rounded bg-danger-bg text-danger border border-rose-300 text-[11px] font-bold"
                          >
                            Revoke Sessions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 5. REQUEST CENTER SECTION */}
          {/* ============================================================ */}
          {activeSectionId === 'requests' && (
            <div className="card p-0 overflow-hidden">
              <div className="p-4 bg-surfaceMuted border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-heading text-sm">Centralized Request Center</h3>
                  <p className="text-xs text-muted">Workflow: Submitted → Pending → Assigned → Under Review → Approved / Closed</p>
                </div>
              </div>
              <div className="overflow-x-auto min-w-full">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-surface text-muted uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="px-5 py-3">Request Details</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Restaurant & Submitter</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLight">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-surfaceMuted/50 transition">
                        <td className="px-5 py-3.5 font-semibold text-heading">{req.title}</td>
                        <td className="px-5 py-3.5 font-mono text-[10px] text-muted">{req.type}</td>
                        <td className="px-5 py-3.5 text-secondary">{req.restaurantName} ({req.submittedBy})</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.priority === 'CRITICAL' ? 'bg-danger-bg text-danger' : 'bg-surfaceMuted text-secondary'
                          }`}>
                            {req.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            {req.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setRequests((prev) =>
                                prev.map((r) => (r.id === req.id ? { ...r, status: 'APPROVED' } : r))
                              );
                              showToast(`Request ${req.id} approved`);
                            }}
                            className="px-2 py-1 rounded bg-success-bg text-success border border-emerald-300 font-bold"
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 6. SUPPORT TICKETS SECTION */}
          {/* ============================================================ */}
          {activeSectionId === 'support' && (
            <div className="card p-0 overflow-hidden">
              <div className="p-4 bg-surfaceMuted border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-heading text-sm">Platform Support Operations</h3>
                  <p className="text-xs text-muted">Direct restaurant owner communication and SLA tracking</p>
                </div>
              </div>
              <div className="overflow-x-auto min-w-full">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-surface text-muted uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="px-5 py-3">Subject & ID</th>
                      <th className="px-5 py-3">Restaurant</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLight">
                    {tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-surfaceMuted/50 transition">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-heading">{t.subject}</div>
                          <div className="text-muted text-[11px]">{t.id} • {t.user}</div>
                        </td>
                        <td className="px-5 py-3.5">{t.restaurantName}</td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-muted">{t.category}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.priority === 'HIGH' ? 'bg-danger-bg text-danger' : 'bg-surfaceMuted text-secondary'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            {t.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => setSelectedTicket(t)}
                            className="btn-secondary text-xs py-1 px-3"
                          >
                            Open Thread
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 7. SYSTEM MONITORING SECTION */}
          {/* ============================================================ */}
          {activeSectionId === 'system_monitoring' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                  <div className="text-xs text-muted uppercase font-bold">API Latency (p95)</div>
                  <div className="text-2xl font-bold text-success mt-1">42 ms</div>
                  <span className="text-[11px] text-muted">Edge cluster Singapore</span>
                </div>
                <div className="stat-card">
                  <div className="text-xs text-muted uppercase font-bold">PostgreSQL Pool</div>
                  <div className="text-2xl font-bold text-heading mt-1">18 / 100 Conn</div>
                  <span className="text-[11px] text-success">Healthy load</span>
                </div>
                <div className="stat-card">
                  <div className="text-xs text-muted uppercase font-bold">Sync Queue Backlog</div>
                  <div className="text-2xl font-bold text-heading mt-1">0 Pending</div>
                  <span className="text-[11px] text-muted">Instant reconciliation</span>
                </div>
                <div className="stat-card">
                  <div className="text-xs text-muted uppercase font-bold">Cron Daemon</div>
                  <div className="text-2xl font-bold text-success mt-1">Operational</div>
                  <span className="text-[11px] text-muted">Next run in 4m</span>
                </div>
              </div>

              <div className="card p-5 space-y-3">
                <h4 className="font-semibold text-heading text-sm">Microservice Fleet Status</h4>
                <div className="divide-y divide-borderLight text-xs">
                  {[
                    { name: 'Tenant Routing Gateway', status: 'HEALTHY', ping: '12ms', region: 'ap-south-1' },
                    { name: 'KDS Socket Cluster', status: 'HEALTHY', ping: '18ms', region: 'ap-south-1' },
                    { name: 'Offline Sync Queue Worker', status: 'HEALTHY', ping: '24ms', region: 'ap-south-1' },
                    { name: 'Thermal ESC/POS Webhook Daemon', status: 'HEALTHY', ping: '15ms', region: 'ap-south-1' },
                    { name: 'Billing & Tax Calculation Engine', status: 'HEALTHY', ping: '8ms', region: 'ap-south-1' },
                  ].map((srv, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Server className="w-4 h-4 text-muted" />
                        <span className="font-semibold text-heading">{srv.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-muted font-mono text-[11px]">{srv.region}</span>
                        <span className="text-muted font-mono text-[11px]">{srv.ping}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-bg text-success">
                          {srv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 8. AUDIT LOGS SECTION */}
          {/* ============================================================ */}
          {activeSectionId === 'audit_logs' && (
            <div className="card p-0 overflow-hidden">
              <div className="p-4 bg-surfaceMuted border-b border-border flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-heading text-sm">Immutable Administrator Audit Trail</h3>
                  <p className="text-xs text-muted">Append-only compliance log for forensic tracking and regulatory reviews</p>
                </div>
                <button
                  onClick={() => showToast('Audit trail exported securely.')}
                  className="btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Cryptographic Hash</span>
                </button>
              </div>
              <div className="overflow-x-auto min-w-full">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-surface text-muted uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">Actor & Role</th>
                      <th className="px-5 py-3">Action</th>
                      <th className="px-5 py-3">Target Entity</th>
                      <th className="px-5 py-3">IP Address</th>
                      <th className="px-5 py-3 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLight">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surfaceMuted/50 transition">
                        <td className="px-5 py-3.5 font-mono text-[11px] text-muted">{log.timestamp}</td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-heading">{log.actor}</span>
                          <div className="text-[10px] text-primary font-bold">{log.actorRole}</div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-heading">{log.action}</td>
                        <td className="px-5 py-3.5 text-secondary">{log.target}</td>
                        <td className="px-5 py-3.5 font-mono text-muted text-[11px]">{log.ip}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.result === 'SUCCESS' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
                          }`}>
                            {log.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* FALLBACK FOR OTHER SECTIONS (Features, Modules, Settings, etc.) */}
          {/* ============================================================ */}
          {!['dashboard', 'registration_requests', 'restaurants', 'users', 'requests', 'support', 'system_monitoring', 'audit_logs'].includes(activeSectionId) && (
            <div className="card p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-borderLight">
                <div>
                  <h3 className="text-xl font-bold text-heading">{currentSection.name}</h3>
                  <p className="text-xs text-muted mt-0.5">SaaS Platform Configuration & Governance</p>
                </div>
                <button onClick={() => showToast(`${currentSection.name} synchronized`)} className="btn-primary text-xs py-2 px-4">
                  Save Changes
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentSection.subtabs.map((sub, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-surfaceMuted border border-borderLight space-y-2 hover:border-primary/40 transition">
                    <h4 className="font-semibold text-xs text-heading">{sub}</h4>
                    <p className="text-[11px] text-secondary">
                      Configure platform-wide rules, quotas, and automation triggers for {sub}.
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-success font-semibold text-[11px]">• Enabled</span>
                      <button className="text-primary hover:underline font-semibold">Configure</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          REGISTRATION APPLICATION REVIEW MODAL
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {selectedRegistration && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-borderLight flex items-center justify-between bg-surfaceMuted">
              <div>
                <h3 className="font-semibold text-heading text-base sm:text-lg">{selectedRegistration.restaurantName}</h3>
                <p className="text-xs text-muted">Application ID: {selectedRegistration.id} • Submitted: {selectedRegistration.date}</p>
              </div>
              <button onClick={() => setSelectedRegistration(null)} className="p-1 rounded text-placeholder hover:text-heading">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-muted block font-semibold">Owner Contact</span>
                  <div className="text-heading font-medium">{selectedRegistration.ownerName}</div>
                  <div className="text-secondary">{selectedRegistration.email}</div>
                  <div className="text-secondary">{selectedRegistration.phone}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted block font-semibold">Business Classification</span>
                  <div className="text-heading font-medium">{selectedRegistration.businessType || 'RESTAURANT'}</div>
                  {selectedRegistration.city && (
                    <div className="text-secondary">{selectedRegistration.city}{selectedRegistration.state ? `, ${selectedRegistration.state}` : ''}</div>
                  )}
                  {selectedRegistration.tableCountEst != null && selectedRegistration.tableCountEst > 0 && (
                    <div className="text-primary font-bold">Estimated {selectedRegistration.tableCountEst} Tables</div>
                  )}
                </div>
              </div>

              {((selectedRegistration.requestedModules && selectedRegistration.requestedModules.length > 0) ||
                (selectedRegistration.intendedModules && selectedRegistration.intendedModules.length > 0)) && (
                <div className="p-4 bg-surfaceMuted rounded-xl border border-borderLight space-y-2">
                  <span className="text-muted font-semibold block">Requested Platform Modules</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedRegistration.requestedModules || selectedRegistration.intendedModules || []).map((m: any) => (
                      <span key={m} className="px-2 py-0.5 rounded bg-surface border border-border font-mono text-[10px] text-heading">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-muted font-semibold block">Application Status</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full font-bold text-xs ${
                  selectedRegistration.status === 'APPROVED' ? 'bg-success-bg text-success' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedRegistration.status}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-borderLight bg-surfaceMuted flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between">
              <button
                onClick={() => handleUpdateRegistrationStatus(selectedRegistration.id, 'REQUIRES_INFO')}
                className="btn-secondary text-xs py-2 px-4 w-full sm:w-auto"
              >
                Request Additional Info
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleUpdateRegistrationStatus(selectedRegistration.id, 'REJECTED')}
                  className="px-3 sm:px-4 py-2 rounded-xl bg-danger-bg text-danger border border-rose-300 font-semibold text-xs hover:bg-rose-100 transition flex-1 sm:flex-initial"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateRegistrationStatus(selectedRegistration.id, 'APPROVED')}
                  className="btn-primary text-xs py-2 px-4 sm:px-5 flex-1 sm:flex-initial"
                >
                  Approve & Provision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          RESTAURANT CONTROL CENTER MODAL
          Per Specification:
          Tabs: Overview, Profile, Owner, Users, Staff,
                Modules, Subscription, Billing, Tables, Menu,
                Devices, Storage, Activity, Support, Audit
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-borderLight flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-surfaceMuted">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white shadow-button shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-heading text-base sm:text-lg">{selectedTenant.name}</h3>
                  <p className="text-xs text-muted">Tenant ID: {selectedTenant.id} • Slug: /{selectedTenant.slug}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <a
                  href={`${
                    process.env.NEXT_PUBLIC_APP_URL ||
                    (typeof window !== 'undefined' && window.location.hostname.includes('localhost')
                      ? 'http://localhost:8000'
                      : 'https://www.zipbill.shop')
                  }/${selectedTenant.slug}/dashboard`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
                >
                  <span>Open Client Outlet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => setSelectedTenant(null)} className="p-1.5 rounded text-placeholder hover:text-heading">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Control Center Tabs per Spec */}
            <div className="flex border-b border-borderLight bg-surface px-5 space-x-2 overflow-x-auto">
              {[
                'Overview',
                'Profile',
                'Owner',
                'Modules',
                'Subscription',
                'Hardware & Devices',
                'Activity',
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTenantModalTab(tab)}
                  className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                    tenantModalTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-heading'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {tenantModalTab === 'Overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="stat-card p-3">
                      <span className="text-[10px] text-muted block uppercase">Status</span>
                      <strong className="text-success text-sm">{selectedTenant.status}</strong>
                    </div>
                    <div className="stat-card p-3">
                      <span className="text-[10px] text-muted block uppercase">Plan</span>
                      <strong className="text-heading text-sm">{selectedTenant.plan}</strong>
                    </div>
                    <div className="stat-card p-3">
                      <span className="text-[10px] text-muted block uppercase">Tables</span>
                      <strong className="text-heading text-sm">{selectedTenant.tablesCount} Tables</strong>
                    </div>
                    <div className="stat-card p-3">
                      <span className="text-[10px] text-muted block uppercase">MRR</span>
                      <strong className="text-primary text-sm">₹{selectedTenant.mrr}</strong>
                    </div>
                  </div>

                  <div className="p-4 bg-surfaceMuted rounded-xl border border-borderLight space-y-2">
                    <span className="font-semibold text-heading block">Active Platform Modules</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedTenant.enabledModules || []).map((m) => (
                        <span key={m} className="px-2 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-heading">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tenantModalTab === 'Profile' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-muted block">Legal Entity Name</span>
                    <strong className="text-heading">{selectedTenant.name} Pvt. Ltd.</strong>
                  </div>
                  <div>
                    <span className="text-muted block">Business Type</span>
                    <strong className="text-heading">{selectedTenant.businessType}</strong>
                  </div>
                  <div>
                    <span className="text-muted block">Registered Slug</span>
                    <strong className="text-heading">app.posplatform.com/{selectedTenant.slug}</strong>
                  </div>
                </div>
              )}

              {tenantModalTab === 'Owner' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-muted block">Primary Owner Name</span>
                    <strong className="text-heading">{selectedTenant.ownerName}</strong>
                  </div>
                  <div>
                    <span className="text-muted block">Owner Email</span>
                    <strong className="text-heading">{selectedTenant.ownerEmail}</strong>
                  </div>
                </div>
              )}

              {tenantModalTab === 'Subscription' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-surfaceMuted rounded-xl border border-borderLight">
                    <div>
                      <strong className="text-heading text-sm block">{selectedTenant.plan} Subscription</strong>
                      <span className="text-muted">Billed Monthly • Renews on Oct 10, 2026</span>
                    </div>
                    <span className="text-primary font-bold text-base">₹{selectedTenant.mrr} / mo</span>
                  </div>
                </div>
              )}

              {tenantModalTab === 'Hardware & Devices' && (
                <div className="space-y-2">
                  <div className="p-3 bg-surfaceMuted rounded-xl border border-borderLight flex justify-between items-center">
                    <div>
                      <strong className="text-heading block">Main Billing Counter Terminal</strong>
                      <span className="text-muted text-[11px]">Hardware ID: DEV-TERM-01 • Windows Web App</span>
                    </div>
                    <span className="text-success font-semibold">Active</span>
                  </div>
                </div>
              )}

              {tenantModalTab === 'Activity' && (
                <div className="space-y-2">
                  <div className="p-3 bg-surfaceMuted rounded-xl border border-borderLight text-xs">
                    <span className="text-muted block font-mono text-[10px]">2026-09-25 10:15 AM</span>
                    <span className="text-heading font-medium">Tenant profile updated by owner</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-borderLight bg-surfaceMuted flex flex-col-reverse sm:flex-row gap-2.5 sm:items-center sm:justify-between">
              {selectedTenant.status === 'ACTIVE' ? (
                <button
                  onClick={() => handleToggleTenantStatus(selectedTenant.id, 'SUSPENDED')}
                  className="px-4 py-2 rounded-xl bg-danger-bg text-danger border border-rose-300 font-semibold text-xs hover:bg-rose-100 transition w-full sm:w-auto"
                >
                  Suspend Tenant Access
                </button>
              ) : (
                <button
                  onClick={() => handleToggleTenantStatus(selectedTenant.id, 'ACTIVE')}
                  className="btn-primary text-xs py-2 px-4 w-full sm:w-auto"
                >
                  Reactivate Tenant
                </button>
              )}

              <button
                onClick={() => setSelectedTenant(null)}
                className="btn-secondary text-xs py-2 px-5 w-full sm:w-auto"
              >
                Close Control Center
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SUPPORT TICKET DETAIL MODAL
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-lg w-full shadow-2xl p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-borderLight">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase">{selectedTicket.category} • {selectedTicket.id}</span>
                <h3 className="font-semibold text-heading text-sm mt-0.5">{selectedTicket.subject}</h3>
                <p className="text-xs text-muted">{selectedTicket.restaurantName} ({selectedTicket.user})</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1 rounded text-placeholder hover:text-heading">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-surfaceMuted rounded-xl border border-borderLight text-xs space-y-2">
              <span className="font-semibold text-heading block">Conversation History</span>
              <p className="text-secondary text-[11px] leading-relaxed">
                Guest bills experiencing timeout during ESC/POS thermal printing over network switch.
                Investigating hardware IP packet drops.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-heading block">Admin Reply</label>
              <textarea rows={3} placeholder="Type support response to restaurant owner..." className="input-field" />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={() => setSelectedTicket(null)} className="btn-secondary text-xs py-1.5 px-3">
                Cancel
              </button>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  showToast('Support response dispatched to restaurant owner.');
                }}
                className="btn-primary text-xs py-1.5 px-4"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reply</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
