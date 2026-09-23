'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  QrCode,
  UploadCloud,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Zap,
  MapPin,
  Store,
} from 'lucide-react';
import { fetchAllShops } from '@/lib/api';

export default function HomePage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllShops()
      .then((data) => setShops(data || []))
      .catch((err) => console.log('Fetch shops err:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50/70 via-slate-50 to-white text-slate-900 relative overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-blue-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 font-['Outfit']">
              PRINT<span className="text-brand-600">X</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="http://localhost:3001"
              target="_blank"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-brand-600 transition-colors border border-slate-200 shadow-xs"
            >
              Super Admin Portal →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-xs">
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>Smart Xerox & Instant Automated Cloud Printing</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.15] text-slate-900 font-['Outfit']">
          Print anything. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
            Pay digitally. Collect instantly.
          </span>
        </h1>

        <p className="mt-5 text-base md:text-lg text-slate-600 max-w-2xl leading-relaxed">
          No waiting in line or sending WhatsApp files to the shopkeeper. Scan the shop counter QR, upload your document, pay via UPI, and your prints emerge automatically.
        </p>

        {/* 4-Step Process Section */}
        <div className="mt-16 w-full">
          <div className="text-left mb-8">
            <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">How PrintX Works in 4 Steps</h2>
            <p className="text-sm text-slate-500">Zero apps required for customers. Works entirely inside the mobile browser.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-blue-600 mb-1">STEP 1</div>
              <h3 className="font-semibold text-slate-900 text-base">Scan Shop QR</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Scan the unique QR standee placed on the shop counter with any phone camera.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-indigo-600 mb-1">STEP 2</div>
              <h3 className="font-semibold text-slate-900 text-base">Upload & Configure</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Select PDF, choose B&W or Color, single or duplex, paper size, and copies.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-emerald-600 mb-1">STEP 3</div>
              <h3 className="font-semibold text-slate-900 text-base">Pay with UPI</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Pay using Google Pay, PhonePe, Paytm or BHIM via secured Indian UPI gateway.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-amber-600 mb-1">STEP 4</div>
              <h3 className="font-semibold text-slate-900 text-base">Auto Print & Collect</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Server verifies payment and triggers shop&apos;s desktop Print Agent immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Registered Xerox Stations */}
        <div className="mt-16 w-full text-left">
          <h2 className="text-xl font-bold text-slate-900 font-['Outfit'] mb-4">Active Xerox Stations</h2>

          {loading ? (
            <div className="p-8 rounded-2xl bg-white border border-blue-100 text-center text-sm text-slate-500 shadow-sm">
              Loading active Xerox shops...
            </div>
          ) : shops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/shop/${shop.slug}`}
                  className="p-5 rounded-2xl bg-white border border-blue-100 hover:border-blue-400 hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-600 transition-colors">
                        {shop.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ONLINE
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {shop.address || 'Address registered with Super Admin'}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-blue-100 text-center text-xs text-slate-500 shadow-sm">
              <Store className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>No Xerox shops registered yet. Add a shop in the Super Admin Portal to generate its counter QR.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white/50">
        <p>© 2026 PrintX Technologies. Smart Xerox & Print Automation SaaS Platform.</p>
      </footer>
    </div>
  );
}
