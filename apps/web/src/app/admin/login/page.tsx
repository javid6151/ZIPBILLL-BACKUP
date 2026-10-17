'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ArrowRight,
  Mail,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useApp } from '@/lib/state';
import { ZipBillLogo } from '@/components/brand/ZipBillLogo';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setSession } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both Admin Email and Password.');
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
          data.error || 'Authentication failed. Please check your admin credentials.'
        );
        setLoading(false);
        return;
      }

      // Store isolated Admin Session
      const adminSession = {
        userId: data.user.id,
        tenantId: 'PLATFORM_SUPER_ADMIN',
        email: data.user.email,
        fullName: data.user.fullName,
        roleName: data.user.roleType || 'SUPER_ADMIN',
        permissions: ['*'],
        deviceId: 'admin-portal-gateway',
        isSuperAdmin: true,
        token: data.token,
        authenticatedAt: new Date().toISOString(),
      };

      localStorage.setItem('saas_admin_session', JSON.stringify(adminSession));

      setSession({
        userId: data.user.id,
        tenantId: 'PLATFORM_SUPER_ADMIN',
        email: data.user.email,
        fullName: data.user.fullName,
        roleName: data.user.roleType || 'SUPER_ADMIN',
        permissions: ['*'],
        deviceId: 'admin-portal-gateway',
        isSuperAdmin: true,
      });

      // Redirect to /tarun/admin if logged in from /tarun/admin, otherwise /admin
      const redirectTarget =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/tarun/admin')
          ? '/tarun/admin'
          : '/admin';
      router.push(redirectTarget);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Unable to connect to the Admin Control Plane. Please try again.'
      );
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-main flex flex-col items-center justify-center py-12 px-4 sm:px-6 font-sans">
      {/* HEADER / BADGE */}
      <div className="text-center mb-6 max-w-md w-full">
        <Link href="/" className="inline-flex flex-col items-center space-y-2 mb-4 hover:opacity-95 transition">
          <ZipBillLogo size="lg" variant="full" />
        </Link>
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-primary mb-3 shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5 text-primary" />
          <span>ZipBill Platform Control Plane</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight">
          Super Admin Gateway
        </h1>
        <p className="mt-1 text-xs text-secondary font-medium">
          Multi-tenant platform infrastructure & master controls
        </p>
      </div>

      {/* LOGIN CARD */}
      <div className="w-full max-w-md bg-surface p-8 sm:p-9 rounded-card border border-border shadow-sm space-y-6">
        {/* Super Admin Credentials Autofill */}
        <div className="p-3 bg-orange-50/80 rounded-lg border border-orange-200/90 flex items-center justify-between text-xs">
          <div>
            <p className="font-semibold text-heading">Super Admin</p>
            <p className="text-[11px] text-secondary font-mono">tarunuttupulusu@gmail.com</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('tarunuttupulusu@gmail.com');
              setPassword('tarun2314638');
            }}
            className="px-2.5 py-1 bg-white border border-orange-300 rounded text-primary font-semibold text-[11px] hover:bg-orange-50 transition shadow-xs"
          >
            Auto-fill
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-5">
          {/* ADMIN EMAIL */}
          <div>
            <label className="block text-xs font-semibold text-heading mb-2">
              Admin Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-placeholder" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field input-with-icon"
                placeholder="superadmin@platform.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-heading">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotSubmitted(false);
                  setForgotEmail('');
                }}
                className="text-xs text-primary font-medium hover:underline focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-placeholder" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field input-with-icon"
                placeholder="••••••••••••"
                disabled={loading}
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary font-semibold text-sm py-3 flex items-center justify-center space-x-2 shadow-button hover:shadow-button-hover transition"
          >
            <span>{loading ? 'Authenticating...' : 'Admin Login'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* SECURITY NOTICE BOX */}
        <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-4 flex items-start space-x-3 text-xs text-secondary leading-relaxed">
          <ShieldAlert className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-heading font-semibold">Security Notice:</strong>{' '}
            Restricted to authorized SaaS platform administrators. All activities are recorded in the immutable audit log.
          </div>
        </div>
      </div>


      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-card max-w-md w-full p-6 shadow-modal space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-heading font-bold text-base">
                <KeyRound className="w-5 h-5 text-primary" />
                <span>Admin Password Recovery</span>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-secondary hover:bg-surfaceMuted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!forgotSubmitted ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-secondary leading-relaxed">
                  Enter your registered administrator email address below to submit a password reset request.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-heading mb-1.5">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="input-field"
                    placeholder="admin@platform.com"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn-secondary text-xs px-3.5 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    {forgotLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-heading">Recovery Dispatched</h3>
                <p className="text-xs text-secondary leading-relaxed max-w-sm mx-auto">
                  If an authorized administrative account exists for <strong>{forgotEmail}</strong>, instructions to reset your password have been sent.
                </p>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="btn-primary text-xs px-5 py-2 mt-2"
                >
                  Return to Admin Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
