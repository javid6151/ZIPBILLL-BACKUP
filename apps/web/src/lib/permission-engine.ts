import { BusinessType, UserRoleType } from '@platform/types';
import { ArchitectureSection, RESTAURANT_PORTAL_SECTIONS } from './portal-architecture';

// ============================================================
// PERMISSION ARCHITECTURE (Level 1: Module, Level 2: Action)
// ============================================================

export interface PermissionDefinition {
  code: string;
  module: string;
  action: string;
  name: string;
  description: string;
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // Dashboard
  { code: 'dashboard.view', module: 'dashboard', action: 'view', name: 'View Dashboard', description: 'Access dashboard overview' },
  { code: 'dashboard.sales', module: 'dashboard', action: 'sales', name: 'View Sales KPIs', description: 'Inspect daily revenue and sales' },
  { code: 'dashboard.orders', module: 'dashboard', action: 'orders', name: 'View Order Feeds', description: 'Inspect real-time order lists' },
  { code: 'dashboard.tables', module: 'dashboard', action: 'tables', name: 'View Table Occupancy', description: 'Inspect floor occupancy stats' },
  { code: 'dashboard.kitchen', module: 'dashboard', action: 'kitchen', name: 'View Kitchen Queue', description: 'Inspect preparation delays' },
  { code: 'dashboard.payments', module: 'dashboard', action: 'payments', name: 'View Payment Summaries', description: 'Inspect payment settlement trends' },
  { code: 'dashboard.actions', module: 'dashboard', action: 'actions', name: 'Execute Quick Actions', description: 'Trigger operational shortcuts' },

  // POS
  { code: 'pos.view', module: 'pos', action: 'view', name: 'Access POS Workspace', description: 'Open point of sale interface' },
  { code: 'pos.create', module: 'pos', action: 'create', name: 'Create Orders', description: 'Create and punch in order line items' },
  { code: 'pos.quick', module: 'pos', action: 'quick', name: 'Quick Billing', description: 'Fast counter walk-in checkout' },
  { code: 'pos.dine_in', module: 'pos', action: 'dine_in', name: 'Dine-In Orders', description: 'Create table-seated orders' },
  { code: 'pos.takeaway', module: 'pos', action: 'takeaway', name: 'Takeaway Orders', description: 'Create pickup parcel orders' },
  { code: 'pos.delivery', module: 'pos', action: 'delivery', name: 'Delivery Dispatch', description: 'Create home delivery orders' },
  { code: 'pos.hold', module: 'pos', action: 'hold', name: 'Hold Orders', description: 'Park open bills on floor' },

  // Tables
  { code: 'tables.view', module: 'tables', action: 'view', name: 'View Floor Plan', description: 'Inspect table layouts and statuses' },
  { code: 'tables.create', module: 'tables', action: 'create', name: 'Create Tables', description: 'Add new dining tables' },
  { code: 'tables.edit', module: 'tables', action: 'edit', name: 'Edit Tables', description: 'Modify table details and capacity' },
  { code: 'tables.delete', module: 'tables', action: 'delete', name: 'Delete Tables', description: 'Remove tables from layout' },
  { code: 'tables.transfer', module: 'tables', action: 'transfer', name: 'Transfer Tables', description: 'Move party between tables' },
  { code: 'tables.merge', module: 'tables', action: 'merge', name: 'Merge Tables', description: 'Combine multiple tables into one tab' },
  { code: 'tables.reserve', module: 'tables', action: 'reserve', name: 'Manage Reservations', description: 'Book tables in advance' },

  // Orders
  { code: 'orders.view', module: 'orders', action: 'view', name: 'View Order History', description: 'Access live and historical orders' },
  { code: 'orders.create', module: 'orders', action: 'create', name: 'Punch Orders', description: 'Place items into order system' },
  { code: 'orders.edit', module: 'orders', action: 'edit', name: 'Edit Orders', description: 'Modify quantities and add dishes' },
  { code: 'orders.cancel', module: 'orders', action: 'cancel', name: 'Cancel Orders', description: 'Void or cancel active orders' },
  { code: 'orders.details', module: 'orders', action: 'details', name: 'View Order Details', description: 'Inspect order item breakdown' },

