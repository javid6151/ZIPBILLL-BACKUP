'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Store,
  ChefHat,
  Calculator,
  LayoutGrid,
  ClipboardList,
  Utensils,
  Coffee,
  Package,
  Users,
  BarChart3,
  Settings,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Printer,
  QrCode,
  CreditCard,
  Banknote,
  Search,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Shield,
  Smartphone,
  Tablet,
  Laptop,
  Mail,
  Lock,
  Eye,
  Camera,
  Upload,
  Check,
  X,
  Bell,
  Sparkles,
  RefreshCw,
  Share2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { SCREENS, PHASES, ScreenDefinition } from '@/lib/screens-data';

export function ScreenRenderer({ screenId, onNavigate }: { screenId: string; onNavigate?: (id: string) => void }) {
  const currentScreen = SCREENS.find((s) => s.id === screenId) || SCREENS[0];
  const num = currentScreen.number;

  // Render the specific screen based on number 1 to 52
  return (
    <div className="w-full max-w-4xl mx-auto bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden min-h-[580px] flex flex-col">
      {/* Screen Frame Header */}
      <div className="bg-surfaceElevated px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-md bg-primary text-white font-bold text-xs flex items-center justify-center font-mono">
            {currentScreen.id}
          </span>
          <span className="font-bold text-sm text-white">{currentScreen.title}</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface text-slate-300 border border-border">
            {currentScreen.phaseName}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
        </div>
      </div>

      {/* Screen Body */}
      <div className="flex-1 p-6 overflow-y-auto bg-background flex flex-col justify-center">
        {renderScreenContent(currentScreen, onNavigate)}
      </div>
    </div>
  );
}

