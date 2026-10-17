'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/state';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  LayoutGrid,
  ChefHat,
  Calculator,
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
  Store,
  Layers,
  Search,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Receipt,
  CreditCard,
  AlertCircle,
  BookOpen,
  Package,
  QrCode,
  Printer,
  Bike,
  Activity,
  Sliders,
} from 'lucide-react';
import { BusinessType, ModuleToken } from '@platform/types';

const BUSINESS_MODEL_INFO: Record<string, { label: string; badge: string; desc: string }> = {
  RESTAURANT: {
    label: 'Fine / Casual Dine-in',
    badge: 'Table Service & KOTs',
    desc: 'Table service, live dining floor plan, KOT printing, and split checks.',
  },
  CAFE: {
    label: 'Cafe & Bistro',
    badge: 'Counter & Barista Queue',
    desc: 'Rapid counter ordering, barista drink preparation, and light seating.',
  },
  BAKERY: {
    label: 'Bakery & Patisserie',
    badge: 'Takeaway & Retail Stock',
    desc: 'Fast takeaway checkouts, boxed pastry billing, and inventory tracking.',
  },
  FAST_FOOD: {
    label: 'Fast Food / QSR',
    badge: 'Token High-Throughput',
    desc: 'Token-based order numbering, instant cash/UPI collection, rapid prep display.',
  },
  CLOUD_KITCHEN: {
    label: 'Cloud Kitchen & Delivery',
    badge: 'Dispatch Aggregator',
    desc: 'Multi-brand online delivery dispatch, rider pickups, without floor seating.',
  },
  FOOD_COURT: {
    label: 'Food Court Outlet',
    badge: 'Buzzer & Counter Tokens',
    desc: 'Rapid counter tokens, guest buzzer notifications, and fast POS checkouts.',
  },
  BAR: {
    label: 'Bar & Lounge',
    badge: 'Tabs & Drink Inventory',
    desc: 'Open bar tabs, bottle inventory, drink modifiers, and lounge floor seating.',
  },
  HOTEL_RESTAURANT: {
    label: 'Hotel & Resort Dining',
    badge: 'Room Billing & Dine-in',
    desc: 'Table service, split checks, and comprehensive guest folio management.',
  },
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    profile,
    session,
    currentTenant,
    businessType,
    enabledModules = [],
    tables,
    categories,
    menuItems,
    activeOrders,
    customers,
    inventory,
    expenses,
    stats,
    isLoadingData,
    updateTableStatus,
  } = useApp();

  // Guard: If restaurant tenant is pending or onboarding wizard not completed, forward to wizard or approval
  const isApproved = (currentTenant as any)?.status === 'APPROVED' || (profile as any)?.status === 'APPROVED';
  const isPending = !isApproved && ((currentTenant as any)?.status === 'PENDING' || (profile as any)?.status === 'PENDING');
  const isIncomplete = !isApproved && profile?.onboardingCompleted === false;

  useEffect(() => {
    if (!session?.isSuperAdmin && !isApproved) {
      if (isIncomplete) {
        router.replace(`/onboarding?tenantId=${profile?.tenantId || currentTenant?.id || ''}&email=${encodeURIComponent(profile?.email || session?.email || '')}`);
      } else if (isPending) {
        router.replace(`/pending-approval?tenantId=${profile?.tenantId || currentTenant?.id || ''}&email=${encodeURIComponent(profile?.email || session?.email || '')}`);
      }
    }
  }, [profile, currentTenant, session, isApproved, isPending, isIncomplete, router]);

  const isModuleActive = (token: string) => {
    const t = token.toLowerCase();
    const parts = t.split('.');
    const shortToken = parts[parts.length - 1];
    const catToken = parts[0];
    return enabledModules.some((m) => {
      const em = String(m).toLowerCase();
      return (
        em === t ||
        em === shortToken ||
        em === catToken ||
        t.startsWith(`${em}.`) ||
        em.startsWith(`${catToken}.`) ||
        t.includes(em) ||
        em.includes(shortToken)
      );
    });
  };

  // Business Model details
  const bModel = BUSINESS_MODEL_INFO[businessType] || BUSINESS_MODEL_INFO.RESTAURANT;

  // Real-time dynamic tab resolution based on enabled modules and business type
  const availableTabs = [
    { id: 'overview', name: 'Overview' },
    ...(session.roleName === 'OWNER' && (isModuleActive('reports.sales_analytics') || isModuleActive('billing.tax_gst'))
      ? [{ id: 'sales', name: "Today's Sales" }]
      : []),
    { id: 'orders', name: "Today's Orders" },
    ...(isModuleActive('operations.tables') && businessType !== 'CLOUD_KITCHEN' && businessType !== 'BAKERY'
      ? [{ id: 'tables', name: 'Active Tables' }]
      : []),
    { id: 'pending', name: 'Pending Orders' },
    ...(isModuleActive('operations.kitchen_kds')
      ? [{ id: 'kitchen', name: 'Kitchen Status' }]
      : []),
    ...(isModuleActive('inventory.raw_materials') || isModuleActive('inventory.recipes_bom')
      ? [{ id: 'inventory', name: 'Stock & Inventory' }]
      : []),
    ...(isModuleActive('billing.split_payment') || isModuleActive('billing.tax_gst')
      ? [{ id: 'payments', name: 'Payment Summary' }]
      : []),
    { id: 'actions', name: 'Quick Actions' },
  ];

  // If currently selected tab was disabled in settings, smoothly fallback to 'overview'
  useEffect(() => {
    if (!availableTabs.some((t) => t.id === activeTab)) {
      setActiveTab('overview');
    }
  }, [availableTabs, activeTab]);

  if (!session?.isSuperAdmin && !isApproved && (isIncomplete || isPending)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB] font-sans">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#78716C]">
            {isIncomplete ? 'Redirecting to Restaurant Setup Wizard...' : 'Redirecting to Admin Approval Screen...'}
          </p>
        </div>
      </div>
    );
  }

  const occupiedTables = (tables || []).filter((t) => t?.status === 'OCCUPIED' || t?.status === 'BILLING');
  const availableTables = (tables || []).filter((t) => t?.status === 'AVAILABLE');
  const completedOrders = (activeOrders || []).filter((o) => o?.status === 'COMPLETED' || o?.status === 'BILLED');
  const preparingOrders = (activeOrders || []).filter((o) => (o?.status as any) === 'PREPARING' || o?.status === 'CONFIRMED' || o?.status === 'PLACED');
  const deliveryOrders = (activeOrders || []).filter((o) => o?.orderType === 'DELIVERY' || !o?.tableName);

  const currencySymbol = profile?.currencySymbol || '₹';
  const totalRevenue =
    stats?.totalRevenue ??
    completedOrders.reduce((acc, o) => acc + (o?.grandTotal || 0), 0) / 100;

  const lowStockItems = (inventory || []).filter((item: any) => (item?.currentStock || 0) <= (item?.minStockAlert || 5));

  const filteredOrders = (activeOrders || []).filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o?.orderNumber?.toLowerCase().includes(q) ||
      o?.tableName?.toLowerCase().includes(q) ||
      o?.createdByWorkerName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 sm:p-8 max-w-[1400px] mx-auto space-y-6 font-sans">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-borderLight">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-[26px] sm:text-[30px] font-semibold text-heading tracking-tight leading-tight">
              {profile.businessName || 'Restaurant Dashboard'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold flex items-center space-x-1.5">
              <Store className="w-3.5 h-3.5 stroke-[2] text-primary" />
              <span>{bModel.label}</span>
            </span>
            {isLoadingData && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary font-medium animate-pulse">
                Syncing DB...
              </span>
            )}
          </div>
          <p className="text-[13px] text-secondary mt-1">
            {bModel.desc}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            href="/settings?tab=modules"
            className="btn-secondary text-xs py-2 px-3 flex items-center space-x-1.5"
            title="Configure Active Modules"
          >
            <Sliders className="w-3.5 h-3.5 text-placeholder" />
            <span>Modules ({enabledModules.length})</span>
          </Link>
          <Link href="/pos" className="btn-primary text-xs py-2 px-3.5 flex items-center space-x-1.5">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ New Order / POS</span>
          </Link>
        </div>
      </div>

      {/* 4 DYNAMIC STAT CARDS TAILORED TO ENABLED MODULES & BUSINESS TYPE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Revenue (Protected: Hidden for non-owners) */}
        {session.roleName === 'OWNER' ? (
          <div className="stat-card">
            <div className="text-[13px] text-secondary font-medium">Today's Revenue</div>
            <div className="text-[26px] font-semibold text-heading mt-2 leading-none">
              {currencySymbol}
              {totalRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-[12px] text-success mt-1.5 flex items-center space-x-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Real-time Settled Total</span>
            </div>
          </div>
        ) : (
          <div className="stat-card">
            <div className="text-[13px] text-secondary font-medium">Shift Assignment</div>
            <div className="text-[26px] font-semibold text-primary mt-2 leading-none">
              Active Shift
            </div>
            <div className="text-[12px] text-muted mt-1.5 font-medium">
              Terminal: {session.roleName}
            </div>
          </div>
        )}

        {/* Card 2: Active Orders */}
        <div className="stat-card">
          <div className="text-[13px] text-secondary font-medium">Active Orders</div>
          <div className="text-[26px] font-semibold text-primary mt-2 leading-none">
            {activeOrders.length}
          </div>
          <div className="text-[12px] text-muted mt-1.5 font-medium">
            {preparingOrders.length} preparing in kitchen
          </div>
        </div>

        {/* Card 3: Dynamically adapts to Tables vs Delivery vs Inventory vs Menu */}
        {isModuleActive('operations.tables') && businessType !== 'CLOUD_KITCHEN' && businessType !== 'BAKERY' ? (
          <div className="stat-card">
            <div className="text-[13px] text-secondary font-medium">Occupied Tables</div>
            <div className="text-[26px] font-semibold text-success mt-2 leading-none">
              {occupiedTables.length} / {tables.length}
            </div>
            <div className="text-[12px] text-secondary mt-1.5 font-medium">
              {tables.length > 0
                ? `${Math.round((occupiedTables.length / tables.length) * 100)}% Floor Capacity Utilized`
                : 'No dining tables added'}
            </div>
          </div>
        ) : isModuleActive('pos.delivery') || businessType === 'CLOUD_KITCHEN' ? (
          <div className="stat-card">
            <div className="text-[13px] text-secondary font-medium">Delivery & Dispatch</div>
            <div className="text-[26px] font-semibold text-info mt-2 leading-none">
              {deliveryOrders.length}
            </div>
            <div className="text-[12px] text-secondary mt-1.5 font-medium">
              {deliveryOrders.length > 0 ? 'Active courier / takeaway orders' : 'Ready for online dispatch'}
            </div>
          </div>
        ) : isModuleActive('inventory.raw_materials') || businessType === 'BAKERY' ? (
          <div className="stat-card">
            <div className="text-[13px] text-secondary font-medium">Stock Inventory</div>
            <div className="text-[26px] font-semibold text-warning mt-2 leading-none">
              {inventory.length} Items
            </div>
            <div className="text-[12px] text-secondary mt-1.5 font-medium">
              {lowStockItems.length > 0
                ? `${lowStockItems.length} items low stock alert`
                : 'Stock levels healthy'}
            </div>
          </div>
        ) : (
          <div className="stat-card">
            <div className="text-[13px] text-secondary font-medium">Menu Catalog Items</div>
            <div className="text-[26px] font-semibold text-heading mt-2 leading-none">
              {menuItems.length}
            </div>
            <div className="text-[12px] text-secondary mt-1.5 font-medium">
              {categories.length} Active Categories
            </div>
          </div>
        )}

        {/* Card 4: Dynamically adapts to Kitchen Queue vs Loyalty CRM vs Completed Bills */}
        {isModuleActive('operations.kitchen_kds') ? (
          <div className="stat-card">
            <div className="text-[13px] text-secondary font-medium">Kitchen Display (KDS)</div>
            <div className="text-[26px] font-semibold text-warning mt-2 leading-none">
              {preparingOrders.length}
            </div>
            <div className="text-[12px] text-secondary mt-1.5 font-medium">
              Tickets currently in preparation
            </div>
          </div>
        ) : isModuleActive('crm.customers') ? (
          <div className="stat-card">
            <div className="text-[13px] text-secondary font-medium">Customer CRM Base</div>
            <div className="text-[26px] font-semibold text-heading mt-2 leading-none">
              {customers.length} Guests
            </div>
            <div className="text-[12px] text-secondary mt-1.5 font-medium">
              Registered guest profiles
            </div>
          </div>
        ) : (
          <div className="stat-card">
            <div className="text-[13px] text-secondary font-medium">Completed Invoices</div>
            <div className="text-[26px] font-semibold text-info mt-2 leading-none">
              {completedOrders.length}
            </div>
            <div className="text-[12px] text-muted mt-1.5 font-medium">Settled today</div>
          </div>
        )}
      </div>

      {/* DYNAMIC NAVIGATION SUB-TABS */}
      <div className="flex items-center space-x-1.5 overflow-x-auto bg-surface border border-border p-1 rounded-xl">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-primary-light text-primary font-semibold'
                : 'text-secondary hover:text-main'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* SEARCH BAR (For tables, orders, items) */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-placeholder absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search live orders, tickets, or tables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input w-full"
        />
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders List */}
          <div className="card space-y-4 lg:col-span-2">
            <div className="flex justify-between items-center pb-3 border-b border-borderLight">
              <div>
                <h3 className="font-semibold text-base text-heading">Live Orders & Tickets</h3>
                <p className="text-xs text-secondary mt-0.5">Real-time status of orders punched into the system</p>
              </div>
              <Link href="/orders" className="text-xs text-primary font-semibold hover:underline">
                View All Orders →
              </Link>
            </div>

            {filteredOrders.length > 0 ? (
              <div className="divide-y divide-borderLight text-xs">
                {filteredOrders.slice(0, 6).map((ord) => (
                  <div key={ord.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-heading text-sm">
                        {ord.tableName ? `${ord.tableName}` : 'Counter / Takeaway'} ({ord.orderNumber})
                      </div>
                      <div className="text-muted">
                        {ord.items && ord.items.length > 0
                          ? ord.items.map((i: any) => `${i.quantity}x ${i.itemName || i.name || 'Item'}`).join(', ')
                          : 'Order items being punched'} • {ord.createdByWorkerName || 'Staff'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-heading text-sm">
                        {currencySymbol}
                        {(Number(ord.grandTotal || 0) / 100).toFixed(2)}
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          ord.status === 'COMPLETED'
                            ? 'bg-success-bg text-success'
                            : ord.status === 'READY'
                            ? 'bg-info-bg text-info'
                            : 'bg-warning-bg text-warning'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-placeholder mx-auto" />
                <p className="text-sm text-secondary">No active orders yet.</p>
                <Link href="/pos" className="btn-primary text-xs py-1.5 px-4 inline-flex items-center space-x-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Punch First Order in POS</span>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions Card (Dynamically filtered by enabled modules!) */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-borderLight">
              <h3 className="font-semibold text-base text-heading">Operational Shortcuts</h3>
              <span className="text-[11px] text-muted">{enabledModules.length} Modules Active</span>
            </div>

            <div className="space-y-2">
              {/* POS Link (if any POS module enabled) */}
              {(isModuleActive('pos.dine_in') ||
                isModuleActive('pos.quick_counter') ||
                isModuleActive('pos.takeaway') ||
                isModuleActive('pos.delivery')) && (
                <Link
                  href="/pos"
                  className="p-2.5 rounded-xl bg-surfaceMuted border border-borderLight flex items-center justify-between hover:border-primary/40 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Calculator className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-heading">Point of Sale (POS)</div>
                      <div className="text-[11px] text-secondary">Punch bills & print slips</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-placeholder" />
                </Link>
              )}

              {/* Kitchen KDS Link (if enabled) */}
              {isModuleActive('operations.kitchen_kds') && (
                <Link
                  href="/kitchen"
                  className="p-2.5 rounded-xl bg-surfaceMuted border border-borderLight flex items-center justify-between hover:border-primary/40 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <ChefHat className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-heading">Kitchen Display (KDS)</div>
                      <div className="text-[11px] text-secondary">Manage cooking tickets</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-placeholder" />
                </Link>
              )}

              {/* Floor Plan Link (if tables enabled) */}
              {isModuleActive('operations.tables') && businessType !== 'CLOUD_KITCHEN' && businessType !== 'BAKERY' && (
                <Link
                  href="/tables"
                  className="p-2.5 rounded-xl bg-surfaceMuted border border-borderLight flex items-center justify-between hover:border-primary/40 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-heading">Floor & Seating Plan</div>
                      <div className="text-[11px] text-secondary">Manage table layout & occupancy</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-placeholder" />
                </Link>
              )}

              {/* Menu Catalog Link */}
              <Link
                href="/menu"
                className="p-2.5 rounded-xl bg-surfaceMuted border border-borderLight flex items-center justify-between hover:border-primary/40 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-xs font-semibold text-heading">Menu Catalog & Prices</div>
                    <div className="text-[11px] text-secondary">{menuItems.length} dishes configured</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-placeholder" />
              </Link>

              {/* Inventory Link (if enabled) */}
              {isModuleActive('inventory.raw_materials') && (
                <Link
                  href="/inventory"
                  className="p-2.5 rounded-xl bg-surfaceMuted border border-borderLight flex items-center justify-between hover:border-primary/40 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Package className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-heading">Inventory & Raw Materials</div>
                      <div className="text-[11px] text-secondary">Stock levels and vendor orders</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-placeholder" />
                </Link>
              )}

              {/* QR Link (if enabled) */}
              {(isModuleActive('qr.table_ordering') || isModuleActive('qr.digital_menu')) && (
                <Link
                  href="/qr"
                  className="p-2.5 rounded-xl bg-surfaceMuted border border-borderLight flex items-center justify-between hover:border-primary/40 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <QrCode className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold text-heading">Contactless QR Ordering</div>
                      <div className="text-[11px] text-secondary">Digital menu & table scan</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-placeholder" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES SUMMARY */}
      {activeTab === 'sales' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-borderLight">
            <h3 className="font-semibold text-base text-heading">Sales & Revenue Breakdown</h3>
            <span className="text-xs font-semibold text-success">Live P&L Ledger</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surfaceMuted border border-borderLight">
              <div className="text-xs text-secondary">Gross Revenue</div>
              <div className="text-2xl font-bold text-heading mt-1">
                {currencySymbol}
                {totalRevenue.toFixed(2)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surfaceMuted border border-borderLight">
              <div className="text-xs text-secondary">Settled Invoices</div>
              <div className="text-2xl font-bold text-heading mt-1">{completedOrders.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-surfaceMuted border border-borderLight">
              <div className="text-xs text-secondary">Average Ticket Size</div>
              <div className="text-2xl font-bold text-heading mt-1">
                {currencySymbol}
                {completedOrders.length > 0 ? (totalRevenue / completedOrders.length).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALL ORDERS */}
      {activeTab === 'orders' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-borderLight">
            <h3 className="font-semibold text-base text-heading">All Restaurant Orders</h3>
            <Link href="/orders" className="text-xs text-primary font-semibold hover:underline">
              Detailed Order Workspace →
            </Link>
          </div>
          <div className="divide-y divide-borderLight text-xs">
            {activeOrders.map((ord) => (
              <div key={ord.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-heading text-sm mr-2">{ord.orderNumber}</span>
                  <span className="text-secondary">({ord.tableName || 'Counter / Takeaway'})</span>
                  <div className="text-muted mt-0.5">
                    {ord.items && ord.items.length > 0
                      ? ord.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')
                      : 'No items recorded'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-heading text-sm">
                    {currencySymbol}
                    {(Number(ord.grandTotal || 0) / 100).toFixed(2)}
                  </div>
                  <span className="text-[11px] font-semibold text-primary">{ord.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVE TABLES (Only if operations.tables is enabled) */}
      {activeTab === 'tables' && isModuleActive('operations.tables') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-heading">Dining Floor Status</h3>
            <Link href="/tables" className="text-xs text-primary font-semibold hover:underline">
              Open Full Floor Plan →
            </Link>
          </div>

          {tables.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {tables.map((t) => (
                <div
                  key={t.id}
                  className={`card text-center p-4 space-y-2 border transition ${
                    t.status === 'OCCUPIED'
                      ? 'border-warning/50 bg-warning/5'
                      : t.status === 'BILLING'
                      ? 'border-info/50 bg-info/5'
                      : 'border-border'
                  }`}
                >
                  <span className="text-xs font-semibold uppercase text-muted">#{t.tableNumber}</span>
                  <div className="text-lg font-bold text-heading truncate">{t.tableName}</div>
                  <div className="text-[11px] text-secondary">Cap: {t.capacity} seats</div>
                  <button
                    type="button"
                    onClick={() =>
                      updateTableStatus(t.id, t.status === 'OCCUPIED' ? 'AVAILABLE' : 'OCCUPIED')
                    }
                    className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer ${
                      t.status === 'OCCUPIED'
                        ? 'bg-warning-bg text-warning'
                        : t.status === 'BILLING'
                        ? 'bg-info-bg text-info'
                        : 'bg-success-bg text-success'
                    }`}
                  >
                    {t.status}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center p-12 space-y-3">
              <LayoutGrid className="w-10 h-10 text-placeholder mx-auto" />
              <p className="text-sm text-secondary">No dining tables added yet.</p>
              <Link href="/tables" className="btn-primary text-xs py-1.5 px-4 inline-flex items-center space-x-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Dining Tables</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PENDING ORDERS */}
      {activeTab === 'pending' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-borderLight">
            <h3 className="font-semibold text-base text-heading">Kitchen Pending Orders</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-warning-bg text-warning font-semibold">
              {preparingOrders.length} Urgent
            </span>
          </div>
          {preparingOrders.length > 0 ? (
            <div className="divide-y divide-borderLight text-xs">
              {preparingOrders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-heading text-sm mr-2">{ord.orderNumber}</span>
                    <span className="text-secondary">{ord.tableName || 'Counter Takeaway'}</span>
                    <div className="text-muted mt-0.5">
                      {ord.items && ord.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </div>
                  <Link href="/kitchen" className="btn-secondary text-xs py-1 px-3">
                    View in KDS
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary py-6 text-center">No pending orders waiting in the queue.</p>
          )}
        </div>
      )}

      {/* TAB 6: KITCHEN KDS (Only if operations.kitchen_kds is enabled) */}
      {activeTab === 'kitchen' && isModuleActive('operations.kitchen_kds') && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-borderLight">
            <h3 className="font-semibold text-base text-heading">Kitchen Display System (KDS)</h3>
            <Link href="/kitchen" className="text-xs text-primary font-semibold hover:underline">
              Open Full KDS Screen →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surfaceMuted border border-borderLight">
              <span className="text-xs font-semibold text-warning uppercase">Station 1: Grill & Main</span>
              <p className="text-xs text-secondary mt-1">Automatic line item routing active</p>
            </div>
            <div className="p-4 rounded-xl bg-surfaceMuted border border-borderLight">
              <span className="text-xs font-semibold text-info uppercase">Station 2: Bar & Beverages</span>
              <p className="text-xs text-secondary mt-1">Cold drink and mocktail queue</p>
            </div>
            <div className="p-4 rounded-xl bg-surfaceMuted border border-borderLight">
              <span className="text-xs font-semibold text-success uppercase">Station 3: Dessert & Bakery</span>
              <p className="text-xs text-secondary mt-1">Pastry and plating queue</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: INVENTORY & STOCK (Only if inventory modules enabled) */}
      {activeTab === 'inventory' && isModuleActive('inventory.raw_materials') && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-borderLight">
            <h3 className="font-semibold text-base text-heading">Raw Materials & Ingredient Tracking</h3>
            <Link href="/inventory" className="text-xs text-primary font-semibold hover:underline">
              Manage Full Stock & Recipes →
            </Link>
          </div>
          {inventory.length > 0 ? (
            <div className="divide-y divide-borderLight text-xs">
              {inventory.slice(0, 8).map((item: any) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-heading">{item.name}</span>
                    <span className="text-muted ml-2">SKU: {item.sku || 'N/A'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-heading">
                      {item.currentStock || 0} {item.unit || 'units'}
                    </span>
                    {(item.currentStock || 0) <= (item.minStockAlert || 5) && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold">
                        LOW STOCK
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary py-6 text-center">No raw material stock items tracked yet.</p>
          )}
        </div>
      )}

      {/* TAB 8: PAYMENTS SUMMARY */}
      {activeTab === 'payments' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-borderLight">
            <h3 className="font-semibold text-base text-heading">Payment Modes & Settlement</h3>
            <Link href="/payments" className="text-xs text-primary font-semibold hover:underline">
              View Detailed Ledger →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surfaceMuted border border-borderLight">
              <span className="text-xs text-secondary">UPI & QR Pay</span>
              <div className="text-xl font-bold text-heading mt-1">Direct Bank Settled</div>
            </div>
            <div className="p-4 rounded-xl bg-surfaceMuted border border-borderLight">
              <span className="text-xs text-secondary">Cash Drawer</span>
              <div className="text-xl font-bold text-heading mt-1">Shift Reconciled</div>
            </div>
            <div className="p-4 rounded-xl bg-surfaceMuted border border-borderLight">
              <span className="text-xs text-secondary">Card POS Terminals</span>
              <div className="text-xl font-bold text-heading mt-1">End of Day Batch</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: QUICK ACTIONS */}
      {activeTab === 'actions' && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-base text-heading">Quick Operational Launchpad</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link href="/pos" className="btn-secondary justify-start p-3">
              <Calculator className="w-4 h-4 text-primary mr-2" />
              <span>Launch POS Billing Terminal</span>
            </Link>
            <Link href="/orders" className="btn-secondary justify-start p-3">
              <ShoppingBag className="w-4 h-4 text-primary mr-2" />
              <span>View Live Orders</span>
            </Link>
            {isModuleActive('operations.tables') && (
              <Link href="/tables" className="btn-secondary justify-start p-3">
                <LayoutGrid className="w-4 h-4 text-primary mr-2" />
                <span>Floor Seating Layout</span>
              </Link>
            )}
            {isModuleActive('operations.kitchen_kds') && (
              <Link href="/kitchen" className="btn-secondary justify-start p-3">
                <ChefHat className="w-4 h-4 text-primary mr-2" />
                <span>Kitchen Display (KDS)</span>
              </Link>
            )}
            <Link href="/menu" className="btn-secondary justify-start p-3">
              <BookOpen className="w-4 h-4 text-primary mr-2" />
              <span>Menu Items & Catalog</span>
            </Link>
            {isModuleActive('inventory.raw_materials') && (
              <Link href="/inventory" className="btn-secondary justify-start p-3">
                <Package className="w-4 h-4 text-primary mr-2" />
                <span>Inventory & Ingredients</span>
              </Link>
            )}
            <Link href="/settings?tab=modules" className="btn-secondary justify-start p-3">
              <Sliders className="w-4 h-4 text-primary mr-2" />
              <span>Configure System Modules</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-400">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