  // Kitchen
  { code: 'kitchen.view', module: 'kitchen', action: 'view', name: 'View KDS Display', description: 'Access live kitchen display screen' },
  { code: 'kitchen.accept', module: 'kitchen', action: 'accept', name: 'Accept Tickets', description: 'Acknowledge pending orders' },
  { code: 'kitchen.prepare', module: 'kitchen', action: 'prepare', name: 'Start Prep', description: 'Mark items as actively cooking' },
  { code: 'kitchen.ready', module: 'kitchen', action: 'ready', name: 'Mark Ready', description: 'Send ready notification to floor' },
  { code: 'kitchen.serve', module: 'kitchen', action: 'serve', name: 'Mark Served', description: 'Confirm dish delivered to guest' },
  { code: 'kitchen.kot', module: 'kitchen', action: 'kot', name: 'Manage KOT Slips', description: 'Reprint or route kitchen tickets' },
  { code: 'kitchen.stations', module: 'kitchen', action: 'stations', name: 'Manage Stations', description: 'Configure Grill, Bar, Dessert stations' },

  // Menu
  { code: 'menu.view', module: 'menu', action: 'view', name: 'View Catalog', description: 'Browse categories and dishes' },
  { code: 'menu.create', module: 'menu', action: 'create', name: 'Add Dishes', description: 'Create new catalog items' },
  { code: 'menu.edit', module: 'menu', action: 'edit', name: 'Edit Catalog', description: 'Update dishes, descriptions, prices' },
  { code: 'menu.delete', module: 'menu', action: 'delete', name: 'Delete Dishes', description: 'Remove items from catalog' },
  { code: 'menu.pricing', module: 'menu', action: 'pricing', name: 'Manage Pricing', description: 'Configure happy hours and price tiers' },
  { code: 'menu.availability', module: 'menu', action: 'availability', name: 'Toggle 86 / Stock', description: 'Mark items in/out of stock' },
  { code: 'menu.ai_import', module: 'menu', action: 'ai_import', name: 'AI Menu OCR', description: 'Ingest printed menu photos' },
  { code: 'menu.qr', module: 'menu', action: 'qr', name: 'Configure QR Menu', description: 'Customize customer digital menu' },

  // Billing
  { code: 'billing.view', module: 'billing', action: 'view', name: 'View Bills & Invoices', description: 'Access bill records and summaries' },
  { code: 'billing.create', module: 'billing', action: 'create', name: 'Generate Invoices', description: 'Finalize bills and print thermal checks' },
  { code: 'billing.edit', module: 'billing', action: 'edit', name: 'Apply Discounts', description: 'Modify service charge and discounts' },
  { code: 'billing.cancel', module: 'billing', action: 'cancel', name: 'Cancel Bills', description: 'Void completed invoices' },
  { code: 'billing.refund', module: 'billing', action: 'refund', name: 'Issue Refunds', description: 'Refund money for disputed bills' },
  { code: 'billing.split', module: 'billing', action: 'split', name: 'Split Bills', description: 'Divide check equally or by item' },
  { code: 'billing.reprint', module: 'billing', action: 'reprint', name: 'Reprint Receipts', description: 'Re-spool thermal receipt slips' },

  // Payments
  { code: 'payments.view', module: 'payments', action: 'view', name: 'View Payments Ledger', description: 'Inspect settled and pending payouts' },
  { code: 'payments.cash', module: 'payments', action: 'cash', name: 'Accept Cash', description: 'Record currency notes & calculate change' },
  { code: 'payments.upi', module: 'payments', action: 'upi', name: 'Accept UPI QR', description: 'Generate dynamic BharatPe / Paytm QR' },
  { code: 'payments.card', module: 'payments', action: 'card', name: 'Accept POS Cards', description: 'Process debit & credit swipe terminals' },
  { code: 'payments.online', module: 'payments', action: 'online', name: 'Online Gateway', description: 'Process digital payment links' },
  { code: 'payments.split', module: 'payments', action: 'split', name: 'Multi-tender Split', description: 'Combine cash + card for single bill' },
  { code: 'payments.reconciliation', module: 'payments', action: 'reconciliation', name: 'End-of-day Reconciliation', description: 'Close cash drawer & balance shifts' },

