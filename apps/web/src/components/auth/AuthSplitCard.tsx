'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/state';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Store,
  Phone,
  AlertCircle,
  Sparkles,
  Zap,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { BusinessType } from '@platform/types';
import { ROLE_DEFAULT_PERMISSIONS } from '@/lib/permission-engine';
import { supabase } from '@/lib/supabase';
import { ZipBillLogo } from '@/components/brand/ZipBillLogo';

const VIDEO_URL =
  'https://res.cloudinary.com/dvueuxjap/video/upload/v1790946122/From_Klickpin.com-_Try_Beautiful_bridal_shower_themes_for_your_next_inspiration_board_with_thoughtful_touches_that_make_everything_feel_complete-p_mry7y4.mp4';

const businessTypes: Array<{ type: BusinessType; name: string }> = [
  { type: 'RESTAURANT', name: 'Restaurant' },
  { type: 'CAFE', name: 'Cafe' },
  { type: 'BAKERY', name: 'Bakery' },
  { type: 'FAST_FOOD', name: 'Fast Food' },
  { type: 'CLOUD_KITCHEN', name: 'Cloud Kitchen' },
  { type: 'HOTEL_RESTAURANT' as any, name: 'Hotel' },
];

export function AuthSplitCard({ defaultMode = 'login' }: { defaultMode?: 'login' | 'register' }) {
  const router = useRouter();
  const { session, setSession, setProfile, setBusinessType, setCurrentTenant } = useApp();

  // Mode: 'login' or 'register'
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);

  // Common & Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tableCount, setTableCount] = useState<number>(8);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saas_selected_table_count');
      if (saved) setTableCount(Number(saved));
    }
  }, []);

  // Register State
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [bType, setBType] = useState<BusinessType>('RESTAURANT');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const [existingUser, setExistingUser] = useState<any>(null);
  const [existingTenant, setExistingTenant] = useState<any>(null);

  // Check if user already has an active authenticated session or arrived via OAuth callback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. If redirected with OAuth tokens or code, forward to callback immediately
    if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
      router.replace(`/auth/callback${window.location.search}${window.location.hash}`);
      return;
    }

    // 2. Check if a valid Supabase or local storage session exists
    let isActive = true;
    const checkActiveSession = async () => {
      const isExplicitLoggedOut = window.location.search.includes('logged_out');

      try {
        const savedSession = localStorage.getItem('saas_active_session');
        if (savedSession && !isExplicitLoggedOut) {
          const parsed = JSON.parse(savedSession);
          if (parsed?.userId && parsed?.email) {
            // Guarantee cookie is synchronized
            document.cookie = 'saas_session_active=true; path=/; max-age=604800; SameSite=Lax';
            window.location.replace('/dashboard');
            return;
          }
        }
      } catch {}

      try {
        const { data } = await supabase.auth.getSession();
        if (isActive && data.session?.user && !isExplicitLoggedOut) {
          const userEmail = data.session.user.email || '';
          document.cookie = 'saas_session_active=true; path=/; max-age=604800; SameSite=Lax';
          router.replace('/auth/callback');
          return;
        }
      } catch {}

      try {
        const savedSession = localStorage.getItem('saas_active_session');
        const savedTenant = localStorage.getItem('saas_active_tenant');
        const savedProfile = localStorage.getItem('saas_active_profile');

        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed?.userId && parsed?.email) {
            setExistingUser(parsed);
            if (savedTenant) {
              try {
                setExistingTenant(JSON.parse(savedTenant));
              } catch {}
            } else if (savedProfile) {
              try {
                const p = JSON.parse(savedProfile);
                setExistingTenant({ name: p.businessName, slug: '' });
              } catch {}
            }
          }
        }
      } catch {}
    };

    void checkActiveSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (isActive && authSession?.user && !window.location.search.includes('logged_out')) {
        document.cookie = 'saas_session_active=true; path=/; max-age=604800; SameSite=Lax';
        router.replace('/auth/callback');
      }
    });

    return () => {
      isActive = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Handle Caps Lock detection
  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const handleLogoutExisting = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase sign out error:', err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saas_active_session');
      localStorage.removeItem('saas_active_profile');
      localStorage.removeItem('saas_active_tenant');
      localStorage.removeItem('saas_active_business_type');
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
    setExistingUser(null);
    setExistingTenant(null);
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setAuthError(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('saas_selected_table_count', String(tableCount));
      }
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });
      if (error) {
        setAuthError(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initiate Google authentication. Please try again.');
      setGoogleLoading(false);
    }
  };

  // Instant 1-Click Demo / Preview Mode
  const handleQuickPreview = async () => {
    setPreviewLoading(true);
    setAuthError(null);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('saas_selected_table_count', String(tableCount));
      }
      // Connect to the primary approved restaurant workspace
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'uttupulusu@gmail.com', password: '', tableCount }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const activeTenant = data.tenant;
        const activeProfile = data.profile || {
          id: `prof-${activeTenant?.id}`,
          tenantId: activeTenant?.id,
          businessName: activeTenant?.name || 'projectk',
          currencySymbol: '₹',
          onboardingCompleted: true,
        };

        const activeSessionObj = {
          ...session,
          tenantId: data.user.tenantId || activeTenant?.id,
          fullName: data.user.fullName || 'Tarun (Owner)',
          email: data.user.email || 'uttupulusu@gmail.com',
          roleName: data.user.roleType || 'OWNER',
          permissions: data.permissions || ['*'],
          userId: data.user.id,
        };

        if (typeof window !== 'undefined') {
          document.cookie = 'saas_session_active=true; path=/; max-age=604800; SameSite=Lax';
          localStorage.setItem('saas_active_session', JSON.stringify(activeSessionObj));
          localStorage.setItem('saas_active_profile', JSON.stringify({ ...activeProfile, onboardingCompleted: true }));
          if (activeTenant) localStorage.setItem('saas_active_tenant', JSON.stringify(activeTenant));
          localStorage.setItem('saas_active_business_type', activeTenant?.businessType || 'RESTAURANT');
          window.location.replace('/dashboard');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      // Offline fallback
      if (typeof window !== 'undefined') {
        window.location.replace('/dashboard');
      }
    } catch (err: any) {
      console.warn('Quick preview fallback:', err);
      if (typeof window !== 'undefined') {
        window.location.replace('/dashboard');
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  // Email / Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setAuthError('Please enter a valid work email.');
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('saas_selected_table_count', String(tableCount));
      }
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, tableCount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.message || data.error || 'Invalid email or password. Please try again.');
        return;
      }

      if (data.status === 'PENDING_APPROVAL' || data.redirect?.includes('/pending-approval')) {
        router.push(data.redirect || '/pending-approval');
        return;
      }

      if (data.redirect?.includes('/onboarding')) {
        if (typeof window !== 'undefined') {
          document.cookie = 'saas_session_active=true; path=/; max-age=604800; SameSite=Lax';
          if (data.profile) localStorage.setItem('saas_active_profile', JSON.stringify(data.profile));
          if (data.tenant) localStorage.setItem('saas_active_tenant', JSON.stringify(data.tenant));
          window.location.replace(data.redirect);
        } else {
          router.push(data.redirect);
        }
        return;
      }

      const activeProfile = data.profile || (data.tenant ? {
        id: `prof-${data.tenant.id}`,
        tenantId: data.tenant.id,
        businessName: data.tenant.name,
        phone: data.user.phone || '',
        email: data.user.email,
        city: data.profile?.city || 'Bengaluru',
        state: data.profile?.state || 'Karnataka',
        address: data.profile?.address || '',
        country: 'IN',
        currencyCode: 'INR',
        currencySymbol: '₹',
        timezone: 'Asia/Kolkata',
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } : null);

      if (activeProfile && typeof window !== 'undefined') {
        localStorage.setItem('saas_active_profile', JSON.stringify(activeProfile));
      }

      if (data.tenant && typeof window !== 'undefined') {
        localStorage.setItem('saas_active_tenant', JSON.stringify(data.tenant));
        localStorage.setItem('saas_active_business_type', data.tenant.businessType || 'RESTAURANT');
      }

      const activeSessionObj = {
        ...session,
        tenantId: data.user.tenantId || data.tenant?.id || session.tenantId,
        fullName: data.user.fullName,
        email: data.user.email,
        roleName: data.user.roleType,
        permissions: data.permissions || ROLE_DEFAULT_PERMISSIONS[data.user.roleType] || ['*'],
        userId: data.user.id,
      };

      if (typeof window !== 'undefined') {
        document.cookie = 'saas_session_active=true; path=/; max-age=604800; SameSite=Lax';
        localStorage.setItem('saas_active_session', JSON.stringify(activeSessionObj));
        // Hard replace guarantees fresh hydration with 0 redirect bounce
        window.location.replace('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Unable to connect to platform server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match. Please verify your password.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    setAuthError(null);
    setRegisterStep(2);
  };

  const handleRegisterFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: email.trim(),
          password,
          restaurantName,
          businessType: bType,
          phone,
          city: city || 'Bengaluru',
          country: 'India',
          tableCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register restaurant.');
      }

      try {
        localStorage.setItem(
          'saas_pending_registration',
          JSON.stringify({
            tenantId: data.tenantId,
            restaurantName,
            email: email.trim(),
            phone,
            city: city || 'Bengaluru',
            businessType: bType,
            tableCount,
            submittedAt: new Date().toISOString(),
          })
        );
      } catch {}

      router.push(`/pending-approval?tenantId=${data.tenantId}&email=${encodeURIComponent(email.trim())}`);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] md:h-screen w-full md:max-h-screen md:overflow-hidden overflow-y-auto bg-[#FAFAF8] text-[#1C1917] flex items-center justify-center p-3 sm:p-5 lg:p-6 font-sans relative selection:bg-orange-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#EA580C_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.035] pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-[480px] md:max-w-[1020px] bg-white rounded-3xl border border-[#E8E6E4] shadow-[0_25px_60px_-15px_rgba(28,25,23,0.08),0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col md:flex-row md:h-[min(650px,94vh)] my-auto transition-all">
        
        {/* LEFT PANEL: Visual Showcase & Brand Highlights */}
        <div className="w-full md:w-1/2 h-64 sm:h-72 md:h-full p-3 sm:p-4 shrink-0 flex flex-col">
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-stone-900 group shadow-inner flex flex-col justify-between p-6">
            <video
              src={VIDEO_URL}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 opacity-80"
            />
            {/* Dark gradient overlay for crystal readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60 pointer-events-none" />

            {/* Top brand chip */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Enterprise POS System</span>
              </span>
              <span className="text-white/60 text-[11px] font-medium hidden sm:inline">v2.4 Production</span>
            </div>

            {/* Bottom feature badges on video */}
            <div className="relative z-10 space-y-3">
              <div className="space-y-1">
                <h2 className="text-white font-bold text-xl sm:text-2xl tracking-tight leading-snug">
                  Precision Restaurant POS, Kitchen & Billing
                </h2>
                <p className="text-white/70 text-xs leading-relaxed max-w-sm">
                  Offline-first architecture with instant thermal printing, table map, KDS and GST compliance.
                </p>
              </div>

              {/* Floating pill tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
                  ⚡ 0.2s KOT Dispatch
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
                  🍽️ Live Table Floor Map
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-white text-[10px] font-medium border border-white/10">
                  👨‍🍳 Kitchen Queue (KDS)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Authentication Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-between p-5 sm:p-7 md:py-6 md:pl-10 md:pr-8 lg:pl-11 lg:pr-10 overflow-y-auto">
          
          {/* Top Bar: Brand Logo & Segmented Mode Switch */}
          <div className="flex items-center justify-between pb-2 border-b border-[#F0EEEB]">
            <Link href="/" className="hover:opacity-90 transition">
              <ZipBillLogo size="sm" variant="full" />
            </Link>

            {/* Segmented Mode Switch */}
            <div className="inline-flex p-1 bg-[#F5F4F0] border border-[#E8E6E4] rounded-full text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setAuthError(null);
                }}
                className={`px-3 py-1 rounded-full font-semibold transition-all text-[11px] cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#EA580C] text-white shadow-xs'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegisterStep(1);
                  setAuthError(null);
                }}
                className={`px-3 py-1 rounded-full font-semibold transition-all text-[11px] cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#EA580C] text-white shadow-xs'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="my-auto py-3">
            
            {/* -------------------- SIGN IN MODE -------------------- */}
            {mode === 'login' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1C1917] tracking-tight">
                    Sign In to Your Restaurant
                  </h1>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Select Google, enter credentials, or launch the instant live preview.
                  </p>
                </div>

                {/* Active Session Detected Banner */}
                {existingUser && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-900 space-y-2 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-[12px] truncate">{existingUser.fullName || 'Active Restaurant Owner'}</p>
                          <p className="text-[11px] text-emerald-700 truncate">{existingUser.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogoutExisting}
                        className="text-red-600 hover:text-red-700 font-semibold text-[11px] hover:underline cursor-pointer shrink-0 ml-2"
                      >
                        Switch Account
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.location.replace('/dashboard');
                        } else {
                          router.push('/dashboard');
                        }
                      }}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-center flex items-center justify-center space-x-1.5 text-xs shadow-sm transition-all cursor-pointer"
                    >
                      <span>Continue to Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 1. Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading || previewLoading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-[#F9F9F8] text-[#1C1917] text-xs font-semibold rounded-xl border border-[#E8E6E4] hover:border-[#D1D5DB] shadow-xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {googleLoading ? (
                    <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>

                {/* Divider */}
                <div className="relative my-3 flex items-center justify-center">
                  <div className="border-t border-[#E8E6E4] w-full" />
                  <span className="bg-white px-3 text-[10px] uppercase tracking-wider text-[#A8A29E] font-semibold absolute">
                    or sign in with email
                  </span>
                </div>

                {/* Email & Password Form */}
                <form onSubmit={handleLogin} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#1C1917]">
                      Work Email
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A8A29E] group-focus-within:text-[#EA580C] transition-colors">
                        <Mail className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E8E6E4] hover:border-[#D1D5DB] rounded-xl text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15 transition-all"
                        placeholder="owner@yourrestaurant.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-[#1C1917]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          alert('To reset your credentials, please use "Continue with Google" or contact your restaurant administrator.');
                        }}
                        className="text-[11px] text-[#EA580C] hover:text-[#C2410C] font-medium hover:underline transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A8A29E] group-focus-within:text-[#EA580C] transition-colors">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handlePasswordKeyDown}
                        className="w-full pl-9 pr-9 py-2 bg-[#FFFFFF] border border-[#E8E6E4] hover:border-[#D1D5DB] rounded-xl text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15 transition-all"
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A8A29E] hover:text-[#565656] cursor-pointer transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* CapsLock Warning */}
                    {capsLockActive && (
                      <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center space-x-1 mt-1 border border-amber-200">
                        <span>⚠️ Caps Lock is turned ON</span>
                      </div>
                    )}
                  </div>

                  {authError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span className="leading-tight">{authError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || googleLoading || previewLoading}
                    className="w-full py-2.5 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-1"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Workspace...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Restaurant</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* -------------------- REGISTER MODE (STEP 1) -------------------- */}
            {mode === 'register' && registerStep === 1 && (
              <div className="space-y-3.5 animate-fadeIn">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#1C1917] tracking-tight">
                    Start Your Restaurant Setup
                  </h1>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Fast onboarding with zero upfront fees. Connect Google or create credentials.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  className="w-full py-2.5 px-4 bg-white hover:bg-[#F9F9F8] text-[#1C1917] text-xs font-semibold rounded-xl border border-[#E8E6E4] hover:border-[#D1D5DB] shadow-xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-70"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Quick Sign Up with Google</span>
                </button>

                <div className="relative my-3 flex items-center justify-center">
                  <div className="border-t border-[#E8E6E4] w-full" />
                  <span className="bg-white px-3 text-[10px] uppercase tracking-wider text-[#A8A29E] font-semibold absolute">
                    or register with email
                  </span>
                </div>

                <form onSubmit={handleRegisterStep1} className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#1C1917]">Full Name</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A8A29E] group-focus-within:text-[#EA580C] transition-colors">
                        <User className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E8E6E4] hover:border-[#D1D5DB] rounded-xl text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15 transition-all"
                        placeholder="e.g. Ramesh Sharma"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#1C1917]">Work Email</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A8A29E] group-focus-within:text-[#EA580C] transition-colors">
                        <Mail className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E8E6E4] hover:border-[#D1D5DB] rounded-xl text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15 transition-all"
                        placeholder="owner@yourrestaurant.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#1C1917]">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E8E6E4] hover:border-[#D1D5DB] rounded-xl text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15 transition-all"
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#1C1917]">Confirm</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E8E6E4] hover:border-[#D1D5DB] rounded-xl text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15 transition-all"
                        placeholder="Repeat password"
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span className="leading-tight">{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-1.5 cursor-pointer mt-1"
                  >
                    <span>Continue to Restaurant Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* -------------------- REGISTER MODE (STEP 2) -------------------- */}
            {mode === 'register' && registerStep === 2 && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setRegisterStep(1)}
                    className="p-1 hover:bg-[#F7F7F5] rounded-lg text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h1 className="text-lg sm:text-xl font-bold text-[#1C1917] tracking-tight">
                    Restaurant Details
                  </h1>
                </div>

                <form onSubmit={handleRegisterFinal} className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#1C1917]">Restaurant Name</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A8A29E] group-focus-within:text-[#EA580C] transition-colors">
                        <Store className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        required
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E8E6E4] hover:border-[#D1D5DB] rounded-xl text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15 transition-all"
                        placeholder="e.g. Royal Biryani & Kebabs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#1C1917]">Business Type</label>
                    <select
                      value={bType}
                      onChange={(e) => setBType(e.target.value as BusinessType)}
                      className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E8E6E4] hover:border-[#D1D5DB] rounded-xl text-xs sm:text-sm text-[#1C1917] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15 transition-all"
                    >
                      {businessTypes.map((bt) => (
                        <option key={bt.type} value={bt.type}>
                          {bt.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#1C1917]">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E8E6E4] hover:border-[#D1D5DB] rounded-xl text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15 transition-all"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#1C1917]">City</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E8E6E4] hover:border-[#D1D5DB] rounded-xl text-xs sm:text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15 transition-all"
                        placeholder="Bengaluru"
                      />
                    </div>
                  </div>

                  {/* Dining Floor Capacity */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#1C1917] flex items-center justify-between">
                      <span>Dining Tables Setup</span>
                      <span className="text-[10px] text-[#EA580C] font-semibold">{tableCount} Tables Configured</span>
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[4, 8, 12, 16, 24].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setTableCount(num)}
                          className={`py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            tableCount === num
                              ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                              : 'bg-white text-[#1C1917] border-[#E8E6E4] hover:border-[#D1D5DB]'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {authError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span className="leading-tight">{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-1 py-2.5 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <span>{loading ? 'Creating Restaurant Workspace...' : 'Complete Registration'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Bottom Switcher Link */}
          <div className="pt-3 pb-1 border-t border-[#F0EEEB] text-center text-xs text-[#78716C]">
            {mode === 'login' ? (
              <span>
                New restaurant owner?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setRegisterStep(1);
                    setAuthError(null);
                  }}
                  className="text-[#EA580C] font-semibold hover:underline cursor-pointer"
                >
                  Create New Workspace
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setAuthError(null);
                  }}
                  className="text-[#EA580C] font-semibold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
