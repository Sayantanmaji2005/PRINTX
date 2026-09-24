'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  X,
  CreditCard,
  Layers,
  Award,
  BookOpen,
  FileCheck,
  Palette,
  Copy,
  Receipt,
  Search,
  Check,
  ChevronRight,
  Sliders,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Share2,
} from 'lucide-react';
import { fetchShopBySlug, startCustomerSession, getOrder } from '@/lib/api';

export default function ShopCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [shop, setShop] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Modals for Specialized Services
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // 1. Google Drive State
  const [driveUrl, setDriveUrl] = useState('');

  // 2. Document Scanner State
  const [scannerPages, setScannerPages] = useState<string[]>([]);
  const [scannerFilter, setScannerFilter] = useState<'original' | 'enhanced' | 'bw' | 'grayscale'>('bw');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3. Passport Photo Studio State
  const [passportPhoto, setPassportPhoto] = useState<string | null>(null);
  const [passportLayout, setPassportLayout] = useState<8 | 16 | 32>(8);
  const [passportPreset, setPassportPreset] = useState<'passport' | 'visa' | 'pan' | 'aadhaar'>('passport');
  const [passportBg, setPassportBg] = useState<'white' | 'blue' | 'gray'>('white');
  const passportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 4. Resume Printing State
  const [resumeTemplate, setResumeTemplate] = useState('executive');
  const [resumePaperGsm, setResumePaperGsm] = useState('80');
  const [resumeColor, setResumeColor] = useState('BW');

  // 5. Binding Service State
  const [bindingType, setBindingType] = useState('spiral');
  const [bindingCover, setBindingCover] = useState('transparent');

  // 6. Lamination Service State
  const [laminationSize, setLaminationSize] = useState('A4');
  const [laminationFinish, setLaminationFinish] = useState('gloss');

  // 7. Bulk Xerox Calculator State
  const [bulkPages, setBulkPages] = useState(120);
  const [bulkMode, setBulkMode] = useState<'BW_SINGLE' | 'BW_DOUBLE' | 'COLOR_SINGLE'>('BW_DOUBLE');

  // 8. Order Tracking & Receipt State
  const [trackOrderNumber, setTrackOrderNumber] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    async function init() {
      try {
        setLoading(true);
        setError(null);
        const shopData = await fetchShopBySlug(slug);
        setShop(shopData);

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

  // Camera Lifecycle for Document Scanner
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (activeModal === 'scanner') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setCameraActive(true);
          }
        })
        .catch(() => {
          setCameraActive(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((track) => track.stop());
      }
      setCameraActive(false);
    }

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [activeModal]);

  // Passport Photo Canvas Render Engine
  useEffect(() => {
    if (activeModal === 'passport' && passportCanvasRef.current && passportPhoto) {
      const canvas = passportCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw A4 Sheet aspect (width 595 x height 842 pt scaled)
        canvas.width = 600;
        canvas.height = 848;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header Guide
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`PRINTX PHOTO STUDIO ΓÇö A4 PASSPORT SHEET (${passportLayout} PHOTOS)`, 24, 30);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(24, 38, 552, 1);

        // Grid parameters
        let cols = 4;
        let rows = 2;
        if (passportLayout === 16) {
          cols = 4;
          rows = 4;
        } else if (passportLayout === 32) {
          cols = 8;
          rows = 4;
        }

        const photoW = passportLayout === 32 ? 60 : 110;
        const photoH = passportLayout === 32 ? 80 : 140;
        const gapX = passportLayout === 32 ? 10 : 26;
        const gapY = passportLayout === 32 ? 12 : 28;
        const startX = 30;
        const startY = 60;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = startX + c * (photoW + gapX);
            const y = startY + r * (photoH + gapY);

            // Background tint
            if (passportBg === 'blue') ctx.fillStyle = '#dbeafe';
            else if (passportBg === 'gray') ctx.fillStyle = '#f1f5f9';
            else ctx.fillStyle = '#ffffff';

            ctx.fillRect(x, y, photoW, photoH);

            // Draw image cropped in center
            ctx.drawImage(img, x + 2, y + 2, photoW - 4, photoH - 4);

            // Border cutting line
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 2]);
            ctx.strokeRect(x, y, photoW, photoH);
            ctx.setLineDash([]);
          }
        }
      };
      img.src = passportPhoto;
    }
  }, [activeModal, passportPhoto, passportLayout, passportBg]);

  // Capture Photo from Camera for Scanner
  const captureScannerPage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply Filter Mode
    if (scannerFilter === 'bw' || scannerFilter === 'grayscale' || scannerFilter === 'enhanced') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (scannerFilter === 'bw') {
          const threshold = v > 128 ? 255 : 0;
          d[i] = threshold;
          d[i + 1] = threshold;
          d[i + 2] = threshold;
        } else if (scannerFilter === 'enhanced') {
          const enhanced = v < 110 ? v * 0.7 : Math.min(255, v * 1.2);
          d[i] = enhanced;
          d[i + 1] = enhanced;
          d[i + 2] = enhanced;
        } else {
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setScannerPages((prev) => [...prev, dataUrl]);
  };

  const handleTrackOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderNumber.trim()) return;
    try {
      setTrackingLoading(true);
      setTrackingError(null);
      const data = await getOrder(trackOrderNumber.trim());
      setTrackedOrder(data);
    } catch (err: any) {
      setTrackingError(err.message || 'Order not found');
      setTrackedOrder(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50/70 via-slate-50 to-white text-slate-800">
        <div className="w-14 h-14 rounded-2xl bg-white border border-blue-200 flex items-center justify-center mb-4 shadow-md shadow-blue-500/10">
          <Printer className="w-7 h-7 text-brand-600 animate-spin" />
        </div>
        <p className="text-sm font-bold text-slate-900 font-['Outfit']">Connecting to Xerox Station...</p>
        <p className="text-xs text-slate-500 mt-1">Initializing secure guest print session</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50/70 via-slate-50 to-white text-slate-800 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-['Outfit']">Shop Unavailable</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm">{error || 'Could not find this Xerox shop.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (shop && (shop.status === 'SUSPENDED' || shop.status === 'INACTIVE')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-50/70 via-slate-50 to-white text-slate-800 text-center font-sans">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 flex items-center justify-center mb-4 text-amber-700 shadow-xl shadow-amber-500/10">
          <AlertCircle className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2 border border-amber-200">
          Subscription Inactive
        </span>
        <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">{shop.name}</h2>
        <p className="text-xs text-slate-600 mt-2 max-w-md leading-relaxed">
          This Xerox counter's <strong>PRINTX Software Subscription (₹299/mo)</strong> is currently expired or paused.
          Please inform the shop counter staff to recharge their PRINTX software license to enable customer QR printing.
        </p>

        <div className="mt-6 p-4 rounded-2xl bg-white border border-slate-200 max-w-sm w-full text-xs text-left shadow-xs space-y-1.5">
          <div className="font-bold text-slate-800">Counter Information:</div>
          <div className="text-slate-600">Location: {shop.address || 'Dingal 4 No Canel Road'}</div>
          {shop.owner?.phone && (
            <div className="text-slate-600">Phone: {shop.owner.phone}</div>
          )}
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
            Powered by PRINTX SaaS Platform
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50/70 via-slate-50 to-white text-slate-900 relative overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="fixed -top-32 -left-32 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Mobile-First Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/85 border-b border-blue-100 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 font-['Outfit']">
              PRINT<span className="text-brand-600">X</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModal('track')}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
            >
              Track Order
            </button>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Printer
            </span>
          </div>
        </div>
      </header>

      {/* Main Customer Screen Container */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col justify-between relative z-10">
        <div>
          {/* Shop Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-blue-100 shadow-md shadow-blue-500/5 relative overflow-hidden mb-6">
            <div className="text-[11px] font-bold tracking-wider text-brand-600 uppercase mb-1">
              CONNECTED XEROX SHOP
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
              Welcome to {shop.name}
            </h1>

            {shop.address && (
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{shop.address}</span>
              </p>
            )}

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Auto-Print Ready</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>UPI Verified</span>
              </div>
            </div>
          </div>

          {/* Core Slogan Banner */}
          <div className="mb-6 text-center">
            <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
              Print anything. Pay digitally. Collect instantly.
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select an option below to start your print order
            </p>
          </div>

          {/* 12 Service Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* 1. Upload Document (PDF, DOCX) */}
            <button
              onClick={() => router.push(`/shop/${slug}/upload`)}
              className="action-card p-4 rounded-3xl bg-white border border-blue-100 hover:border-brand-500 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit']">Upload Document</span>
                <span className="text-[10px] text-brand-600 font-semibold mt-0.5 block">PDF, DOCX, PPTX</span>
              </div>
            </button>

            {/* 2. Google Drive */}
            <button
              onClick={() => setActiveModal('drive')}
              className="action-card p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-indigo-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <FolderDown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit']">Google Drive</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Import from Cloud</span>
              </div>
            </button>

            {/* 3. Scan Document */}
            <button
              onClick={() => setActiveModal('scanner')}
              className="action-card p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-emerald-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit']">Scan Document</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Use Phone Camera</span>
              </div>
            </button>

            {/* 4. Upload Images */}
            <button
              onClick={() => router.push(`/shop/${slug}/upload`)}
              className="action-card p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-amber-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit']">Upload Images</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">JPG, PNG, Photos</span>
              </div>
            </button>

            {/* 5. Passport Photo Studio */}
            <button
              onClick={() => setActiveModal('passport')}
              className="action-card p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-sky-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit']">Passport Photo</span>
                <span className="text-[10px] text-sky-600 font-medium mt-0.5 block">8, 16, 32 Sheet Layout</span>
              </div>
            </button>

            {/* 6. Resume / CV */}
            <button
              onClick={() => setActiveModal('resume')}
              className="action-card p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-violet-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-200/80 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit']">Resume / CV</span>
                <span className="text-[10px] text-violet-600 font-medium mt-0.5 block">High GSM Paper</span>
              </div>
            </button>

            {/* 7. ID Card & Certificate */}
            <button
              onClick={() => setActiveModal('idcard')}
              className="action-card p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-rose-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit']">ID & Certificate</span>
                <span className="text-[10px] text-rose-600 font-medium mt-0.5 block">PVC & Badge Sizing</span>
              </div>
            </button>

            {/* 8. Binding Service */}
            <button
              onClick={() => setActiveModal('binding')}
              className="action-card p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-orange-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit']">Spiral & Binding</span>
                <span className="text-[10px] text-orange-600 font-medium mt-0.5 block">Comb, Wiro & Hard</span>
              </div>
            </button>

            {/* 9. Lamination */}
            <button
              onClick={() => setActiveModal('lamination')}
              className="action-card p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-teal-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit']">Lamination</span>
                <span className="text-[10px] text-teal-600 font-medium mt-0.5 block">A4, A3, Gloss / Matte</span>
              </div>
            </button>

            {/* 10. Design Studio */}
            <button
              onClick={() => setActiveModal('design')}
              className="action-card p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-fuchsia-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-fuchsia-50 border border-fuchsia-200/80 flex items-center justify-center text-fuchsia-600 group-hover:scale-110 transition-transform">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit']">Design Studio</span>
                <span className="text-[10px] text-fuchsia-600 font-medium mt-0.5 block">Posters, Cards, Covers</span>
              </div>
            </button>

            {/* 11. Bulk Photocopy / Xerox */}
            <button
              onClick={() => setActiveModal('bulk')}
              className="action-card p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-cyan-400 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-200/80 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit']">Bulk Photocopy</span>
                <span className="text-[10px] text-cyan-600 font-medium mt-0.5 block">50+ Page Discounts</span>
              </div>
            </button>

            {/* 12. Track Order & Digital Bill */}
            <button
              onClick={() => setActiveModal('track')}
              className="action-card p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-slate-500 text-left flex flex-col justify-between h-36 group relative overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 group-hover:scale-110 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block font-['Outfit']">Track & Receipts</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Live Status & Bill</span>
              </div>
            </button>
          </div>

          {/* Pricing Info Banner */}
          <div className="mt-6 p-4 rounded-3xl bg-white border border-blue-100 shadow-xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-brand-600 shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-600 flex-1">
              <div className="text-slate-900 font-bold flex items-center justify-between">
                <span className="font-['Outfit']">Verified Rates for {shop.name}</span>
                <span className="text-[10px] text-emerald-600 font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  Live Rates
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-700">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span>A4 B&W (Single)</span>
                  <strong className="text-brand-600 font-bold">Γé╣2.00</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span>A4 B&W (Both)</span>
                  <strong className="text-brand-600 font-bold">Γé╣3.00</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span>A4 Color (Single)</span>
                  <strong className="text-brand-600 font-bold">Γé╣8.00</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span>A4 Color (Both)</span>
                  <strong className="text-brand-600 font-bold">Γé╣15.00</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span>A3 B&W (Single)</span>
                  <strong className="text-brand-600 font-bold">Γé╣3.00</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span>A3 Color (Single)</span>
                  <strong className="text-brand-600 font-bold">Γé╣10.00</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span>Spiral Binding</span>
                  <strong className="text-brand-600 font-bold">Γé╣40.00</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span>A4 Lamination</span>
                  <strong className="text-brand-600 font-bold">Γé╣20.00</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy Notice */}
        <div className="mt-8 text-center text-[10px] text-slate-500 pb-2 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit Encrypted ΓÇó Auto-deleted after 24 hours</span>
          </div>
          <p>Session ID: {session?.id ? `${session.id.substring(0, 10)}...` : 'Guest'}</p>
        </div>
      </main>

      {/* ================= MODAL: 1. GOOGLE DRIVE IMPORT ================= */}
      {activeModal === 'drive' && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-indigo-100 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <FolderDown className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base font-['Outfit']">Google Drive Import</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-600">
              <p>You can import any document or PDF from your Google Drive:</p>
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                <div className="font-semibold text-indigo-950">Option A: Native Phone Storage Picker</div>
                <p className="text-[11px] text-indigo-900/80">
                  Tap &quot;Select from Drive&quot; below, then choose &quot;Google Drive&quot; in your mobile file selector.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Option B: Paste Shared Google Drive Link
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push(`/shop/${slug}/upload?source=drive`)}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20"
              >
                Open File Picker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 2. DOCUMENT SCANNER ================= */}
      {activeModal === 'scanner' && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm font-['Outfit']">Document Camera Scanner</span>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Viewfinder Canvas */}
          <div className="flex-1 my-3 flex flex-col items-center justify-center relative rounded-2xl overflow-hidden bg-black border border-slate-800">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />

            {/* Document Edge Alignment Overlay Guide */}
            <div className="absolute inset-8 border-2 border-emerald-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between text-[10px] font-mono text-emerald-300 font-bold bg-black/40 px-2 py-0.5 rounded">
                <span>ALIGN DOCUMENT CORNERS</span>
                <span>A4 AUTO-DETECT</span>
              </div>
              <div className="text-center text-[10px] text-emerald-300 font-bold bg-black/40 py-0.5 rounded">
                Keep camera flat and steady
              </div>
            </div>
          </div>

          {/* Captured Pages Strip */}
          {scannerPages.length > 0 && (
            <div className="mb-3 flex items-center gap-2 overflow-x-auto p-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 px-1">Pages ({scannerPages.length}):</span>
              {scannerPages.map((p, idx) => (
                <div key={idx} className="relative w-12 h-16 rounded-lg overflow-hidden border border-emerald-500 shrink-0">
                  <img src={p} alt={`Scanned page ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center font-bold">#{idx + 1}</span>
                </div>
              ))}
            </div>
          )}

          {/* Filter Bar & Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setScannerFilter('bw')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  scannerFilter === 'bw' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                B&W Xerox
              </button>
              <button
                onClick={() => setScannerFilter('enhanced')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  scannerFilter === 'enhanced' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Enhanced
              </button>
              <button
                onClick={() => setScannerFilter('grayscale')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  scannerFilter === 'grayscale' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Grayscale
              </button>
              <button
                onClick={() => setScannerFilter('original')}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  scannerFilter === 'original' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                Color
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setScannerPages([])}
                disabled={scannerPages.length === 0}
                className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-400 text-xs font-semibold disabled:opacity-40"
              >
                Clear
              </button>

              <button
                onClick={captureScannerPage}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg transition-transform active:scale-95"
              >
                <Camera className="w-7 h-7" />
              </button>

              <button
                onClick={() => {
                  setActiveModal(null);
                  router.push(`/shop/${slug}/upload`);
                }}
                disabled={scannerPages.length === 0}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold disabled:opacity-40"
              >
                Done ({scannerPages.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 3. PASSPORT PHOTO STUDIO ================= */}
      {activeModal === 'passport' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-sky-100 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-['Outfit']">Passport Photo Studio</h3>
                  <p className="text-[11px] text-slate-500">Auto-crop, background tone & A4 sheet tiling</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Photo Input or Upload */}
              {!passportPhoto ? (
                <div className="p-8 rounded-2xl border-2 border-dashed border-sky-200 text-center flex flex-col items-center">
                  <Award className="w-10 h-10 text-sky-500 mb-2" />
                  <p className="text-xs font-bold text-slate-800">Upload Your Portrait Photo</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Clear front face with neutral expression</p>
                  <label className="mt-4 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer shadow-md shadow-sky-500/20">
                    <span>Select Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const reader = new FileReader();
                          reader.onload = () => setPassportPhoto(reader.result as string);
                          reader.readAsDataURL(f);
                        }
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preset & Layout Controls */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Standard Preset</label>
                      <select
                        value={passportPreset}
                        onChange={(e) => setPassportPreset(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        <option value="passport">Indian Passport (3.5 ├ù 4.5 cm)</option>
                        <option value="visa">US / Europe Visa (2 ├ù 2 in)</option>
                        <option value="pan">PAN Card Specification</option>
                        <option value="aadhaar">Aadhaar / ID Card</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Photos Per A4 Sheet</label>
                      <select
                        value={passportLayout}
                        onChange={(e) => setPassportLayout(Number(e.target.value) as any)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        <option value={8}>8 Photos (Standard Pack)</option>
                        <option value={16}>16 Photos (Value Pack)</option>
                        <option value={32}>32 Photos (Bulk Sheet)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[11px] font-bold text-slate-700">Background Tone:</span>
                    <button
                      onClick={() => setPassportBg('white')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        passportBg === 'white' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      White
                    </button>
                    <button
                      onClick={() => setPassportBg('blue')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        passportBg === 'blue' ? 'bg-sky-600 text-white border-sky-600' : 'bg-sky-50 text-sky-700'
                      }`}
                    >
                      Studio Blue
                    </button>
                    <button
                      onClick={() => setPassportBg('gray')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        passportBg === 'gray' ? 'bg-slate-600 text-white border-slate-600' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Light Gray
                    </button>
                  </div>

                  {/* A4 Photo Sheet Live Canvas Preview */}
                  <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex justify-center">
                    <canvas
                      ref={passportCanvasRef}
                      className="w-full max-w-sm rounded-lg shadow-md border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Rate: Γé╣50.00 <span className="text-[11px] text-slate-500 font-normal">/ A4 Photo Glossy Sheet</span>
              </span>
              <div className="flex items-center gap-2">
                {passportPhoto && (
                  <button
                    onClick={() => setPassportPhoto(null)}
                    className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    Change Photo
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveModal(null);
                    router.push(`/shop/${slug}/upload`);
                  }}
                  disabled={!passportPhoto}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-40"
                >
                  Proceed to Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 4. RESUME / CV PRINTING ================= */}
      {activeModal === 'resume' && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-violet-100 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-['Outfit']">Resume & CV Printing</h3>
                  <p className="text-[11px] text-slate-500">Executive bond papers & sharp professional prints</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Paper Weight & Finish</label>
                  <select
                    value={resumePaperGsm}
                    onChange={(e) => setResumePaperGsm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                  >
                    <option value="80">80 GSM Executive Bond Paper (+Γé╣1/sheet)</option>
                    <option value="100">100 GSM Premium Ultra-White (+Γé╣2/sheet)</option>
                    <option value="75">75 GSM Standard Paper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Color Mode</label>
                  <select
                    value={resumeColor}
                    onChange={(e) => setResumeColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                  >
                    <option value="BW">Black & White (Sharp & Crisp)</option>
                    <option value="COLOR">Full Color (Profile Photo / Badges)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 space-y-1.5">
                <div className="font-bold text-violet-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>HR Recommended Settings</span>
                </div>
                <p className="text-[11px] text-violet-900/80 leading-relaxed">
                  For job interviews, 80-100 GSM heavy bond paper creates a strong tactile impression. Single-sided printing is recommended.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  router.push(`/shop/${slug}/upload`);
                }}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Upload Resume PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 5. SPIRAL & HARD BINDING ================= */}
      {activeModal === 'binding' && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-orange-100 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-['Outfit']">Document Binding Options</h3>
                  <p className="text-[11px] text-slate-500">Project reports, thesis, legal files & brochures</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'spiral', label: 'Spiral Coil Binding', price: 'Γé╣40.00', desc: 'Plastic spiral ring + sheet covers' },
                  { id: 'comb', label: 'Comb Binding', price: 'Γé╣40.00', desc: 'Re-openable 19-ring spine' },
                  { id: 'wiro', label: 'Wiro Twin Ring', price: 'Γé╣60.00', desc: 'Executive metal double-wire' },
                  { id: 'staple', label: 'Corner / Edge Staple', price: 'Γé╣5.00', desc: 'Heavy-duty steel staple' },
                  { id: 'softcover', label: 'Thermal Soft Cover', price: 'Γé╣80.00', desc: 'Glued spine with clear front' },
                  { id: 'hardcover', label: 'Golden Hard Cover', price: 'Γé╣250.00', desc: 'College thesis & project books' },
                ].map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setBindingType(b.id)}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      bindingType === b.id
                        ? 'border-orange-500 bg-orange-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-slate-900 text-xs">{b.label}</div>
                    <div className="text-[10px] text-orange-700 font-bold mt-0.5">{b.price}</div>
                    <div className="text-[9px] text-slate-500 mt-1 leading-tight">{b.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Selected: <span className="text-orange-600 capitalize">{bindingType}</span>
              </span>
              <button
                onClick={() => {
                  setActiveModal(null);
                  router.push(`/shop/${slug}/upload`);
                }}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Upload Document to Bind
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 6. LAMINATION ================= */}
      {activeModal === 'lamination' && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-teal-100 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-['Outfit']">Document Lamination</h3>
                  <p className="text-[11px] text-slate-500">Waterproof & tearproof thermal pouch lamination</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Size Pouch</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'A4', label: 'A4 Sheet', price: 'Γé╣20.00' },
                    { id: 'A3', label: 'A3 Certificate', price: 'Γé╣40.00' },
                    { id: 'ID', label: 'ID Card / Badge', price: 'Γé╣10.00' },
                    { id: 'AADHAAR', label: 'Aadhaar / PAN', price: 'Γé╣10.00' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLaminationSize(l.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        laminationSize === l.id ? 'border-teal-500 bg-teal-50/60 font-bold' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="text-xs text-slate-900">{l.label}</div>
                      <div className="text-[10px] text-teal-700 font-bold">{l.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Finish</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLaminationFinish('gloss')}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold ${
                      laminationFinish === 'gloss' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    High Gloss Ultra Clear
                  </button>
                  <button
                    onClick={() => setLaminationFinish('matte')}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold ${
                      laminationFinish === 'matte' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    Matte Non-Reflective
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  router.push(`/shop/${slug}/upload`);
                }}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 7. BULK XEROX CALCULATOR ================= */}
      {activeModal === 'bulk' && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-cyan-100 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-['Outfit']">Bulk Xerox Calculator</h3>
                  <p className="text-[11px] text-slate-500">Tier discounts automatically applied on 50+ pages</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-700">
              <div>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>Number of Pages / Sheets:</span>
                  <span className="text-cyan-700 font-mono text-sm">{bulkPages} pages</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={600}
                  step={10}
                  value={bulkPages}
                  onChange={(e) => setBulkPages(Number(e.target.value))}
                  className="w-full accent-cyan-600"
                />
              </div>

              {/* Discount Badge */}
              <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-cyan-950">
                    {bulkPages >= 500 ? 'Tier 3 Wholesale Discount' : bulkPages >= 100 ? 'Tier 2 Bulk Discount' : bulkPages >= 50 ? 'Tier 1 Student / Bulk' : 'Standard Rate'}
                  </div>
                  <div className="text-[10px] text-cyan-800">
                    {bulkPages >= 500 ? '15% Off Total Bill' : bulkPages >= 100 ? '10% Off Total Bill' : bulkPages >= 50 ? '5% Off Total Bill' : 'Add 50+ pages for discount'}
                  </div>
                </div>
                <span className="text-sm font-extrabold text-cyan-700 font-mono">
                  {bulkPages >= 500 ? '-15%' : bulkPages >= 100 ? '-10%' : bulkPages >= 50 ? '-5%' : '0%'}
                </span>
              </div>

              {/* Calculation Preview */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[11px] block">Estimated Total Cost:</span>
                  <span className="text-lg font-black text-slate-900 font-['Outfit']">
                    Γé╣{Math.max(
                      10,
                      Math.round(
                        bulkPages *
                          1.5 *
                          (bulkPages >= 500 ? 0.85 : bulkPages >= 100 ? 0.9 : bulkPages >= 50 ? 0.95 : 1)
                      )
                    ).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    router.push(`/shop/${slug}/upload`);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Upload & Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 8. TRACK ORDER & DIGITAL RECEIPT ================= */}
      {activeModal === 'track' && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-['Outfit']">Track Order & Receipt</h3>
                  <p className="text-[11px] text-slate-500">Live timeline & digital billing voucher</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTrackOrderSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Enter PRINTX Order ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. PX-20260924-5053"
                    value={trackOrderNumber}
                    onChange={(e) => setTrackOrderNumber(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {trackingLoading ? 'Searching...' : 'Track'}
                  </button>
                </div>
              </div>
            </form>

            {trackingError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                {trackingError}
              </div>
            )}

            {/* Tracked Order Details */}
            {trackedOrder && (
              <div className="mt-4 space-y-4 pt-3 border-t border-slate-100">
                {/* 7-Step Timeline */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900">{trackedOrder.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {trackedOrder.paymentStatus}
                    </span>
                  </div>

                  {/* Visual Steps */}
                  <div className="space-y-2 pt-2 text-[11px]">
                    {[
                      { title: 'Order Received & Encrypted', done: true },
                      { title: 'UPI Payment Confirmed', done: trackedOrder.paymentStatus === 'SUCCESS' },
                      { title: 'Added to Printer Hardware Queue', done: trackedOrder.status !== 'CREATED' },
                      { title: 'Printing on Machine', done: trackedOrder.printStatus === 'PRINTING' || trackedOrder.printStatus === 'PRINTED' },
                      { title: 'Automated Print Completed', done: trackedOrder.printStatus === 'PRINTED' },
                      { title: 'Ready at Counter for Pickup', done: trackedOrder.status === 'COMPLETED' || trackedOrder.printStatus === 'PRINTED' },
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            step.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className={step.done ? 'font-medium text-slate-900' : 'text-slate-400'}>{step.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Digital Receipt Card */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-900 flex justify-between">
                    <span>Document:</span>
                    <span className="truncate max-w-[180px]">{trackedOrder.document?.originalName || 'Document.pdf'}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Station:</span>
                    <span>{trackedOrder.shop?.name || shop.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Amount Paid:</span>
                    <strong className="text-slate-900">Γé╣{(trackedOrder.total || 0).toFixed(2)}</strong>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="w-full mt-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Print Receipt / Save PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
