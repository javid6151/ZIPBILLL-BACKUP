'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/state';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  Volume2,
  Filter,
  Check,
  Flame,
} from 'lucide-react';
import { KitchenTicketStatus } from '@platform/types';

interface KdsTicket {
  id: string;
  orderNumber: string;
  tableNumber: string;
  orderType: string;
  elapsedMinutes: number;
  serverName: string;
  station: string;
  status: KitchenTicketStatus;
  items: Array<{ name: string; qty: number; notes?: string }>;
}

export default function KitchenKdsPage() {
  const { activeOrders, updateOrderStatus } = useApp();

  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [ticketOverrides, setTicketOverrides] = useState<Record<string, KitchenTicketStatus>>({});

  // Derive KDS tickets from real active orders — no fake data
  const tickets: KdsTicket[] = activeOrders
    .filter((o) => ['PLACED', 'PREPARING', 'READY', 'SERVED'].includes(o.status))
    .map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber || `ORD-${o.id.substring(0, 4).toUpperCase()}`,
      tableNumber: o.tableName || (o as any).table?.tableName || (o.tableId ? 'Dine-In Table' : 'Counter'),
      orderType: o.orderType === 'DINE_IN' || o.tableId ? 'Dine-In' : 'Takeaway',
      elapsedMinutes: Math.max(0, Math.floor((Date.now() - new Date(o.createdAt || Date.now()).getTime()) / 60000)),
      serverName: o.createdByWorkerName || (o as any).workerId || 'Cashier',
      station: 'Main Kitchen',
      status: (ticketOverrides[o.id] ||
        (o.status === 'PLACED' ? 'PENDING' : o.status === 'PREPARING' ? 'PREPARING' : o.status === 'READY' ? 'READY' : 'SERVED')
      ) as KitchenTicketStatus,
      items: (o.items || []).map((item: any) => ({
        name: item.itemName || item.name || 'Item',
        qty: item.quantity || item.qty || 1,
        notes: item.notes,
      })),
    }));

  const advanceStatus = async (ticketId: string) => {
    const current = tickets.find((t) => t.id === ticketId)?.status;
    const nextStatus: Record<KitchenTicketStatus, KitchenTicketStatus> = {
      PENDING: 'ACCEPTED',
      ACCEPTED: 'PREPARING',
      PREPARING: 'READY',
      READY: 'SERVED',
      SERVED: 'SERVED',
      CANCELLED: 'CANCELLED',
    };
    if (current) {
      const next = nextStatus[current];
      setTicketOverrides((prev) => ({ ...prev, [ticketId]: next }));

      const orderStatusMap: Record<KitchenTicketStatus, any> = {
        PENDING: 'PLACED',
        ACCEPTED: 'PREPARING',
        PREPARING: 'PREPARING',
        READY: 'READY',
        SERVED: 'SERVED',
        CANCELLED: 'CANCELLED',
      };
      const newOrderStatus = orderStatusMap[next];
      if (newOrderStatus) {
        await updateOrderStatus(ticketId, newOrderStatus);
      }
    }
  };

  const filteredTickets = tickets.filter(
    (t) => selectedStation === 'ALL' || t.station === selectedStation
  );

  return (
    <div className="p-8 sm:p-10 max-w-[1400px] mx-auto space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-borderLight">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold text-heading tracking-tight leading-tight flex items-center space-x-2">
            <span>Kitchen Display System (KDS)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-success" />
          </h1>
          <p className="text-[14px] text-secondary mt-1">
            Live Station Dispatch • Real-time order routing
          </p>
        </div>

        {/* Station Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto bg-surface border border-border p-1 rounded-xl">
          {['ALL', 'Main Kitchen', 'Grill & Tandoor', 'Beverage & Dessert'].map((station) => (
            <button
              key={station}
              onClick={() => setSelectedStation(station)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedStation === station
                  ? 'bg-primary-light text-primary font-semibold'
                  : 'text-secondary hover:text-main'
              }`}
            >
              {station === 'ALL' ? 'All Stations' : station}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Grid or Empty State */}
      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => {
            const isDelayed = ticket.elapsedMinutes > 15;
            return (
              <div
                key={ticket.id}
                className={`card flex flex-col justify-between transition-all duration-150 ${
                  ticket.status === 'READY'
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : isDelayed
                    ? 'border-red-300 bg-red-50/20'
                    : 'hover:border-placeholder'
                }`}
              >
                <div>
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-borderLight">
                    <div>
                      <h3 className="text-base font-semibold text-heading">{ticket.tableNumber}</h3>
                      <span className="text-xs text-muted">
                        {ticket.orderNumber} • {ticket.orderType}
                      </span>
                    </div>
                    <div
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isDelayed
                          ? 'bg-danger-bg text-danger'
                          : 'bg-surfaceMuted text-secondary border border-borderLight'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{ticket.elapsedMinutes}m</span>
                    </div>
                  </div>

                  {/* Server / Station Info */}
                  <div className="py-2.5 flex items-center justify-between text-xs text-muted border-b border-borderLight">
                    <span>Server: <strong className="text-secondary">{ticket.serverName}</strong></span>
                    <span className="font-semibold text-primary">{ticket.station}</span>
                  </div>

                  {/* Line Items */}
                  <div className="py-3 space-y-2">
                    {ticket.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between text-sm">
                        <div className="flex items-start space-x-2">
                          <span className="w-5 h-5 rounded-md bg-primary-soft text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {item.qty}
                          </span>
                          <div>
                            <span className="font-medium text-heading text-[13px]">{item.name}</span>
                            {item.notes && (
                              <span className="block text-[11px] text-danger font-medium">
                                Note: {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Action Button */}
                <div className="pt-3 border-t border-borderLight">
                  <button
                    type="button"
                    onClick={() => advanceStatus(ticket.id)}
                    disabled={ticket.status === 'SERVED'}
                    className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-1.5 transition ${
                      ticket.status === 'READY'
                        ? 'bg-success text-white hover:bg-emerald-700'
                        : ticket.status === 'PREPARING'
                        ? 'bg-primary text-white hover:bg-primary-hover shadow-button'
                        : ticket.status === 'SERVED'
                        ? 'bg-surfaceMuted text-muted cursor-not-allowed'
                        : 'btn-secondary w-full'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {ticket.status === 'PENDING' && 'Accept Order'}
                      {ticket.status === 'ACCEPTED' && 'Start Preparation'}
                      {ticket.status === 'PREPARING' && 'Mark Ready'}
                      {ticket.status === 'READY' && 'Serve to Table'}
                      {ticket.status === 'SERVED' && 'Order Served'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-16 text-center space-y-4">
          <ChefHat className="w-14 h-14 text-placeholder mx-auto" />
          <h3 className="font-semibold text-lg text-heading">Kitchen is All Clear</h3>
          <p className="text-sm text-secondary max-w-sm mx-auto">
            No active kitchen tickets right now. Orders placed from the POS will appear here in real-time.
          </p>
        </div>
      )}
    </div>
  );
}
