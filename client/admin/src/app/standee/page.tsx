'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, Smartphone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function StandeeContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || 'printx-shop';
  const [shop, setShop] = useState<any>(null);
  const [networkMode, setNetworkMode] = useState<'vercel' | 'local' | 'cloudflare'>('vercel');

  useEffect(() => {
    if (!slug) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://printx-cib8.onrender.com/api';
    fetch(`${apiUrl}/shops/public/${slug}`)
      .then((res) => res.json())
      .then((json) => setShop(json.data))
      .catch((err) => console.error(err));
  }, [slug]);

  const vercelBaseUrl = process.env.NEXT_PUBLIC_CUSTOMER_URL || 'https://printx-customer.vercel.app';
  const localBaseUrl = 'http://192.168.0.103:3000';
  const cloudflareBaseUrl = 'https://bye-belong-enquiries-shape.trycloudflare.com';

  const activeBaseUrl =
    networkMode === 'vercel'
      ? vercelBaseUrl
      : networkMode === 'local'
      ? localBaseUrl
      : cloudflareBaseUrl;

  const customerUrl = `${activeBaseUrl}/shop/${slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(customerUrl)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 via-slate-50 to-white p-6 flex flex-col items-center justify-center print:p-0 print:bg-white text-slate-900">
      {/* Top Actions (hidden during print) */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* QR Source Mode Selector */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold gap-1">
          <button
            type="button"
            onClick={() => setNetworkMode('vercel')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              networkMode === 'vercel'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚀 Vercel Cloud (Official)
          </button>
          <button
            type="button"
            onClick={() => setNetworkMode('local')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              networkMode === 'local'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📶 Shop Wi-Fi (LAN)
          </button>
          <button
            type="button"
            onClick={() => setNetworkMode('cloudflare')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              networkMode === 'cloudflare'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌐 Cloudflare Tunnel
          </button>
        </div>

        <button
          onClick={() => window.print()}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Counter Standee (A4)</span>
        </button>
      </div>

      {/* Standee Card */}
      <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl p-8 border-4 border-blue-100 shadow-2xl flex flex-col items-center text-center relative overflow-hidden print:border-2 print:shadow-none">
        {/* Brand Banner */}
        <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-2xl mb-6 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Printer className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight font-['Outfit']">
            PRINT<span className="text-sky-300">X</span>
          </span>
        </div>

        {/* Shop Name */}
        <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit'] leading-tight">
          {shop?.name || 'Xerox Station'}
        </h1>
        {shop?.address && (
          <p className="text-xs text-slate-500 mt-1 max-w-xs">{shop.address}</p>
        )}

        {/* Action Prompt */}
        <div className="my-5 py-2 px-4 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold inline-flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          <span>SCAN WITH ANY CAMERA TO PRINT</span>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-inner mb-2">
          <img
            src={qrUrl}
            alt="PrintX Shop QR"
            className="w-56 h-56 object-contain"
          />
        </div>

        {/* Direct Link Caption */}
        <div className="mb-4 text-[11px] font-mono text-slate-500 font-semibold max-w-xs break-all bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          {customerUrl}
        </div>

        {/* 3 Steps Badge */}
        <div className="w-full grid grid-cols-3 gap-1 text-slate-700 text-[10px] font-bold border-t border-slate-100 pt-4 mt-2">
          <div className="p-1">
            <span className="block text-brand-600 text-xs">1. SCAN</span>
            <span>Shop QR</span>
          </div>
          <div className="p-1">
            <span className="block text-brand-600 text-xs">2. UPLOAD</span>
            <span>PDF / Photo</span>
          </div>
          <div className="p-1">
            <span className="block text-brand-600 text-xs">3. PAY UPI</span>
            <span>Auto-Prints</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-[9px] text-slate-400 tracking-wider uppercase font-semibold">
          No WhatsApp Needed • 100% Encrypted & Safe
        </div>
      </div>
    </div>
  );
}

export default function ShopStandeePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Standee...</div>}>
      <StandeeContent />
    </Suspense>
  );
}