  // Inventory
  { code: 'inventory.view', module: 'inventory', action: 'view', name: 'View Stock', description: 'Inspect raw materials and quantities' },
  { code: 'inventory.adjust', module: 'inventory', action: 'adjust', name: 'Adjust Stock', description: 'Log waste, spoilage, or manual counts' },
  { code: 'inventory.recipes', module: 'inventory', action: 'recipes', name: 'Manage Recipe BOM', description: 'Link raw ingredient consumption to dishes' },
  { code: 'inventory.suppliers', module: 'inventory', action: 'suppliers', name: 'Manage Suppliers', description: 'Vendor contact books and price sheets' },
  { code: 'inventory.purchases', module: 'inventory', action: 'purchases', name: 'Create Purchase Orders', description: 'Record incoming vendor ingredient deliveries' },

  // Customers
  { code: 'customers.view', module: 'customers', action: 'view', name: 'View Customer CRM', description: 'Access customer visit history and spend' },
  { code: 'customers.create', module: 'customers', action: 'create', name: 'Add Customers', description: 'Register guest profiles' },
  { code: 'customers.edit', module: 'customers', action: 'edit', name: 'Edit CRM Data', description: 'Update guest tags and birthdays' },
  { code: 'customers.loyalty', module: 'customers', action: 'loyalty', name: 'Redeem Loyalty Points', description: 'Award and debit reward points' },
  { code: 'customers.analytics', module: 'customers', action: 'analytics', name: 'Customer Insights', description: 'Frequency and churn metrics' },

  // Staff
  { code: 'staff.view', module: 'staff', action: 'view', name: 'View Staff Directory', description: 'Inspect employee profiles' },
  { code: 'staff.create', module: 'staff', action: 'create', name: 'Add Staff Member', description: 'Create login and assign role' },
  { code: 'staff.edit', module: 'staff', action: 'edit', name: 'Edit Staff Profiles', description: 'Modify employee contact details' },
  { code: 'staff.delete', module: 'staff', action: 'delete', name: 'Deactivate Staff', description: 'Revoke employee login credentials' },
  { code: 'staff.permissions', module: 'staff', action: 'permissions', name: 'Manage Roles & Permissions', description: 'Configure custom roles and matrices' },
  { code: 'staff.activity', module: 'staff', action: 'activity', name: 'Inspect Audit Logs', description: 'Review immutable micro-action trail' },
  { code: 'staff.devices', module: 'staff', action: 'devices', name: 'Authorize Devices', description: 'Bind POS tablets and phones' },

  // Expenses
  { code: 'expenses.view', module: 'expenses', action: 'view', name: 'View Expense Ledger', description: 'Review operational costs and payouts' },
  { code: 'expenses.create', module: 'expenses', action: 'create', name: 'Record Expenses', description: 'Log petty cash, rent, utility bills' },
  { code: 'expenses.edit', module: 'expenses', action: 'edit', name: 'Edit Expenses', description: 'Modify expense records' },
  { code: 'expenses.delete', module: 'expenses', action: 'delete', name: 'Delete Expenses', description: 'Remove invalid expense entries' },
  { code: 'expenses.categories', module: 'expenses', action: 'categories', name: 'Manage Categories', description: 'Configure custom cost centers' },

  // Reports
  { code: 'reports.view', module: 'reports', action: 'view', name: 'Access Reports', description: 'Open financial and sales summaries' },
  { code: 'reports.sales', module: 'reports', action: 'sales', name: 'Sales Analytics', description: 'Item-level revenue breakdowns' },
  { code: 'reports.tax', module: 'reports', action: 'tax', name: 'GST & Tax Reports', description: 'Generate B2B and B2C tax files' },
  { code: 'reports.inventory', module: 'reports', action: 'inventory', name: 'Inventory Valuations', description: 'Ingredient burn rates and COGS' },
  { code: 'reports.staff', module: 'reports', action: 'staff', name: 'Staff Performance', description: 'Server sales and shift productivity' },
  { code: 'reports.export', module: 'reports', action: 'export', name: 'Export CSV / PDF', description: 'Download business records' },

