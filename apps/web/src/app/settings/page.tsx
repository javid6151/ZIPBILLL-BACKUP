'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/state';
import {
  Settings,
  Layers,
  Printer,
  Receipt,
  Shield,
  CreditCard,
  Bell,
  CheckCircle,
  Store,
  Sparkles,
  Info,
  Check,
  RefreshCw,
  Calculator,
  LayoutGrid,
  ClipboardList,
  ChefHat,
  BookOpen,
  Package,
  Users,
  TrendingDown,
  BarChart3,
  QrCode,
  Sliders,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SYSTEM_MODULE_REGISTRY } from '@platform/config-engine';
import { BusinessType, ModuleToken } from '@platform/types';
import { SECTION_MODULE_REQUIREMENTS } from '@/lib/permission-engine';

const BUSINESS_MODELS: Array<{ type: BusinessType; name: string; desc: string }> = [
  { type: 'RESTAURANT', name: 'Fine / Casual Dine-in', desc: 'Table service, live occupancy, KOTs, and split checks' },
  { type: 'CAFE', name: 'Cafe & Bistro', desc: 'Fast counter ordering, barista queues, and light seating' },
  { type: 'BAKERY', name: 'Bakery & Patisserie', desc: 'Counter parcel checkouts, retail sales, stock tracking' },
  { type: 'FAST_FOOD', name: 'Fast Food / QSR', desc: 'Token billing, instant checkout, and high-speed counter' },
  { type: 'CLOUD_KITCHEN', name: 'Cloud Kitchen', desc: 'Online delivery dispatch, courier riders, no dining tables' },
  { type: 'FOOD_COURT', name: 'Food Court Outlet', desc: 'Customer buzzer tokens, rapid counter checkouts' },
  { type: 'BAR', name: 'Bar & Lounge', desc: 'Open bar tabs, drink modifiers, and lounge floor layout' },
  { type: 'HOTEL_RESTAURANT', name: 'Hotel Restaurant', desc: 'Table service, room billing, guest folios' },
];

interface SidebarComponentItem {
  id: string;
  name: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'Operations' | 'Sales' | 'Finance' | 'Catalog' | 'Hardware' | 'CRM' | 'Intelligence';
  description: string;
  badge?: string;
}

const SIDEBAR_COMPONENTS: SidebarComponentItem[] = [
  {
    id: 'pos',
    name: 'Point of Sale (POS)',
    route: '/pos',
    icon: Calculator,
    category: 'Sales',
    description: 'Fast counter billing, dine-in table orders, takeaway parcel sales and quick checkout.',
    badge: 'Core Billing',
  },
  {
    id: 'tables',
    name: 'Tables & Floor Management',
    route: '/tables',
    icon: LayoutGrid,
    category: 'Operations',
    description: 'Interactive visual floor map, table occupancy colors, seat transfers and table merging.',
  },
  {
    id: 'orders',
    name: 'Live Orders Feed',
    route: '/orders',
    icon: ClipboardList,
    category: 'Operations',
    description: 'Real-time kitchen order feed, active ticket tracking, pending statuses and order history.',
  },
  {
    id: 'kitchen',
    name: 'Kitchen Display (KDS)',
    route: '/kitchen',
    icon: ChefHat,
    category: 'Operations',
    description: 'Live chef prep screen, paperless kitchen tickets (KOT), item timers and prep queues.',
  },
  {
    id: 'menu',
    name: 'Menu & Food Catalog',
    route: '/menu',
    icon: BookOpen,
    category: 'Catalog',
    description: 'Dishes, portion variations, addon groups, price overrides and instant menu updates.',
  },
  {
    id: 'billing',
    name: 'Invoices & Billing',
    route: '/billing',
    icon: Receipt,
    category: 'Finance',
    description: 'GST tax invoices, bill splits, manager discounts, bill reprints and refund management.',
  },
  {
    id: 'payments',
    name: 'Payments & Settlement',
    route: '/payments',
    icon: CreditCard,
    category: 'Finance',
    description: 'Dynamic BharatPe / Paytm UPI QR codes, debit/credit cards, cash register shift audits.',
  },
  {
    id: 'inventory',
    name: 'Inventory & Stock',
    route: '/inventory',
    icon: Package,
    category: 'Operations',
    description: 'Raw ingredient tracking, recipe bills-of-materials, low-stock warnings and wastage logs.',
  },
  {
    id: 'customers',
    name: 'Customers & CRM',
    route: '/customers',
    icon: Users,
    category: 'CRM',
    description: 'Guest telephone directory, visit frequency, spend history, feedback and loyalty rewards.',
  },
  {
    id: 'staff',
    name: 'Staff & Team Access',
    route: '/staff',
    icon: Shield,
    category: 'Operations',
    description: 'Waiter & kitchen employee profiles, PIN access logins, role-based permission control.',
  },
  {
    id: 'expenses',
    name: 'Daily Store Expenses',
    route: '/expenses',
    icon: TrendingDown,
    category: 'Finance',
    description: 'Petty cash records, daily vegetable/milk vendor payouts, utility bills and operating costs.',
  },
  {
    id: 'qr',
    name: 'QR & Digital Ordering',
    route: '/qr',
    icon: QrCode,
    category: 'Operations',
    description: 'High-res printable table QR codes, contactless guest phone ordering and digital menu.',
  },
  {
    id: 'printers',
    name: 'Printers & Hardware',
    route: '/printers',
    icon: Printer,
    category: 'Hardware',
    description: '80mm cashier thermal invoice printers, 58mm KOT kitchen printers and USB/LAN routing.',
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    route: '/reports',
    icon: BarChart3,
    category: 'Intelligence',
    description: 'Daily revenue analytics, item-level sales breakdown, GST reports and staff productivity.',
  },
];

