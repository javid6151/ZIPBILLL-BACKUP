'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Command,
} from 'lucide-react';
import { ZipBillLogo } from '@/components/brand/ZipBillLogo';

const VIDEO_URL =
  'https://res.cloudinary.com/dvueuxjap/video/upload/v1790946122/From_Klickpin.com-_Try_Beautiful_bridal_shower_themes_for_your_next_inspiration_board_with_thoughtful_touches_that_make_everything_feel_complete-p_mry7y4.mp4';

export default function SuperAdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data.error || 'Authentication failed. Please verify your administrator credentials.'
        );
        setLoading(false);
        return;
      }

      // Store isolated Superadmin session
      const adminSession = {
        userId: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        roleName: data.user.roleType || 'SUPER_ADMIN',
        token: data.token,
        isSuperAdmin: true,
        authenticatedAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('saas_admin_session', JSON.stringify(adminSession));
      }

      router.push(data.redirect || '/admin/dashboard');
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Unable to connect to the authentication server. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] md:h-screen w-full md:max-h-screen md:overflow-hidden overflow-y-auto bg-[#FAFAF8] text-[#1C1917] flex items-center justify-center p-3 sm:p-5 lg:p-6 font-sans relative">
      {/* Subtle ambient glow matching ZipBill warm tones */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-orange-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-amber-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#EA580C_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

      {/* Main Split Card - Mobile: compact banner + form, Desktop: full split card */}
      <div className="relative w-full max-w-[480px] md:max-w-[940px] bg-white rounded-2xl sm:rounded-3xl border border-[#E8E6E4] shadow-[0_20px_50px_-15px_rgba(28,25,23,0.07),0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col md:flex-row md:h-[min(580px,94vh)] my-auto">
        
        {/* LEFT / TOP SIDE: Video Animation - Generously sized banner on mobile, full-height on desktop */}
        <div className="w-full md:w-1/2 h-64 sm:h-72 md:h-full p-2.5 sm:p-3.5 shrink-0 flex flex-col">
          <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-stone-900 group shadow-inner">
            <video
              src={VIDEO_URL}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
        </div>

        {/* RIGHT / BOTTOM SIDE: Senior Developer-Grade Minimalist Login Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-between p-5 sm:p-7 md:py-7 md:pl-10 md:pr-8 lg:pl-12 lg:pr-10 overflow-y-auto">
          
          {/* Top Bar: Clean Brand Logo */}
          <div className="flex items-center justify-between">
            <Link href="/" className="hover:opacity-90 transition">
              <ZipBillLogo size="sm" variant="full" />
            </Link>
          </div>

          {/* Form Content Area */}
          <div className="my-auto py-2">
            <div className="mb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1C1917] tracking-tight">
                Welcome to ZipBill Admin
              </h1>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-3.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-tight font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAdminLogin} className="space-y-3.5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#1C1917]">
                  Admin Email
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E] group-focus-within:text-[#EA580C] transition-colors">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[#E8E6E4] hover:border-[#D1D5DB] rounded-xl text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15 transition-all"
                    placeholder="name@company.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#1C1917]">
                  Password
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A29E] group-focus-within:text-[#EA580C] transition-colors">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FFFFFF] border border-[#E8E6E4] hover:border-[#D1D5DB] rounded-xl text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15 transition-all"
                    placeholder="••••••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A8A29E] hover:text-[#565656] cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember device row */}
              <div className="flex items-center text-xs pt-0.5">
                <label className="flex items-center space-x-2 cursor-pointer select-none text-[#78716C]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#E8E6E4] text-[#EA580C] focus:ring-[#EA580C]"
                  />
                  <span>Remember device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold rounded-xl text-sm shadow-md shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Admin Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Bottom Minimal Footer */}
          <div className="pt-3 border-t border-[#E8E6E4] text-xs text-[#A8A29E] flex items-center justify-between">
            <span>© {new Date().getFullYear()} ZipBill Technologies</span>
            <div className="flex items-center space-x-3 text-[#78716C] text-[11px]">
              <span>Privacy</span>
              <span>•</span>
              <span>Security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