  // QR
  { code: 'qr.view', module: 'qr', action: 'view', name: 'View QR Management', description: 'Inspect active table QRs' },
  { code: 'qr.generate', module: 'qr', action: 'generate', name: 'Generate Table QRs', description: 'Create high-res printable table QR codes' },
  { code: 'qr.ordering', module: 'qr', action: 'ordering', name: 'Contactless Ordering', description: 'Accept guest phone-placed orders' },
  { code: 'qr.payment', module: 'qr', action: 'payment', name: 'Scan to Pay', description: 'Allow guests to settle bills via phone' },

  // Printers
  { code: 'printers.view', module: 'printers', action: 'view', name: 'View Hardware Status', description: 'Check thermal printers online state' },
  { code: 'printers.configure', module: 'printers', action: 'configure', name: 'Configure Routing', description: 'Assign KOT printers to specific stations' },
  { code: 'printers.test', module: 'printers', action: 'test', name: 'Trigger Test Prints', description: 'Send ESC/POS diagnostic slip' },

  // Sync
  { code: 'sync.view', module: 'sync', action: 'view', name: 'View Sync Status', description: 'Inspect local IndexedDB queue' },
  { code: 'sync.manual', module: 'sync', action: 'manual', name: 'Force Reconciliation', description: 'Trigger manual cloud push' },

  // Settings
  { code: 'settings.view', module: 'settings', action: 'view', name: 'View Settings', description: 'Open configuration workspace' },
  { code: 'settings.profile', module: 'settings', action: 'profile', name: 'Update Restaurant Profile', description: 'Change name, phone, address, logo' },
  { code: 'settings.tax', module: 'settings', action: 'tax', name: 'Configure GST & Billing', description: 'Set tax percentages and invoice headers' },
  { code: 'settings.modules', module: 'settings', action: 'modules', name: 'Toggle Modules', description: 'Enable/disable platform modules' },
  { code: 'settings.security', module: 'settings', action: 'security', name: 'Security & 2FA', description: 'Manage session timeouts and passwords' },
];

// ============================================================
// ============================================================
// DEFAULT ROLE PERMISSION MATRIX
// Per Specification: STRICT 3-ROLE ARCHITECTURE (OWNER, WAITER, KITCHEN ONLY)
// ============================================================

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  // 1. OWNER: Full management access across all enabled restaurant modules
  OWNER: ['*'],

  // 2. WAITER: Customer-facing order operations (Dashboard, POS, Tables, Orders, Menu, Customers)
  WAITER: [
    'dashboard.view',
    'dashboard.tables',
    'dashboard.orders',
    'pos.*',
    'tables.*',
    'orders.view',
    'orders.create',
    'orders.dine_in',
    'orders.details',
    'menu.view',
    'customers.view',
    'sync.*',
  ],

  // 3. KITCHEN: Kitchen order display and queue preparation (Kitchen, Orders)
  KITCHEN: [
    'kitchen.*',
    'orders.view',
    'orders.details',
    'sync.*',
  ],
};

