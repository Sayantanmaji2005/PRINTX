'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, Smartphone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  PhonePeIcon,
  GooglePayIcon,
  PaytmIcon,
  BhimUpiIcon,
} from '@/components/PaymentLogos';

function StandeeContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || 'printx-shop';
  const [shop, setShop] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://printx-cib8.onrender.com/api';
    fetch(`${apiUrl}/shops/public/${slug}`)
      .then((res) => res.json())
      .then((json) => setShop(json.data))
      .catch((err) => console.error(err));
  }, [slug]);

  const baseUrl = process.env.NEXT_PUBLIC_CUSTOMER_URL || 'https://printx-customer.vercel.app';
  const customerUrl = `${baseUrl}/shop/${slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(customerUrl)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/70 via-slate-50 to-slate-100 p-6 flex flex-col items-center justify-center print:p-0 print:bg-white text-slate-900">
      {/* Top Actions (hidden during print) */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold flex items-center gap-1.5 border-2 border-slate-900 shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <ArrowLeft className="w-4 h-4 stroke-2" />
          <span>Back to Dashboard</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="px-5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2 border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4 stroke-2 text-white" />
          <span>Print Counter Standee (A4)</span>
        </button>
      </div>

      {/* Standee Card with Crisp Modern Black Outline */}
      <div className="w-full max-w-sm bg-white text-slate-950 rounded-3xl p-8 border-3 border-slate-900 shadow-neo-lg flex flex-col items-center text-center relative overflow-hidden print:border-2 print:shadow-none">
        {/* Brand Banner */}
        <div className="w-full bg-slate-950 text-white py-3.5 px-4 rounded-2xl mb-6 flex items-center justify-center gap-2 border-2 border-slate-900 shadow-neo-sm">
          <div className="w-7 h-7 rounded-lg bg-brand-500 border border-white/20 flex items-center justify-center">
            <Printer className="w-4 h-4 text-white stroke-[2.2]" />
          </div>
          <span className="text-xl font-black tracking-tight font-outfit">
            PRINT<span className="text-sky-400">X</span>
          </span>
        </div>

        {/* Shop Name */}
        <h1 className="text-2xl font-black text-slate-950 font-outfit leading-tight">
          {shop?.name || 'Xerox Station'}
        </h1>
        {shop?.address && (
          <p className="text-xs text-slate-600 font-medium mt-1 max-w-xs">{shop.address}</p>
        )}

        {/* Action Prompt */}
        <div className="my-4 py-1.5 px-4 rounded-full bg-amber-300 border-2 border-slate-900 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 shadow-neo-sm">
          <Smartphone className="w-3.5 h-3.5 stroke-2" />
          <span>SCAN WITH ANY CAMERA TO PRINT</span>
        </div>

        {/* QR Code Container with Black Outline */}
        <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-neo-sm mb-3">
          <img
            src={qrUrl}
            alt="PrintX Shop QR"
            className="w-56 h-56 object-contain block mx-auto"
          />
        </div>

        {/* Direct Link Caption */}
        <div className="mb-3 text-[11px] font-mono text-slate-900 font-bold max-w-xs break-all bg-slate-100 px-3 py-1.5 rounded-lg border-2 border-slate-900 shadow-neo-sm">
          {customerUrl}
        </div>

        {/* Accepted Payment Apps Row with Logos and Names */}
        <div className="mb-3 flex items-center justify-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-950 bg-white px-2 py-0.5 rounded-lg border border-slate-900 shadow-neo-sm">
            <PhonePeIcon className="w-3.5 h-3.5" />
            <span>PhonePe</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-950 bg-white px-2 py-0.5 rounded-lg border border-slate-900 shadow-neo-sm">
            <GooglePayIcon className="w-3.5 h-3.5" />
            <span>GPay</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-950 bg-white px-2 py-0.5 rounded-lg border border-slate-900 shadow-neo-sm">
            <PaytmIcon className="w-4 h-3.5" />
            <span>Paytm</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-950 bg-white px-2 py-0.5 rounded-lg border border-slate-900 shadow-neo-sm">
            <BhimUpiIcon className="w-3.5 h-3.5" />
            <span>BHIM</span>
          </span>
        </div>

        {/* Direct UPI ID Badge */}
        {shop?.upiId && (
          <div className="mb-3 px-3 py-1 rounded-full bg-emerald-100 border-2 border-slate-900 text-emerald-950 text-[10px] font-bold inline-flex items-center gap-1.5 shadow-neo-sm">
            <BhimUpiIcon className="w-3.5 h-3.5" />
            <span>Payee UPI:</span>
            <code className="font-mono font-bold text-emerald-950">{shop.upiId}</code>
          </div>
        )}

        {/* 3 Steps Badge */}
        <div className="w-full grid grid-cols-3 gap-2 text-slate-900 text-[10px] font-bold pt-3 mt-1 border-t-2 border-slate-900">
          <div className="p-2 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm">
            <span className="block text-brand-600 font-extrabold text-xs">1. SCAN</span>
            <span>Shop QR</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm">
            <span className="block text-brand-600 font-extrabold text-xs">2. UPLOAD</span>
            <span>PDF / Photo</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm">
            <span className="block text-brand-600 font-extrabold text-xs">3. PAY UPI</span>
            <span>Auto-Prints</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-[9px] text-slate-500 tracking-wider uppercase font-bold">
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
