'use client';

import React, { useEffect, useState } from 'react';
import { Store, Plus, Search, Loader2, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  status: string;
  plan: string;
  email?: string;
  createdAt: string;
}

export default function AdminRestaurantsPage() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadTenants = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/admin/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
    // Auto-poll every 3.5 seconds for real-time synchronization
    const interval = setInterval(() => {
      loadTenants(true);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    // 1. Instant optimistic update
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status: nextStatus } : t))
    );
    setUpdatingId(tenantId);

    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tenantId, status: nextStatus }),
      });
      if (res.ok) {
        loadTenants(true);
      }
    } catch (err) {
      console.error('Failed to toggle tenant status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading tracking-tight">Restaurant Tenants</h1>
          <p className="text-sm text-secondary mt-1">
            Global tenant provisioning, workspace management, and active status controls
          </p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center space-x-3 bg-surfaceMuted px-3.5 py-2 rounded-lg border border-border max-w-md">
          <Search className="w-4 h-4 text-placeholder" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant by name, slug, or email..."
            className="bg-transparent text-xs text-heading placeholder-placeholder focus:outline-none w-full"
          />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-muted">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Loading registered restaurants...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted">
              <Store className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No restaurants found</p>
              <p className="text-xs mt-1">New restaurant registrations will appear here dynamically.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-secondary font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Restaurant Name</th>
                  <th className="py-3 px-4">Domain / Slug</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-surfaceMuted transition">
                    <td className="py-3.5 px-4 font-bold text-heading">
                      <div>{tenant.name}</div>
                      {tenant.email && (
                        <div className="text-[11px] font-normal text-secondary">{tenant.email}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-secondary font-mono">/{tenant.slug}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-primary-light text-primary font-semibold">
                        {tenant.businessType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-heading">{tenant.plan}</td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                        disabled={updatingId === tenant.id}
                        title="Click to toggle status"
                        className={`px-2.5 py-1 rounded font-semibold text-[11px] cursor-pointer transition hover:opacity-80 ${
                          tenant.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tenant.status === 'SUSPENDED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {updatingId === tenant.id ? 'Updating...' : tenant.status}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <a
                        href={`/${tenant.slug}/dashboard`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary text-[11px] px-3 py-1 font-semibold inline-flex items-center space-x-1"
                      >
                        <span>Open Portal</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