// Map Section Children Action IDs to Permission Codes
export const SECTION_CHILD_PERMISSIONS: Record<string, string> = {
  // Dashboard
  overview: 'dashboard.view',
  today_sales: 'dashboard.sales',
  today_orders: 'dashboard.orders',
  active_tables: 'dashboard.tables',
  pending_orders: 'dashboard.kitchen',
  kitchen_status: 'dashboard.kitchen',
  payment_summary: 'dashboard.payments',
  quick_actions: 'dashboard.actions',

  // POS
  new_order: 'pos.create',
  quick_billing: 'pos.quick',
  dine_in: 'pos.dine_in',
  takeaway: 'pos.takeaway',
  delivery: 'pos.delivery',
  held_orders: 'pos.hold',

  // Tables
  floor_view: 'tables.view',
  all_tables: 'tables.view',
  table_sections: 'tables.view',
  reservations: 'tables.reserve',
  table_qr_codes: 'tables.view',
  table_transfer: 'tables.transfer',
  table_merge: 'tables.merge',

  // Orders
  all_orders: 'orders.view',
  active_orders: 'orders.view',
  completed_orders: 'orders.view',
  cancelled_orders: 'orders.cancel',
  dine_in_orders: 'orders.view',
  takeaway_orders: 'orders.view',
  delivery_orders: 'orders.view',
  order_details: 'orders.details',

  // Kitchen
  kitchen_display: 'kitchen.view',
  new_orders: 'kitchen.accept',
  preparing: 'kitchen.prepare',
  ready: 'kitchen.ready',
  served: 'kitchen.serve',
  kot: 'kitchen.kot',
  kitchen_stations: 'kitchen.stations',

  // Menu
  menu_overview: 'menu.view',
  categories: 'menu.view',
  menu_items: 'menu.view',
  variants: 'menu.edit',
  modifiers: 'menu.edit',
  add_ons: 'menu.edit',
  pricing: 'menu.pricing',
  availability: 'menu.availability',
  menu_images: 'menu.edit',
  ai_menu_import: 'menu.ai_import',
  qr_menu: 'menu.qr',

  // Billing
  all_bills: 'billing.view',
  open_bills: 'billing.view',
  paid_bills: 'billing.view',
  cancelled_bills: 'billing.cancel',
  refunds: 'billing.refund',
  split_bills: 'billing.split',
  merged_bills: 'billing.edit',
  invoices: 'billing.view',
  reprint: 'billing.reprint',

  // Payments
  all_payments: 'payments.view',
  cash: 'payments.cash',
  upi: 'payments.upi',
  card: 'payments.card',
  online_payments: 'payments.online',
  split_payments: 'payments.split',
  payment_reconciliation: 'payments.reconciliation',

  // Inventory
  inventory_overview: 'inventory.view',
  products: 'inventory.view',
  ingredients: 'inventory.view',
  stock: 'inventory.view',
  stock_adjustment: 'inventory.adjust',
  low_stock: 'inventory.view',
  stock_history: 'inventory.view',
  recipes: 'inventory.recipes',
  suppliers: 'inventory.suppliers',
  purchases: 'inventory.purchases',

  // Customers
  all_customers: 'customers.view',
  customer_profiles: 'customers.view',
  order_history: 'customers.view',
  customer_analytics: 'customers.analytics',
  feedback: 'customers.view',
  loyalty: 'customers.loyalty',

  // Staff
  all_staff: 'staff.view',
  add_staff: 'staff.create',
  roles: 'staff.permissions',
  permissions: 'staff.permissions',
  staff_activity: 'staff.activity',
  devices: 'staff.devices',
  sessions: 'staff.devices',

  // Expenses
  expense_overview: 'expenses.view',
  add_expense: 'expenses.create',
  expense_categories: 'expenses.categories',
  recurring_expenses: 'expenses.create',
  expense_history: 'expenses.view',

  // Reports
  sales_report: 'reports.sales',
  order_report: 'reports.sales',
  payment_report: 'reports.sales',
  tax_report: 'reports.tax',
  product_performance: 'reports.sales',
  category_performance: 'reports.sales',
  table_performance: 'reports.sales',
  staff_performance: 'reports.staff',
  inventory_report: 'reports.inventory',
  customer_report: 'reports.sales',
  expense_report: 'reports.sales',

  // QR
  qr_digital_menu: 'qr.view',
  table_qr: 'qr.generate',
  qr_ordering: 'qr.ordering',
  qr_bill_payment: 'qr.payment',
  generate_qr: 'qr.generate',

  // Printers
  printers: 'printers.view',
  thermal_printers: 'printers.view',
  kot_printers: 'printers.configure',
  network_printers: 'printers.configure',
  connected_devices: 'printers.view',
  test_print: 'printers.test',

  // Insights
  revenue: 'reports.sales',
  sales_trends: 'reports.sales',
  peak_hours: 'reports.sales',
  best_selling_items: 'reports.sales',
  staff_perf: 'reports.staff',
  table_perf: 'reports.sales',

  // Settings
  restaurant_profile: 'settings.profile',
  business_information: 'settings.profile',
  tax_billing: 'settings.tax',
  payment_settings: 'settings.tax',
  printer_settings: 'printers.configure',
  table_settings: 'tables.edit',
  menu_settings: 'menu.edit',
  staff_settings: 'staff.permissions',
  roles_permissions: 'staff.permissions',
  module_management: 'settings.modules',
  notifications: 'settings.view',
  integrations: 'settings.view',
  security: 'settings.security',

  // Sync
  connection_status: 'sync.view',
  pending_sync: 'sync.view',
  sync_history: 'sync.view',
  failed_sync: 'sync.view',
};

