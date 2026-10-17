'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/state';
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  QrCode,
  Tag,
  CheckCircle,
  Sliders,
  DollarSign,
  Image as ImageIcon,
  Edit,
  Trash2,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  Camera,
  CheckSquare,
  Square,
  X,
  Layers,
  UploadCloud,
} from 'lucide-react';

const MENU_TABS = [
  { id: 'overview', name: 'Menu Overview' },
  { id: 'categories', name: 'Categories' },
  { id: 'items', name: 'Menu Items' },
  { id: 'variants', name: 'Variants' },
  { id: 'modifiers', name: 'Modifiers' },
  { id: 'addons', name: 'Add-ons' },
  { id: 'pricing', name: 'Pricing' },
  { id: 'availability', name: 'Availability' },
  { id: 'images', name: 'Menu Images' },
  { id: 'ai_import', name: 'AI Menu Scan' },
  { id: 'qr', name: 'QR Menu' },
];

interface ApprovalItem {
  id: string;
  selected: boolean;
  name: string;
  category: string;
  price: number;
  foodType: 'VEG' | 'NON_VEG';
  description: string;
}

function MenuManagementContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { categories, setCategories, menuItems, setMenuItems, profile, session, currentTenant, refreshTenantData } = useApp();
  const [search, setSearch] = useState('');

  // Add Item State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('Main Course');
  const [basePrice, setBasePrice] = useState('');
  const [foodType, setFoodType] = useState('VEG');

  // AI OCR State (Camera, Upload, Text & Interactive Approval)
  const [rawMenuText, setRawMenuText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [approvalList, setApprovalList] = useState<ApprovalItem[]>([]);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const filteredItems = menuItems
    .filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const catA = categories.find((c) => c.id === a.categoryId);
      const catB = categories.find((c) => c.id === b.categoryId);
      const rankA = catA?.sortOrder ?? 999;
      const rankB = catB?.sortOrder ?? 999;
      if (rankA !== rankB) return rankA - rankB;
      if ((a.sortOrder || 0) !== (b.sortOrder || 0)) {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      return a.basePrice - b.basePrice;
    });

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    setImageMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage(result);
      setOcrError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunGeminiOCR = async () => {
    setIsExtracting(true);
    setOcrError(null);
    setExtractedData(null);
    setImportSuccess(null);
    setApprovalList([]);

    try {
      const payload: any = {};
      if (selectedImage) {
        payload.imageBase64 = selectedImage;
        payload.mimeType = imageMimeType;
      }
      if (rawMenuText.trim()) {
        payload.menuText = rawMenuText.trim();
      }

      if (!payload.imageBase64 && !payload.menuText) {
        throw new Error('Please snap a photo, upload an image, or paste menu text to scan.');
      }

      const res = await fetch('/api/ai/menu-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Gemini API Error');
      }

      setExtractedData(json.data);

      // Convert extracted categories & dishes into interactive approval list
      const items: ApprovalItem[] = [];
      if (json.data?.categories) {
        json.data.categories.forEach((cat: any, catIdx: number) => {
          (cat.items || []).forEach((dish: any, dishIdx: number) => {
            items.push({
              id: `ocr-${catIdx}-${dishIdx}-${Date.now()}`,
              selected: true,
              name: dish.name || 'Dish Item',
              category: cat.name || 'General',
              price: Number(dish.price) || 100,
              foodType: dish.foodType === 'NON_VEG' ? 'NON_VEG' : 'VEG',
              description: dish.description || '',
            });
          });
        });
      }

      if (items.length === 0) {
        throw new Error('Gemini could not detect items clearly. Please ensure the menu photo or text is legible.');
      }

      setApprovalList(items);
    } catch (err: any) {
      console.error(err);
      setOcrError(err.message || 'Failed to extract menu using Gemini AI.');
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleApprovalItem = (id: string) => {
    setApprovalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateApprovalItem = (id: string, field: keyof ApprovalItem, value: any) => {
    setApprovalList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const deleteApprovalItem = (id: string) => {
    setApprovalList((prev) => prev.filter((item) => item.id !== id));
  };

  const selectAllApprovalItems = (selected: boolean) => {
    setApprovalList((prev) => prev.map((item) => ({ ...item, selected })));
  };

  const handleApproveAndSave = async () => {
    const activeTenantId = profile?.tenantId || session?.tenantId || currentTenant?.id || '';
    const selectedItems = approvalList.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      setOcrError('Please select at least one dish to import.');
      return;
    }
    if (!activeTenantId) {
      setOcrError('Active restaurant tenant not resolved.');
      return;
    }

    setIsImporting(true);
    setOcrError(null);

    try {
      const res = await fetch('/api/tenant/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          items: selectedItems.map((it) => ({
            name: it.name,
            categoryName: it.category,
            price: it.price,
            foodType: it.foodType,
            description: it.description,
          })),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to save menu items to database.');
      }

      await refreshTenantData();
      setImportSuccess(`Successfully approved and added ${selectedItems.length} dishes to your menu!`);
      setApprovalList([]);
      setExtractedData(null);
      setSelectedImage(null);
      setImageFileName(null);
      setRawMenuText('');

      // Auto-switch to Menu Items tab so user can see all sections updated!
      setActiveTab('items');
    } catch (err: any) {
      console.error(err);
      setOcrError(err.message || 'Failed to import approved dishes.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !basePrice) return;
    const activeTenantId = profile.tenantId || session.tenantId || currentTenant?.id || '';

    let targetCat = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    let categoryId = targetCat?.id || `cat-${Date.now()}`;

    if (!targetCat) {
      targetCat = {
        id: categoryId,
        tenantId: activeTenantId,
        name: categoryName,
        sortOrder: categories.length + 1,
        isActive: true,
      };
      setCategories([...categories, targetCat]);
    }

    const newItem: any = {
      id: `item-${Date.now()}`,
      tenantId: activeTenantId,
      categoryId,
      name,
      basePrice: Math.round(Number(basePrice) * 100),
      taxRatePercent: 5,
      foodType,
      isAvailable: true,
    };

    setMenuItems([...menuItems, newItem]);

    try {
      const res = await fetch('/api/tenant/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          name,
          categoryName,
          basePrice,
          foodType,
        }),
      });
      if (res.ok) {
        refreshTenantData().catch(() => {});
      }
    } catch {}

    setName('');
    setBasePrice('');
    setIsAddOpen(false);
  };

  return (
    <div className="p-8 sm:p-10 max-w-[1400px] mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-borderLight">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold text-heading tracking-tight leading-tight">
            Menu Management
          </h1>
          <p className="text-[14px] text-secondary mt-1">
            Configure dishes, categories, variants, modifiers, pricing tiers, and QR menus
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('ai_import')}
            className="btn-secondary"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI Menu OCR (Gemini)</span>
          </button>
          <button onClick={() => setIsAddOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="text-[14px] text-secondary font-medium">Total Menu Items</div>
          <div className="text-[28px] font-semibold text-heading mt-2 leading-none">{menuItems.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-[14px] text-secondary font-medium">Active Categories</div>
          <div className="text-[28px] font-semibold text-heading mt-2 leading-none">{categories.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-[14px] text-secondary font-medium">Available Dishes</div>
          <div className="text-[28px] font-semibold text-success mt-2 leading-none">
            {menuItems.filter((i) => i.isAvailable).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-[14px] text-secondary font-medium">Database Status</div>
          <div className="text-[28px] font-semibold text-info mt-2 leading-none">Live Synced</div>
        </div>
      </div>

      {/* Children Sub-Tabs per Information Architecture */}
      <div className="flex items-center space-x-1.5 overflow-x-auto bg-surface border border-border p-1 rounded-xl">
        {MENU_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-light text-primary font-semibold'
                : 'text-secondary hover:text-main'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab 1: Menu Overview & Items */}
      {(activeTab === 'overview' || activeTab === 'items') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-placeholder absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search dish name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9 text-xs py-2"
              />
            </div>
            <span className="text-xs text-secondary">
              Showing {filteredItems.length} of {menuItems.length} dishes
            </span>
          </div>

          <div className="card p-0 overflow-hidden">
            {filteredItems.length > 0 ? (
              <table className="w-full text-left text-[14px]">
                <thead className="bg-surfaceMuted text-muted text-xs font-semibold uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5">Dish Name</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Price</th>
                    <th className="px-6 py-3.5">Tax (GST)</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderLight">
                  {filteredItems.map((item) => {
                    const cat = categories.find((c) => c.id === item.categoryId);
                    return (
                      <tr key={item.id} className="hover:bg-surfaceMuted/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-heading">{item.name}</div>
                        </td>
                        <td className="px-6 py-4 text-secondary">{cat?.name || 'Main Course'}</td>
                        <td className="px-6 py-4 font-semibold text-heading">
                          ₹{(item.basePrice / 100).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-secondary">{item.taxRatePercent}%</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                              item.foodType === 'NON_VEG'
                                ? 'bg-rose-100 text-rose-800'
                                : item.foodType === 'VEG'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.foodType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.isAvailable
                                ? 'bg-success-bg text-success'
                                : 'bg-danger-bg text-danger'
                            }`}
                          >
                            {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button className="p-1.5 rounded-lg text-placeholder hover:text-danger transition" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-placeholder mx-auto" />
                <p className="text-sm text-secondary">No dishes or menu items added to this restaurant catalog yet.</p>
                <button onClick={() => setIsAddOpen(true)} className="btn-primary text-xs py-1.5 px-4 inline-flex items-center space-x-1">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Dish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...categories]
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((c) => (
            <div key={c.id} className="card p-5 space-y-2 border-border hover:border-primary/40 transition">
              <div className="flex items-center justify-between">
                <Tag className="w-5 h-5 text-primary" />
                <span className="text-xs text-muted font-medium">Order: {c.sortOrder}</span>
              </div>
              <h3 className="font-semibold text-base text-heading">{c.name}</h3>
              <p className="text-xs text-secondary">
                {menuItems.filter((i) => i.categoryId === c.id).length} linked dishes
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 8: AI Menu Scan & OCR (Gemini AI Powered) */}
      {activeTab === 'ai_import' && (
        <div className="card space-y-6 max-w-4xl mx-auto p-6 sm:p-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-7 h-7 stroke-[2]" />
            </div>
            <h3 className="font-bold text-xl sm:text-2xl text-heading">
              Google Gemini AI Menu Card Scanner
            </h3>
            <p className="text-xs sm:text-sm text-secondary max-w-lg mx-auto">
              Snap a photo with your mobile camera or upload a menu image. Gemini AI automatically parses all dishes, categories, prices, and dietary tags into an approval table.
            </p>
          </div>

          {/* Success Banner */}
          {importSuccess && (
            <div className="p-3.5 bg-success-bg text-success border border-emerald-300 rounded-xl text-xs flex items-center space-x-2 font-medium animate-in fade-in">
              <Check className="w-4 h-4 stroke-[3] flex-shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {ocrError && (
            <div className="p-3.5 bg-danger-bg text-danger border border-rose-300 rounded-xl text-xs flex items-center space-x-2 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{ocrError}</span>
            </div>
          )}

          {/* Capture / Upload Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Camera Button for Mobile/Desktop */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-4 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary-soft/30 hover:bg-primary-soft/50 transition flex flex-col items-center justify-center space-y-2 text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-sm text-heading block">
                  Take Photo with Camera
                </span>
                <span className="text-xs text-secondary">
                  Tap to capture paper menu card directly
                </span>
              </div>
            </button>

            {/* Gallery / File Upload Button */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/60 bg-surfaceMuted/40 hover:bg-surfaceMuted transition flex flex-col items-center justify-center space-y-2 text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-surface border border-border text-secondary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-sm text-heading block">
                  Upload Menu Image
                </span>
                <span className="text-xs text-secondary">
                  Select JPG, PNG, or photo from gallery
                </span>
              </div>
            </button>

            {/* Hidden Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageFile}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFile}
            />
          </div>

          {/* Selected Image Preview (if present) */}
          {selectedImage && (
            <div className="p-4 bg-surfaceMuted rounded-xl border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-xs text-heading">
                    {imageFileName || 'Captured Menu Photo'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImageFileName(null);
                    }}
                    className="text-xs text-danger hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="relative max-h-56 overflow-hidden rounded-lg border border-borderLight flex items-center justify-center bg-black/5">
                <img
                  src={selectedImage}
                  alt="Menu Card Preview"
                  className="max-h-56 w-auto object-contain rounded"
                />
              </div>
            </div>
          )}

          {/* Alternative: Raw Text Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-secondary">
                Or paste printed menu text / OCR transcript:
              </label>
              <button
                type="button"
                onClick={() =>
                  setRawMenuText(`STARTERS:
Paneer Tikka - ₹280 [VEG]
Chicken Malai Tikka - ₹340 [NON-VEG]

MAINS:
Hyderabadi Chicken Dum Biryani - ₹320 [NON-VEG]
Butter Garlic Naan - ₹75 [VEG]
Dal Makhani - ₹220 [VEG]

DESSERTS:
Gulab Jamun with Rabdi - ₹140 [VEG]`)
                }
                className="text-primary hover:underline font-semibold"
              >
                Load Sample Menu
              </button>
            </div>

            <textarea
              rows={4}
              value={rawMenuText}
              onChange={(e) => setRawMenuText(e.target.value)}
              placeholder="Paste dish names, prices, and categories if you don't have a photo..."
              className="input-field font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Trigger Scan Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-borderLight">
            <span className="text-[11px] text-muted flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Multimodal Vision: Google Gemini 3.5 Flash & Lite (Active)</span>
            </span>

            <button
              type="button"
              disabled={isExtracting || (!selectedImage && !rawMenuText.trim())}
              onClick={handleRunGeminiOCR}
              className="btn-primary text-xs py-2.5 px-6 flex items-center justify-center space-x-2"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning &amp; Detecting Items with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Scan &amp; Detect Menu Items</span>
                </>
              )}
            </button>
          </div>

          {/* INTERACTIVE APPROVAL & REVIEW TABLE */}
          {approvalList.length > 0 && (
            <div className="pt-6 border-t-2 border-primary/20 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-primary-soft/40 p-3.5 rounded-xl border border-primary/20">
                <div>
                  <h4 className="font-bold text-sm text-heading flex items-center space-x-2">
                    <span>Menu Review &amp; Approval Table</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary text-white">
                      {approvalList.filter((i) => i.selected).length} / {approvalList.length} Selected
                    </span>
                  </h4>
                  <p className="text-xs text-secondary mt-0.5">
                    Review and edit dish names, categories, and prices detected by Gemini before approving.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => selectAllApprovalItems(true)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-border">•</span>
                  <button
                    type="button"
                    onClick={() => selectAllApprovalItems(false)}
                    className="text-xs text-secondary font-semibold hover:underline"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    disabled={isImporting || approvalList.filter((i) => i.selected).length === 0}
                    onClick={handleApproveAndSave}
                    className="btn-primary text-xs py-2 px-4 flex items-center space-x-1.5 shadow-md ml-2"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve &amp; Add ({approvalList.filter((i) => i.selected).length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Items Table / Cards */}
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surfaceMuted text-muted uppercase font-semibold border-b border-border text-[11px]">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={approvalList.length > 0 && approvalList.every((i) => i.selected)}
                          onChange={(e) => selectAllApprovalItems(e.target.checked)}
                          className="rounded border-border text-primary cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Dish / Item Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 w-28">Price (₹)</th>
                      <th className="p-3 w-28">Dietary</th>
                      <th className="p-3 text-right w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderLight bg-surface">
                    {approvalList.map((item) => (
                      <tr
                        key={item.id}
                        className={`transition ${item.selected ? 'hover:bg-primary-soft/10' : 'opacity-50 bg-surfaceMuted/30'}`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleApprovalItem(item.id)}
                            className="rounded border-border text-primary cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateApprovalItem(item.id, 'name', e.target.value)}
                            className="w-full bg-transparent font-semibold text-heading border-b border-transparent focus:border-primary focus:bg-white focus:outline-hidden px-1 py-0.5 rounded text-xs"
                          />
                          {item.description && (
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateApprovalItem(item.id, 'description', e.target.value)}
                              placeholder="Description"
                              className="w-full bg-transparent text-[11px] text-muted border-b border-transparent focus:border-primary focus:bg-white focus:outline-hidden px-1 rounded mt-0.5"
                            />
                          )}
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => updateApprovalItem(item.id, 'category', e.target.value)}
                            className="w-full bg-transparent font-medium text-secondary border-b border-transparent focus:border-primary focus:bg-white focus:outline-hidden px-1 py-0.5 rounded text-xs"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <span className="text-secondary font-semibold">₹</span>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateApprovalItem(item.id, 'price', Number(e.target.value))}
                              className="w-20 bg-transparent font-bold text-heading border-b border-transparent focus:border-primary focus:bg-white focus:outline-hidden px-1 py-0.5 rounded text-xs font-mono"
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() =>
                              updateApprovalItem(item.id, 'foodType', item.foodType === 'VEG' ? 'NON_VEG' : 'VEG')
                            }
                            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                              item.foodType === 'NON_VEG'
                                ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            {item.foodType}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => deleteApprovalItem(item.id)}
                            className="p-1 text-placeholder hover:text-danger rounded-lg transition"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Sticky / Responsive Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isImporting || approvalList.filter((i) => i.selected).length === 0}
                  onClick={handleApproveAndSave}
                  className="btn-primary w-full sm:w-auto text-sm py-3 px-8 flex items-center justify-center space-x-2 shadow-lg"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Items to Menu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>
                        Approve &amp; Save {approvalList.filter((i) => i.selected).length} Dishes to Menu Catalog
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 9: QR Menu */}
      {activeTab === 'qr' && (
        <div className="card space-y-4 text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-surfaceMuted border border-border flex items-center justify-center mx-auto text-primary">
            <QrCode className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h3 className="font-semibold text-lg text-heading">Contactless Digital QR Menu</h3>
          <p className="text-xs text-secondary max-w-sm mx-auto">
            Customers can scan the table QR code to browse this menu in their mobile browser.
          </p>
          <div className="pt-2">
            <button className="btn-primary">
              <QrCode className="w-4 h-4" />
              <span>Download Printable Table QRs</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Dish Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-borderLight">
              <h3 className="font-semibold text-heading text-lg">Add New Dish / Menu Item</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-secondary hover:text-heading p-1 rounded-lg hover:bg-surfaceMuted transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Item / Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Butter Chicken, Paneer Tikka"
                  className="input-field text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Starters, Main Course"
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="e.g. 250"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Dietary Food Type
                </label>
                <select
                  value={foodType}
                  onChange={(e) => setFoodType(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="VEG">Vegetarian (VEG)</option>
                  <option value="NON_VEG">Non-Vegetarian (NON_VEG)</option>
                  <option value="EGG">Contains Egg (EGG)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-borderLight flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Save Dish to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuManagementSectionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-400">Loading menu management...</div>}>
      <MenuManagementContent />
    </Suspense>
  );
}
