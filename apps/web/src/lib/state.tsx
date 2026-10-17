'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  BusinessType,
  BusinessProfile,
  ModuleToken,
  UserSession,
  Table as FloorTable,
  Order,
  Category,
  MenuItem,
  DevicePlatform,
} from '@platform/types';
import { resolveDynamicNavigation, NavItem, getDefaultModulesForBusinessType } from '@platform/config-engine';
import { offlineDb } from './offline-db';
import { generateUUIDv7, createIdempotencyKey } from '@platform/offline-sync';

import { ROLE_DEFAULT_PERMISSIONS } from './permission-engine';

// Initial Empty State
const INITIAL_PROFILE: BusinessProfile = {
  id: '',
  tenantId: '',
  businessName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  country: 'IN',
  currencyCode: 'INR',
  currencySymbol: '₹',
  timezone: 'Asia/Kolkata',
  onboardingCompleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const INITIAL_SESSION: UserSession = {
  userId: '',
  tenantId: '',
  email: '',
  fullName: '',
  roleName: 'OWNER',
  permissions: ['*'],
  deviceId: 'dev-terminal-01',
  isSuperAdmin: false,
};

interface AppContextType {
  profile: BusinessProfile;
  setProfile: (p: BusinessProfile) => void;
  businessType: BusinessType;
  setBusinessType: (b: BusinessType) => void;
  enabledModules: ModuleToken[];
  setEnabledModules: (mods: ModuleToken[]) => void;
  toggleModule: (token: ModuleToken) => void;
  session: UserSession;
  setSession: (s: UserSession) => void;
  isOnline: boolean;
  setIsOnline: (status: boolean) => void;
  navigation: {
    sidebarItems: NavItem[];
    bottomNavItems: NavItem[];
    defaultRoute: string;
  };
  tables: FloorTable[];
  setTables: React.Dispatch<React.SetStateAction<FloorTable[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  activeOrders: Order[];
  setActiveOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  expenses: any[];
  setExpenses: React.Dispatch<React.SetStateAction<any[]>>;
  staff: any[];
  setStaff: React.Dispatch<React.SetStateAction<any[]>>;
  inventory: any[];
  setInventory: React.Dispatch<React.SetStateAction<any[]>>;
  devices: any[];
  setDevices: React.Dispatch<React.SetStateAction<any[]>>;
  currentTenant: { id: string; name: string; slug: string; businessType: string } | null;
  setCurrentTenant: (t: { id: string; name: string; slug: string; businessType: string } | null) => void;
  availableTenants: Array<{ id: string; name: string; slug: string; businessType: string }>;
  setAvailableTenants: (tenants: Array<{ id: string; name: string; slug: string; businessType: string }>) => void;
  stats: {
    totalRevenue: number;
    totalOrders: number;
    activeOrders: number;
    occupiedTables: number;
    totalTables: number;
    totalMenuItems: number;
    totalCustomers: number;
    totalStaff: number;
  };
  isLoadingData: boolean;
  refreshTenantData: () => Promise<void>;
  createOrderOffline: (orderData: Partial<Order>) => Promise<Order>;
  updateTableStatus: (tableId: string, status: FloorTable['status']) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  pendingSyncCount: number;
  triggerSync: () => Promise<void>;
  resetToDemo: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<BusinessProfile>(INITIAL_PROFILE);
  const [businessType, setBusinessTypeState] = useState<BusinessType>('RESTAURANT');
  const [enabledModules, setEnabledModulesState] = useState<ModuleToken[]>(
    getDefaultModulesForBusinessType('RESTAURANT')
  );
  const [session, setSessionState] = useState<UserSession>(INITIAL_SESSION);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [devicePlatform] = useState<DevicePlatform>('DESKTOP');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const [currentTenant, setCurrentTenant] = useState<{ id: string; name: string; slug: string; businessType: string } | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Array<{ id: string; name: string; slug: string; businessType: string }>>([]);

  const [tables, setTables] = useState<FloorTable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeOrders: 0,
    occupiedTables: 0,
    totalTables: 0,
    totalMenuItems: 0,
    totalCustomers: 0,
    totalStaff: 0,
  });
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Persistent storage wrappers
  const setProfile = (newProfile: BusinessProfile) => {
    setProfileState(newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saas_active_profile', JSON.stringify(newProfile));
    }
  };

  const setSession = (newSession: UserSession) => {
    setSessionState(newSession);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saas_active_session', JSON.stringify(newSession));
    }
  };

  const setEnabledModules = (mods: ModuleToken[]) => {
    setEnabledModulesState(mods);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saas_active_modules', JSON.stringify(mods));
    }
  };

  const setBusinessType = (newType: BusinessType) => {
    setBusinessTypeState(newType);
    if (typeof window !== 'undefined') {
      localStorage.setItem('saas_active_business_type', newType);
    }
  };

  const resetToDemo = () => {
    setProfile(INITIAL_PROFILE);
    setSession(INITIAL_SESSION);
    setBusinessType('RESTAURANT');
  };

  // Dynamic Database Fetcher
  const refreshTenantData = useCallback(async () => {
    let urlSlug = '';
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const querySlug = searchParams.get('restaurantSlug') || searchParams.get('restaurant') || searchParams.get('slug');
      if (querySlug) {
        urlSlug = querySlug;
      } else {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const KNOWN = ['dashboard', 'pos', 'tables', 'orders', 'kitchen', 'menu', 'customers', 'billing', 'payments', 'expenses', 'inventory', 'reports', 'staff', 'qr', 'screens', 'printers', 'sync', 'settings', 'insights', 'subscription', 'leads', 'offline', 'onboarding', 'login', 'register', 'admin', 'auth'];
        if (parts.length > 0 && !KNOWN.includes(parts[0])) {
          urlSlug = parts[0];
        }
      }
    }

    const activeTenantId = profile.tenantId || session.tenantId;

    // If there is no active tenant, slug, or user email, skip querying
    if (!activeTenantId && !urlSlug && !session.email) {
      return;
    }

    setIsLoadingData(true);
    try {
      const q = new URLSearchParams();
      if (activeTenantId) q.set('tenantId', activeTenantId);
      if (urlSlug) q.set('slug', urlSlug);
      if (session.email) q.set('email', session.email);

      const res = await fetch(`/api/tenant/data?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables || []);
        setCategories(data.categories || []);
        setMenuItems(data.menuItems || []);
        setActiveOrders(data.orders || []);
        setCustomers(data.customers || []);
        setExpenses(data.expenses || []);
        if (data.inventory) setInventory(data.inventory);
        if (data.devices) setDevices(data.devices);
        if (data.staff) setStaff(data.staff);
        if (data.stats) setStats(data.stats);
        if (data.tenant) {
          setCurrentTenant(data.tenant);
        }
        if (data.availableTenants) {
          setAvailableTenants(data.availableTenants);
        }
        if (data.profile) {
          setProfileState(data.profile);
        }
        if (data.modules && Array.isArray(data.modules)) {
          setEnabledModulesState(data.modules);
          if (typeof window !== 'undefined') {
            localStorage.setItem('saas_active_modules', JSON.stringify(data.modules));
          }
        }
      } else if (res.status === 404) {
        console.warn('Tenant data not found; maintaining active session.');
      }
    } catch (err) {
      console.error('Error loading dynamic database data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [profile.tenantId, session.tenantId, session.email]);

  // Hydrate session & profile on initial browser load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedProfile = localStorage.getItem('saas_active_profile');
      const savedSession = localStorage.getItem('saas_active_session');
      const savedBType = localStorage.getItem('saas_active_business_type');

      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfileState(parsed);
      }
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        // Only purge the hardcoded mock owner account if present
        if (parsed.userId === 'usr-owner-01' && parsed.email === 'owner@restaurant.pos') {
          localStorage.removeItem('saas_active_session');
          localStorage.removeItem('saas_active_profile');
          localStorage.removeItem('saas_active_tenant');
        } else {
          setSessionState(parsed);
        }
      }
      const savedModules = localStorage.getItem('saas_active_modules');
      if (savedModules) {
        try {
          const parsed = JSON.parse(savedModules);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEnabledModules(parsed);
          }
        } catch (e) {
          console.error('Failed to parse saved modules:', e);
        }
      } else if (savedBType) {
        setBusinessTypeState(savedBType as BusinessType);
        setEnabledModules(getDefaultModulesForBusinessType(savedBType as BusinessType));
      }
    } catch (e) {
      console.error('Failed to hydrate local session:', e);
    }
  }, []);

  // Whenever tenantId changes, dynamically fetch data from the database
  useEffect(() => {
    refreshTenantData();
  }, [profile.tenantId, session.tenantId, refreshTenantData]);

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOnline(navigator.onLine);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Update Pending Sync Count from IndexedDB
  const refreshPendingCount = async () => {
    try {
      const count = await offlineDb.syncQueue.where('status').equals('PENDING').count();
      setPendingSyncCount(count);
    } catch {
      // IndexedDB fallback in non-browser env
    }
  };

  useEffect(() => {
    refreshPendingCount();
  }, []);

  const toggleModule = (token: ModuleToken | string) => {
    setEnabledModulesState((prev: ModuleToken[]) => {
      const lowerToken = String(token).toLowerCase().trim();

      // Related sub-tokens to clean or activate together
      const SUB_MAP: Record<string, string[]> = {
        pos: ['pos.dine_in', 'pos.quick_counter', 'pos.takeaway', 'pos.delivery'],
        tables: ['operations.tables'],
        kitchen: ['operations.kitchen_kds', 'operations.kot_printing'],
        qr: ['qr.table_ordering', 'qr.digital_menu', 'qr.table_pay'],
        billing: ['billing.thermal_receipts', 'billing.split_payment', 'billing.discounts', 'billing.tax_gst'],
        payments: ['payments.upi_qr'],
        inventory: ['inventory.raw_materials', 'inventory.recipes_bom'],
        customers: ['crm.customers', 'crm.loyalty'],
        staff: ['staff.shared_access', 'staff.device_mgmt'],
        expenses: ['finance.expenses'],
        printers: ['hardware.thermal_printers', 'operations.kot_printing'],
        reports: ['reports.sales_analytics', 'reports.staff_activity'],
        menu: ['catalog.modifiers_variants', 'ai_menu_import', 'ai.menu_import'],
        orders: [],
      };

      const subs = SUB_MAP[lowerToken] || [];
      const allRelated = new Set([lowerToken, ...subs]);

      // Check if currently enabled: either exact match, or in subs, or starts with lowerToken + '.'
      const isCurrentlyEnabled = (prev || []).some((t) => {
        const l = String(t).toLowerCase().trim();
        return l === lowerToken || subs.includes(l) || l.startsWith(lowerToken + '.');
      });

      let next: ModuleToken[];
      if (isCurrentlyEnabled) {
        // Disabling: remove this token, its sub-tokens, and anything starting with lowerToken + '.'
        next = (prev || []).filter((t) => {
          const l = String(t).toLowerCase().trim();
          return !allRelated.has(l) && !l.startsWith(lowerToken + '.');
        });
      } else {
        // Enabling: add this token and its sub-tokens (cleanly deduplicated)
        const currentLower = new Set((prev || []).map((t) => String(t).toLowerCase().trim()));
        currentLower.add(lowerToken);
        for (const s of subs) {
          currentLower.add(s);
        }
        next = Array.from(currentLower) as ModuleToken[];
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('saas_active_modules', JSON.stringify(next));
      }

      // Asynchronously persist to backend database
      const activeTenantId = profile.tenantId || session.tenantId || currentTenant?.id;
      if (activeTenantId) {
        fetch('/api/tenant/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: activeTenantId,
            moduleToken: token,
            isEnabled: !isCurrentlyEnabled,
          }),
        }).catch((err) => console.error('Failed to persist module state to DB:', err));
      }

      return next;
    });
  };

  const updateTableStatus = async (tableId: string, status: FloorTable['status']) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status, updatedAt: new Date().toISOString() } : t))
    );
    try {
      await fetch('/api/tenant/tables', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, status }),
      });
    } catch (err) {
      console.warn('Failed to sync table status update to cloud:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    setActiveOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
    );
    try {
      await fetch('/api/tenant/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
    } catch (err) {
      console.warn('Failed to sync order status update to cloud:', err);
    }
  };

  // Transactional Offline/Online Order Creation
  const createOrderOffline = async (orderData: Partial<Order>): Promise<Order> => {
    const activeTenantId = profile.tenantId || session.tenantId || currentTenant?.id || '';
    const orderId = generateUUIDv7();
    const orderNumber = `ORD-${String(activeOrders.length + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      tenantId: activeTenantId,
      orderNumber,
      orderType: orderData.orderType || 'DINE_IN',
      tableId: orderData.tableId,
      tableName: orderData.tableName,
      status: 'PLACED',
      guestCount: orderData.guestCount || 2,
      subtotal: orderData.subtotal || 0,
      taxAmount: orderData.taxAmount || 0,
      discountAmount: 0,
      serviceChargeAmount: 0,
      roundOffAmount: 0,
      grandTotal: (orderData.subtotal || 0) + (orderData.taxAmount || 0),
      createdByWorkerId: session.userId,
      createdByWorkerName: session.fullName,
      deviceId: session.deviceId || 'device-local',
      items: orderData.items || [],
      createdAt: now,
      updatedAt: now,
    };

    // 1. Commit to in-memory state
    setActiveOrders((prev) => [newOrder, ...prev]);

    // 2. Post to Database if online
    if (isOnline) {
      try {
        await fetch('/api/tenant/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: activeTenantId,
            orderType: newOrder.orderType,
            tableId: newOrder.tableId,
            tableName: newOrder.tableName,
            guestCount: newOrder.guestCount,
            subtotal: newOrder.subtotal,
            taxAmount: newOrder.taxAmount,
            grandTotal: newOrder.grandTotal,
            items: newOrder.items,
            createdByWorkerId: session.userId,
            createdByWorkerName: session.fullName,
          }),
        });
      } catch (err) {
        console.warn('Could not post order immediately to cloud API, queued locally:', err);
      }
    }

    // 3. Commit to persistent IndexedDB
    try {
      await offlineDb.orders.add(newOrder);

      const idempotencyKey = createIdempotencyKey({
        deviceId: session.deviceId || 'local',
        tenantId: activeTenantId,
        entityType: 'ORDER',
        action: 'CREATE',
        localTimestamp: Date.now(),
      });

      await offlineDb.syncQueue.add({
        operationId: generateUUIDv7(),
        tenantId: activeTenantId,
        deviceId: session.deviceId || 'local',
        workerId: session.userId,
        entityType: 'ORDER',
        action: 'CREATE',
        localTimestamp: Date.now(),
        idempotencyKey,
        payloadJson: newOrder,
        status: 'PENDING',
        retryCount: 0,
      });

      await refreshPendingCount();
    } catch (e) {
      console.error('Local IndexedDB write error:', e);
    }

    return newOrder;
  };

  const triggerSync = async () => {
    if (!isOnline) return;
    try {
      const pendingOps = await offlineDb.syncQueue.where('status').equals('PENDING').toArray();
      if (pendingOps.length === 0) return;

      // Simulate network sync reconciliation
      await new Promise((r) => setTimeout(r, 600));

      for (const op of pendingOps) {
        await offlineDb.syncQueue.update(op.operationId, {
          status: 'SYNCED',
          syncedAt: new Date().toISOString(),
        });
      }
      await refreshPendingCount();
    } catch (e) {
      console.error('Sync reconciliation error:', e);
    }
  };

  const navigation = resolveDynamicNavigation({
    businessType,
    enabledModules,
    userRole: session.roleName as any,
    permissions: session.permissions,
    devicePlatform,
  });

  return (
    <AppContext.Provider
      value={{
        profile,
        setProfile,
        businessType,
        setBusinessType,
        enabledModules,
        setEnabledModules,
        toggleModule,
        session,
        setSession,
        isOnline,
        setIsOnline,
        navigation,
        tables,
        setTables,
        categories,
        setCategories,
        menuItems,
        setMenuItems,
        activeOrders,
        setActiveOrders,
        customers,
        setCustomers,
        expenses,
        setExpenses,
        staff,
        setStaff,
        inventory,
        setInventory,
        devices,
        setDevices,
        currentTenant,
        setCurrentTenant,
        availableTenants,
        setAvailableTenants,
        stats,
        isLoadingData,
        refreshTenantData,
        createOrderOffline,
        updateTableStatus,
        updateOrderStatus,
        pendingSyncCount,
        triggerSync,
        resetToDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