// ============================================================
// PERMISSION CHECK ENGINE
// ============================================================

export function checkPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;

  if (userPermissions.includes(requiredPermission)) return true;

  const [requiredModule] = requiredPermission.split('.');
  if (userPermissions.includes(`${requiredModule}.*`)) return true;

  return false;
}

export function checkModuleAccess(userPermissions: string[], moduleId: string): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (userPermissions.includes('*')) return true;
  if (userPermissions.includes(`${moduleId}.*`)) return true;

  return userPermissions.some((perm) => perm.startsWith(`${moduleId}.`));
}

// ============================================================
// DYNAMIC MODULE REQUIREMENTS MAPPING
// Strictly maps sidebar sections and sub-items to system module tokens.
// If a module is disabled in restaurant settings, it will NOT show in the sidebar.
// ============================================================

export const SECTION_MODULE_REQUIREMENTS: Record<string, string[]> = {
  pos: ['pos', 'pos.dine_in', 'pos.quick_counter', 'pos.takeaway', 'pos.delivery'],
  tables: ['tables', 'operations.tables'],
  orders: ['orders'],
  kitchen: ['kitchen', 'operations.kitchen_kds'],
  menu: ['menu', 'catalog.modifiers_variants', 'ai_menu_import'],
  billing: ['billing', 'billing.thermal_receipts'],
  payments: ['payments', 'payments.upi_qr'],
  inventory: ['inventory', 'inventory.raw_materials', 'inventory.recipes_bom'],
  customers: ['customers', 'crm.customers', 'crm.loyalty'],
  staff: ['staff', 'staff.shared_access'],
  expenses: ['expenses', 'finance.expenses'],
  qr: ['qr', 'qr.table_ordering', 'qr.digital_menu', 'qr.table_pay'],
  printers: ['printers', 'hardware.thermal_printers', 'operations.kot_printing'],
  reports: ['reports', 'reports.sales_analytics', 'reports.staff_activity'],
  insights: ['insights', 'reports.sales_analytics'],
};

export const CHILD_MODULE_REQUIREMENTS: Record<string, string[]> = {
  // POS children
  dine_in: ['pos.dine_in'],
  quick_billing: ['pos.quick_counter'],
  takeaway: ['pos.takeaway'],
  delivery: ['pos.delivery'],

  // Tables children
  table_qr_codes: ['qr.table_ordering', 'qr.digital_menu'],

  // Kitchen children
  kot: ['operations.kot_printing'],

  // Menu children
  variants: ['catalog.modifiers_variants'],
  modifiers: ['catalog.modifiers_variants'],
  add_ons: ['catalog.modifiers_variants'],
  ai_menu_import: ['ai.menu_import'],
  qr_menu: ['qr.digital_menu', 'qr.table_ordering'],

  // Billing children
  split_bills: ['billing.split_payment'],

  // Payments children
  split_payments: ['billing.split_payment'],

  // Inventory children
  recipes: ['inventory.recipes_bom'],

  // Customers children
  loyalty: ['crm.loyalty'],

  // Staff children
  devices: ['staff.device_mgmt'],
  sessions: ['staff.device_mgmt'],

  // QR children
  qr_ordering: ['qr.table_ordering'],
  qr_digital_menu: ['qr.digital_menu'],
  qr_bill_payment: ['qr.table_pay'],

  // Printers children
  kot_printers: ['operations.kot_printing'],
};

// ============================================================
// 12-STEP DYNAMIC NAVIGATION GENERATOR
// ============================================================

export interface NavigationGenerationParams {
  tenantId: string;
  businessType: BusinessType;
  enabledModules: string[];
  userRole: string;
  userPermissions?: string[];
  subscriptionPlan?: string;
  deviceType?: string;
}

