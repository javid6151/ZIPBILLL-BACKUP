'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/state';
import {
  Store,
  ChefHat,
  Utensils,
  Calculator,
  LayoutGrid,
  ClipboardList,
  Coffee,
  Users,
  Package,
  BarChart3,
  Camera,
  Printer,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Receipt,
  CreditCard,
  QrCode,
  ShieldCheck,
  TrendingDown,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  FileCheck,
  Check,
  Loader2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { BusinessType, ModuleToken } from '@platform/types';

const ALL_MODULE_TOKENS = [
  'POS',
  'TABLES',
  'ORDERS',
  'KITCHEN',
  'MENU',
  'BILLING',
  'PAYMENTS',
  'INVENTORY',
  'CUSTOMERS',
  'STAFF',
  'EXPENSES',
  'REPORTS',
  'QR',
  'PRINTERS',
  'AI_MENU_IMPORT',
];

// Map registration requested module tokens to wizard platform module tokens
function mapRequestedModulesToWizard(requested: string[]): string[] {
  if (!requested || requested.length === 0) {
    return ALL_MODULE_TOKENS;
  }

  const set = new Set<string>();
  for (const m of requested) {
    const lower = m.toLowerCase();
    if (lower.includes('pos')) set.add('POS');
    if (lower.includes('table')) set.add('TABLES');
    if (lower.includes('kitchen') || lower.includes('kds')) set.add('KITCHEN');
    if (lower.includes('modifier') || lower.includes('menu') || lower.includes('catalog')) set.add('MENU');
    if (lower.includes('bill') || lower.includes('receipt')) {
      set.add('BILLING');
      set.add('PRINTERS');
    }
    if (lower.includes('payment') || lower.includes('upi') || lower.includes('qr')) {
      set.add('PAYMENTS');
      set.add('QR');
    }
    if (lower.includes('staff')) set.add('STAFF');
    if (lower.includes('inventory') || lower.includes('raw_materials')) set.add('INVENTORY');
    if (lower.includes('report') || lower.includes('analytic')) set.add('REPORTS');
  }

  return Array.from(set);
}

function OnboardingWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, setProfile, setBusinessType, setEnabledModules, enabledModules, toggleModule, currentTenant, refreshTenantData } = useApp();

  const [step, setStep] = useState<number>(1);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Authentication & Approval Verification State
  const [authVerified, setAuthVerified] = useState<boolean>(false);
  const [approvalStatus, setApprovalStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_FOUND' | null>(null);
  const [isOnboardingDone, setIsOnboardingDone] = useState<boolean>(false);
  const [tenantId, setTenantId] = useState<string>('');
  const [tenantSlug, setTenantSlug] = useState<string>('');
  const [applicantOwnerName, setApplicantOwnerName] = useState<string>('');
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string>('');

  // STEP 01: Business Type (No default selection - user must explicitly select one)
  const [bType, setBType] = useState<BusinessType | ''>('');

  // STEP 02: Restaurant Information (Empty defaults - user fills them in Step 02)
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [country, setCountry] = useState<string>('India');
  const [currency, setCurrency] = useState<string>('INR');
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');

  // STEP 03: Restaurant Logo (Supabase Storage)
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // STEP 04: Restaurant Services (Empty defaults - user selects from channels)
  const [services, setServices] = useState<string[]>([]);

  // STEP 05: Module Selection (No defaults - user manually chooses)
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // STEP 06: Table Configuration (No defaults - user chooses)
  const [usesTables, setUsesTables] = useState<boolean | null>(null);
  const [tableCount, setTableCount] = useState<number | ''>('');
  const [tableSections, setTableSections] = useState<string[]>([]);
  const [newSectionName, setNewSectionName] = useState<string>('');

  // STEP 07: Staff Configuration (Clean empty defaults, NO fake employees)
  const [hasEmployees, setHasEmployees] = useState<boolean>(false);
  const [staffList, setStaffList] = useState<Array<{ name: string; role: string; phone: string }>>([]);
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffRole, setNewStaffRole] = useState<string>('WAITER');

  // STEP 08: Menu Configuration (Clean empty defaults, NO hardcoded fake dishes)
  const [menuMode, setMenuMode] = useState<'MANUAL' | 'AI'>('AI');
  const [aiMenuRawText, setAiMenuRawText] = useState<string>('');
  const [menuImageFile, setMenuImageFile] = useState<File | null>(null);
  const [menuImageBase64, setMenuImageBase64] = useState<string>('');
  const [menuImageMime, setMenuImageMime] = useState<string>('image/jpeg');
  const [menuImagePreview, setMenuImagePreview] = useState<string>('');
  const [aiParsing, setAiParsing] = useState<boolean>(false);
  const [aiParsedCategories, setAiParsedCategories] = useState<any[]>([]);

  // STEP 09: Billing Configuration (No defaults - filled by user)
  const [taxRate, setTaxRate] = useState<number | ''>('');
  const [serviceCharge, setServiceCharge] = useState<number | ''>('');
  const [roundOff, setRoundOff] = useState<boolean>(false);
  const [invoicePrefix, setInvoicePrefix] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([
    'Cash',
    'UPI (PhonePe, GPay, Paytm)',
    'Credit/Debit Card',
    'Food Vouchers',
  ]);

  // STEP 10: Printer Configuration (No defaults - selected by user)
  const [printerType, setPrinterType] = useState<string>('');
  const [kotPrinter, setKotPrinter] = useState<boolean>(true);
  const [networkIp, setNetworkIp] = useState<string>('192.168.1.100');

  // Client mount lifecycle
  useEffect(() => {
    setMounted(true);
  }, []);

  // Authentication & Approved Tenant Verification on Mount
  useEffect(() => {
    async function loadTenantData() {
      setLoadingInitial(true);

      const qTenant = searchParams?.get('tenantId') || '';
      const qEmail = searchParams?.get('email') || '';

      // Check stored user session from login
      let storedSession: any = null;
      try {
        const raw = localStorage.getItem('saas_active_session');
        if (raw) storedSession = JSON.parse(raw);
      } catch {}

      // Check stored tenant
      let storedTenant: any = null;
      try {
        const raw = localStorage.getItem('saas_active_tenant');
        if (raw) storedTenant = JSON.parse(raw);
      } catch {}

      // Check pending registration
      let storedPending: any = null;
      try {
        const raw = localStorage.getItem('saas_pending_registration');
        if (raw) storedPending = JSON.parse(raw);
      } catch {}

      // Check stored profile
      let storedProfile: any = null;
      try {
        const raw = localStorage.getItem('saas_active_profile');
        if (raw) storedProfile = JSON.parse(raw);
      } catch {}

      const resolvedTenantId =
        qTenant ||
        storedSession?.tenantId ||
        storedTenant?.id ||
        storedPending?.tenantId ||
        storedProfile?.tenantId ||
        profile?.tenantId ||
        '';

      const resolvedEmail =
        qEmail ||
        storedSession?.email ||
        storedPending?.email ||
        storedProfile?.email ||
        profile?.email ||
        '';

      if (!resolvedTenantId && !resolvedEmail) {
        // No authenticated session found
        setAuthVerified(false);
        setApprovalStatus('NOT_FOUND');
        setLoadingInitial(false);
        return;
      }

      setTenantId(resolvedTenantId);
      setAuthenticatedEmail(resolvedEmail);

      try {
        const query = resolvedTenantId
          ? `tenantId=${encodeURIComponent(resolvedTenantId)}`
          : `email=${encodeURIComponent(resolvedEmail)}`;

        const res = await fetch(`/api/tenant/status?${query}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setApprovalStatus(data.status);
          setAuthVerified(true);
          if (data.onboardingCompleted !== undefined) {
            setIsOnboardingDone(Boolean(data.onboardingCompleted));
          }

          if (data.tenantId) setTenantId(data.tenantId);
          if (data.slug) setTenantSlug(data.slug);

          // Do not auto-fill restaurant profile or modules - user explicitly selects in Step 05
          if (data.applicantName) setApplicantOwnerName(data.applicantName);
        } else if (resolvedTenantId || storedPending || storedTenant) {
          setApprovalStatus('PENDING');
          setAuthVerified(true);
          if (storedPending?.restaurantName) setName(storedPending.restaurantName);
          else if (storedTenant?.name) setName(storedTenant.name);
          if (storedPending?.email) setEmail(storedPending.email);
          if (storedPending?.businessType) setBType(storedPending.businessType);
          else if (storedTenant?.businessType) setBType(storedTenant.businessType);
          if (storedPending?.tableCount) setTableCount(Number(storedPending.tableCount));
        } else {
          setApprovalStatus('NOT_FOUND');
        }
      } catch (err) {
        console.error('Error verifying approved tenant status:', err);
        if (resolvedTenantId || storedPending || storedTenant) {
          setApprovalStatus('PENDING');
          setAuthVerified(true);
          if (storedPending?.restaurantName) setName(storedPending.restaurantName);
          else if (storedTenant?.name) setName(storedTenant.name);
          if (storedPending?.email) setEmail(storedPending.email);
        } else {
          setApprovalStatus('NOT_FOUND');
        }
      } finally {
        setLoadingInitial(false);
      }
    }

    loadTenantData();
  }, [searchParams]);

  // Once approved by admin, the setup wizard should NEVER be accessible - route directly to dashboard
  useEffect(() => {
    if (approvalStatus === 'APPROVED' && !loadingInitial) {
      router.replace('/dashboard');
    }
  }, [approvalStatus, loadingInitial, router]);

  // Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit.');
      return;
    }

    setUploadError(null);
    setUploadingLogo(true);
    setLogoFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'logos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setLogoUrl(data.publicUrl);
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setUploadError(err.message || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  };


  const handleMenuFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMenuImageFile(file);
    setMenuImageMime(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setMenuImageBase64(b64);
      setMenuImagePreview(b64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMenuFile = () => {
    setMenuImageFile(null);
    setMenuImageBase64('');
    setMenuImagePreview('');
  };

  const handleRunAiMenu = async () => {
    if (!aiMenuRawText.trim() && !menuImageBase64) return;
    setAiParsing(true);
    try {
      const res = await fetch('/api/ai/menu-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: aiMenuRawText,
          imageBase64: menuImageBase64 || undefined,
          mimeType: menuImageMime || 'image/jpeg',
        }),
      });
      const data = await res.json();
      if (res.ok && data.categories && data.categories.length > 0) {
        const formatted = data.categories.map((c: any) => ({
          category: c.name || c.category || 'Specialties',
          items: (c.items || []).map((it: any) => ({
            name: it.name,
            price: it.price || 150,
            isVeg: it.foodType === 'VEG' || it.isVeg === true,
            foodType: it.foodType || 'VEG',
            description: it.description || '',
          })),
        }));
        setAiParsedCategories(formatted);
      }
    } catch (err) {
      console.error('AI OCR error:', err);
    } finally {
      setAiParsing(false);
    }
  };

  const toggleService = (s: string) => {
    setServices((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const toggleModuleSelection = (token: string) => {
    setSelectedModules((prev) =>
      prev.includes(token) ? prev.filter((item) => item !== token) : [...prev, token]
    );
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    setTableSections([...tableSections, newSectionName.trim()]);
    setNewSectionName('');
  };

  const handleAddStaff = () => {
    if (!newStaffName.trim()) return;
    setStaffList([
      ...staffList,
      {
        name: newStaffName.trim(),
        role: newStaffRole,
        phone: '',
      },
    ]);
    setNewStaffName('');
  };

  // STEP 11: Final Review & Save to Database
  const handleFinalSubmit = async () => {
    if (!bType) {
      alert('Please select your business model in Step 1 before submitting.');
      setStep(1);
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const targetTenant = tenantId || profile.tenantId;
      const payload = {
        tenantId: targetTenant,
        businessType: bType,
        businessName: name,
        phone,
        email,
        address,
        city,
        state,
        country,
        currency,
        timezone,
        logoUrl,
        services,
        modules: selectedModules,
        hasTables: usesTables === true,
        tableCount: usesTables === true && typeof tableCount === 'number' ? tableCount : 0,
        tableSections: usesTables === true ? tableSections : [],
        hasEmployees,
        employees: hasEmployees ? staffList : [],
        billingConfig: {
          taxRate: typeof taxRate === 'number' ? taxRate : 0,
          serviceCharge: typeof serviceCharge === 'number' ? serviceCharge : 0,
          roundOff,
          invoicePrefix: invoicePrefix.trim() || 'INV-',
          paymentMethods,
        },
        printerConfig: {
          printerType: printerType || 'SKIP',
          kotPrinter,
          networkIp,
        },
        initialMenu: menuMode === 'AI' ? aiParsedCategories : [],
      };

      const res = await fetch('/api/tenant/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        // Keep the server diagnostic available while the request is being
        // tested.  The generic message alone made database failures appear as
        // a login/redirect problem.
        throw new Error(data.details || data.error || 'Failed to save onboarding configuration.');
      }

      // Update local state and storage
      if (bType) setBusinessType(bType as BusinessType);
      setEnabledModules(selectedModules as any);
      const updatedProfile = {
        ...profile,
        tenantId: targetTenant,
        businessName: name,
        phone,
        email,
        address,
        city,
        country,
        currencyCode: currency,
        currencySymbol: currency === 'USD' ? '$' : '₹',
        timezone,
        logoUrl,
        onboardingCompleted: true,
      };

      setProfile(updatedProfile);

      if (typeof window !== 'undefined') {
        localStorage.setItem('saas_active_profile', JSON.stringify(updatedProfile));
        localStorage.setItem('saas_active_tenant', JSON.stringify({
          id: targetTenant,
          name,
          slug: data.slug || tenantSlug || 'restaurant',
          businessType: bType,
        }));
        localStorage.setItem('saas_active_modules', JSON.stringify(selectedModules));
        localStorage.setItem('saas_pending_registration', JSON.stringify({
          tenantId: targetTenant,
          email,
          restaurantName: name,
          city,
          tableCountEst: usesTables === true && typeof tableCount === 'number' ? tableCount : 0,
          requestedModules: selectedModules,
          submittedAt: new Date().toISOString(),
          wizardSubmitted: true,
          onboardingCompleted: true,
        }));
      }

      // Refresh application tenant data
      try {
        await refreshTenantData();
      } catch (e) {
        console.warn('Silent refresh after onboarding:', e);
      }

      // Route to pending-approval screen to await Super Admin approval
      const targetRedirect = data.redirect || `/pending-approval?tenantId=${targetTenant}&email=${encodeURIComponent(email || authenticatedEmail)}`;
      if (typeof window !== 'undefined') {
        window.location.href = targetRedirect;
      } else {
        router.push(targetRedirect);
      }
    } catch (err: any) {
      console.error('Onboarding final submit error:', err);
      const msg = err.message || 'Failed to save configuration to database.';
      setSubmitError(msg);
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Protected View 1: Initial Loading or Hydrating
  if (!mounted || loadingInitial) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#EA580C]" />
        <p className="text-xs font-semibold text-[#78716C]">
          Verifying account approval & loading restaurant details...
        </p>
      </div>
    );
  }

  // Protected View 2: Unauthenticated / Not Found
  if (!authVerified || approvalStatus === 'NOT_FOUND') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E8E6E4] shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#1C1917]">Protected Setup Wizard</h2>
          <p className="text-xs text-[#78716C] leading-relaxed">
            Please sign in with your approved restaurant email and password to access the setup wizard.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="w-full py-3 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="text-xs text-[#78716C] hover:text-[#1C1917] hover:underline py-1"
            >
              Sign In with Another Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Protected View 3: If already APPROVED by Admin, the wizard is completed and closed
  if (approvalStatus === 'APPROVED') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E8E6E4] shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#1C1917]">Workspace Already Activated</h2>
          <p className="text-xs text-[#78716C] leading-relaxed">
            Your restaurant setup for <strong className="text-[#1C1917]">{name || 'Your Restaurant'}</strong> has already been approved and activated. The setup wizard is completed.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="w-full py-3 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Protected View 4: Awaiting Admin Approval ONLY if the wizard was already submitted
  if (approvalStatus === 'PENDING' && isOnboardingDone) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E8E6E4] shadow-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#1C1917]">Application Under Review</h2>
          <p className="text-xs text-[#78716C] leading-relaxed">
            Your registration for <strong className="text-[#1C1917]">{name || 'Your Restaurant'}</strong> is currently pending review by our platform administration team.
          </p>
          <div className="pt-2 space-y-2">
            <Link
              href={`/pending-approval?tenantId=${tenantId}&email=${encodeURIComponent(email || authenticatedEmail)}`}
              className="w-full py-3 px-4 rounded-xl bg-[#1C1917] hover:bg-black text-white font-bold text-xs flex items-center justify-center space-x-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>View Approval Status</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C1917] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#EA580C]/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        {/* Onboarding Setup Wizard Banner */}
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200/80 rounded-2xl text-xs flex items-center justify-between text-[#C2410C]">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#EA580C] shrink-0" />
            <span>
              <strong>Setup Wizard:</strong> Configure your business model, feature preferences, and tables to activate your restaurant workspace.
            </span>
          </div>
          <span className="font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#C2410C] text-[10px] uppercase tracking-wider">
            Step {step} of 9
          </span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center shadow-md">
              <Store className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1C1917] tracking-tight">
                Restaurant Setup Wizard
              </h1>
              <p className="text-xs text-[#78716C] font-medium mt-0.5">
                Step {step} of 9: Onboarding Configuration
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-orange-100/80 text-[#C2410C] border border-orange-200/90 rounded-full">
            {Math.round((step / 9) * 100)}% Completed
          </span>
        </div>

        {/* Orange Progress Bar */}
        <div className="w-full bg-[#E7E5E4] h-1.5 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-[#EA580C] transition-all duration-300 rounded-full"
            style={{ width: `${(step / 9) * 100}%` }}
          />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="bg-white rounded-3xl border border-[#E8E6E4] shadow-sm p-6 sm:p-8 space-y-6">

          {/* STEP 01: Business Model */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-[#F5F5F4] pb-4">
                <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider block">
                  STEP 01
                </span>
                <h2 className="text-xl font-extrabold text-[#1C1917] mt-1 tracking-tight">
                  Select Your Business Model
                </h2>
                <p className="text-xs sm:text-sm text-[#78716C] mt-1 leading-relaxed">
                  The ZipPOS platform dynamically tailors UI, POS layout, order routing, and reports to your business model.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[
                  { type: 'RESTAURANT', name: 'Fine / Casual Dine-In', icon: Utensils, desc: 'Table service, KOTs, split checks' },
                  { type: 'CAFE', name: 'Cafe & Bistro', icon: Coffee, desc: 'Barista stations, pastry counter' },
                  { type: 'BAKERY', name: 'Bakery & Patisserie', icon: Store, desc: 'Weight/item billing, pre-orders' },
                  { type: 'FAST_FOOD', name: 'Fast Food / QSR', icon: Calculator, desc: 'High-speed billing, order tokens' },
                  { type: 'CLOUD_KITCHEN', name: 'Cloud Kitchen', icon: ChefHat, desc: 'Zomato/Swiggy dispatch, delivery' },
                  { type: 'FOOD_COURT', name: 'Food Court Outlet', icon: Building, desc: 'Rapid counter tokens & buzzer' },
                  { type: 'BAR', name: 'Bar & Lounge', icon: Sparkles, desc: 'Open tabs, drink inventory, lounge' },
                  { type: 'CUSTOM', name: 'Other Food Venture', icon: LayoutGrid, desc: 'Fully configurable workflows' },
                ].map((item) => {
                  const isSelected = bType === item.type;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      id={`biz-model-${item.type.toLowerCase()}`}
                      type="button"
                      onClick={() => {
                        const newType = item.type as BusinessType;
                        setBType(newType);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#EA580C] bg-[#FFF8F5] ring-2 ring-[#EA580C]/20 shadow-sm'
                          : 'border-[#E8E6E4] hover:border-[#D6D3D1] hover:bg-[#FAFAF9]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 border ${
                        isSelected 
                          ? 'bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/20' 
                          : 'bg-[#F5F5F4] text-[#78716C] border-[#E8E6E4]'
                      }`}>
                        <Icon className="w-4 h-4 stroke-[2]" />
                      </div>
                      <span className="text-xs font-bold text-[#1C1917] block">{item.name}</span>
                      <span className="text-[11px] text-[#78716C] mt-1 block leading-relaxed">{item.desc}</span>
                    </button>
                  );
                })}
              </div>

              {!bType && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-800 text-xs flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">
                    Please select a business model above to enable the Continue button.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 02: Restaurant Profile & Location (Filled by User) */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="border-b border-[#F5F5F4] pb-4">
                <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider block">
                  STEP 02
                </span>
                <h2 className="text-xl font-extrabold text-[#1C1917] mt-1 tracking-tight">
                  Restaurant Profile & Location
                </h2>
                <p className="text-xs sm:text-sm text-[#78716C] mt-1 leading-relaxed">
                  Enter your official restaurant contact details and physical address.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#1C1917] block mb-1">
                    Restaurant Legal / Trade Name <span className="text-[#EA580C]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-semibold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C]"
                    placeholder="Enter restaurant legal or trade name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C1917] block mb-1">
                    Official Contact Phone <span className="text-[#EA580C]">*</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-semibold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C]"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C1917] block mb-1">
                    Manager / Billing Email <span className="text-[#EA580C]">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-semibold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C]"
                    placeholder="e.g. manager@restaurant.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-[#1C1917] block mb-1">
                    Street Address / Locality <span className="text-[#EA580C]">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-semibold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C]"
                    placeholder="Enter street address, building, or area"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C1917] block mb-1">
                    City <span className="text-[#EA580C]">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-semibold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C]"
                    placeholder="City (e.g. Bengaluru)"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C1917] block mb-1">
                    State / Province <span className="text-[#EA580C]">*</span>
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-semibold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C]"
                    placeholder="State (e.g. Karnataka)"
                  />
                </div>
              </div>

              {(!name.trim() || !phone.trim() || !email.trim() || !address.trim() || !city.trim() || !state.trim()) && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-800 text-xs flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">
                    Please fill in your restaurant profile details above to enable the Continue button.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 03: Brand Logo */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="border-b border-[#F5F5F4] pb-4">
                <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider block">
                  STEP 03
                </span>
                <h2 className="text-xl font-extrabold text-[#1C1917] mt-1 tracking-tight">
                  Restaurant Brand Logo
                </h2>
                <p className="text-xs sm:text-sm text-[#78716C] mt-1 leading-relaxed">
                  Upload your official logo to be printed on receipts and invoices.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border-2 border-dashed border-[#E8E6E4] rounded-2xl bg-[#FAFAF9] text-center sm:text-left">
                {logoUrl ? (
                  <div className="relative group">
                    <img
                      src={logoUrl}
                      alt="Brand Logo"
                      className="w-28 h-28 object-contain rounded-xl border border-[#E8E6E4] bg-white p-2 shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-medium">Uploaded</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-xl border border-[#E8E6E4] bg-white flex flex-col items-center justify-center text-[#78716C]">
                    {uploadingLogo ? (
                      <Loader2 className="w-8 h-8 animate-spin text-[#EA580C]" />
                    ) : (
                      <Store className="w-10 h-10 stroke-[1.5] text-[#A8A29E]" />
                    )}
                    <span className="text-[11px] mt-1 text-[#78716C]">No logo</span>
                  </div>
                )}

                <div className="space-y-2 flex-1">
                  <h4 className="text-sm font-bold text-[#1C1917]">Upload Logo File</h4>
                  <p className="text-xs text-[#78716C]">
                    Recommended dimensions: 512x512px. Formats: PNG, JPG, WebP or SVG up to 10MB.
                  </p>
                  <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white border border-[#D6D3D1] hover:bg-[#F5F5F4] text-xs font-bold text-[#1C1917] cursor-pointer shadow-sm transition">
                    <Upload className="w-4 h-4 text-[#EA580C]" />
                    <span>{uploadingLogo ? 'Uploading...' : 'Choose Logo File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <p className="text-[11px] text-emerald-600 font-medium flex items-center mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Logo uploaded successfully.
                    </p>
                  )}
                  {uploadError && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center mt-2">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" />
                      {uploadError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 04: Restaurant Services */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="border-b border-[#F5F5F4] pb-4">
                <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider block">
                  STEP 04
                </span>
                <h2 className="text-xl font-extrabold text-[#1C1917] mt-1 tracking-tight">
                  Operational Dining Services
                </h2>
                <p className="text-xs sm:text-sm text-[#78716C] mt-1 leading-relaxed">
                  Select which dining channels your restaurant supports.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'Dine In', desc: 'Customers seated at designated tables with waiter service' },
                  { name: 'Takeaway', desc: 'Customers ordering food packed to go at pickup counter' },
                  { name: 'Delivery', desc: 'Direct restaurant delivery or integration with rider fleets' },
                  { name: 'Online Ordering', desc: 'Incoming orders from digital QR menu and website' },
                  { name: 'Counter Ordering', desc: 'Express counter payment with food token slips' },
                ].map((s) => {
                  const active = services.includes(s.name);
                  return (
                    <div
                      key={s.name}
                      id={`service-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      onClick={() => toggleService(s.name)}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                        active
                          ? 'border-[#EA580C] bg-[#FFF8F5] shadow-sm'
                          : 'border-[#E8E6E4] hover:bg-[#FAFAF9]'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-[#1C1917] block">{s.name}</span>
                        <span className="text-[11px] text-[#78716C] mt-0.5 block">{s.desc}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          active ? 'bg-[#EA580C] border-[#EA580C] text-white' : 'border-[#D6D3D1] bg-white'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {services.length === 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-800 text-xs flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">
                    Please select at least one dining service above to enable the Continue button.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 05: Module Selection */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="border-b border-[#F5F5F4] pb-4">
                <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider block">
                  STEP 05
                </span>
                <h2 className="text-xl font-extrabold text-[#1C1917] mt-1 tracking-tight">
                  Platform Modules Activation
                </h2>
                <p className="text-xs sm:text-sm text-[#78716C] mt-1 leading-relaxed">
                  Select which platform modules and features you want activated for your restaurant.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { token: 'POS', name: 'POS Terminal', icon: <Calculator className="w-4 h-4" /> },
                  { token: 'TABLES', name: 'Table Floor Map', icon: <LayoutGrid className="w-4 h-4" /> },
                  { token: 'ORDERS', name: 'Live Orders', icon: <Utensils className="w-4 h-4" /> },
                  { token: 'KITCHEN', name: 'Kitchen KDS', icon: <ChefHat className="w-4 h-4" /> },
                  { token: 'MENU', name: 'Menu Catalog', icon: <Store className="w-4 h-4" /> },
                  { token: 'BILLING', name: 'Tax Billing', icon: <Receipt className="w-4 h-4" /> },
                  { token: 'PAYMENTS', name: 'Payments & Split', icon: <CreditCard className="w-4 h-4" /> },
                  { token: 'INVENTORY', name: 'Inventory & Stock', icon: <Package className="w-4 h-4" /> },
                  { token: 'CUSTOMERS', name: 'CRM & Loyalty', icon: <Users className="w-4 h-4" /> },
                  { token: 'STAFF', name: 'Staff & Roles', icon: <ShieldCheck className="w-4 h-4" /> },
                  { token: 'EXPENSES', name: 'Petty Cash', icon: <TrendingDown className="w-4 h-4" /> },
                  { token: 'REPORTS', name: 'Sales Analytics', icon: <BarChart3 className="w-4 h-4" /> },
                  { token: 'QR', name: 'Table QR Ordering', icon: <QrCode className="w-4 h-4" /> },
                  { token: 'PRINTERS', name: 'Thermal KOT Printing', icon: <Printer className="w-4 h-4" /> },
                  { token: 'AI_MENU_IMPORT', name: 'Gemini AI OCR', icon: <Sparkles className="w-4 h-4" /> },
                ].map((mod) => {
                  const active = selectedModules.includes(mod.token);
                  return (
                    <button
                      key={mod.token}
                      id={`module-card-${mod.token.toLowerCase()}`}
                      type="button"
                      onClick={() => toggleModuleSelection(mod.token)}
                      className={`flex items-center space-x-2.5 p-3.5 rounded-2xl border text-left transition-all ${
                        active
                          ? 'border-[#EA580C] bg-[#FFF8F5] text-[#EA580C] font-bold shadow-sm'
                          : 'border-[#E8E6E4] hover:bg-[#FAFAF9] text-[#78716C]'
                      }`}
                    >
                      <div className={active ? 'text-[#EA580C]' : 'text-[#A8A29E]'}>{mod.icon}</div>
                      <span className="text-xs truncate">{mod.name}</span>
                    </button>
                  );
                })}
              </div>

              {selectedModules.length === 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-800 text-xs flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">
                    Please select at least one platform module above to enable the Continue button.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 06: Table Configuration */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="border-b border-[#F5F5F4] pb-4">
                <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider block">
                  STEP 06
                </span>
                <h2 className="text-xl font-extrabold text-[#1C1917] mt-1 tracking-tight">
                  Table & Seating Layout
                </h2>
                <p className="text-xs sm:text-sm text-[#78716C] mt-1 leading-relaxed">
                  Does your restaurant operate dining tables?
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setUsesTables(true)}
                  className={`flex-1 p-4 rounded-2xl border text-center transition-all ${
                    usesTables === true
                      ? 'border-[#EA580C] bg-[#FFF8F5] font-bold text-[#EA580C] ring-2 ring-[#EA580C]/20 shadow-sm'
                      : 'border-[#E8E6E4] hover:bg-[#FAFAF9] text-[#78716C]'
                  }`}
                >
                  <LayoutGrid className="w-6 h-6 mx-auto mb-1 stroke-[2]" />
                  <span className="text-xs block font-semibold">Yes, we have tables</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUsesTables(false)}
                  className={`flex-1 p-4 rounded-2xl border text-center transition-all ${
                    usesTables === false
                      ? 'border-[#EA580C] bg-[#FFF8F5] font-bold text-[#EA580C] ring-2 ring-[#EA580C]/20 shadow-sm'
                      : 'border-[#E8E6E4] hover:bg-[#FAFAF9] text-[#78716C]'
                  }`}
                >
                  <Store className="w-6 h-6 mx-auto mb-1 stroke-[2]" />
                  <span className="text-xs block font-semibold">No, quick counter only</span>
                </button>
              </div>

              {usesTables === true && (
                <div className="space-y-4 pt-3 border-t border-[#F5F5F4]">
                  <div>
                    <label className="text-xs font-bold text-[#1C1917] block mb-1">
                      Total Seating Tables Count <span className="text-[#EA580C]">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={tableCount}
                      onChange={(e) => setTableCount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Enter total number of tables (e.g. 12)"
                      className="w-full max-w-xs px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-semibold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1C1917] block mb-1">
                      Table Sections & Dining Areas
                    </label>
                    {tableSections.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tableSections.map((sec, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-xs px-3 py-1.5 bg-[#F5F5F4] border border-[#E8E6E4] rounded-xl text-[#1C1917] font-semibold"
                          >
                            {sec}
                            <button
                              type="button"
                              onClick={() => setTableSections(tableSections.filter((_, i) => i !== idx))}
                              className="ml-2 text-[#78716C] hover:text-rose-600 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#78716C] italic mb-2">
                        No areas added yet. Enter sections below (e.g. Main Dining, AC Hall, Outdoor Terrace).
                      </p>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        placeholder="Add area (e.g. VIP Lounge, Rooftop)"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-semibold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C]"
                      />
                      <button
                        type="button"
                        onClick={handleAddSection}
                        className="px-4 py-2 rounded-xl bg-white border border-[#D6D3D1] hover:bg-[#F5F5F4] text-xs font-bold text-[#1C1917] shadow-sm transition"
                      >
                        Add Area
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {usesTables === null && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-800 text-xs flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">
                    Please select whether your restaurant operates dining tables to enable the Continue button.
                  </span>
                </div>
              )}

              {usesTables === true && (!tableCount || Number(tableCount) <= 0) && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-800 text-xs flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">
                    Please enter the total number of seating tables to enable the Continue button.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 07: Staff Configuration (Clean empty defaults, NO fake employees) */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="border-b border-[#F5F5F4] pb-4">
                <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider block">
                  STEP 07
                </span>
                <h2 className="text-xl font-extrabold text-[#1C1917] mt-1 tracking-tight">
                  Staff Team & Employee Roles
                </h2>
                <p className="text-xs sm:text-sm text-[#78716C] mt-1 leading-relaxed">
                  Configure workers who will be operating the POS terminal, taking orders, and cooking.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-[#E8E6E4] bg-[#FAFAF9]">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-[#1C1917] block">
                    Do you have employees?
                  </span>
                  <span className="text-[11px] text-[#78716C] mt-0.5 block">
                    If solo, you can skip creating additional logins.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hasEmployees}
                  onChange={(e) => setHasEmployees(e.target.checked)}
                  className="w-4 h-4 rounded text-[#EA580C] focus:ring-[#EA580C] border-gray-300"
                />
              </div>

              {hasEmployees && (
                <div className="space-y-4">
                  {staffList.length > 0 && (
                    <div className="space-y-2">
                      {staffList.map((s, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-[#E8E6E4] bg-white shadow-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] flex items-center justify-center font-bold text-xs">
                              {s.name[0]}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#1C1917] block">{s.name}</span>
                              <span className="text-[10px] text-[#78716C]">{s.role}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F5F5F4] border border-[#E8E6E4] text-[#1C1917] inline-flex items-center gap-1.5">
                              {s.role === 'WAITER' ? (
                                <>
                                  <ClipboardList className="w-3 h-3 text-blue-600 stroke-[2]" />
                                  <span>Floor Waiter</span>
                                </>
                              ) : (
                                <>
                                  <ChefHat className="w-3 h-3 text-amber-600 stroke-[2]" />
                                  <span>Kitchen Chef</span>
                                </>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => setStaffList(staffList.filter((_, i) => i !== idx))}
                              className="text-[#A8A29E] hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="Staff Member Name"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-semibold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] sm:col-span-2"
                    />
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-bold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C]"
                    >
                      <option value="WAITER">Floor Waiter (Floor & POS)</option>
                      <option value="KITCHEN">Kitchen Staff (KDS)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddStaff}
                    className="w-full py-2.5 rounded-xl border border-[#D6D3D1] bg-white hover:bg-[#FAFAF9] text-xs font-bold text-[#1C1917] shadow-sm transition"
                  >
                    + Add Employee
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 08: Menu Configuration (Clean, NO fake mock dishes) */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="border-b border-[#F5F5F4] pb-4">
                <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider block">
                  STEP 08
                </span>
                <h2 className="text-xl font-extrabold text-[#1C1917] mt-1 tracking-tight">
                  Menu Ingestion & Gemini AI
                </h2>
                <p className="text-xs sm:text-sm text-[#78716C] mt-1 leading-relaxed">
                  Choose how to initialize your catalog. Use Google Gemini 2.5 Flash to automatically detect categories & prices.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setMenuMode('AI')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    menuMode === 'AI'
                      ? 'border-[#EA580C] bg-[#FFF8F5] text-[#EA580C] font-bold ring-2 ring-[#EA580C]/20 shadow-sm'
                      : 'border-[#E8E6E4] hover:bg-[#FAFAF9] text-[#78716C]'
                  }`}
                >
                  <Sparkles className="w-5 h-5 mx-auto mb-1 text-[#EA580C]" />
                  <span className="text-xs block">AI Instant Ingestion</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMenuMode('MANUAL')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    menuMode === 'MANUAL'
                      ? 'border-[#EA580C] bg-[#FFF8F5] text-[#EA580C] font-bold ring-2 ring-[#EA580C]/20 shadow-sm'
                      : 'border-[#E8E6E4] hover:bg-[#FAFAF9] text-[#78716C]'
                  }`}
                >
                  <Store className="w-5 h-5 mx-auto mb-1 text-[#78716C]" />
                  <span className="text-xs block">Manual Entry Later</span>
                </button>
              </div>

              {menuMode === 'AI' && (
                <div className="space-y-4">
                  {/* Photo / File Upload Card for Phone Camera or Desktop */}
                  <div className="p-5 border-2 border-dashed border-[#E8E6E4] rounded-2xl bg-[#FAFAF9] text-center sm:text-left flex flex-col sm:flex-row items-center gap-5">
                    {menuImagePreview ? (
                      <div className="relative group shrink-0">
                        <img
                          src={menuImagePreview}
                          alt="Menu Preview"
                          className="w-24 h-24 object-cover rounded-xl border border-[#E8E6E4] bg-white p-1 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveMenuFile}
                          className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-md text-xs"
                          title="Remove menu file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl border border-[#E8E6E4] bg-white flex flex-col items-center justify-center text-[#A8A29E] shrink-0">
                        <Camera className="w-8 h-8 stroke-[1.5]" />
                        <span className="text-[10px] mt-1 font-medium">Menu Photo</span>
                      </div>
                    )}

                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-xs font-bold text-[#1C1917]">
                        Upload Menu Card Photo or Document
                      </h4>
                      <p className="text-[11px] text-[#78716C] leading-relaxed">
                        Take a photo of your printed menu from your phone or upload an image/PDF. Gemini AI scans all dishes and prices directly.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <label className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#D6D3D1] hover:bg-[#F5F5F4] text-xs font-bold text-[#1C1917] cursor-pointer shadow-xs transition">
                          <Upload className="w-3.5 h-3.5 text-[#EA580C]" />
                          <span>{menuImageFile ? 'Change Photo' : 'Choose Menu File / Photo'}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleMenuFileUpload}
                            className="hidden"
                          />
                        </label>
                        {menuImageFile && (
                          <span className="text-xs text-emerald-600 font-semibold self-center flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            {menuImageFile.name} ({(menuImageFile.size / 1024).toFixed(0)} KB)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1C1917] block mb-1">
                      Or Paste Menu Dishes & Prices Manually (Optional)
                    </label>
                    <textarea
                      rows={4}
                      value={aiMenuRawText}
                      onChange={(e) => setAiMenuRawText(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-mono text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] leading-relaxed"
                      placeholder="Paste your dish names and prices (e.g. Chicken Dum Biryani - 350, Paneer Tikka - 280)..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAiMenu}
                    disabled={aiParsing || (!aiMenuRawText.trim() && !menuImageBase64)}
                    className="py-2.5 px-5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs flex items-center space-x-2 shadow-md transition disabled:opacity-50"
                  >
                    {aiParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Scanning & Extracting with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Extract Menu with Gemini 2.5 Flash</span>
                      </>
                    )}
                  </button>

                  <div className="space-y-2.5 pt-2">
                    <span className="text-[11px] font-extrabold text-[#1C1917] uppercase tracking-wider block">
                      PARSED CATALOG PREVIEW ({aiParsedCategories.length} CATEGORIES)
                    </span>
                    {aiParsedCategories.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                        {aiParsedCategories.map((cat, i) => (
                          <div key={i} className="p-3 rounded-xl border border-[#E8E6E4] bg-[#FAFAF9]">
                            <span className="text-xs font-bold text-[#EA580C] block border-b border-[#E8E6E4] pb-1">
                              {cat.category || cat.name}
                            </span>
                            <div className="mt-2 space-y-1.5">
                              {(cat.items || []).map((it: any, j: number) => (
                                <div key={j} className="flex justify-between items-center text-xs">
                                  <span className="text-[#1C1917] font-medium flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${it.isVeg || it.foodType === 'VEG' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span>{it.name}</span>
                                  </span>
                                  <span className="font-bold text-[#1C1917]">₹{it.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#78716C] italic p-3 border border-dashed border-[#E8E6E4] rounded-xl text-center">
                        No menu items added yet. You can paste dishes above to extract with Gemini, or configure your menu later from the Menu Catalog.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 09: Taxation, Hardware & Final Submission (FINAL 100%) */}
          {step === 9 && (
            <div className="space-y-6">
              <div className="border-b border-[#F5F5F4] pb-4">
                <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider block">
                  STEP 09 (FINAL • 100%)
                </span>
                <h2 className="text-xl font-extrabold text-[#1C1917] mt-1 tracking-tight">
                  Billing, Hardware & Final Submission
                </h2>
                <p className="text-xs sm:text-sm text-[#78716C] mt-1 leading-relaxed">
                  Configure taxation, receipt printer preferences, and submit your registration for account verification.
                </p>
              </div>

              {/* Taxation & GST */}
              <div>
                <h3 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider mb-3">
                  1. Taxes, GST & Invoicing
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1C1917] block mb-1">
                      Standard Tax / GST Rate (%) <span className="text-[#EA580C]">*</span>
                    </label>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-semibold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C]"
                      placeholder="e.g. 5"
                    />
                    <span className="text-[11px] text-[#78716C] mt-1.5 block">
                      Standard restaurant GST (e.g. 5% = CGST 2.5% + SGST 2.5%)
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1C1917] block mb-1">
                      Service Charge (%)
                    </label>
                    <input
                      type="number"
                      value={serviceCharge}
                      onChange={(e) => setServiceCharge(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-semibold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C]"
                      placeholder="e.g. 0"
                    />
                    <span className="text-[11px] text-[#78716C] mt-1.5 block">
                      Set 0% if optional or inclusive
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1C1917] block mb-1">
                      Invoice Prefix <span className="text-[#EA580C]">*</span>
                    </label>
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D6D3D1] bg-[#FAFAF9] text-xs font-mono font-semibold text-[#1C1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C]"
                      placeholder="e.g. INV-2026-"
                    />
                  </div>

                  <div className="flex items-center pt-2 sm:pt-6">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roundOff}
                        onChange={(e) => setRoundOff(e.target.checked)}
                        className="w-4 h-4 rounded text-[#EA580C] focus:ring-[#EA580C] border-gray-300"
                      />
                      <span className="text-xs font-bold text-[#1C1917]">
                        Enable Automatic Rupee Round Off
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Hardware / Printers */}
              <div className="pt-3 border-t border-[#F5F5F4]">
                <h3 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider mb-3">
                  2. POS Receipt & KOT Printers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'THERMAL_80MM', title: '80mm Thermal Printer', desc: 'Standard ESC/POS counter roll' },
                    { id: 'THERMAL_58MM', title: '58mm Compact Bluetooth', desc: 'Handheld mobile billing device' },
                    { id: 'NETWORK_LAN', title: 'LAN Kitchen Printer', desc: 'Direct order tickets to chef station' },
                    { id: 'SKIP', title: 'Skip / Digital KDS Only', desc: 'Use screen tablets & e-receipts' },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-start space-x-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        printerType === p.id
                          ? 'border-[#EA580C] bg-[#FFF8F5] shadow-sm'
                          : 'border-[#E8E6E4] hover:bg-[#FAFAF9]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="printerType"
                        checked={printerType === p.id}
                        onChange={() => setPrinterType(p.id)}
                        className="mt-1 text-[#EA580C] focus:ring-[#EA580C]"
                      />
                      <div>
                        <span className="text-xs font-bold text-[#1C1917] block">{p.title}</span>
                        <span className="text-[11px] text-[#78716C] mt-0.5 block">{p.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Review Summary */}
              <div className="pt-3 border-t border-[#F5F5F4]">
                <h3 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider mb-3">
                  3. Application Review Summary
                </h3>
                <div className="space-y-2 text-xs bg-[#FAFAF9] p-4 rounded-2xl border border-[#E8E6E4]">
                  <div className="flex justify-between py-1 border-b border-[#E8E6E4]">
                    <span className="text-[#78716C]">Restaurant Name</span>
                    <span className="font-bold text-[#1C1917]">{name || 'Unnamed'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E8E6E4]">
                    <span className="text-[#78716C]">Location</span>
                    <span className="font-bold text-[#1C1917]">{city ? `${city}, ` : ''}{state}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E8E6E4]">
                    <span className="text-[#78716C]">Business Model</span>
                    <span className="font-bold text-[#1C1917]">{bType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E8E6E4]">
                    <span className="text-[#78716C]">Table Seating</span>
                    <span className="font-bold text-[#1C1917]">
                      {usesTables === true
                        ? `${tableCount || 0} Tables (${tableSections.length > 0 ? tableSections.join(', ') : 'Open Seating'})`
                        : 'Disabled (Counter Service)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E8E6E4]">
                    <span className="text-[#78716C]">Feature Modules</span>
                    <span className="font-bold text-[#1C1917]">{selectedModules.length} Modules Requested</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E8E6E4]">
                    <span className="text-[#78716C]">Staff Setup</span>
                    <span className="font-bold text-[#1C1917]">
                      {hasEmployees && staffList.length > 0 ? `${staffList.length} Staff configured` : 'Owner Only'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#78716C]">Tax / GST</span>
                    <span className="font-bold text-[#1C1917]">
                      {taxRate !== '' ? `${taxRate}% GST` : 'Not set'} ({roundOff ? 'Auto Round Off' : 'Exact'})
                    </span>
                  </div>
                </div>
              </div>

              {(!printerType || !invoicePrefix.trim() || taxRate === '') && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-800 text-xs flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium">
                    Please fill in your GST rate, invoice prefix, and choose a printer option above to enable submission.
                  </span>
                </div>
              )}

              {/* Ready for Verification Alert */}
              <div className="p-4 bg-orange-50/80 border border-orange-200/90 rounded-2xl text-[#9A3412] text-xs flex items-start space-x-3 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-[#7C2D12] text-xs block">
                    Ready for Verification
                  </span>
                  <span className="text-[11px] leading-relaxed block text-[#9A3412]">
                    All 9 onboarding steps are 100% filled. Clicking the button below transmits your registration details directly to the Super Admin portal. Once approved by the administrator, your dynamic restaurant dashboard is immediately generated.
                  </span>
                </div>
              </div>

              {submitError && (
                <div className="p-4 bg-rose-50 border border-rose-200/90 rounded-2xl text-rose-800 text-xs flex items-start space-x-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-rose-900 text-xs block">
                      Registration Submission Error
                    </span>
                    <span className="text-[11px] leading-relaxed block text-rose-700">
                      {submitError}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-5 border-t border-[#F5F5F4]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                className="px-5 py-2.5 rounded-xl border border-[#D6D3D1] text-[#1C1917] font-semibold text-xs hover:bg-[#FAFAF9] transition flex items-center space-x-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            ) : <div />}

            {step < 9 ? (
              <button
                id="wizard-continue-btn"
                type="button"
                onClick={() => {
                  if (step === 1 && !bType) return;
                  if (step === 2 && (!name.trim() || !phone.trim() || !email.trim() || !address.trim() || !city.trim() || !state.trim())) return;
                  if (step === 4 && services.length === 0) return;
                  if (step === 5 && selectedModules.length === 0) return;
                  if (step === 6 && (usesTables === null || (usesTables === true && (!tableCount || Number(tableCount) <= 0)))) return;
                  setStep((prev) => Math.min(9, prev + 1));
                }}
                disabled={
                  (step === 1 && !bType) ||
                  (step === 2 && (!name.trim() || !phone.trim() || !email.trim() || !address.trim() || !city.trim() || !state.trim())) ||
                  (step === 4 && services.length === 0) ||
                  (step === 5 && selectedModules.length === 0) ||
                  (step === 6 && (usesTables === null || (usesTables === true && (!tableCount || Number(tableCount) <= 0))))
                }
                className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-md transition ${
                  (step === 1 && !bType) ||
                  (step === 2 && (!name.trim() || !phone.trim() || !email.trim() || !address.trim() || !city.trim() || !state.trim())) ||
                  (step === 4 && services.length === 0) ||
                  (step === 5 && selectedModules.length === 0) ||
                  (step === 6 && (usesTables === null || (usesTables === true && (!tableCount || Number(tableCount) <= 0))))
                    ? 'bg-stone-200 text-stone-400 border border-stone-300 opacity-60 cursor-not-allowed shadow-none'
                    : 'bg-[#EA580C] hover:bg-[#C2410C] text-white cursor-pointer'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting || !printerType || !invoicePrefix.trim() || taxRate === ''}
                className="px-7 py-3 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs sm:text-sm flex items-center space-x-2.5 shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ring-4 ring-[#EA580C]/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Registration...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Registration for Approval</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CompleteOnboardingWizard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#EA580C]" />
        </div>
      }
    >
      <OnboardingWizardContent />
    </Suspense>
  );
}