function renderScreenContent(currentScreen: ScreenDefinition, onNav?: (id: string) => void) {
  const num = currentScreen.number;
  // Phase 1: Screens 1 to 6
  if (num === 1) {
    return (
      <div className="text-center py-12 px-4 max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-amber-500 mx-auto flex items-center justify-center shadow-2xl shadow-primary/40 mb-6">
          <ChefHat className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">RestoPro</h1>
        <p className="text-sm text-slate-400 mt-2 font-medium">Smart POS for Every Restaurant</p>
        <div className="mt-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <button
          onClick={() => onNav?.('02')}
          className="mt-6 text-xs text-primary font-bold hover:underline"
        >
          Tap to continue →
        </button>
      </div>
    );
  }

  if (num === 2) {
    return (
      <div className="text-center py-8 px-4 max-w-md mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary mx-auto flex items-center justify-center border border-primary/30">
          <Store className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">RestoPro</h2>
          <h3 className="text-lg font-semibold text-primary mt-1">Complete Restaurant Management Solution</h3>
          <p className="text-xs text-slate-400 mt-2">
            POS • Billing • Kitchen • Inventory • Reports • Cloud SaaS
          </p>
        </div>
        <div className="space-y-3 pt-4">
          <button
            onClick={() => onNav?.('04')}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/25 transition tap-effect"
          >
            Get Started
          </button>
          <button
            onClick={() => onNav?.('03')}
            className="w-full py-3 rounded-xl bg-surfaceElevated hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-border transition"
          >
            Sign In / Login
          </button>
        </div>
      </div>
    );
  }

  if (num === 3) {
    return (
      <div className="max-w-sm mx-auto w-full space-y-5">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to your restaurant account</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
            <input
              type="email"
              defaultValue="owner@spicegarden.com"
              className="w-full bg-surfaceElevated border border-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <input
              type="password"
              defaultValue="••••••••••••"
              className="w-full bg-surfaceElevated border border-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center space-x-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-600" />
              <span>Remember me</span>
            </label>
            <a href="#" className="text-primary hover:underline">Forgot password?</a>
          </div>
          <button
            onClick={() => onNav?.('27')}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary-hover transition"
          >
            Login
          </button>
          <div className="relative text-center my-3">
            <span className="text-[11px] text-slate-500 uppercase px-2 bg-background">or continue with</span>
          </div>
          <button
            onClick={() => onNav?.('27')}
            className="w-full py-2.5 rounded-xl bg-surfaceElevated border border-border text-xs font-semibold text-white flex items-center justify-center space-x-2 hover:bg-slate-700 transition"
          >
            <span>Google Login</span>
          </button>
        </div>
      </div>
    );
  }

  if (num === 4) {
    return (
      <div className="max-w-sm mx-auto w-full space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Create Your Account</h2>
          <p className="text-xs text-slate-400 mt-1">Start your restaurant journey</p>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Full Name"
            defaultValue="Rajesh Kumar"
            className="w-full bg-surfaceElevated border border-border rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
          />
          <input
            type="email"
            placeholder="Email Address"
            defaultValue="rajesh@spicegarden.com"
            className="w-full bg-surfaceElevated border border-border rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            defaultValue="Password123"
            className="w-full bg-surfaceElevated border border-border rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            defaultValue="Password123"
            className="w-full bg-surfaceElevated border border-border rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
          />
          <button
            onClick={() => onNav?.('05')}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary-hover transition"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  if (num === 5) {
    return (
      <div className="text-center max-w-sm mx-auto space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/30">
          <Mail className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Verify Your Email</h2>
          <p className="text-xs text-slate-400 mt-2">
            We've sent a verification link to <strong>rajesh@spicegarden.com</strong>.
          </p>
        </div>
        <div className="space-y-2.5">
          <button
            onClick={() => onNav?.('06')}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25"
          >
            Open Email App
          </button>
          <button className="text-xs text-slate-400 hover:text-white">Resend Email</button>
        </div>
      </div>
    );
  }

  if (num === 6) {
    return (
      <div className="max-w-md mx-auto w-full space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
          <Clock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Registration Submitted</h2>
          <p className="text-xs text-slate-400 mt-1">
            Your business registration is under review. This usually takes 1-2 business days.
          </p>
        </div>
        {/* Timeline */}
        <div className="p-4 rounded-xl bg-surfaceElevated border border-border text-left space-y-3">
          <div className="flex items-center space-x-3">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
            <span className="text-xs font-semibold text-white">Submitted</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold animate-pulse">●</span>
            <span className="text-xs font-semibold text-primary">Under Review</span>
          </div>
          <div className="flex items-center space-x-3 opacity-50">
            <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center text-xs">3</span>
            <span className="text-xs text-slate-400">Approval Pending</span>
          </div>
        </div>
        <button
          onClick={() => onNav?.('07')}
          className="w-full py-3 rounded-xl bg-surfaceElevated border border-border text-slate-200 text-xs font-bold hover:bg-slate-700"
        >
          Check Super Admin Review →
        </button>
      </div>
    );
  }

  // Phase 2: Super Admin (Screens 7 to 10)
  if (num === 7) {
    return (
      <div className="max-w-sm mx-auto w-full space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center border border-indigo-500/30 mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Admin Portal</h2>
          <p className="text-xs text-slate-400">Sign in to Super Admin</p>
        </div>
        <div className="space-y-3">
          <input
            type="email"
            defaultValue="admin@platform.pos"
            className="w-full bg-surfaceElevated border border-border rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
          />
          <input
            type="password"
            defaultValue="••••••••••••"
            className="w-full bg-surfaceElevated border border-border rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
          />
          <button
            onClick={() => onNav?.('08')}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
          >
            Login to Admin Portal
          </button>
        </div>
      </div>
    );
  }

  if (num === 8) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="font-bold text-base text-white">Super Admin Dashboard</h3>
          <span className="text-xs text-indigo-400 font-mono">Platform v2.4</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border text-center">
            <span className="text-[11px] text-slate-400">Total Businesses</span>
            <div className="text-2xl font-bold text-white mt-1">128</div>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border text-center">
            <span className="text-[11px] text-amber-400 font-semibold">Pending</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">12</div>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border text-center">
            <span className="text-[11px] text-emerald-400 font-semibold">Approved</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">96</div>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border text-center">
            <span className="text-[11px] text-rose-400 font-semibold">Rejected</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">8</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surfaceElevated border border-border">
          <span className="text-xs font-semibold text-slate-300">Tenant Growth & MRR</span>
          <div className="h-24 flex items-end justify-between gap-2 mt-3 pt-4 border-t border-border">
            {[40, 65, 80, 55, 90, 110, 128].map((h, i) => (
              <div key={i} className="flex-1 bg-indigo-600/80 hover:bg-indigo-500 rounded-t transition" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <button
          onClick={() => onNav?.('09')}
          className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md"
        >
          View Pending Registration Requests (12) →
        </button>
      </div>
    );
  }

  if (num === 9) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="font-bold text-base text-white">Registration Requests</h3>
          <div className="flex space-x-1.5 text-xs">
            <button className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold">Pending (12)</button>
            <button className="px-2.5 py-1 rounded-lg bg-surfaceElevated text-slate-300">Approved</button>
            <button className="px-2.5 py-1 rounded-lg bg-surfaceElevated text-slate-300">Rejected</button>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { name: 'Spice Garden', type: 'Restaurant', owner: 'Rajesh Kumar', date: 'Today' },
            { name: 'Cafe Bliss', type: 'Cafe', owner: 'Anita Roy', date: 'Yesterday' },
            { name: 'Tasty Bites', type: 'Fast Food', owner: 'Mohan Lal', date: '2 days ago' },
            { name: 'Royal Kitchen', type: 'Cloud Kitchen', owner: 'Farhan Khan', date: '3 days ago' },
          ].map((req, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-surfaceElevated border border-border flex items-center justify-between"
            >
              <div>
                <h4 className="font-semibold text-xs text-white">{req.name}</h4>
                <p className="text-[11px] text-slate-400">{req.type} • {req.owner} • {req.date}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNav?.('10')}
                  className="px-3 py-1.5 rounded-lg bg-surface text-slate-200 text-xs font-medium hover:bg-slate-700"
                >
                  View
                </button>
                <button
                  onClick={() => onNav?.('11')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 shadow-sm"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (num === 10) {
    return (
      <div className="max-w-md mx-auto w-full space-y-4">
        <div className="p-4 rounded-xl bg-surfaceElevated border border-border">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-bold text-base text-white">Spice Garden</h3>
              <span className="text-xs text-primary font-medium">Fine Dining Restaurant</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Pending Approval
            </span>
          </div>
          <div className="space-y-2 py-3 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Owner Name:</span>
              <span className="text-white font-medium">Rajesh Kumar</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Phone:</span>
              <span className="text-white font-medium">+91 98765 43210</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Email:</span>
              <span className="text-white font-medium">rajesh@spicegarden.com</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>GST / Tax ID:</span>
              <span className="text-white font-mono">29ABCDE1234F1Z5</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimated Tables:</span>
              <span className="text-white font-medium">20 Tables</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNav?.('09')}
            className="py-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-600/40 text-xs font-bold hover:bg-rose-600/30"
          >
            Reject Request
          </button>
          <button
            onClick={() => onNav?.('11')}
            className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
          >
            Approve & Onboard
          </button>
        </div>
      </div>
    );
  }

  // Phase 3: Smart Onboarding (Screens 11 to 26)
  if (num === 11) {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white">What type of business do you operate?</h3>
          <p className="text-xs text-slate-400 mt-1">We will customize your modules, POS layout, and features automatically</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: 'Restaurant', icon: Utensils, selected: true },
            { name: 'Cafe', icon: Coffee },
            { name: 'Bakery', icon: Store },
            { name: 'Fast Food', icon: Calculator },
            { name: 'Cloud Kitchen', icon: ChefHat },
            { name: 'Bar', icon: LayoutGrid },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border text-center cursor-pointer transition flex flex-col items-center justify-center ${
                item.selected
                  ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-surfaceElevated border-border text-slate-300 hover:border-slate-500'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 border border-primary/20">
                <item.icon className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="font-semibold text-xs">{item.name}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => onNav?.('12')}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25"
        >
          Next: Restaurant Info →
        </button>
      </div>
    );
  }

  if (num === 12) {
    return (
      <div className="max-w-md mx-auto space-y-3">
        <h3 className="text-lg font-bold text-white text-center">Tell us about your business</h3>
        <input type="text" defaultValue="Spice Garden" placeholder="Business Name" className="w-full bg-surfaceElevated border border-border rounded-xl px-3 py-2 text-xs text-white outline-none" />
        <input type="text" defaultValue="+91 98765 43210" placeholder="Phone Number" className="w-full bg-surfaceElevated border border-border rounded-xl px-3 py-2 text-xs text-white outline-none" />
        <input type="email" defaultValue="contact@spicegarden.com" placeholder="Email" className="w-full bg-surfaceElevated border border-border rounded-xl px-3 py-2 text-xs text-white outline-none" />
        <input type="text" defaultValue="104 MG Road" placeholder="Address" className="w-full bg-surfaceElevated border border-border rounded-xl px-3 py-2 text-xs text-white outline-none" />
        <div className="grid grid-cols-2 gap-2">
          <input type="text" defaultValue="Bengaluru" placeholder="City" className="w-full bg-surfaceElevated border border-border rounded-xl px-3 py-2 text-xs text-white outline-none" />
          <input type="text" defaultValue="Karnataka" placeholder="State" className="w-full bg-surfaceElevated border border-border rounded-xl px-3 py-2 text-xs text-white outline-none" />
        </div>
        <button
          onClick={() => onNav?.('13')}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 mt-2"
        >
          Next: Services →
        </button>
      </div>
    );
  }

  if (num === 13) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h3 className="text-lg font-bold text-white text-center">What services do you offer?</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: 'Dine-In', desc: 'Table management & service', checked: true },
            { title: 'Takeaway', desc: 'Counter pickup & parcels', checked: true },
            { title: 'Delivery', desc: 'Direct rider dispatch', checked: false },
            { title: 'Online Orders', desc: 'Website & QR ordering', checked: true },
          ].map((s, i) => (
            <div key={i} className={`p-4 rounded-xl border text-left cursor-pointer ${s.checked ? 'bg-primary/10 border-primary' : 'bg-surfaceElevated border-border'}`}>
              <div className="font-bold text-sm text-white">{s.title}</div>
              <div className="text-xs text-slate-400 mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
        <button onClick={() => onNav?.('14')} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25">
          Next: Modules →
        </button>
      </div>
    );
  }

  if (num === 14) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <h3 className="text-lg font-bold text-white text-center">Select the modules you need</h3>
        <div className="grid grid-cols-2 gap-3">
          {['POS', 'Tables', 'Kitchen / KOT', 'Inventory', 'Customers', 'Reports'].map((m, i) => (
            <div key={i} className="p-3 rounded-xl bg-surfaceElevated border border-primary/60 flex items-center justify-between">
              <span className="font-semibold text-xs text-white">{m}</span>
              <span className="w-5 h-5 rounded bg-primary text-white text-xs flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </span>
            </div>
          ))}
        </div>
        <button onClick={() => onNav?.('15')} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25">
          Next: Tables →
        </button>
      </div>
    );
  }

  if (num === 15) {
    return (
      <div className="max-w-md mx-auto space-y-5 text-center">
        <h3 className="text-lg font-bold text-white">How many tables do you have?</h3>
        <div className="flex items-center justify-center space-x-4">
          <button className="w-12 h-12 rounded-2xl bg-surfaceElevated border border-border text-white text-xl font-bold">-</button>
          <span className="text-4xl font-extrabold text-primary font-mono">20</span>
          <button className="w-12 h-12 rounded-2xl bg-surfaceElevated border border-border text-white text-xl font-bold">+</button>
        </div>
        <div className="p-3 rounded-xl bg-surfaceElevated border border-border text-xs text-slate-300">
          Will automatically generate Table 1 through Table 20.
        </div>
        <button onClick={() => onNav?.('16')} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25">
          Next: Table Sections →
        </button>
      </div>
    );
  }

  if (num === 16) {
    return (
      <div className="max-w-md mx-auto space-y-3">
        <h3 className="text-lg font-bold text-white text-center">Create Table Sections</h3>
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border flex justify-between text-xs text-white">
            <span>Indoor Section</span>
            <span className="font-bold text-primary">10 Tables</span>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border flex justify-between text-xs text-white">
            <span>Outdoor Terrace</span>
            <span className="font-bold text-primary">6 Tables</span>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border flex justify-between text-xs text-white">
            <span>VIP Hall</span>
            <span className="font-bold text-primary">4 Tables</span>
          </div>
        </div>
        <button onClick={() => onNav?.('17')} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 mt-4">
          Next: Staff Setup →
        </button>
      </div>
    );
  }

  if (num === 17) {
    return (
      <div className="max-w-md mx-auto space-y-4 text-center">
        <h3 className="text-lg font-bold text-white">How many staff members?</h3>
        <div className="text-3xl font-bold text-primary font-mono">6 Workers</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-surfaceElevated border border-border text-slate-200">1 Owner</div>
          <div className="p-2.5 rounded-lg bg-surfaceElevated border border-border text-slate-200">1 Manager</div>
          <div className="p-2.5 rounded-lg bg-surfaceElevated border border-border text-slate-200">3 Waiters</div>
          <div className="p-2.5 rounded-lg bg-surfaceElevated border border-border text-slate-200">1 Chef / Kitchen</div>
        </div>
        <button onClick={() => onNav?.('18')} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25">
          Next: Roles & Permissions →
        </button>
      </div>
    );
  }

  if (num === 18) {
    return (
      <div className="max-w-md mx-auto space-y-3">
        <h3 className="text-lg font-bold text-white text-center">Configure Permissions</h3>
        <div className="p-3 rounded-xl bg-surfaceElevated border border-border text-xs space-y-2">
          <div className="font-bold text-primary pb-1 border-b border-border">Waiter Role Permissions:</div>
          <label className="flex items-center space-x-2 text-slate-300">
            <input type="checkbox" defaultChecked /> <span>View Tables</span>
          </label>
          <label className="flex items-center space-x-2 text-slate-300">
            <input type="checkbox" defaultChecked /> <span>Create & Edit Orders</span>
          </label>
          <label className="flex items-center space-x-2 text-slate-300">
            <input type="checkbox" defaultChecked /> <span>Send KOT to Kitchen</span>
          </label>
          <label className="flex items-center space-x-2 text-slate-500">
            <input type="checkbox" disabled /> <span>Cancel Bills / Refund (Manager Only)</span>
          </label>
        </div>
        <button onClick={() => onNav?.('19')} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25">
          Next: Device Assignment →
        </button>
      </div>
    );
  }

  if (num === 19) {
    return (
      <div className="max-w-md mx-auto space-y-3">
        <h3 className="text-lg font-bold text-white text-center">Add Worker Device</h3>
        <div className="space-y-2 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Assigned Worker</label>
            <input type="text" defaultValue="Ramesh (Waiter)" className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-white" />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Device Platform</label>
            <input type="text" defaultValue="Android Phone / Tablet" className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-white" />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Device ID</label>
            <input type="text" defaultValue="DEV-RAMESH-01" className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 font-mono text-white" />
          </div>
        </div>
        <button onClick={() => onNav?.('20')} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 mt-2">
          Next: Menu Categories →
        </button>
      </div>
    );
  }

  if (num === 20) {
    return (
      <div className="max-w-md mx-auto space-y-3">
        <h3 className="text-lg font-bold text-white text-center">Create Menu Categories</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {['Starters', 'Main Course', 'Biryani Specials', 'Breads & Rice', 'Beverages', 'Desserts'].map((c, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-surfaceElevated border border-border text-white font-semibold flex justify-between items-center">
              <span>{c}</span>
              <span className="text-slate-500 text-[10px]">#0{i + 1}</span>
            </div>
          ))}
        </div>
        <button onClick={() => onNav?.('21')} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 mt-3">
          Next: AI Menu Import →
        </button>
      </div>
    );
  }

  if (num === 21) {
    return (
      <div className="max-w-md mx-auto space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary mx-auto flex items-center justify-center border border-primary/30">
          <Camera className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white">Import Menu with AI</h3>
        <p className="text-xs text-slate-400">
          Snap a photo of your printed restaurant menu card. Gemini OCR will extract all dishes, prices, and categories automatically.
        </p>
        <div className="border-2 border-dashed border-border rounded-2xl p-6 bg-surfaceElevated/50 flex flex-col items-center">
          <Upload className="w-8 h-8 text-primary mb-2" />
          <span className="text-xs font-semibold text-white">Upload Menu Photo (JPG/PNG)</span>
          <span className="text-[10px] text-slate-500 mt-1">Simulated card: "menu-sample.jpg"</span>
        </div>
        <button onClick={() => onNav?.('22')} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25">
          Scan & Review AI Results →
        </button>
      </div>
    );
  }

  if (num === 22) {
    return (
      <div className="max-w-md mx-auto space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="text-base font-bold text-white">Review AI Menu Ingestion</h3>
          <span className="text-xs text-emerald-400 font-semibold">3 Items Extracted</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border flex justify-between items-center">
            <div>
              <div className="font-bold text-white">Chicken Biryani</div>
              <div className="text-slate-400">Category: Biryani Specials</div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-emerald-400">₹250</span>
              <button className="text-[10px] px-2 py-1 rounded bg-surface border border-border text-slate-300">Edit</button>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border flex justify-between items-center">
            <div>
              <div className="font-bold text-white">Mutton Biryani</div>
              <div className="text-slate-400">Category: Biryani Specials</div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-emerald-400">₹320</span>
              <button className="text-[10px] px-2 py-1 rounded bg-surface border border-border text-slate-300">Edit</button>
            </div>
          </div>
        </div>
        <button onClick={() => onNav?.('24')} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/30">
          Confirm & Import to Catalog →
        </button>
      </div>
    );
  }

  if (num === 23) {
    return (
      <div className="max-w-md mx-auto space-y-3">
        <h3 className="text-base font-bold text-white text-center">Manual Menu Setup</h3>
        <input type="text" placeholder="Dish Name" defaultValue="Paneer Tikka" className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-xs text-white" />
        <input type="number" placeholder="Price (INR)" defaultValue="220" className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-xs text-white" />
        <select className="w-full bg-surfaceElevated border border-border rounded-xl p-2.5 text-xs text-white">
          <option>Starters</option>
          <option>Main Course</option>
        </select>
        <button onClick={() => onNav?.('24')} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25">
          Save Item & Next →
        </button>
      </div>
    );
  }

  if (num === 24) {
    return (
      <div className="max-w-md mx-auto space-y-3">
        <h3 className="text-base font-bold text-white text-center">Configure Billing Settings</h3>
        <div className="p-4 rounded-xl bg-surfaceElevated border border-border space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-white">Enable GST / Tax</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white">Default Tax Rate</span>
            <span className="font-mono font-bold text-primary">5%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white">Service Charge (Optional)</span>
            <input type="checkbox" className="rounded" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white">Bill Prefix</span>
            <span className="font-mono text-white">INV-</span>
          </div>
        </div>
        <button onClick={() => onNav?.('25')} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25">
          Next: Printer Setup →
        </button>
      </div>
    );
  }

  if (num === 25) {
    return (
      <div className="max-w-md mx-auto space-y-3 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary mx-auto flex items-center justify-center">
          <Printer className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">Connect Thermal Printer</h3>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-surfaceElevated border border-primary text-white font-semibold">
            <span>Bluetooth</span>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border text-slate-400">
            <span>USB Raw</span>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border text-slate-400">
            <span>LAN Port 9100</span>
          </div>
        </div>
        <button onClick={() => onNav?.('26')} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 mt-3">
          Test Print & Final Review →
        </button>
      </div>
    );
  }

  if (num === 26) {
    return (
      <div className="max-w-md mx-auto space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Review Your Setup</h3>
        <div className="p-4 rounded-xl bg-surfaceElevated border border-border text-left text-xs space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" /> <span>Business Information Configured</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" /> <span>Enabled Modules (POS, Tables, KDS, Reports)</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" /> <span>Tables Created (20 Tables Across 3 Sections)</span>
          </div>
          <div className="flex items-center space-x-2 text-emerald-400">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" /> <span>Menu Catalog Ready (42 Items Loaded)</span>
          </div>
        </div>
        <button
          onClick={() => onNav?.('27')}
          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30"
        >
          Complete Setup & Launch Dashboard →
        </button>
      </div>
    );
  }

  // Phase 4: Restaurant Operations (Screens 27 to 40)
  if (num === 27) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <div>
            <h3 className="font-bold text-lg text-white">Spice Garden Dashboard</h3>
            <span className="text-xs text-slate-400">Live Service Operational Overview</span>
          </div>
          <button onClick={() => onNav?.('28')} className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md">
            Open POS →
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-surfaceElevated border border-border">
            <span className="text-[11px] text-slate-400">Today's Sales</span>
            <div className="text-xl font-bold text-white mt-1">₹12,450</div>
          </div>
          <div className="p-3.5 rounded-xl bg-surfaceElevated border border-border">
            <span className="text-[11px] text-primary">Live Orders</span>
            <div className="text-xl font-bold text-primary mt-1">48</div>
          </div>
          <div className="p-3.5 rounded-xl bg-surfaceElevated border border-border">
            <span className="text-[11px] text-cyan-400">Tables Active</span>
            <div className="text-xl font-bold text-cyan-400 mt-1">8 / 20</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surfaceElevated border border-border">
          <span className="text-xs font-bold text-slate-300">Sales Overview by Hour</span>
          <div className="h-20 flex items-end justify-between gap-2 mt-2 pt-2 border-t border-border">
            {[20, 35, 60, 90, 75, 40, 85].map((val, i) => (
              <div key={i} className="flex-1 bg-primary/80 rounded-t" style={{ height: `${val}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (num === 28) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <span className="text-xs font-bold text-primary uppercase">POS / Billing Screen</span>
          <button onClick={() => onNav?.('30')} className="text-xs text-slate-400 hover:text-white">View Table 5 →</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['Chicken Biryani (₹250)', 'Paneer Butter Masala (₹220)', 'Garlic Naan (₹60)'].map((dish, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-surfaceElevated border border-border text-xs text-white">
              <div className="font-semibold truncate">{dish}</div>
              <button onClick={() => onNav?.('32')} className="mt-2 text-[10px] text-primary font-bold">+ Add to Cart</button>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-surfaceElevated border border-border flex justify-between items-center text-xs">
          <span className="font-semibold text-white">Total Cart: ₹540 (2 items)</span>
          <button onClick={() => onNav?.('34')} className="px-3 py-1.5 rounded-lg bg-primary text-white font-bold">
            Bill & Settle →
          </button>
        </div>
      </div>
    );
  }

  if (num === 29) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="font-bold text-sm text-white">Tables Dashboard</h3>
          <div className="flex space-x-2 text-[11px]">
            <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> <span>Available</span></span>
            <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> <span>Occupied</span></span>
            <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-cyan-500" /> <span>Billing</span></span>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { num: 'T1', status: 'Available', color: 'emerald' },
            { num: 'T2', status: 'Occupied', color: 'amber' },
            { num: 'T3', status: 'Available', color: 'emerald' },
            { num: 'T4', status: 'Occupied', color: 'amber' },
            { num: 'T5', status: 'Billing', color: 'cyan' },
            { num: 'T6', status: 'Reserved', color: 'indigo' },
          ].map((t, i) => (
            <button
              key={i}
              onClick={() => onNav?.('30')}
              className="p-3 rounded-xl bg-surfaceElevated border border-border text-center hover:border-primary transition"
            >
              <div className="font-bold text-sm text-white">{t.num}</div>
              <div className={`text-[10px] font-semibold mt-1 text-${t.color}-400`}>{t.status}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (num === 30) {
    return (
      <div className="max-w-md mx-auto space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="font-bold text-base text-white">Table 5 - Order</h3>
          <span className="text-xs text-slate-400">Guests: 4</span>
        </div>
        <div className="p-3 rounded-xl bg-surfaceElevated border border-border text-xs space-y-1.5">
          <div className="flex justify-between text-white font-medium">
            <span>Chicken Biryani x2</span>
            <span>₹500</span>
          </div>
          <div className="flex justify-between text-white font-medium">
            <span>Coke x1</span>
            <span>₹40</span>
          </div>
          <div className="flex justify-between text-white font-medium">
            <span>Water x1</span>
            <span>₹20</span>
          </div>
          <div className="pt-2 border-t border-border flex justify-between font-bold text-primary">
            <span>Total:</span>
            <span>₹560</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onNav?.('33')} className="py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs">
            Send KOT
          </button>
          <button onClick={() => onNav?.('34')} className="py-2.5 rounded-xl bg-primary text-white font-bold text-xs">
            Generate Bill
          </button>
        </div>
      </div>
    );
  }

  if (num === 33) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <ChefHat className="w-5 h-5 text-amber-400" />
            <span>Kitchen Display System (KDS)</span>
          </h3>
          <span className="text-xs text-emerald-400 font-mono">Live WebSocket</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-surfaceElevated border border-amber-500/40 space-y-2">
            <div className="flex justify-between text-xs font-bold text-amber-400">
              <span>Table 5 (Order #1234)</span>
              <span>4m ago</span>
            </div>
            <div className="text-xs text-slate-200 space-y-1">
              <div>• Chicken Biryani x2</div>
              <div>• Coke x1</div>
            </div>
            <button onClick={() => onNav?.('34')} className="w-full py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold">
              Mark Preparing →
            </button>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-emerald-500/40 space-y-2">
            <div className="flex justify-between text-xs font-bold text-emerald-400">
              <span>Table 2 (Order #1233)</span>
              <span>12m ago</span>
            </div>
            <div className="text-xs text-slate-200 space-y-1">
              <div>• Paneer Tikka x1</div>
              <div>• Butter Naan x2</div>
            </div>
            <button onClick={() => onNav?.('34')} className="w-full py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">
              Mark Ready / Served →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (num === 34) {
    return (
      <div className="max-w-md mx-auto space-y-3 font-receipt bg-surfaceElevated p-5 rounded-2xl border border-border">
        <div className="text-center pb-3 border-b border-dashed border-slate-600">
          <div className="font-extrabold text-amber-500 text-lg tracking-tight flex items-center justify-center space-x-1 mb-0.5">
            <span className="text-slate-400 mr-1">=</span>
            <span className="text-white">Zip</span>
            <span className="text-amber-500">Bill</span>
          </div>
          <div className="text-[8px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-2">RESTAURANT | CAFE | HOTEL</div>
          <div className="font-bold text-white text-sm">SPICE GARDEN RESTAURANT</div>
          <div className="text-[11px] text-slate-400">104 MG Road, Bengaluru</div>
          <div className="text-[11px] text-slate-400">Invoice: #INV000123 • Table 5</div>
        </div>
        <div className="text-xs text-slate-300 space-y-1 py-2">
          <div className="flex justify-between"><span>Chicken Biryani x2</span> <span>₹500.00</span></div>
          <div className="flex justify-between"><span>Coke x1</span> <span>₹40.00</span></div>
          <div className="flex justify-between"><span>Water x1</span> <span>₹20.00</span></div>
          <div className="border-t border-dashed border-slate-600 pt-1 flex justify-between font-bold text-white">
            <span>Subtotal:</span> <span>₹560.00</span>
          </div>
          <div className="flex justify-between text-slate-400"><span>GST (5%):</span> <span>₹28.00</span></div>
          <div className="border-t-2 border-slate-500 pt-1 flex justify-between font-bold text-primary text-sm">
            <span>GRAND TOTAL:</span> <span>₹588.00</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button onClick={() => onNav?.('35')} className="py-2.5 rounded-xl bg-primary text-white font-sans font-bold text-xs">
            Pay Now
          </button>
          <button onClick={() => onNav?.('36')} className="py-2.5 rounded-xl bg-surface border border-border text-slate-200 font-sans font-bold text-xs">
            Scan & Pay QR
          </button>
        </div>
      </div>
    );
  }

  if (num === 36) {
    return (
      <div className="max-w-sm mx-auto text-center space-y-4">
        <h3 className="font-bold text-base text-white">Scan to Pay Bill</h3>
        <p className="text-xs text-slate-400">Table 5 • Total: <strong className="text-emerald-400 font-mono">₹588.00</strong></p>
        <div className="w-48 h-48 bg-white p-3 rounded-2xl mx-auto shadow-2xl flex items-center justify-center">
          <QrCode className="w-40 h-40 text-black" />
        </div>
        <div className="text-xs text-slate-400">Accepts GPay, PhonePe, Paytm, BHIM UPI</div>
        <button onClick={() => onNav?.('37')} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs">
          Simulate Payment Success →
        </button>
      </div>
    );
  }

  if (num === 37) {
    return (
      <div className="max-w-sm mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/30">
          <Printer className="w-8 h-8 animate-bounce" />
        </div>
        <h3 className="font-bold text-lg text-white">Printing Bill...</h3>
        <p className="text-xs text-slate-400">
          Bill persisted safely. Sending ESC/POS byte stream to thermal printer.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button onClick={() => onNav?.('34')} className="py-2 rounded-xl bg-surfaceElevated border border-border text-xs text-slate-300">
            Try Again
          </button>
          <button onClick={() => onNav?.('38')} className="py-2 rounded-xl bg-primary text-white text-xs font-bold">
            Done
          </button>
        </div>
      </div>
    );
  }

  if (num === 40) {
    return (
      <div className="max-w-md mx-auto space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="font-bold text-base text-white">Worker Activity (Shared Access)</h3>
          <span className="text-xs text-primary font-medium">Ramesh (Waiter)</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border flex justify-between">
            <div>
              <div className="font-bold text-white">Added: Chicken Biryani x2</div>
              <div className="text-slate-400">Table 5 • Order #1234</div>
            </div>
            <span className="text-slate-400 font-mono">9:12 PM</span>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border flex justify-between">
            <div>
              <div className="font-bold text-white">Sent KOT to Kitchen</div>
              <div className="text-slate-400">Table 5 • Order #1234</div>
            </div>
            <span className="text-slate-400 font-mono">9:08 PM</span>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border flex justify-between">
            <div>
              <div className="font-bold text-white">Generated Bill #INV000123</div>
              <div className="text-slate-400">Table 2 • Settle Cash</div>
            </div>
            <span className="text-slate-400 font-mono">8:45 PM</span>
          </div>
        </div>
      </div>
    );
  }

  // Phase 5: Management & Reports (Screens 41 to 49)
  if (num === 41) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="font-bold text-base text-white">Staff Management</h3>
          <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold">+ Add Staff</button>
        </div>
        <div className="space-y-2 text-xs">
          {[
            { name: 'Rajesh Kumar', role: 'Owner', phone: '+91 98765 43210' },
            { name: 'Vikram Sharma', role: 'Manager', phone: '+91 98765 11111' },
            { name: 'Ramesh Patel', role: 'Waiter', phone: '+91 98765 22222' },
            { name: 'Chef Anand', role: 'Kitchen', phone: '+91 98765 33333' },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-xl bg-surfaceElevated border border-border flex justify-between items-center">
              <div>
                <div className="font-bold text-white">{s.name}</div>
                <div className="text-slate-400">{s.phone}</div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-surface text-primary font-semibold text-[11px] border border-border">
                {s.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (num === 42) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="font-bold text-base text-white">Inventory Management</h3>
          <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold">+ Add Item</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { name: 'Basmati Rice', stock: '50 kg', alert: false },
            { name: 'Tomatoes', stock: '20 kg', alert: false },
            { name: 'Cooking Oil', stock: '15 L', alert: false },
            { name: 'Onions', stock: '4 kg', alert: true },
          ].map((item, i) => (
            <div key={i} className={`p-3 rounded-xl bg-surfaceElevated border ${item.alert ? 'border-rose-500/50 bg-rose-500/10' : 'border-border'}`}>
              <div className="font-bold text-white">{item.name}</div>
              <div className="text-sm font-mono mt-1 text-slate-200">{item.stock}</div>
              {item.alert && (
                <div className="text-[10px] text-rose-400 font-bold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 stroke-[2]" />
                  <span>Low Stock</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (num === 44) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="font-bold text-base text-white">Sales & Analytics</h3>
          <span className="text-xs text-slate-400 font-mono">Last 30 Days</span>
        </div>
        <div className="p-4 rounded-xl bg-surfaceElevated border border-border">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Weekly Revenue Breakdown</span>
            <span className="text-emerald-400 font-bold">Total: ₹1,42,850</span>
          </div>
          <div className="h-28 flex items-end justify-between gap-3 pt-4 border-t border-border">
            {[45, 60, 75, 95, 80, 110, 130].map((v, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-primary to-orange-400 rounded-t" style={{ height: `${(v / 130) * 100}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (num === 47) {
    return (
      <div className="space-y-3">
        <h3 className="font-bold text-base text-white pb-2 border-b border-border">Module Management</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {['POS Terminal', 'Tables Management', 'Kitchen Display', 'Inventory BOM', 'Customers CRM', 'Reports & Analytics'].map((mod, i) => (
            <div key={i} className="p-3 rounded-xl bg-surfaceElevated border border-border flex justify-between items-center">
              <span className="text-white font-medium">{mod}</span>
              <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Phase 6: SaaS & Offline (Screens 50 to 52)
  if (num === 50) {
    return (
      <div className="max-w-md mx-auto space-y-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
          <WifiOff className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">You are Offline</h3>
        <p className="text-xs text-slate-400">
          Orders, bills, and local thermal printing will continue operating smoothly. Changes will sync automatically when the internet returns.
        </p>
        <div className="p-3 rounded-xl bg-surfaceElevated border border-border flex justify-between items-center text-xs">
          <span className="text-slate-300">Pending Sync Queue:</span>
          <span className="font-bold font-mono text-amber-400">12 Transactions</span>
        </div>
        <button className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25">
          Sync Now
        </button>
      </div>
    );
  }

  if (num === 51) {
    return (
      <div className="space-y-3">
        <h3 className="font-bold text-base text-white text-center pb-2 border-b border-border">Choose Your Plan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-surfaceElevated border border-border flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">Free</h4>
              <div className="text-xl font-bold text-white mt-1">₹0</div>
              <p className="text-slate-400 text-[11px] mt-2">Up to 5 tables, 2 staff</p>
            </div>
            <button className="mt-4 py-2 rounded-lg bg-surface border border-border text-slate-300">Active</button>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 border-primary border ring-1 ring-primary flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-primary text-sm">Pro</h4>
              <div className="text-xl font-bold text-white mt-1">₹999 <span className="text-xs font-normal text-slate-400">/ mo</span></div>
              <p className="text-slate-300 text-[11px] mt-2">Unlimited tables, KDS, AI imports</p>
            </div>
            <button className="mt-4 py-2 rounded-lg bg-primary text-white font-bold">Upgrade</button>
          </div>
          <div className="p-4 rounded-xl bg-surfaceElevated border border-border flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">Enterprise</h4>
              <div className="text-xl font-bold text-white mt-1">Custom</div>
              <p className="text-slate-400 text-[11px] mt-2">Multi-location chains & franchise</p>
            </div>
            <button className="mt-4 py-2 rounded-lg bg-surface border border-border text-slate-300">Contact</button>
          </div>
        </div>
      </div>
    );
  }

  if (num === 52) {
    return (
      <div className="space-y-3 max-w-md mx-auto">
        <div className="flex justify-between items-center pb-2 border-b border-border">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <Bell className="w-4 h-4 text-primary" />
            <span>Real-time Notifications</span>
          </h3>
          <span className="text-xs text-primary font-semibold">Mark all read</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border">
            <div className="font-bold text-white">New Order #1234 Placed</div>
            <div className="text-slate-400 text-[11px]">Table 5 • 2 items • ₹560 (2m ago)</div>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-border">
            <div className="font-bold text-emerald-400">Payment Received ₹588</div>
            <div className="text-slate-400 text-[11px]">Bill #INV000123 paid via UPI (5m ago)</div>
          </div>
          <div className="p-3 rounded-xl bg-surfaceElevated border border-rose-500/40">
            <div className="font-bold text-rose-400">Low Stock Alert: Onions</div>
            <div className="text-slate-400 text-[11px]">Current stock 4 kg below threshold (15m ago)</div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for other screen numbers (shows interactive placeholder for that exact screen)
  return (
    <div className="text-center py-8 space-y-4 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-surfaceElevated border border-border mx-auto flex items-center justify-center text-primary font-bold text-lg font-mono">
        #{num}
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{currentScreen.title}</h3>
        <p className="text-xs text-slate-400 mt-1">{currentScreen.description}</p>
      </div>
      <div className="p-4 rounded-xl bg-surfaceElevated border border-border text-xs text-slate-300 text-left space-y-1">
        <div><strong>Phase:</strong> {currentScreen.phaseName}</div>
        <div><strong>Category:</strong> {currentScreen.category}</div>
        <div><strong>Route:</strong> <code className="text-primary font-mono">{currentScreen.route}</code></div>
      </div>
      <div className="flex justify-center space-x-2">
        {num > 1 && (
          <button
            onClick={() => onNav?.(String(num - 1).padStart(2, '0'))}
            className="px-4 py-2 rounded-xl bg-surfaceElevated border border-border text-xs font-semibold text-slate-200"
          >
            ← Previous Screen
          </button>
        )}
        {num < 52 && (
          <button
            onClick={() => onNav?.(String(num + 1).padStart(2, '0'))}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/25"
          >
            Next Screen →
          </button>
        )}
      </div>
    </div>
  );
}
