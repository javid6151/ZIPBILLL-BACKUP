'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/state';

export default function RootPage() {
  const router = useRouter();
  const { session, profile } = useApp();

  useEffect(() => {
    // If redirected to root with OAuth tokens or code, forward to callback immediately!
    if (typeof window !== 'undefined') {
      if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
        router.replace(`/auth/callback${window.location.search}${window.location.hash}`);
        return;
      }
    }

    let savedProfile: any = null;
    let savedSession: any = null;
    if (typeof window !== 'undefined') {
      try {
        const rawP = localStorage.getItem('saas_active_profile');
        if (rawP) savedProfile = JSON.parse(rawP);
        const rawS = localStorage.getItem('saas_active_session');
        if (rawS) savedSession = JSON.parse(rawS);
      } catch {}
    }

    const hasCookie = typeof document !== 'undefined' && document.cookie.includes('saas_session_active=true');
    const hasValidSession = Boolean(
      (savedSession?.userId && savedSession.userId !== 'usr-owner-01') ||
      (session?.userId && session.userId !== 'usr-owner-01') ||
      hasCookie
    );

    if (hasValidSession) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [session, profile, router]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center font-sans">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-secondary">Redirecting to login...</p>
      </div>
    </div>
  );
}
