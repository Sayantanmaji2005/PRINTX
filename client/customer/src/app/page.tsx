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
import {
  PhonePeIcon,
  GooglePayIcon,
  PaytmIcon,
  BhimUpiIcon,
} from '@/components/PaymentLogos';
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

      {/* Top Navbar with Crisp Modern Black Outline */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/95 border-b-2 border-slate-900 shadow-neo-sm transition-all">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border-2 border-slate-900 flex items-center justify-center shadow-neo-sm group-hover:scale-105 transition-transform">
              <Printer className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-950 font-outfit">
              PRINT<span className="text-brand-600">X</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-bold text-slate-700">
            <a href="#brand" className="hover:text-brand-600 transition-colors font-extrabold text-brand-600">Brand</a>
            <a href="#services" className="hover:text-brand-600 transition-colors">Services</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing List</a>
            <a href="#recharge" className="text-slate-950 font-black hover:bg-amber-400 transition-colors px-3 py-1 rounded-full bg-amber-300 border-2 border-slate-900 text-xs shadow-neo-sm">
              Shop Plan ₹299
            </a>
            <a href="#shops" className="hover:text-brand-600 transition-colors">Find Station</a>
            <a href="#about" className="hover:text-brand-600 transition-colors">About Us</a>
            <a href="#contact" className="hover:text-brand-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={(process.env.NEXT_PUBLIC_ADMIN_URL || 'https://printx-admin.vercel.app').replace(/\/+$/, '') + '/login'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 transition-all border-2 border-slate-900 shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5"
            >
              Super Admin Portal →
            </a>
          </div>
        </div>
      </header>

      {/* Brand Showcase Section with Black Outline Card */}
      <section id="brand" className="relative z-10 max-w-6xl mx-auto px-4 pt-20 md:pt-24 w-full scroll-mt-20">
        <div className="relative rounded-3xl overflow-hidden border-3 border-slate-900 shadow-neo-lg bg-slate-950">
          <img
            src="/printxdemo.png"
            alt="PRINTX Smart Xerox & Automated Cloud Printing Brand Showcase"
            className="w-full h-auto object-cover object-center block select-none"
          />
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pt-10 pb-14 md:pt-14 md:pb-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-300 border-2 border-slate-900 text-slate-950 text-xs font-black mb-5 shadow-neo-sm">
          <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950 stroke-[2.5]" />
          <span>⚡ INDIA&apos;S SMARTEST CONTACTLESS XEROX & PRINT KIOSK</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight max-w-4xl leading-[1.15] text-slate-950 font-outfit">
          Instant Cloud Xerox,{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent font-black">
            Zero Waiting Time.
          </span>
          <br className="hidden sm:inline" />
          <span className="text-2xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 bg-clip-text text-transparent block mt-2 sm:mt-1">
            Scan & Print Directly from Your Phone.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg md:text-xl text-slate-700 max-w-2xl leading-relaxed font-medium">
          Transform your smartphone into an on-demand printing studio. No app installation, no pendrives, no WhatsApp file sharing — simply scan the shop counter QR and your fresh prints roll out in seconds.
        </p>

        {/* Hero Quick Action Buttons with Modern Black Outlines */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#shops"
            className="px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm border-2 border-slate-900 shadow-neo hover:shadow-neo-hover flex items-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <span>Scan or Select a Print Station</span>
            <ArrowRight className="w-4 h-4 stroke-[2.2]" />
          </a>
          <a
            href="#pricing"
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm border-2 border-slate-900 shadow-neo hover:shadow-neo-hover transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            View Rate Card & Pricing
          </a>
        </div>

        {/* Quick Trust Highlights with Black Outlines */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl text-left">
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 border-2 border-slate-900 text-slate-950 flex items-center justify-center shrink-0 shadow-neo-sm">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-950">0 Waiting Time</div>
              <div className="text-[11px] text-slate-600 font-semibold">Immediate Dispatch</div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-200 border-2 border-slate-900 text-slate-950 flex items-center justify-center shrink-0 shadow-neo-sm">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-950">100% UPI Safe</div>
              <div className="text-[11px] text-slate-600 font-semibold">Direct Shop Routing</div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-200 border-2 border-slate-900 text-slate-950 flex items-center justify-center shrink-0 shadow-neo-sm">
              <Smartphone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-950">No App Install</div>
              <div className="text-[11px] text-slate-600 font-semibold">Any Mobile Browser</div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo-sm hover:shadow-neo hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-200 border-2 border-slate-900 text-slate-950 flex items-center justify-center shrink-0 shadow-neo-sm">
              <Cpu className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-950">Cloud Print Agent</div>
              <div className="text-[11px] text-slate-600 font-semibold">Native Desktop Driver</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Process Section ("How It Works") with Modern Black Outlines */}
      <section id="how-it-works" className="py-16 bg-white border-y-2 border-slate-900 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-300 border-2 border-slate-900 text-slate-950 text-xs font-black mb-2 shadow-neo-sm">
              <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" /> HOW IT WORKS
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-950 font-outfit">
              Seamless 4-Step Self-Service Flow
            </h2>
            <p className="mt-3 text-sm text-slate-600 font-medium leading-relaxed">
              No need to explain pages or duplex settings to the shopkeeper. Configure everything visually from your own smartphone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 border-2 border-slate-900 text-slate-950 flex items-center justify-center mb-5 shadow-neo-sm group-hover:scale-105 transition-transform">
                  <QrCode className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="inline-block text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-200 border border-slate-900 text-slate-950 mb-2">STEP 01</div>
                <h3 className="font-black text-slate-950 text-lg">Scan Shop Standee QR</h3>
                <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                  Open your phone camera or any scanner to scan the unique PrintX counter QR standee at the Xerox shop.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t-2 border-slate-900 text-[11px] font-bold text-slate-950 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" /> Instant Shop Connect
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-slate-900 text-slate-950 flex items-center justify-center mb-5 shadow-neo-sm group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="inline-block text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-200 border border-slate-900 text-slate-950 mb-2">STEP 02</div>
                <h3 className="font-black text-slate-950 text-lg">Upload & Configure</h3>
                <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                  Upload PDF, Word or Photos. Customize B&W / Color, Single / Duplex, GSM paper quality, and number of copies.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t-2 border-slate-900 text-[11px] font-bold text-slate-950 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" /> Live Price Calculation
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 border-2 border-slate-900 text-slate-950 flex items-center justify-center mb-5 shadow-neo-sm group-hover:scale-105 transition-transform">
                  <CreditCard className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="inline-block text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-200 border border-slate-900 text-slate-950 mb-2">STEP 03</div>
                <h3 className="font-black text-slate-950 text-lg">Fast UPI Payment</h3>
                <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                  Scan the generated Dynamic UPI QR or launch Google Pay, PhonePe, Paytm or BHIM with a single click.
                </p>
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
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
              </div>
              <div className="mt-4 pt-3 border-t-2 border-slate-900 text-[11px] font-bold text-slate-950 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" /> 100% Automatic Verification
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-slate-900 text-slate-950 flex items-center justify-center mb-5 shadow-neo-sm group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="inline-block text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-200 border border-slate-900 text-slate-950 mb-2">STEP 04</div>
                <h3 className="font-black text-slate-950 text-lg">Instant Auto-Print</h3>
                <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                  Once payment is verified, the local Print Agent triggers the printer and your crisp prints are ready for pickup.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t-2 border-slate-900 text-[11px] font-bold text-slate-950 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" /> Zero Staff Dependency
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Network Stations Section */}
      <section id="shops" className="py-16 md:py-20 bg-slate-50 border-y-2 border-slate-900 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-200 border-2 border-slate-900 text-slate-950 text-xs font-black mb-2 shadow-neo-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse border border-slate-900" />
              <span>LIVE CONNECTED STATIONS</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-950 font-outfit">
              Find a Connected Xerox Counter Nearby
            </h2>
            <p className="mt-3 text-sm text-slate-600 font-medium leading-relaxed">
              Real-time hardware status of partner Xerox stations. Stations with running Desktop Agents show <strong>ONLINE</strong> for instant auto-print.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-500">Loading live print stations...</div>
          ) : shops.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border-2 border-slate-900 text-center max-w-md mx-auto shadow-neo">
              <div className="w-12 h-12 rounded-2xl bg-amber-200 border-2 border-slate-900 flex items-center justify-center mx-auto mb-3 text-slate-950 shadow-neo-sm">
                <Store className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="font-black text-slate-950 text-base">Demo PrintX Station</div>
              <p className="text-xs text-slate-600 font-medium mt-1">Visit our flagship counter to test instant phone-to-printer dispatch.</p>
              <a
                href="/shop/printx-shop"
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-xs border-2 border-slate-900 shadow-neo active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                <span>Open Station</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((s) => (
                <div
                  key={s.id}
                  className="p-6 rounded-3xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-blue-100 text-slate-950 font-black border-2 border-slate-900 shadow-neo-sm">
                        /{s.slug}
                      </span>
                      {s.isAgentOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-200 text-slate-950 border-2 border-slate-900 shadow-neo-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse border border-slate-900" />
                          ONLINE (Agent Active)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-slate-950 border-2 border-slate-900 shadow-neo-sm">
                          <span className="w-2 h-2 rounded-full bg-rose-600 border border-slate-900" />
                          OFFLINE (Agent Closed)
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-slate-950 text-xl font-outfit group-hover:text-brand-600 transition-colors">
                      {s.name}
                    </h3>
                    {s.address && (
                      <p className="text-xs text-slate-600 font-medium mt-1.5 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-900 shrink-0 stroke-[2.2]" />
                        <span>{s.address}</span>
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-slate-900 flex items-center justify-between">
                    <div className="text-[11px] text-slate-600 font-bold">
                      {s.isAgentOnline ? (
                        <span className="text-emerald-700 font-black">⚡ Ready to Print</span>
                      ) : (
                        <span className="text-slate-500">Agent Disconnected</span>
                      )}
                    </div>
                    <a
                      href={`/shop/${s.slug}`}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all border-2 border-slate-900 shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 ${
                        s.isAgentOnline
                          ? 'bg-amber-300 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                      }`}
                    >
                      <span>Open Counter</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services Section with Black Outlines */}
      <section id="services" className="py-16 md:py-24 max-w-6xl mx-auto px-4 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-100 border-2 border-slate-900 text-slate-950 text-xs font-black mb-2 shadow-neo-sm">
            <Layers className="w-3.5 h-3.5 stroke-[2.2]" /> FULL SUITE OF SERVICES
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-950 font-outfit">
            Comprehensive Printing & Finishing Solutions
          </h2>
          <p className="mt-3 text-sm text-slate-600 font-medium leading-relaxed">
            From single-page legal affidavits to complete 500-page academic dissertations with spiral binding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-200 border-2 border-slate-900 text-slate-950 flex items-center justify-center shadow-neo-sm group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-950 border border-slate-900 shadow-neo-sm">
                      {srv.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-950 font-outfit group-hover:text-brand-600 transition-colors">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                    {srv.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-slate-900 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-950 bg-amber-100 px-2.5 py-1 rounded-lg border border-slate-900 shadow-neo-sm">
                    {srv.badge}
                  </span>
                  <a
                    href="#shops"
                    className="text-xs font-black text-slate-950 flex items-center gap-1 group-hover:gap-1.5 transition-all"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transparent Pricing List Section (Modern Precision Black Outline) */}
      <section id="pricing" className="py-16 bg-white border-y-2 border-slate-900 text-slate-950 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-300 text-slate-950 text-xs font-black mb-3 border-2 border-slate-900 shadow-neo-sm">
              <BadgePercent className="w-3.5 h-3.5 stroke-[2.2]" /> 100% TRANSPARENT RATE CARD
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-950 font-outfit">
              Standard Print & Xerox Pricing
            </h2>
            <p className="mt-2 text-sm text-slate-600 font-medium">
              No hidden fees. Dynamic volume discounts automatically applied at checkout.
            </p>
          </div>

          {/* Pricing Category Tabs with Black Outlines */}
          <div className="flex justify-center mb-8">
            <div className="p-1.5 rounded-2xl bg-slate-100 border-2 border-slate-900 inline-flex gap-1.5 shadow-neo-sm">
              <button
                type="button"
                onClick={() => setPricingCategory('standard')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  pricingCategory === 'standard'
                    ? 'bg-amber-300 text-slate-950 border-2 border-slate-900 shadow-neo-sm'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                Black & White Docs
              </button>
              <button
                type="button"
                onClick={() => setPricingCategory('color')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  pricingCategory === 'color'
                    ? 'bg-amber-300 text-slate-950 border-2 border-slate-900 shadow-neo-sm'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                Color & Photo Prints
              </button>
              <button
                type="button"
                onClick={() => setPricingCategory('finishing')}
                className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  pricingCategory === 'finishing'
                    ? 'bg-amber-300 text-slate-950 border-2 border-slate-900 shadow-neo-sm'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                Binding & Lamination
              </button>
            </div>
          </div>

          {/* Pricing Table Card with Black Outline */}
          <div className="rounded-3xl bg-white border-2 border-slate-900 shadow-neo-lg overflow-hidden">
            <div className="divide-y-2 divide-slate-900">
              <div className="grid grid-cols-12 px-6 py-3.5 bg-slate-100 text-[11px] font-black text-slate-950 uppercase tracking-wider border-b-2 border-slate-900">
                <div className="col-span-6 sm:col-span-7">Service / Specification</div>
                <div className="col-span-3 sm:col-span-2 text-right">Standard Rate</div>
                <div className="col-span-3 text-right">Bulk / Student Offer</div>
              </div>

              {pricingData[pricingCategory].map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  <div className="col-span-6 sm:col-span-7">
                    <div className="font-black text-slate-950">{row.item}</div>
                    <div className="text-xs text-slate-600 font-medium mt-0.5">{row.specs}</div>
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right font-black text-slate-950">
                    {row.rate}
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="inline-block text-xs font-bold text-slate-950 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-slate-900 shadow-neo-sm">
                      {row.bulk}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-700 font-medium gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.2] shrink-0" />
                <span>Rates may slightly vary depending on individual shop configuration.</span>
              </div>
              <a
                href="#shops"
                className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black transition-all text-xs shrink-0 border-2 border-slate-900 shadow-neo-sm hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                Go to Live Print Station →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Partner ₹299 Monthly Recharge Pack Section with Black Outlines */}
      <section id="recharge" className="py-16 md:py-20 bg-slate-50 text-slate-950 relative overflow-hidden border-b-2 border-slate-900">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-200 text-slate-950 text-xs font-black mb-3 border-2 border-slate-900 shadow-neo-sm">
              <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950 stroke-[2.2]" />
              <span>SHOP PARTNER PLAN • FLAT MONTHLY RECHARGE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-outfit tracking-tight text-slate-950">
              Power Your Xerox Shop for Just{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                ₹299 / Month
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              Everything a Cyber Cafe or Xerox store needs to run automated, queue-free cloud printing. Zero commission on your print income — you keep 100% of your earnings.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Pricing Feature Highlight Box (Left) with Black Outline */}
            <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white border-2 border-slate-900 shadow-neo-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900">
                  <div>
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">ALL-IN-ONE XEROX LICENSE</span>
                    <h3 className="text-2xl font-black text-slate-950 font-outfit mt-1">Smart PrintX Station Pack</h3>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className="text-3xl sm:text-4xl font-black text-slate-950 font-outfit">₹299</span>
                      <span className="text-xs text-slate-600 font-bold">/ month</span>
                    </div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-slate-950 border border-slate-900 shadow-neo-sm mt-1">
                      0% Commission Cut
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Unlimited Print Dispatch:</strong> Zero page limits. Run thousands of prints every day smoothly.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Custom Standee QR:</strong> High-res printable counter QR standee generated with your shop name.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Direct UPI Payouts:</strong> Customer payment goes straight to your own UPI ID.
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                          <GooglePayIcon className="w-3 h-3" />
                          <span>GPay</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 shadow-2xs">
                          <PhonePeIcon className="w-3 h-3" />
                          <span>PhonePe</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200 shadow-2xs">
                          <PaytmIcon className="w-3.5 h-3" />
                          <span>Paytm</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Desktop Agent Driver:</strong> Connects with all Canon, HP, Epson, Brother & Konica printers.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Live Daily Accounts:</strong> Real-time dashboard showing total earnings, pages & order history.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">Anti-Fraud Protection:</strong> Zero prints are executed before UPI payment confirmation.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600 font-semibold">
                  💳 Instant recharge via UPI • Auto-renew or cancel anytime
                </div>
                <a
                  href="https://wa.me/919002761536?text=Hi%20PrintX%20Team,%20I%20want%20to%20recharge/activate%20the%20Rs%20299%20Monthly%20Shop%20Partner%20Pack%20for%20my%20Xerox%20Shop."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-xs sm:text-sm border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-slate-950 stroke-[2.2]" />
                  <span>Recharge Shop Now (₹299)</span>
                </a>
              </div>
            </div>

            {/* Why Recharge with PrintX (Right) with Black Outline */}
            <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white border-2 border-slate-900 shadow-neo-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-200 border-2 border-slate-900 text-slate-950 flex items-center justify-center mb-4 shadow-neo-sm">
                  <Store className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-xl font-black text-slate-950 font-outfit">How ₹299 Transforms Your Shop</h3>
                <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">
                  Save 2+ hours daily, stop taking WhatsApp prints manually, eliminate loose change arguments, and handle 3x more customers during exam rush hours.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-200 text-slate-950 border border-slate-900 flex items-center justify-center font-black text-xs shrink-0 shadow-neo-sm">
                      ₹0
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-slate-950">No Commission Deductions</span>
                      <p className="text-[11px] text-slate-600">All customer UPI payments reach your account directly.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-200 text-slate-950 border border-slate-900 flex items-center justify-center font-black text-xs shrink-0 shadow-neo-sm">
                      10x
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-slate-950">Parallel Customer Queue</span>
                      <p className="text-[11px] text-slate-600">Multiple students can upload and print simultaneously.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-200 text-slate-950 border border-slate-900 flex items-center justify-center font-black text-xs shrink-0 shadow-neo-sm">
                      24h
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-slate-950">Technician Support Included</span>
                      <p className="text-[11px] text-slate-600">Call or WhatsApp +91 9002761536 for instant remote setup.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-slate-900">
                <a
                  href={(process.env.NEXT_PUBLIC_ADMIN_URL || 'https://printx-admin.vercel.app').replace(/\/+$/, '') + '/login'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-amber-300 hover:bg-amber-400 text-slate-950 font-black text-xs border-2 border-slate-900 shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Already a partner? Open Shop Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zero-Storage Privacy & Hardware Guarantee Section with Black Outlines */}
      <section className="py-16 md:py-20 max-w-6xl mx-auto px-4 w-full">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border-2 border-slate-900 shadow-neo-lg relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-300 text-slate-950 text-xs font-black mb-3 border-2 border-slate-900 shadow-neo-sm">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" /> 100% PRIVATE & EPHEMERAL
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 font-outfit">
                Zero Cloud Storage • Auto-Purged After Printing
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                Your private bank statements, college assignments, legal contracts, and personal photos are never stored permanently. As soon as the physical printer spools the pages, files are securely shredded and permanently deleted from RAM and disk.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <a
                href="#shops"
                className="px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-xs sm:text-sm border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Find a Live Counter</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </a>
              <a
                href="#pricing"
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs sm:text-sm border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                View Rate Card
              </a>
            </div>
          </div>
        </div>
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
                  href="https://wa.me/919002761536?text=Hi%20PrintX%20Team,%20I%20want%20to%20know%20more%20about%20your%20Smart%20Printing%20Station."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">WhatsApp Direct Support</div>
                    <div className="text-[11px] text-emerald-700">+91 9002761536 (Tap to Chat)</div>
                  </div>
                </a>

                <a
                  href="tel:+919002761536"
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-blue-50/50 hover:bg-blue-100/60 border border-blue-100 text-slate-700 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Helpline / Support Phone</div>
                    <div className="text-[11px] text-slate-600">+91 9002761536 (Tap to Call)</div>
                  </div>
                </a>

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
                      <label className="block text-xs font-bold text-slate-900 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white shadow-neo-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1">Phone / WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white shadow-neo-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@gmail.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white shadow-neo-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">Your Message / Requirement</label>
                    <textarea
                      rows={3}
                      placeholder="Tell us what you are looking for (e.g. Bulk thesis printing, franchise inquiry, support...)"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 text-xs font-bold text-slate-950 focus:outline-none focus:bg-white shadow-neo-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-xs border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Black Outline */}
      <footer className="mt-auto border-t-2 border-slate-900 bg-white py-10 text-xs text-slate-600 font-medium">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-900 flex items-center justify-center text-white">
                <Printer className="w-4 h-4 stroke-[2.2]" />
              </div>
              <span className="text-xl font-black text-slate-950 font-outfit">
                PRINT<span className="text-brand-600">X</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              India&apos;s pioneering cloud automated xerox & print-on-demand kiosk SaaS platform.
            </p>
          </div>

          <div>
            <div className="font-black text-slate-950 mb-2.5 uppercase tracking-wider text-[11px]">Quick Navigation</div>
            <ul className="space-y-2 text-[11px] font-bold">
              <li><a href="#services" className="hover:text-brand-600 transition-colors">Services Offered</a></li>
              <li><a href="#how-it-works" className="hover:text-brand-600 transition-colors">4-Step Flow</a></li>
              <li><a href="#pricing" className="hover:text-brand-600 transition-colors">Rate Card & Pricing</a></li>
              <li><a href="#shops" className="hover:text-brand-600 transition-colors">Active Print Stations</a></li>
            </ul>
          </div>

          <div>
            <div className="font-black text-slate-950 mb-2.5 uppercase tracking-wider text-[11px]">Company & Legal</div>
            <ul className="space-y-2 text-[11px] font-bold">
              <li><a href="#about" className="hover:text-brand-600 transition-colors">About PrintX</a></li>
              <li><a href="#contact" className="hover:text-brand-600 transition-colors">Contact Support</a></li>
              <li><span className="text-slate-400">Privacy Policy (Auto-Purge)</span></li>
              <li><span className="text-slate-400">Terms of Service</span></li>
            </ul>
          </div>

          <div>
            <div className="font-black text-slate-950 mb-2.5 uppercase tracking-wider text-[11px]">Admin Access</div>
            <p className="text-[11px] text-slate-600 mb-3 font-medium">
              Shop owners & Super Admins can manage printers, standee QRs and revenue reports.
            </p>
            <a
              href={(process.env.NEXT_PUBLIC_ADMIN_URL || 'https://printx-admin.vercel.app').replace(/\/+$/, '') + '/login'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-300 hover:bg-amber-400 text-slate-950 text-[11px] font-black border-2 border-slate-900 shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <span>Admin Login</span>
              <ArrowRight className="w-3 h-3 stroke-[2.2]" />
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-bold text-slate-900">
          <p>© 2026 PrintX Technologies Pvt Ltd. All rights reserved.</p>
          <p className="text-slate-500 font-semibold">Built for speed, security & high concurrency.</p>
        </div>
      </footer>
    </div>
  );
}
