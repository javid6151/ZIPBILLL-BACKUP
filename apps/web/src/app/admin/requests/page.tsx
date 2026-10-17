'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Store, Loader2, RefreshCw } from 'lucide-react';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/admin/tenants');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.tenants || []);
      }
    } catch (e) {
      console.error('Error loading tenants:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // Auto-poll every 3.5 seconds so newly registered restaurants appear in real time
    const interval = setInterval(() => {
      loadRequests(true);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (tenantId: string, newStatus: 'APPROVED' | 'SUSPENDED') => {
    // 1. Instant optimistic UI update
    setRequests((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status: newStatus } : t))
    );
    setUpdatingId(tenantId);

    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenantId, status: newStatus }),
      });
      if (res.ok) {
        loadRequests(true);
      }
    } catch (err) {
      console.error('Failed to update tenant status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading tracking-tight">
            Tenant Status & Approval Queue
          </h1>
          <p className="text-sm text-secondary mt-1">
            Review live tenant workspaces, activate onboarding approvals, and manage tenant platform access
          </p>
        </div>
        <button
          onClick={() => loadRequests(false)}
          disabled={loading}
          className="btn-secondary text-xs px-3.5 py-2 flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      <div className="card p-6 space-y-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-muted">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Fetching tenant workspaces from PostgreSQL...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-secondary text-xs">
            No registration requests in database.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-5 rounded-xl border border-border bg-surface hover:border-primary/40 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Store className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-bold text-heading">{req.name}</h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary-light text-primary">
                      {req.businessType || 'RESTAURANT'}
                    </span>
                    <span className="text-[11px] font-mono text-secondary">
                      /{req.slug}
                    </span>
                  </div>
                  <p className="text-xs text-secondary">
                    Contact: <strong className="text-heading">{req.email || 'N/A'}</strong> {req.phone ? `• Phone: ${req.phone}` : ''}
                  </p>
                  <p className="text-xs text-secondary">
                    Plan: <strong className="text-heading">{req.plan}</strong> • Registered: {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {req.status === 'APPROVED' ? (
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>APPROVED</span>
                      </span>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'SUSPENDED')}
                        disabled={updatingId === req.id}
                        className="btn-secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 border border-red-200"
                      >
                        {updatingId === req.id ? 'Updating...' : 'Suspend'}
                      </button>
                    </div>
                  ) : req.status === 'SUSPENDED' ? (
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-800 text-xs font-semibold flex items-center space-x-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>SUSPENDED</span>
                      </span>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                        disabled={updatingId === req.id}
                        className="btn-primary text-xs px-3.5 py-1.5 flex items-center space-x-1"
                      >
                        {updatingId === req.id ? 'Updating...' : 'Re-Activate'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'SUSPENDED')}
                        disabled={updatingId === req.id}
                        className="btn-secondary text-xs px-3.5 py-1.5 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                        disabled={updatingId === req.id}
                        className="btn-primary text-xs px-4 py-1.5 flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{updatingId === req.id ? 'Approving...' : 'Approve Workspace'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
