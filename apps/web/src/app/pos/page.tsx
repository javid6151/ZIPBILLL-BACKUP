'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/state';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle,
  AlertCircle,
  X,
  ChefHat,
  Receipt,
  User,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
} from 'lucide-react';
import { MenuItem, OrderItem, PaymentMethod } from '@platform/types';
import { buildReceiptPrintJob, buildKotPrintJob } from '@platform/print-engine';

export default function PosPage() {
  const {
    profile,
    businessType,
    enabledModules = [],
    categories,
    menuItems,
    tables,
    session,
    createOrderOffline,
    updateTableStatus,
    isOnline,
  } = useApp();

  const isDineIn =
    (enabledModules.includes('operations.tables') || enabledModules.includes('pos.dine_in')) &&
    businessType !== 'CLOUD_KITCHEN' &&
    businessType !== 'BAKERY' &&
    businessType !== 'FAST_FOOD';

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTableId, setSelectedTableId] = useState<string>(isDineIn ? tables[0]?.id || '' : '');
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('UPI');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [lastPrintedInvoice, setLastPrintedInvoice] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'COURSE' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC'>('COURSE');

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const totalCartCount = cartItems.reduce((acc, ci) => acc + ci.quantity, 0);

  function getCategoryCourseRank(name: string): number {
    const n = (name || '').toLowerCase().trim();
    if (n.includes('appetizer') || n.includes('starter') || n.includes('soup') || n.includes('salad') || n.includes('snack') || n.includes('chaat')) return 1;
    if (n.includes('main') || n.includes('curry') || n.includes('biryani') || n.includes('gravy') || n.includes('entree') || n.includes('rice') || n.includes('pasta') || n.includes('pizza') || n.includes('burger')) return 2;
    if (n.includes('bread') || n.includes('roti') || n.includes('naan') || n.includes('paratha') || n.includes('side')) return 3;
    if (n.includes('dessert') || n.includes('sweet') || n.includes('ice cream') || n.includes('cake') || n.includes('pastry') || n.includes('halwa')) return 4;
    if (n.includes('drink') || n.includes('beverage') || n.includes('juice') || n.includes('shake') || n.includes('tea') || n.includes('coffee') || n.includes('soda') || n.includes('water')) return 5;
    return 10;
  }

  // Sorted Categories for navigation bar
  const sortedCategories = [...categories].sort((a, b) => {
    const rankA = a.sortOrder || getCategoryCourseRank(a.name);
    const rankB = b.sortOrder || getCategoryCourseRank(b.name);
    if (rankA !== rankB) return rankA - rankB;
    return a.name.localeCompare(b.name);
  });

  // Filter and Sort Menu Items in proper order
  const filteredItems = menuItems
    .filter((item) => {
      const matchesCat = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery && item.isAvailable;
    })
    .sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.basePrice - b.basePrice;
      if (sortBy === 'PRICE_DESC') return b.basePrice - a.basePrice;
      if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);

      // Default: Strict Course Order (Appetizers -> Mains -> Breads -> Desserts -> Drinks)
      const catA = categories.find((c) => c.id === a.categoryId);
      const catB = categories.find((c) => c.id === b.categoryId);
      const rankA = catA?.sortOrder || getCategoryCourseRank(catA?.name || '');
      const rankB = catB?.sortOrder || getCategoryCourseRank(catB?.name || '');
      if (rankA !== rankB) return rankA - rankB;

      // Within same category, sort by dish sortOrder first, then ascending price
      if ((a.sortOrder || 0) !== (b.sortOrder || 0)) {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      return a.basePrice - b.basePrice;
    });

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.menuItemId === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItemId === item.id
            ? { ...ci, quantity: ci.quantity + 1, subtotal: (ci.quantity + 1) * ci.unitPrice }
            : ci
        );
      }
      const newItem: OrderItem = {
        id: `oi-${item.id}-${Date.now()}`,
        orderId: '',
        menuItemId: item.id,
        itemName: item.name,
        unitPrice: item.basePrice,
        quantity: 1,
        subtotal: item.basePrice,
        status: 'PLACED',
        addedByWorkerId: session.userId,
        addedByWorkerName: session.fullName,
        createdAt: new Date().toISOString(),
      };
      return [...prev, newItem];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((ci) => {
          if (ci.menuItemId === menuItemId) {
            const nextQty = ci.quantity + delta;
            return nextQty > 0
              ? { ...ci, quantity: nextQty, subtotal: nextQty * ci.unitPrice }
              : null;
          }
          return ci;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const removeFromCart = (menuItemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.menuItemId !== menuItemId));
  };

  const clearCart = () => setCartItems([]);

  // Computed totals
  const cartSubtotal = cartItems.reduce((acc, ci) => acc + ci.subtotal, 0);
  const cartTax = Math.round(cartSubtotal * 0.05); // 5% GST
  const cartGrandTotal = cartSubtotal + cartTax;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Dispatch Kitchen Order Ticket (KOT)
  const handleSendKot = async () => {
    if (cartItems.length === 0) return;
    const order = await createOrderOffline({
      tableId: isDineIn ? selectedTableId : undefined,
      tableName: isDineIn ? selectedTable?.tableName : 'Counter',
      items: cartItems,
      subtotal: cartSubtotal,
      taxAmount: cartTax,
      grandTotal: cartGrandTotal,
    });

    if (isDineIn && selectedTableId) {
      updateTableStatus(selectedTableId, 'OCCUPIED');
    }

    const kotBytes = buildKotPrintJob({
      id: `kot-${Date.now()}`,
      tenantId: profile.tenantId,
      ticketNumber: `KOT-${order.orderNumber.replace('ORD-', '')}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: isDineIn ? selectedTable?.tableNumber : 'Counter',
      orderType: isDineIn ? 'Dine In' : 'Takeaway',
      status: 'PENDING',
      waiterName: session.fullName,
      createdAt: new Date().toISOString(),
      items: cartItems.map((ci) => ({
        id: `ki-${ci.id}`,
        kitchenTicketId: '',
        orderItemId: ci.id,
        itemName: ci.itemName,
        quantity: ci.quantity,
        status: 'PENDING',
      })),
    });

    showToast(`KOT dispatched for ${order.orderNumber}! (${kotBytes.length} ESC/POS bytes spooled)`);
    clearCart();
  };

  // Complete Payment & Generate Bill
  const handleCompletePayment = async () => {
    if (cartItems.length === 0) return;
    const order = await createOrderOffline({
      tableId: isDineIn ? selectedTableId : undefined,
      tableName: isDineIn ? selectedTable?.tableName : 'Counter',
      items: cartItems,
      subtotal: cartSubtotal,
      taxAmount: cartTax,
      grandTotal: cartGrandTotal,
    });

    const invoiceNumber = `INV-${order.orderNumber.replace('ORD-', '')}`;

    const receiptBytes = buildReceiptPrintJob({
      business: profile,
      invoice: {
        id: `inv-${Date.now()}`,
        tenantId: profile.tenantId,
        invoiceNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        subtotal: cartSubtotal,
        taxAmount: cartTax,
        discountAmount: 0,
        serviceChargeAmount: 0,
        roundOffAmount: 0,
        grandTotal: cartGrandTotal,
        status: 'PAID',
        paidAmount: cartGrandTotal,
        dueAmount: 0,
        generatedByWorkerId: session.userId,
        generatedByWorkerName: session.fullName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      order,
    });

    if (isDineIn && selectedTableId) {
      updateTableStatus(selectedTableId, 'AVAILABLE');
    }

    setLastPrintedInvoice(invoiceNumber);
    setPaymentModalOpen(false);
    clearCart();
    setMobileCartOpen(false);
    showToast(`Bill ${invoiceNumber} settled & printed successfully! (${receiptBytes.length} bytes ESC/POS)`);
  };

  return (
    <div className="flex h-full w-full overflow-hidden select-none font-sans bg-background relative">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-8 z-50 bg-success text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 text-sm font-semibold">
          <CheckCircle className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* LEFT / CENTER: MENU CATALOG & CATEGORIES */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border bg-background">
        {/* TOP BAR: TABLE PICKER (If Dine-In) + SEARCH + MOBILE CART */}
        <div className="p-3 sm:p-3.5 border-b border-border bg-surface flex items-center gap-2 sm:gap-3">
          {isDineIn ? (
            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="text-xs font-semibold text-secondary uppercase hidden sm:inline">Table:</span>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="bg-surfaceMuted border border-border text-heading text-xs font-semibold rounded-xl px-2.5 sm:px-3 py-2 focus:outline-none focus:border-primary max-w-[125px] sm:max-w-[180px] truncate"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tableName} ({t.status})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-primary bg-primary-light px-2.5 sm:px-3 py-1.5 rounded-xl border border-primary/20 shrink-0">
              <span>
                {businessType === 'CLOUD_KITCHEN'
                  ? 'Cloud Kitchen Dispatch'
                  : businessType === 'BAKERY'
                  ? 'Bakery Takeaway'
                  : businessType === 'FAST_FOOD'
                  ? 'QSR High-Speed'
                  : 'Quick Counter POS'}
              </span>
            </div>
          )}

          {/* Search Box */}
          <div className="flex-1 min-w-[100px] relative">
            <Search className="w-4 h-4 text-placeholder absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input w-full h-[38px] sm:h-[40px] text-xs pl-8 sm:pl-9"
            />
          </div>

          {/* Sort By Selector */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-surfaceMuted border border-border text-heading text-xs font-semibold rounded-xl pl-2.5 pr-7 py-2 focus:outline-none focus:border-primary appearance-none cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
              title="Sort Order"
            >
              <option value="COURSE">Course Order</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="NAME_ASC">Name: A to Z</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-secondary absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Mobile Cart Button in Top Bar */}
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="lg:hidden relative p-2 rounded-xl bg-primary-light border border-primary/20 text-primary font-bold flex items-center space-x-1.5 shrink-0 hover:bg-primary hover:text-white transition"
            title="Open Cart"
          >
            <Receipt className="w-4 h-4" />
            {totalCartCount > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>

        {/* CATEGORIES HORIZONTAL BAR */}
        <div className="px-3.5 py-2.5 border-b border-border bg-surface flex items-center space-x-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-primary text-white shadow-button'
                : 'bg-surfaceMuted text-secondary hover:text-main'
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {sortedCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-button'
                  : 'bg-surfaceMuted text-secondary hover:text-main'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ITEMS GRID */}
        {filteredItems.length > 0 ? (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 content-start">
            {filteredItems.map((item) => {
              const inCart = cartItems.find((ci) => ci.menuItemId === item.id);
              const categoryName = categories.find((c) => c.id === item.categoryId)?.name;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addToCart(item)}
                  className={`card p-3 sm:p-4 rounded-2xl flex flex-col justify-between transition-all duration-150 relative min-h-[148px] sm:min-h-[165px] text-left select-none group ${
                    inCart
                      ? 'bg-primary-light/40 border-primary ring-1 ring-primary/40 shadow-sm'
                      : 'hover:border-placeholder shadow-sm hover:shadow-card hover:-translate-y-0.5'
                  }`}
                >
                  <div>
                    {/* Top Row: Food Type & Optional In-Order Badge */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            item.foodType === 'VEG'
                              ? 'bg-emerald-500'
                              : item.foodType === 'NON_VEG'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span className="text-[10px] uppercase font-bold text-muted truncate">
                          {item.foodType || 'VEG'}
                        </span>
                      </div>

                      {inCart && (
                        <span className="text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-primary text-white shadow-button shrink-0 whitespace-nowrap">
                          {inCart.quantity} in order
                        </span>
                      )}
                    </div>

                    {/* Middle: Dish Name Centered */}
                    <div className="my-2 sm:my-3 text-center px-0.5">
                      <div className="text-sm sm:text-base md:text-lg font-bold text-heading capitalize line-clamp-2 sm:line-clamp-1 group-hover:text-primary transition-colors leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted truncate mt-0.5 font-medium">
                        {categoryName || 'Food Item'}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Divider with Price & Add Button */}
                  <div className="pt-2 sm:pt-2.5 border-t border-borderLight flex items-center justify-between gap-1.5 mt-auto">
                    <span className="font-extrabold text-xs sm:text-sm md:text-base text-heading whitespace-nowrap">
                      {profile.currencySymbol}{(item.basePrice / 100).toFixed(2)}
                    </span>
                    <span className="shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-primary text-white text-[11px] sm:text-xs font-bold shadow-button flex items-center justify-center whitespace-nowrap leading-none transition-transform active:scale-95">
                      + Add
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-surfaceMuted flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-muted" />
            </div>
            <h4 className="font-semibold text-heading text-sm mb-1">No Menu Items Found</h4>
            <p className="text-xs text-muted max-w-xs mb-4">
              Add your dishes to the menu or import your menu to start taking orders.
            </p>
            <a href="/menu" className="btn-primary text-xs py-2 px-4">
              Configure Menu Items
            </a>
          </div>
        )}

        {/* MOBILE STICKY BOTTOM CART BAR */}
        {cartItems.length > 0 && (
          <div className="lg:hidden p-3 bg-surface border-t border-border flex items-center justify-between shadow-lg z-20 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center relative shrink-0">
                <Receipt className="w-4 h-4 text-primary" />
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted block leading-none">Order Total</span>
                <span className="font-extrabold text-sm text-heading whitespace-nowrap">
                  {profile.currencySymbol} {(cartGrandTotal / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileCartOpen(true)}
              className="btn-primary text-xs py-2 px-4 shadow-button flex items-center space-x-1.5 shrink-0"
            >
              <span>View Order ({totalCartCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR: CURRENT ORDER & BILLING PANEL (Slide-over on mobile, permanent on desktop) */}
      <div
        className={`
          flex flex-col bg-surface border-l border-border h-full transition-all duration-200
          ${
            mobileCartOpen
              ? 'fixed inset-0 z-50 flex w-full'
              : 'hidden lg:flex lg:w-80 xl:w-96 shrink-0'
          }
        `}
      >
        {/* Cart Header */}
        <div className="p-3.5 sm:p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setMobileCartOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-secondary hover:bg-surfaceMuted mr-1"
              title="Back to Catalog"
            >
              <ArrowLeft className="w-5 h-5 text-heading" />
            </button>
            <div>
              <h3 className="font-semibold text-sm sm:text-[15px] text-heading flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-primary" />
                <span>Current Order</span>
              </h3>
              <span className="text-[11px] sm:text-xs text-muted">
                {isDineIn ? selectedTable?.tableName : 'Walk-in Counter'} • {session.fullName}
              </span>
            </div>
          </div>
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-danger hover:underline font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surfaceMuted border border-borderLight flex items-center justify-center mb-3">
                <Receipt className="w-6 h-6 stroke-[1.8]" />
              </div>
              <p className="text-sm font-semibold text-heading">Cart is empty</p>
              <p className="text-xs text-muted mt-1">Tap items on the left to add to order</p>
            </div>
          ) : (
            cartItems.map((ci) => (
              <div
                key={ci.id}
                className="p-3 rounded-xl bg-surfaceMuted border border-borderLight flex items-center justify-between space-x-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-heading truncate">{ci.itemName}</div>
                  <div className="text-[11px] text-muted">
                    {profile.currencySymbol} {(ci.unitPrice / 100).toFixed(2)} each
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-1.5 bg-surface border border-border rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(ci.menuItemId, -1)}
                    className="p-1 rounded text-secondary hover:bg-surfaceMuted"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-xs text-heading px-1">
                    {ci.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(ci.menuItemId, 1)}
                    className="p-1 rounded text-secondary hover:bg-surfaceMuted"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-xs text-heading">
                    {profile.currencySymbol} {(ci.subtotal / 100).toFixed(2)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(ci.menuItemId)}
                  className="p-1 text-placeholder hover:text-danger"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Totals & Checkout Panel */}
        <div className="p-4 border-t border-border bg-surface space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-secondary">
              <span>Subtotal:</span>
              <span className="font-medium">{profile.currencySymbol} {(cartSubtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-secondary">
              <span>GST / Taxes (5%):</span>
              <span className="font-medium">{profile.currencySymbol} {(cartTax / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-heading pt-2 border-t border-borderLight">
              <span>Grand Total:</span>
              <span className="text-base text-primary font-bold">
                {profile.currencySymbol} {(cartGrandTotal / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {enabledModules.includes('operations.kitchen_kds') && (
              <button
                type="button"
                onClick={handleSendKot}
                disabled={cartItems.length === 0}
                className="btn-secondary text-xs py-2.5 disabled:opacity-40"
              >
                <ChefHat className="w-4 h-4 text-primary" />
                <span>Send KOT</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setPaymentModalOpen(true)}
              disabled={cartItems.length === 0}
              className={`btn-primary text-xs py-2.5 disabled:opacity-40 ${
                !enabledModules.includes('operations.kitchen_kds') ? 'col-span-2' : ''
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Settle & Pay</span>
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT & SETTLEMENT MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[20px] bg-surface border border-border p-6 shadow-dropdown space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-borderLight">
              <div>
                <h3 className="font-semibold text-lg text-heading">Settle & Generate Bill</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Total Due: <strong className="text-heading text-sm font-bold">{profile.currencySymbol} {(cartGrandTotal / 100).toFixed(2)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 rounded-lg text-placeholder hover:text-heading"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Modes */}
            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'CASH', 'CARD'] as PaymentMethod[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSelectedPaymentMethod(mode)}
                  className={`p-3 rounded-xl border text-center font-semibold text-xs transition ${
                    selectedPaymentMethod === mode
                      ? 'bg-primary-light text-primary border-primary shadow-sm'
                      : 'bg-surface text-secondary border-border hover:bg-surfaceMuted'
                  }`}
                >
                  {mode === 'UPI' && <QrCode className="w-5 h-5 mx-auto mb-1 stroke-[1.8]" />}
                  {mode === 'CASH' && <Banknote className="w-5 h-5 mx-auto mb-1 stroke-[1.8]" />}
                  {mode === 'CARD' && <CreditCard className="w-5 h-5 mx-auto mb-1 stroke-[1.8]" />}
                  <span>{mode}</span>
                </button>
              ))}
            </div>

            {/* Cash Tendered Input */}
            {selectedPaymentMethod === 'CASH' && (
              <div className="p-3.5 rounded-xl bg-surfaceMuted border border-borderLight space-y-2">
                <label className="text-xs text-secondary font-medium">Cash Received:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    {profile.currencySymbol}
                  </span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="input-field pl-8"
                  />
                </div>
                {Number(cashTendered) * 100 >= cartGrandTotal && (
                  <div className="text-xs text-success font-medium">
                    Change to return: {profile.currencySymbol} {((Number(cashTendered) * 100 - cartGrandTotal) / 100).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {/* Settle Action */}
            <button
              type="button"
              onClick={handleCompletePayment}
              className="w-full btn-primary py-3"
            >
              <Printer className="w-4 h-4" />
              <span>Confirm Payment & Print Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
