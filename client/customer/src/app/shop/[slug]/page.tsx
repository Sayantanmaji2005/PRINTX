'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Printer,
  UploadCloud,
  Camera,
  FolderDown,
  Image as ImageIcon,
  ShieldCheck,
  Zap,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { fetchShopBySlug, startCustomerSession } from '@/lib/api';

export default function ShopCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [shop, setShop] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function init() {
      try {
        setLoading(true);
        setError(null);
        // 1. Fetch shop profile
        const shopData = await fetchShopBySlug(slug);
        setShop(shopData);

        // 2. Start customer guest session
        const sessionData = await startCustomerSession(slug);
        setSession(sessionData);
        sessionStorage.setItem('printx_customer_session_id', sessionData.id);
        sessionStorage.setItem('printx_shop_id', shopData.id);
      } catch (err: any) {
        console.error('Session init error:', err);
        setError(err.message || 'Failed to connect to Xerox shop');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 via-white to-slate-50 text-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center animate-pulse mb-4 shadow-sm">
          <Printer className="w-7 h-7 text-blue-600 animate-spin" />
        </div>
        <p className="text-sm font-bold text-slate-800">Connecting to Xerox Station...</p>
        <p className="text-xs text-slate-500 mt-1">Initializing secure guest print session</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 via-white to-slate-50 text-slate-800 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">Shop Unavailable</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm">{error || 'Could not find this Xerox shop.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50/70 via-slate-50 to-white text-slate-900 relative overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="fixed -top-32 -left-32 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Mobile-First Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-blue-100 shadow-xs">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-xs">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 font-['Outfit']">
              PRINT<span className="text-brand-600">X</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Printer
            </span>
          </div>
        </div>
      </header>

      {/* Main Customer Screen Container */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 flex flex-col justify-between relative z-10">
        <div>
          {/* Shop Card */}
          <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-md shadow-blue-500/5 relative overflow-hidden mb-6">
            <div className="text-[11px] font-bold tracking-wider text-blue-600 uppercase mb-1">
              CONNECTED XEROX SHOP
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
              Welcome to {shop.name}
            </h1>

            {shop.address && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="line-clamp-1">{shop.address}</span>
              </p>
            )}

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1 text-slate-700 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Auto-Print Ready</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>UPI Verified</span>
              </div>
            </div>
          </div>

          {/* Core Slogan Banner */}
          <div className="mb-6 text-center">
            <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
              Print anything. Pay digitally. Collect instantly.
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an option below to start your print order
            </p>
          </div>

          {/* 4 Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* 1. Upload Document (PDF / DOCX) */}
            <button
              onClick={() => router.push(`/shop/${slug}/upload`)}
              className="action-card p-4 rounded-2xl bg-white border-2 border-blue-200 hover:border-blue-500 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-sm hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Upload Document</span>
                <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">PDF, DOCX, PPTX</span>
              </div>
            </button>

            {/* 2. Google Drive */}
            <button
              onClick={() => alert('Google Drive OAuth import will connect in next phase!')}
              className="action-card p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-sm hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <FolderDown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Google Drive</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Import from Cloud</span>
              </div>
            </button>

            {/* 3. Scan Document with Camera */}
            <button
              onClick={() => alert('Camera scanner with PDF generation ready for Phase 8!')}
              className="action-card p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-sm hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Scan Document</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Use Phone Camera</span>
              </div>
            </button>

            {/* 4. Upload Images */}
            <button
              onClick={() => router.push(`/shop/${slug}/upload`)}
              className="action-card p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-sm hover:shadow-md"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Upload Images</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">JPG, PNG, Photos</span>
              </div>
            </button>
          </div>

          {/* Pricing Info Banner */}
          <div className="mt-6 p-3.5 rounded-2xl bg-white border border-blue-100 shadow-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600">
              <span className="text-slate-900 font-bold">Standard Rates at this shop:</span>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-slate-700 font-medium">
                <span>A4 B&W: ₹1.00/page</span>
                <span>•</span>
                <span>Both Side: ₹1.50/sheet</span>
                <span>•</span>
                <span>Color: ₹5.00/page</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy Notice */}
        <div className="mt-8 text-center text-[10px] text-slate-500 pb-2 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit Encrypted • Auto-deleted after 24 hours</span>
          </div>
          <p>Session ID: {session?.id ? `${session.id.substring(0, 8)}...` : 'Guest'}</p>
        </div>
      </main>
    </div>
  );
}
