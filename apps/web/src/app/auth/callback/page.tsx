'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/lib/state';
import { Loader2, ArrowRight } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { session, setSession, setProfile, setBusinessType, setCurrentTenant } = useApp();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const syncInProgress = useRef(false);

  useEffect(() => {
    async function processUser(authUser: any) {
      if (syncInProgress.current) return;
      syncInProgress.current = true;

      try {
        const userEmail = authUser.email || '';
        const userName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          userEmail.split('@')[0] ||
          'Restaurant Owner';

        const savedTableCount =
          typeof window !== 'undefined' ? localStorage.getItem('saas_selected_table_count') : null;

        // Synchronize with PostgreSQL database to create or retrieve clean workspace
        const res = await fetch('/api/auth/oauth-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: authUser.id,
            email: userEmail,
            fullName: userName,
            tableCount: savedTableCount ? Number(savedTableCount) : 8,
          }),
        });

        const data = await res.json();
        if (!res.ok && !data.redirect) {
          throw new Error(data.error || 'Failed to initialize restaurant workspace.');
        }

        const targetUrl = data.redirect || '/dashboard';

        // 1. If user needs to complete setup wizard:
        if (targetUrl.includes('/onboarding')) {
          if (typeof window !== 'undefined') {
            document.cookie = 'saas_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
            try {
              localStorage.removeItem('saas_session_active');
              if (data.tenant) localStorage.setItem('saas_active_tenant', JSON.stringify(data.tenant));
              if (data.profile) localStorage.setItem('saas_active_profile', JSON.stringify(data.profile));
              localStorage.setItem(
                'saas_pending_registration',
                JSON.stringify({
                  tenantId: data.tenantId || data.tenant?.id,
                  email: userEmail,
                  restaurantName: data.tenant?.name || `${userName}'s Restaurant`,
                  submittedAt: new Date().toISOString(),
                  onboardingCompleted: false,
                })
              );
            } catch {}
            window.location.replace(targetUrl);
          } else {
            router.replace(targetUrl);
          }
          return;
        }

        // 2. If tenant application is awaiting admin review after completing onboarding
        if (targetUrl.includes('/pending-approval')) {
          if (typeof window !== 'undefined') {
            document.cookie = 'saas_session_active=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
            try {
              localStorage.removeItem('saas_session_active');
              if (data.tenant) localStorage.setItem('saas_active_tenant', JSON.stringify(data.tenant));
              if (data.profile) localStorage.setItem('saas_active_profile', JSON.stringify(data.profile));
              localStorage.setItem(
                'saas_pending_registration',
                JSON.stringify({
                  tenantId: data.tenantId || data.tenant?.id,
                  email: userEmail,
                  restaurantName: data.tenant?.name || `${userName}'s Restaurant`,
                  submittedAt: new Date().toISOString(),
                  onboardingCompleted: true,
                })
              );
            } catch {}
            window.location.replace(targetUrl);
          } else {
            router.replace(targetUrl);
          }
          return;
        }

        // 3. Tenant is APPROVED by administrator AND Onboarding is Completed
        const activeTenant = data.tenant;
        const activeProfile = data.profile || (activeTenant ? {
          id: `prof-${activeTenant.id}`,
          tenantId: activeTenant.id,
          businessName: activeTenant.name,
          phone: '',
          email: userEmail,
          city: 'Bengaluru',
          state: 'Karnataka',
          address: 'Main Road',
          country: 'IN',
          currencyCode: 'INR',
          currencySymbol: '₹',
          timezone: 'Asia/Kolkata',
          onboardingCompleted: data.onboardingCompleted ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } : null);

        const dbUser = data.user;

        const activeSessionObj = {
          ...session,
          userId: authUser.id,
          tenantId: activeTenant?.id || dbUser?.tenantId || '',
          email: userEmail,
          fullName: dbUser?.fullName || userName,
          roleName: 'OWNER',
          permissions: ['*'],
        };

        // Guarantee immediate synchronous persistence in localStorage and cookies for APPROVED users
        if (typeof window !== 'undefined') {
          try {
            document.cookie = 'saas_session_active=true; path=/; max-age=604800; SameSite=Lax';
            localStorage.setItem('saas_active_session', JSON.stringify(activeSessionObj));
            if (activeProfile) {
              localStorage.setItem('saas_active_profile', JSON.stringify(activeProfile));
            }
            if (activeTenant) {
              localStorage.setItem('saas_active_tenant', JSON.stringify(activeTenant));
            }
            localStorage.setItem('saas_active_business_type', activeTenant?.businessType || 'RESTAURANT');
          } catch (storageErr) {
            console.warn('LocalStorage error:', storageErr);
          }
        }

        if (activeProfile) {
          setProfile(activeProfile);
        }
        if (activeTenant) {
          setCurrentTenant(activeTenant);
          if (activeTenant.businessType) {
            setBusinessType(activeTenant.businessType);
          }
        }
        setSession(activeSessionObj);

        // Direct user to target URL (/dashboard)
        if (typeof window !== 'undefined') {
          window.location.replace(targetUrl);
        } else {
          router.replace(targetUrl);
        }
      } catch (err: any) {
        console.error('OAuth sync error:', err);
        setErrorMsg(err.message || 'Authentication callback failed');
        syncInProgress.current = false;
      }
    }

    async function handleAuth() {
      try {
        if (typeof window !== 'undefined') {
          // 1. Handle code in search params
          if (window.location.search) {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            if (code) {
              try {
                const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
                if (data?.session?.user) {
                  await processUser(data.session.user);
                  return;
                }
              } catch (exErr) {
                console.warn('Code exchange fallback:', exErr);
              }
            }
          }

          // 2. Handle hash fragment tokens
          if (window.location.hash.includes('access_token')) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            if (accessToken && refreshToken) {
              try {
                const { data, error: setErr } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken,
                });
                if (data?.session?.user) {
                  await processUser(data.session.user);
                  return;
                }
              } catch (setHashErr) {
                console.warn('Hash token exchange error:', setHashErr);
              }
            }
          }
        }

        // 3. Fallback to existing session
        const {
          data: { session: supaSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (supaSession?.user) {
          await processUser(supaSession.user);
        } else {
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, authSession) => {
              if (authSession?.user) {
                await processUser(authSession.user);
              }
            }
          );

          return () => {
            authListener.subscription.unsubscribe();
          };
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Authentication callback failed');
      }
    }

    handleAuth();
  }, [router, session, setSession, setProfile, setBusinessType, setCurrentTenant]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] px-4 font-sans">
        <div className="bg-white rounded-2xl border border-[#E8E6E4] p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 text-[#EA580C] flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-[#1C1917]">Authentication Complete</h2>
          <p className="text-xs text-[#78716C] leading-relaxed">{errorMsg}</p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.location.replace('/dashboard');
              }}
              className="w-full py-2.5 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <a href="/login" className="text-xs text-[#78716C] hover:text-[#1C1917] hover:underline py-1">
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB] font-sans">
      <div className="flex flex-col items-center space-y-4 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#EA580C]" />
        <div>
          <h2 className="text-lg font-bold text-[#1C1917]">Authenticating Account...</h2>
          <p className="text-xs text-[#78716C] mt-1">Setting up your restaurant workspace and opening setup wizard...</p>
        </div>
      </div>
    </div>
  );
}