export function generateDynamicNavigation(params: NavigationGenerationParams): ArchitectureSection[] {
  const { businessType, enabledModules = [], userRole, userPermissions } = params;

  const normalizedRole = (userRole || 'OWNER').toUpperCase();
  const effectivePermissions =
    userPermissions && userPermissions.length > 0
      ? userPermissions
      : ROLE_DEFAULT_PERMISSIONS[normalizedRole] || ROLE_DEFAULT_PERMISSIONS.WAITER;

  // Normalize enabled modules for reliable matching (support lowercase and uppercase)
  const normalizedEnabled = new Set(
    enabledModules.map((m) => String(m).toLowerCase().trim())
  );

  const hasModule = (token: string) => {
    const t = token.toLowerCase().trim();
    if (normalizedEnabled.has(t)) return true;
    for (const em of normalizedEnabled) {
      if (em === t) return true;
      if (em.startsWith(t + '.')) return true;
      if (t.startsWith(em + '.')) return true;
    }
    return false;
  };

  const generatedSections: ArchitectureSection[] = [];

  for (const section of RESTAURANT_PORTAL_SECTIONS) {
    // STRICT 3-ROLE SIDEBAR RULE:
    // WAITER: Dashboard, POS, Tables, Orders, Menu, Customers
    // KITCHEN: Kitchen, Orders
    // OWNER: All sections
    if (normalizedRole === 'WAITER' && !['dashboard', 'pos', 'tables', 'orders', 'menu', 'customers'].includes(section.id)) {
      continue;
    }
    if (normalizedRole === 'KITCHEN' && !['kitchen', 'orders'].includes(section.id)) {
      continue;
    }

    // Business Type exclusions (e.g. Cloud Kitchen or Bakery do not have dining tables)
    if ((businessType === 'CLOUD_KITCHEN' || businessType === 'BAKERY') && section.id === 'tables') {
      continue;
    }

    // STRICT MODULE REQUIREMENT CHECK:
    // When a module is disabled in system settings, it CANNOT show in the sidebar (even for Owner)
    const requiredModules = SECTION_MODULE_REQUIREMENTS[section.id];
    if (requiredModules && requiredModules.length > 0) {
      const hasAnyRequired = requiredModules.some((token) => hasModule(token));
      if (!hasAnyRequired) {
        continue;
      }
    }

    // Role-based Module Access Permission Check
    if (!checkModuleAccess(effectivePermissions, section.id)) {
      continue;
    }

    // Filter Children based on both Module requirements AND Permissions
    const authorizedChildren = section.children.filter((child) => {
      // 1. Check if child feature is enabled in system modules
      const childModuleReq = CHILD_MODULE_REQUIREMENTS[child.id];
      if (childModuleReq && childModuleReq.length > 0) {
        const hasChildMod = childModuleReq.some((token) => hasModule(token));
        if (!hasChildMod) return false;
      }

      // 2. Check if user has permission for child action
      const requiredCode = SECTION_CHILD_PERMISSIONS[child.id];
      if (!requiredCode) return true;
      return checkPermission(effectivePermissions, requiredCode);
    });

    // Remove empty sections (if no authorized children, omit)
    if (section.children.length > 0 && authorizedChildren.length === 0) {
      continue;
    }

    // Add to final dynamic navigation
    generatedSections.push({
      ...section,
      children: authorizedChildren,
    });
  }

  return generatedSections;
}

// Map route paths to their primary required permission for route guard enforcement
export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/dashboard': 'dashboard.view',
  '/pos': 'pos.view',
  '/tables': 'tables.view',
  '/orders': 'orders.view',
  '/kitchen': 'kitchen.view',
  '/menu': 'menu.view',
  '/billing': 'billing.view',
  '/payments': 'payments.view',
  '/inventory': 'inventory.view',
  '/customers': 'customers.view',
  '/staff': 'staff.view',
  '/expenses': 'expenses.view',
  '/reports': 'reports.view',
  '/qr': 'qr.view',
  '/printers': 'printers.view',
  '/insights': 'reports.sales',
  '/settings': 'settings.view',
  '/sync': 'sync.view',
};
