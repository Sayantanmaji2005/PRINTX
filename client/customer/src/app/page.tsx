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
  FileText,
  Sparkles,
  Layers,
  ShieldCheck,
  Phone,
  Mail,
  Clock,
  Send,
  BadgePercent,
  BookOpen,
  Image as ImageIcon,
  Cpu,
  MessageCircle,
  Check,
  Building2,
  Users,
  Smartphone,
  ChevronDown
} from 'lucide-react';
import { fetchAllShops } from '@/lib/api';

export default function HomePage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricingCategory, setPricingCategory] = useState<'standard' | 'color' | 'finishing'>('standard');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });

  useEffect(() => {
    fetchAllShops()
      .then((data) => setShops(data || []))
      .catch((err) => console.log('Fetch shops err:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', phone: '', email: '', message: '' });
    }, 4000);
  };

  const services = [
    {
      icon: FileText,
      title: 'High-Speed B&W Xerox & Prints',
      desc: 'Crystal sharp 1200 DPI monochrome printing on premium 75/80 GSM papers. Perfect for study notes, legal docs & books.',
      badge: 'From ₹1.50/page',
      gradient: 'from-blue-600 to-sky-600',
      tag: 'Fastest'
    },
    {
      icon: Sparkles,
      title: 'Full Color Laser Printing',
      desc: 'Vibrant CMYK color laser printing with high-density toner. Ideal for presentations, project reports, posters & graphs.',
      badge: 'From ₹5.00/page',
      gradient: 'from-indigo-600 to-purple-600',
      tag: 'High Quality'
    },
    {
      icon: BookOpen,
      title: 'Spiral, Comb & Thesis Binding',
      desc: 'Durable binding options including 25mm PVC spiral coils, comb ring clips and gold-embossed hardcover project binding.',
      badge: 'From ₹30/book',
      gradient: 'from-amber-500 to-orange-600',
      tag: 'Academic'
    },
    {
      icon: Layers,
      title: 'Glossy & Matte Lamination',
      desc: '125 Micron thermal lamination sheets ensuring 100% waterproof and tearproof protection for marks cards and certificates.',
      badge: 'From ₹20/sheet',
      gradient: 'from-emerald-500 to-teal-600',
      tag: 'Long Lasting'
    },
    {
      icon: ImageIcon,
      title: 'Passport Size Photo Studio',
      desc: 'Instant passport photo sheets with custom background removal (White/Blue/Gray) on 200 GSM glossy photo paper.',
      badge: 'From ₹40 / 8 Pcs',
      gradient: 'from-rose-500 to-pink-600',
      tag: 'Official'
    },
    {
      icon: BadgePercent,
      title: 'Bulk Photocopy & Project Xerox',
      desc: 'Huge volume discounts for college students and coaching institutions. Automated page-order sorting and collation.',
      badge: 'Up to 30% OFF',
      gradient: 'from-violet-600 to-blue-600',
      tag: 'Best Value'
    },
  ];

  const pricingData = {
    standard: [
      { item: 'A4 Black & White (Single Sided)', specs: '75 GSM Standard Paper', rate: '₹ 2.00', bulk: '₹ 1.50 (50+ pgs)' },
      { item: 'A4 Black & White (Back-to-Back Duplex)', specs: '75 GSM Standard Paper', rate: '₹ 3.00', bulk: '₹ 2.50 (50+ pgs)' },
      { item: 'A4 B&W Executive (Single Sided)', specs: '80 GSM Heavy Bond Paper', rate: '₹ 3.00', bulk: '₹ 2.20 (50+ pgs)' },
      { item: 'Legal / Stamp Paper B&W', specs: '8.5 x 14 Inch Legal Sheets', rate: '₹ 3.50', bulk: '₹ 3.00 (50+ pgs)' },
      { item: 'A3 Blueprint / Drawing B&W', specs: 'Architectural & Engineering Drawings', rate: '₹ 8.00', bulk: '₹ 6.50 (20+ pgs)' },
    ],
    color: [
      { item: 'A4 Standard Color Print', specs: 'Text & Light Graphics on 75 GSM', rate: '₹ 6.00', bulk: '₹ 5.00 (20+ pgs)' },
      { item: 'A4 High-Density Laser Color', specs: 'Full Page Graphics & Presentations', rate: '₹ 10.00', bulk: '₹ 8.00 (20+ pgs)' },
      { item: 'A4 Glossy Photo Print (200 GSM)', specs: 'Ultra Glossy Photo Quality Paper', rate: '₹ 25.00', bulk: '₹ 20.00 (10+ pgs)' },
      { item: 'Passport Photos (Sheet of 8)', specs: '2x2 / 35x45mm on Glossy Sheet', rate: '₹ 40.00', bulk: '₹ 70.00 (16 Pcs)' },
      { item: 'A3 Color Poster / Presentation', specs: 'Large Format Vibrant Laser Sheet', rate: '₹ 20.00', bulk: '₹ 16.00 (10+ pgs)' },
    ],
    finishing: [
      { item: 'Spiral Binding (Up to 100 pages)', specs: 'Clear Plastic Front & Dark Back Sheet', rate: '₹ 35.00', bulk: '₹ 30.00 (5+ bks)' },
      { item: 'Spiral Binding (100 - 300 pages)', specs: 'Heavy Gauge Coil + Thick Cover', rate: '₹ 50.00', bulk: '₹ 45.00 (5+ bks)' },
      { item: 'Hardcover Golden Foil Thesis', specs: 'University Standard Book Binding', rate: '₹ 220.00', bulk: '₹ 190.00 (3+ bks)' },
      { item: 'A4 Thermal Lamination (125 Mic)', specs: 'High-Gloss Crystal Protective Seal', rate: '₹ 20.00', bulk: '₹ 15.00 (10+ shts)' },
      { item: 'ID Card / Certificate Lamination', specs: 'Compact Pouch Lamination', rate: '₹ 15.00', bulk: '₹ 10.00 (10+ shts)' },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-slate-900 relative overflow-x-hidden selection:bg-brand-500 selection:text-white">
      {/* Decorative ambient glowing orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-1/4 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-blue-100/80 shadow-xs transition-all">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 font-['Outfit']">
              PRINT<span className="text-brand-600">X</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#brand" className="hover:text-brand-600 transition-colors font-semibold text-brand-600">Brand</a>
            <a href="#services" className="hover:text-brand-600 transition-colors">Services</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing List</a>
            <a href="#shops" className="hover:text-brand-600 transition-colors">Find Station</a>
            <a href="#about" className="hover:text-brand-600 transition-colors">About Us</a>
            <a href="#contact" className="hover:text-brand-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={(process.env.NEXT_PUBLIC_ADMIN_URL || 'https://printx-admin.vercel.app').replace(/\/+$/, '') + '/login'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-brand-600 transition-all border border-slate-200 shadow-xs active:scale-95"
            >
              Super Admin Portal →
            </a>
          </div>
        </div>
      </header>

      {/* Brand Showcase Section (Pure Visual, Zero Text Overlay) */}
      <section id="brand" className="relative z-10 max-w-6xl mx-auto px-4 pt-6 md:pt-8 w-full scroll-mt-20">
        <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-slate-950">
          <img
            src="/printxdemo.png"
            alt="PRINTX Smart Xerox & Automated Cloud Printing Brand Showcase"
            className="w-full h-auto object-cover object-center block select-none"
          />
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pt-10 pb-14 md:pt-14 md:pb-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-5 shadow-xs">
          <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
          <span>Smart Xerox & Automated Cloud Printing SaaS</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.12] text-slate-900 font-['Outfit']">
          Print anything. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
            Pay digitally. Collect instantly.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
          Say goodbye to crowded xerox lines, pen drives, and WhatsApp files. Scan the shop counter QR, upload your PDF, pay securely via UPI, and your prints shoot right out of the printer.
        </p>

        {/* Hero Quick Action Buttons */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#shops"
            className="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all active:scale-95 hover:gap-3"
          >
            <span>Scan or Select a Print Station</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#pricing"
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs transition-all active:scale-95"
          >
            View Rate Card & Pricing
          </a>
        </div>

        {/* Quick Trust Highlights */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl text-left">
          <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-blue-100/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">0 Waiting Time</div>
              <div className="text-[11px] text-slate-500">Immediate Print Dispatch</div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-blue-100/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">100% UPI Safe</div>
              <div className="text-[11px] text-slate-500">Encrypted Indian Gateway</div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-blue-100/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">No App Install</div>
              <div className="text-[11px] text-slate-500">Works in Any Browser</div>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-blue-100/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Cloud Print Agent</div>
              <div className="text-[11px] text-slate-500">Direct Desktop Driver</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Process Section ("How It Works") */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200/80 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> HOW IT WORKS
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-['Outfit']">
              Seamless 4-Step Self-Service Flow
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              No need to explain pages or duplex settings to the shopkeeper. Configure everything visually from your own smartphone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-white transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="text-xs font-extrabold text-blue-600 tracking-wider mb-1">STEP 01</div>
                <h3 className="font-bold text-slate-900 text-lg">Scan Shop Standee QR</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Open your phone camera or any scanner to scan the unique PrintX counter QR standee at the Xerox shop.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Instant Shop Connect
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 hover:bg-white transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs font-extrabold text-indigo-600 tracking-wider mb-1">STEP 02</div>
                <h3 className="font-bold text-slate-900 text-lg">Upload & Configure</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Upload PDF, Word or Photos. Customize B&W / Color, Single / Duplex, GSM paper quality, and number of copies.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Live Price Calculation
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 hover:bg-white transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="text-xs font-extrabold text-emerald-600 tracking-wider mb-1">STEP 03</div>
                <h3 className="font-bold text-slate-900 text-lg">Fast UPI Payment</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Scan the generated Dynamic UPI QR or launch Google Pay, PhonePe, Paytm or BHIM with a single click.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 100% Automatic Verification
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-amber-300 hover:bg-white transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-extrabold text-amber-600 tracking-wider mb-1">STEP 04</div>
                <h3 className="font-bold text-slate-900 text-lg">Instant Auto-Print</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Once payment is verified, the local Print Agent triggers the printer and your crisp prints are ready for pickup.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Zero Staff Dependency
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24 max-w-6xl mx-auto px-4 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5" /> FULL SUITE OF SERVICES
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-['Outfit']">
            Comprehensive Printing & Finishing Solutions
          </h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            From single-page legal affidavits to complete 500-page academic dissertations with spiral binding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${srv.gradient} opacity-5 rounded-bl-full group-hover:scale-125 transition-transform`} />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${srv.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      {srv.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] group-hover:text-brand-600 transition-colors">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {srv.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100">
                    {srv.badge}
                  </span>
                  <a
                    href="#shops"
                    className="text-xs font-semibold text-brand-600 flex items-center gap-1 group-hover:gap-1.5 transition-all"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transparent Pricing List Section */}
      <section id="pricing" className="py-16 bg-slate-900 text-white relative overflow-hidden">
        {/* Glowing background highlights */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-3 border border-blue-400/30">
              <BadgePercent className="w-3.5 h-3.5" /> 100% TRANSPARENT RATE CARD
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold font-['Outfit']">
              Standard Print & Xerox Pricing
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              No hidden fees. Dynamic volume discounts automatically applied at checkout.
            </p>
          </div>

          {/* Pricing Category Tabs */}
          <div className="flex justify-center mb-8">
            <div className="p-1 rounded-2xl bg-slate-800/90 border border-slate-700 inline-flex gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setPricingCategory('standard')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  pricingCategory === 'standard'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Black & White Docs
              </button>
              <button
                type="button"
                onClick={() => setPricingCategory('color')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  pricingCategory === 'color'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Color & Photo Prints
              </button>
              <button
                type="button"
                onClick={() => setPricingCategory('finishing')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  pricingCategory === 'finishing'
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Binding & Lamination
              </button>
            </div>
          </div>

          {/* Pricing Table Card */}
          <div className="rounded-2xl bg-slate-800/70 border border-slate-700/80 backdrop-blur-md overflow-hidden shadow-2xl">
            <div className="divide-y divide-slate-700/60">
              <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-800/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="col-span-6 sm:col-span-7">Service / Specification</div>
                <div className="col-span-3 sm:col-span-2 text-right">Standard Rate</div>
                <div className="col-span-3 text-right">Bulk / Student Offer</div>
              </div>

              {pricingData[pricingCategory].map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-750/50 transition-colors text-sm"
                >
                  <div className="col-span-6 sm:col-span-7">
                    <div className="font-semibold text-white">{row.item}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{row.specs}</div>
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right font-bold text-brand-400">
                    {row.rate}
                  </div>
                  <div className="col-span-3 text-right text-xs font-semibold text-emerald-400">
                    {row.bulk}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-800/40 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Rates may slightly vary depending on individual shop configuration.</span>
              </div>
              <a
                href="#shops"
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-all text-xs shrink-0"
              >
                Go to Live Print Station →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Active Xerox Stations Section */}
      <section id="shops" className="py-16 md:py-20 max-w-6xl mx-auto px-4 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <Store className="w-3.5 h-3.5" /> LIVE COUNTERS
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-['Outfit']">
              Find & Connect to a PrintX Station
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select an active shop near you or scan their on-counter QR standee.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Realtime Cloud Agent Sync</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 rounded-3xl bg-white border border-blue-100 text-center text-sm text-slate-500 shadow-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="font-semibold text-slate-700">Connecting with active Xerox shops...</p>
          </div>
        ) : shops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/shop/${shop.slug}`}
                className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-brand-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-600 group-hover:scale-105 transition-transform">
                      <Printer className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      STATION ONLINE
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg mt-4 group-hover:text-brand-600 transition-colors">
                    {shop.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{shop.address || 'Smart Xerox Station, India'}</span>
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Auto Print Ready</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:translate-x-1 transition-transform">
                    <span>Open Station</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-10 rounded-3xl bg-white border border-blue-100 text-center text-slate-600 shadow-sm max-w-lg mx-auto">
            <Store className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="font-bold text-slate-900 text-base">No Stations Registered Yet</h4>
            <p className="text-xs text-slate-500 mt-1.5">
              Log in to the Super Admin Portal to add Xerox shops and download counter QR standees.
            </p>
            <Link
              href="/shop/default"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs shadow-md"
            >
              <span>Explore Demo Station</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 bg-gradient-to-b from-blue-50/50 to-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold mb-3">
                <Building2 className="w-3.5 h-3.5" /> ABOUT PRINTX
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-['Outfit'] leading-tight">
                Modernizing India&apos;s Xerox & Document Infrastructure
              </h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                PrintX is built to solve one of the most common daily friction points for students, lawyers, and office workers across India: <strong>waiting in long queues at local Xerox shops</strong>, sharing confidential documents over unencrypted WhatsApp chats, and dealing with cash change.
              </p>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Our lightweight cloud desktop agent links directly with physical printers, enabling customers to scan a counter QR, customize printing specs in real-time, pay via UPI, and receive automated prints within seconds.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-xs">
                  <div className="text-2xl font-black text-brand-600 font-['Outfit']">100%</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">Privacy First</div>
                  <div className="text-[11px] text-slate-500 mt-1">Docs auto-purge after printing is complete</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-xs">
                  <div className="text-2xl font-black text-indigo-600 font-['Outfit']">&lt; 3 Sec</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">Ultra-Fast Dispatch</div>
                  <div className="text-[11px] text-slate-500 mt-1">Real-time printer queue triggering</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="p-6 md:p-8 rounded-3xl bg-white border border-blue-100 shadow-xl relative z-10">
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-600" />
                  Why Shopkeepers & Students Love PrintX
                </h3>

                <div className="space-y-3.5 text-xs text-slate-600">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Zero WhatsApp spam:</strong> Shopkeepers don&apos;t need to share personal WhatsApp numbers or clean phone storage constantly.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Guaranteed payment:</strong> Print agent only executes jobs once UPI funds are verified, avoiding unpaid xerox losses.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Multi-Customer Concurrency:</strong> 10 customers can upload and queue prints simultaneously without chaos.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Details & Inquiry Form Section */}
      <section id="contact" className="py-16 md:py-20 max-w-6xl mx-auto px-4 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <MessageCircle className="w-3.5 h-3.5" /> GET IN TOUCH
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-['Outfit']">
            Contact Support & Station Partnerships
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Want to install PrintX at your college, campus shop, or cyber cafe? Reach out to us directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-4 font-['Outfit']">Direct Channels</h3>

              <div className="space-y-4">
                <a
                  href="https://wa.me/919876543210?text=Hi%20PrintX%20Team,%20I%20want%20to%20know%20more%20about%20your%20Smart%20Printing%20Station."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">WhatsApp Direct Support</div>
                    <div className="text-[11px] text-emerald-700">+91 98765 43210 (Tap to Chat)</div>
                  </div>
                </a>

                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 text-slate-700">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Helpline / Support Phone</div>
                    <div className="text-[11px] text-slate-600">+91 1800-PRINTX-HELP (Toll Free)</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 text-slate-700">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Email Support</div>
                    <div className="text-[11px] text-slate-600">support@printx.in / partner@printx.in</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 text-slate-700">
                  <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Working Hours</div>
                    <div className="text-[11px] text-slate-600">Mon - Sat: 8:00 AM – 10:00 PM IST</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inquiry Form Column */}
          <div className="lg:col-span-7">
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-md">
              <h3 className="font-bold text-slate-900 text-lg mb-1 font-['Outfit']">Send Us an Inquiry</h3>
              <p className="text-xs text-slate-500 mb-5">
                Have questions about pricing, bulk orders or setting up your own shop? Drop a quick note.
              </p>

              {contactSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-fade-in">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <h4 className="font-bold text-emerald-900 text-base">Message Sent Successfully!</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Thank you for contacting PrintX. Our regional support team will get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@gmail.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Message / Requirement</label>
                    <textarea
                      rows={3}
                      placeholder="Tell us what you are looking for (e.g. Bulk thesis printing, franchise inquiry, support...)"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                <Printer className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-slate-900 font-['Outfit']">
                PRINT<span className="text-brand-600">X</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              India&apos;s pioneering cloud automated xerox & print-on-demand kiosk SaaS platform.
            </p>
          </div>

          <div>
            <div className="font-bold text-slate-900 mb-2.5 uppercase tracking-wider text-[11px]">Quick Navigation</div>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#services" className="hover:text-brand-600 transition-colors">Services Offered</a></li>
              <li><a href="#how-it-works" className="hover:text-brand-600 transition-colors">4-Step Flow</a></li>
              <li><a href="#pricing" className="hover:text-brand-600 transition-colors">Rate Card & Pricing</a></li>
              <li><a href="#shops" className="hover:text-brand-600 transition-colors">Active Print Stations</a></li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-slate-900 mb-2.5 uppercase tracking-wider text-[11px]">Company & Legal</div>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#about" className="hover:text-brand-600 transition-colors">About PrintX</a></li>
              <li><a href="#contact" className="hover:text-brand-600 transition-colors">Contact Support</a></li>
              <li><span className="text-slate-400">Privacy Policy (Auto-Purge)</span></li>
              <li><span className="text-slate-400">Terms of Service</span></li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-slate-900 mb-2.5 uppercase tracking-wider text-[11px]">Admin Access</div>
            <p className="text-[11px] text-slate-500 mb-3">
              Shop owners & Super Admins can manage printers, standee QRs and revenue reports.
            </p>
            <a
              href={(process.env.NEXT_PUBLIC_ADMIN_URL || 'https://printx-admin.vercel.app').replace(/\/+$/, '') + '/login'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors"
            >
              <span>Admin Login</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <p>© 2026 PrintX Technologies Pvt Ltd. All rights reserved.</p>
          <p className="text-slate-400">Built for speed, security & high concurrency.</p>
        </div>
      </footer>
    </div>
  );
}
