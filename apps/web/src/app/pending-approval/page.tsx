'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Store,
  RefreshCw,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Building2,
  ArrowRight,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { ZipBillLogo } from '@/components/brand/ZipBillLogo';

function PendingApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tenantId, setTenantId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [city, setCity] = useState<string>('Bengaluru');
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string>('');
  const [checking, setChecking] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  // Initialize from searchParams or localStorage
  useEffect(() => {
    const qTenantId = searchParams?.get('tenantId') || '';
    const qEmail = searchParams?.get('email') || '';

    let localData: any = null;
    try {
      const stored = localStorage.getItem('saas_pending_registration');
      if (stored) localData = JSON.parse(stored);
    } catch {}

    const targetTenantId = qTenantId || localData?.tenantId || '';
    const targetEmail = qEmail || localData?.email || '';

    setTenantId(targetTenantId);
    setEmail(targetEmail);
    if (localData?.restaurantName) setRestaurantName(localData.restaurantName);
    if (localData?.city) setCity(localData.city);
    if (localData?.submittedAt) setSubmittedAt(localData.submittedAt);
  }, [searchParams]);

  // Real-time status fetcher
  const fetchStatus = useCallback(async () => {
    if (!tenantId && !email) return;
    setChecking(true);

    try {
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      else if (email) params.append('email', email);

      const res = await fetch(`/api/tenant/status?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          setStatus(data.status);
        }
        if (data.restaurantName) setRestaurantName(data.restaurantName);
        if (data.city) setCity(data.city);
        if (data.rejectionReason) setRejectionReason(data.rejectionReason);
        if (data.submittedAt) setSubmittedAt(data.submittedAt);
      }
    } catch (err) {
      console.warn('Status check warning:', err);
    } finally {
      setChecking(false);
      setLastChecked(new Date());
    }
  }, [tenantId, email]);

  // Polling every 3.5 seconds
  useEffect(() => {
    if (status === 'APPROVED') return;

    fetchStatus();
    const interval = setInterval(fetchStatus, 3500);
    return () => clearInterval(interval);
  }, [fetchStatus, status]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C1917] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#EA580C]/20">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-amber-500/10 via-orange-400/5 to-transparent blur-3xl opacity-70" />
      </div>

      <div className="max-w-xl w-full mx-auto space-y-6 relative z-10">
        {/* Brand header */}
        <div className="flex justify-center mb-2">
          <Link href="/" className="hover:opacity-90 transition">
            <ZipBillLogo size="md" variant="full" />
          </Link>
        </div>

        {/* Status Card Container */}
        <div className="bg-white rounded-3xl border border-[#E8E6E4] shadow-xl p-8 sm:p-10 text-center space-y-6 transition-all duration-300">
          {status === 'PENDING' ? (
            <>
              {/* Pulsing Pending Icon */}
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-amber-500/15 animate-ping" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100/60 border border-amber-300/80 text-[#D97706] flex items-center justify-center shadow-inner">
                  <Clock className="w-8 h-8" />
                </div>
              </div>

              {/* Status Header */}
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Request In Review</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight">
                  Registration Submitted
                </h1>
                <p className="text-sm text-[#78716C] max-w-md mx-auto leading-relaxed">
                  Your restaurant registration for{' '}
                  <strong className="text-[#1C1917] font-bold">
                    {restaurantName || 'Your Restaurant'}
                  </strong>{' '}
                  has been sent to the Platform Admin Panel on{' '}
                  <span className="font-mono font-semibold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
                    Port 9000
                  </span>
                  .
                </p>
              </div>

              {/* Detail Summary Card */}
              <div className="p-5 rounded-2xl bg-[#F8F7F4] border border-[#E8E6E4] text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-[#E8E6E4]/70">
                  <span className="text-[#78716C] flex items-center gap-1.5 font-medium">
                    <Store className="w-3.5 h-3.5 text-[#EA580C]" /> Restaurant Name:
                  </span>
                  <span className="text-[#1C1917] font-bold text-sm">
                    {restaurantName || 'Restaurant Account'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#78716C]">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#A8A29E]" /> Owner Email:
                  </span>
                  <span className="text-[#1C1917] font-semibold">{email || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center text-[#78716C]">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#A8A29E]" /> Location:
                  </span>
                  <span className="text-[#1C1917] font-medium">{city}, India</span>
                </div>

                <div className="flex justify-between items-center text-[#78716C]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#A8A29E]" /> Approval Stage:
                  </span>
                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Awaiting Super Admin
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#78716C] pt-1">
                  <span>Last Live Poll:</span>
                  <span className="font-mono text-[#A8A29E]">
                    {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Information Notice */}
              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/60 text-left flex items-start space-x-3 text-xs text-[#9A3412]">
                <Sparkles className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Workflow Rule:</strong> The Super Admin must review and click <strong>Approve</strong> in the Admin Control Plane (Port 9000). Until then, login to the workspace is restricted.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={fetchStatus}
                  disabled={checking}
                  className="w-full py-3 px-4 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                  <span>{checking ? 'Checking PostgreSQL Database...' : 'Check Approval Status Now'}</span>
                </button>

                {/* Direct Link to Admin Panel */}
                <div className="pt-2">
                  <a
                    href={
                      process.env.NEXT_PUBLIC_ADMIN_URL ||
                      (typeof window !== 'undefined' && window.location.hostname.includes('localhost')
                        ? 'http://localhost:9000'
                        : 'https://zipbill.vercel.app')
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#92400E] border border-amber-300/80 text-xs font-bold flex items-center justify-center space-x-2 transition"
                  >
                    <span>Open Admin Panel to Approve</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="pt-2 flex items-center justify-center space-x-4 text-xs text-[#78716C]">
                  <Link href="/login" className="hover:text-[#EA580C] font-semibold transition">
                    Already approved? Sign In
                  </Link>
                  <span>•</span>
                  <Link href="/" className="hover:text-[#1C1917] transition flex items-center gap-1">
                    <LogOut className="w-3 h-3" /> Back to Home
                  </Link>
                </div>
              </div>
            </>
          ) : status === 'APPROVED' ? (
            <>
              {/* APPROVED CELEBRATION STATE */}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center shadow-md animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Approved by Administrator</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight">
                  Congratulations! Restaurant Approved
                </h1>
                <p className="text-sm text-[#78716C] max-w-md mx-auto leading-relaxed">
                  Your restaurant workspace for <strong className="text-[#1C1917]">{restaurantName}</strong> has been officially approved and provisioned in the database.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Link
                  href="/dashboard"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Enter Restaurant Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href={`/onboarding?tenantId=${tenantId}&email=${encodeURIComponent(email)}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 border border-[#E8E6E4] text-[#1C1917] font-semibold text-xs flex items-center justify-center space-x-1.5 transition"
                >
                  <span>Optional: Customise in Setup Wizard</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* REJECTED STATE */}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-300 text-rose-600 flex items-center justify-center shadow-md">
                <XCircle className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                  <span>Application Rejected</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight">
                  Application Not Approved
                </h1>
                <p className="text-sm text-[#78716C] max-w-md mx-auto leading-relaxed">
                  The administrator was unable to approve this restaurant onboarding request.
                </p>
                {rejectionReason && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-left text-xs text-rose-900 mt-3">
                    <strong>Reason:</strong> {rejectionReason}
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-2">
                <Link
                  href="/register"
                  className="w-full py-3 px-4 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-bold flex items-center justify-center space-x-2"
                >
                  <span>Submit a New Application</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EA580C]" />
      </div>
    }>
      <PendingApprovalContent />
    </Suspense>
  );
}