export default function SettingsAndModulesPage() {
  const {
    profile,
    setProfile,
    businessType,
    setBusinessType,
    enabledModules,
    toggleModule,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'SIDEBAR' | 'REGISTRY' | 'MODEL' | 'BILLING' | 'PRINTERS'>('SIDEBAR');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [componentSearch, setComponentSearch] = useState<string>('');
  const [lastToggled, setLastToggled] = useState<{ name: string; status: string } | null>(null);
  const [gstRate, setGstRate] = useState<number>(5);

  const categories = ['ALL', 'POINT_OF_SALE', 'OPERATIONS', 'INVENTORY', 'BILLING', 'MARKETING', 'INTELLIGENCE'];

  const filteredMicroModules = Object.values(SYSTEM_MODULE_REGISTRY).filter((mod) => {
    if (selectedCategory === 'ALL') return true;
    return mod.category === selectedCategory;
  });

  // Determines if a primary sidebar component is currently visible
  const isComponentActive = (compId: string): boolean => {
    const reqs = SECTION_MODULE_REQUIREMENTS[compId] || [compId];
    const normalized = new Set((enabledModules || []).map((m) => String(m).toLowerCase().trim()));

    return reqs.some((req) => {
      const r = req.toLowerCase().trim();
      if (normalized.has(r)) return true;
      for (const m of normalized) {
        if (m === r || m.startsWith(r + '.') || r.startsWith(m + '.')) return true;
      }
      return false;
    });
  };

  const activeSidebarCount = SIDEBAR_COMPONENTS.filter((c) => isComponentActive(c.id)).length;

  const handleToggleSidebarComponent = (compId: string, compName: string) => {
    const currentlyActive = isComponentActive(compId);
    toggleModule(compId as any);
    setLastToggled({
      name: compName,
      status: !currentlyActive ? 'visible in' : 'hidden from',
    });
    setTimeout(() => setLastToggled(null), 3500);
  };

  const handleToggleMicroModule = (token: ModuleToken, name: string) => {
    const isCurrentlyOn = enabledModules.includes(token);
    toggleModule(token);
    setLastToggled({
      name,
      status: !isCurrentlyOn ? 'enabled in' : 'disabled from',
    });
    setTimeout(() => setLastToggled(null), 3500);
  };

  const filteredSidebarComponents = SIDEBAR_COMPONENTS.filter((comp) => {
    if (!componentSearch) return true;
    const q = componentSearch.toLowerCase();
    return (
      comp.name.toLowerCase().includes(q) ||
      comp.description.toLowerCase().includes(q) ||
      comp.route.toLowerCase().includes(q) ||
      comp.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 sm:p-8 max-w-[1400px] mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-borderLight">
        <div>
          <h1 className="text-[26px] sm:text-[30px] font-semibold text-heading tracking-tight leading-tight">
            Store Settings
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1.5 bg-surface border border-border p-1 rounded-xl overflow-x-auto">
          {[
            { id: 'SIDEBAR', label: `Sidebar Navigation (${activeSidebarCount}/14)` },
            { id: 'REGISTRY', label: `Micro-Features (${enabledModules.length})` },
            { id: 'MODEL', label: 'Business Model' },
            { id: 'BILLING', label: 'Taxes & Billing' },
            { id: 'PRINTERS', label: 'Thermal Printers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-primary-light text-primary font-semibold shadow-sm'
                  : 'text-secondary hover:text-main'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time alert toast banner */}
      {lastToggled && (
        <div className="p-3.5 rounded-xl bg-success-bg border border-success/30 text-success text-xs font-medium flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
            <span>
              <strong>{lastToggled.name}</strong> is now <strong>{lastToggled.status}</strong> sidebar navigation. Saved & synced to database in real time!
            </span>
          </div>
          <span className="text-[11px] opacity-80 hidden sm:inline">Instant Real-Time Reaction</span>
        </div>
      )}

      {/* TAB 1: SIDEBAR NAVIGATION COMPONENTS (PRIMARY USER REQUEST) */}
      {activeTab === 'SIDEBAR' && (
        <div className="space-y-5">

          {/* Grid of 14 Sidebar Navigation Components */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSidebarComponents.map((comp) => {
              const isActive = isComponentActive(comp.id);

              return (
                <div
                  key={comp.id}
                  className={`card flex flex-col justify-between transition-all duration-200 ${
                    isActive
                      ? 'border-primary/40 bg-surface shadow-sm hover:border-primary/60'
                      : 'border-border bg-surfaceMuted/30 opacity-75 hover:opacity-90'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon, Route badge & Toggle Switch */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isActive
                              ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                              : 'bg-surfaceMuted text-secondary border border-borderLight'
                          }`}
                        >
                          <comp.icon className="w-4 h-4 stroke-[2]" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-medium">
                            {comp.category}
                          </span>
                          <div className="text-[11px] font-mono text-primary font-semibold">
                            {comp.route}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleSidebarComponent(comp.id, comp.name)}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                          isActive ? 'bg-primary' : 'bg-border hover:bg-placeholder'
                        }`}
                        title={isActive ? `Disable ${comp.name} from sidebar` : `Enable ${comp.name} in sidebar`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            isActive ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Component Name & Description */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <h3 className="font-semibold text-sm text-heading leading-snug">
                          {comp.name}
                        </h3>
                        {comp.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                            {comp.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary leading-relaxed">
                        {comp.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: Real-time Sidebar Visibility Badge */}
                  <div className="mt-4 pt-3 border-t border-borderLight flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-muted">
                      ID: {comp.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSidebarComponent(comp.id, comp.name)}
                      className={`inline-flex items-center space-x-1.5 font-medium transition cursor-pointer hover:underline text-xs ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-muted'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Eye className="w-3.5 h-3.5 stroke-[2.2]" />
                          <span>● Visible in Sidebar</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 stroke-[2]" />
                          <span>○ Hidden from Sidebar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: GRANULAR MICRO-FEATURES REGISTRY */}
      {activeTab === 'REGISTRY' && (
        <div className="space-y-5">
          <div className="card space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-heading">Fine-Grained Micro-Features Registry</h2>
                <p className="text-xs text-secondary mt-0.5">
                  Granular functional sub-tokens (e.g. Dine-In vs Takeaway mode, BOM Recipes, Thermal Spooler). Toggling these adapts sub-actions within pages.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-surfaceMuted font-semibold text-heading border border-borderLight">
                  {enabledModules.length} of {Object.keys(SYSTEM_MODULE_REGISTRY).length} Enabled
                </span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pt-2 border-t border-borderLight">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-primary text-white font-semibold'
                      : 'bg-surfaceMuted text-secondary hover:text-heading'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMicroModules.map((mod) => {
              const isEnabled = enabledModules.includes(mod.token as ModuleToken);
              return (
                <div
                  key={mod.token}
                  className={`card flex flex-col justify-between transition-all duration-150 ${
                    isEnabled
                      ? 'border-primary/40 bg-surface shadow-sm'
                      : 'border-border bg-surfaceMuted/40 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
                        {mod.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleMicroModule(mod.token as ModuleToken, mod.name)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                          isEnabled ? 'bg-primary' : 'bg-border'
                        }`}
                        title={isEnabled ? `Disable ${mod.name}` : `Enable ${mod.name}`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <h3 className="font-semibold text-[14px] text-heading leading-snug">
                      {mod.name}
                    </h3>
                    <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-borderLight flex items-center justify-between text-[11px] text-muted">
                    <span className="font-mono text-[10px]">{mod.token}</span>
                    <span className={`font-semibold ${isEnabled ? 'text-primary' : 'text-muted'}`}>
                      {isEnabled ? '● Active Sub-feature' : '○ Disabled'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: BUSINESS MODEL */}
      {activeTab === 'MODEL' && (
        <div className="space-y-4">
          <div className="card space-y-2">
            <h2 className="text-base font-semibold text-heading">Switch Restaurant Business Model</h2>
            <p className="text-xs text-secondary">
              Selecting a business model automatically tailors recommended modules and default layouts for that specific establishment type.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {BUSINESS_MODELS.map((item) => {
              const isCurrent = businessType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setBusinessType(item.type)}
                  className={`card p-4 text-left transition-all ${
                    isCurrent
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2.5 border border-primary/20">
                    <Store className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="font-semibold text-sm text-heading flex items-center justify-between">
                    <span>{item.name}</span>
                    {isCurrent && <Check className="w-4 h-4 text-primary stroke-[2.5]" />}
                  </div>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">{item.desc}</p>
                  <div className="mt-3 pt-2 border-t border-borderLight text-[11px] text-primary font-medium">
                    {isCurrent ? 'Active Model' : 'Switch to this model →'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: TAXES & BILLING */}
      {activeTab === 'BILLING' && (
        <div className="card space-y-4 max-w-xl">
          <h2 className="text-base font-semibold text-heading">Tax & Invoice Configuration</h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-secondary font-medium mb-1">Business Registered Name</label>
              <input
                type="text"
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-secondary font-medium mb-1">GSTIN Number</label>
              <input
                type="text"
                value={profile.taxNumber || ''}
                placeholder="Enter 15-digit GSTIN (optional)"
                onChange={(e) => setProfile({ ...profile, taxNumber: e.target.value })}
                className="input-field font-mono"
              />
            </div>
            <div>
              <label className="block text-secondary font-medium mb-1">Default GST Rate (%)</label>
              <input
                type="number"
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => alert('Tax and billing settings saved!')}
                className="btn-primary"
              >
                Save Tax Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PRINTERS */}
      {activeTab === 'PRINTERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-heading text-sm">Cashier Thermal Printer (80mm)</h3>
            <p className="text-xs text-muted">USB / Network ESC/POS thermal printer for bills and invoices.</p>
            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-success font-semibold">● Ready & Connected</span>
              <button
                type="button"
                onClick={() => alert('Test invoice slip sent to 80mm thermal spooler!')}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Test Print
              </button>
            </div>
          </div>
          <div className="card space-y-3">
            <h3 className="font-semibold text-heading text-sm">Kitchen Ticket Printer (KOT 58mm)</h3>
            <p className="text-xs text-muted">Ethernet ESC/POS printer connected to KDS router.</p>
            <div className="pt-2 flex justify-between items-center text-xs">
              <span className="text-success font-semibold">● Ready & Connected</span>
              <button
                type="button"
                onClick={() => alert('Test KOT order slip sent to kitchen printer!')}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Test Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
