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
  Search,
  Check,
  ChevronRight,
  Sliders,
  Maximize2,
  Minimize2,
  RefreshCw,
  Share2,
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
        ctx.fillText(`PRINTX PHOTO STUDIO — A4 PASSPORT SHEET (${passportLayout} PHOTOS)`, 24, 30);
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-800">
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Printer Icon with rolling spinner ring */}
          <div className="relative flex items-center justify-center w-16 h-16">
            <div className="absolute inset-0 rounded-full border-3 border-blue-200/80 border-t-brand-600 animate-spin" />
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <Printer className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
              Connecting to Xerox Station...
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Please wait a moment while we connect
            </p>
          </div>
        </div>
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 relative overflow-hidden">
      {/* Top Mobile-First Header with Modern Black Outline */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 border-b-2 border-slate-900 shadow-neo-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-900 flex items-center justify-center text-white shadow-neo-sm">
              <Printer className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-950 font-outfit">
              PRINT<span className="text-brand-600">X</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {shop?.isAgentOnline ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-200 text-slate-950 border-2 border-slate-900 shadow-neo-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse border border-slate-900" />
                Agent Online
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-200 text-slate-950 border-2 border-slate-900 shadow-neo-sm">
                <span className="w-2 h-2 rounded-full bg-rose-600 border border-slate-900" />
                Agent Offline
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Customer Screen Container */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col justify-between relative z-10">
        <div>
          {/* Shop Card with Crisp Modern Black Outline */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-slate-900 shadow-neo-lg relative overflow-hidden mb-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-[11px] font-black tracking-wider text-slate-900 uppercase">
                CONNECTED XEROX SHOP
              </div>
              {shop.isAgentOnline ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-200 text-slate-950 border border-slate-900 shadow-neo-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse border border-slate-900" />
                  ONLINE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-200 text-slate-950 border border-slate-900 shadow-neo-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 border border-slate-900" />
                  OFFLINE
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-slate-950 font-outfit">
              Welcome to {shop.name}
            </h1>

            {shop.address && (
              <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-900 shrink-0 stroke-[2.2]" />
                <span>{shop.address}</span>
              </p>
            )}

            <div className="mt-4 pt-3.5 border-t-2 border-slate-900 flex items-center justify-between text-[11px] text-slate-700 flex-wrap gap-2 font-bold">
              <div className="flex items-center gap-1.5">
                {shop.isAgentOnline ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />
                    <span className="text-emerald-800 font-extrabold">Counter Agent Live & Spooling</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 stroke-[2.2]" />
                    <span className="text-rose-700 font-extrabold">Counter Agent Offline (Spool Paused)</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-slate-950">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />
                <span>UPI Verified</span>
              </div>
            </div>
          </div>

          {/* Offline Notice Banner if Agent is closed */}
          {!shop.isAgentOnline && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-100 border-2 border-slate-900 text-slate-950 shadow-neo-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-200 border border-slate-900 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 shadow-neo-sm">
                <AlertCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-black text-slate-950 flex items-center gap-2">
                  <span>Counter PC Agent is Currently Offline</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-200 text-slate-950 uppercase border border-slate-900">
                    Agent Closed
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium mt-1 leading-relaxed">
                  The PrintX Agent is not running on this shop&apos;s computer. Please ask the shopkeeper to double-click <strong>start-agent.bat</strong> on their counter PC to enable instant auto-printing.
                </p>
              </div>
            </div>
          )}

          {/* Core Slogan Banner */}
          <div className="mb-6 text-center">
            <h2 className="text-xl font-black text-slate-950 font-outfit">
              Print anything. Pay digitally. Collect instantly.
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Select an option below to start your print order
            </p>
          </div>

          {/* 12 Service Cards Grid with Black Outlines */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* 1. Upload Document (PDF, DOCX) */}
            <button
              onClick={() => router.push(`/shop/${slug}/upload`)}
              className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 text-left flex flex-col justify-between h-36 group relative overflow-hidden transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm group-hover:scale-105 transition-transform">
                <UploadCloud className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-950 block font-outfit">Upload Document</span>
                <span className="text-[10px] text-brand-600 font-extrabold mt-0.5 block">PDF, DOCX, PPTX</span>
              </div>
            </button>

            {/* 2. Google Drive */}
            <button
              onClick={() => setActiveModal('drive')}
              className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 text-left flex flex-col justify-between h-36 group relative overflow-hidden transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm group-hover:scale-105 transition-transform">
                <FolderDown className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-950 block font-outfit">Google Drive</span>
                <span className="text-[10px] text-slate-600 font-bold mt-0.5 block">Import from Cloud</span>
              </div>
            </button>

            {/* 3. Scan Document */}
            <button
              onClick={() => setActiveModal('scanner')}
              className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 text-left flex flex-col justify-between h-36 group relative overflow-hidden transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-950 block font-outfit">Scan Document</span>
                <span className="text-[10px] text-slate-600 font-bold mt-0.5 block">Use Phone Camera</span>
              </div>
            </button>

            {/* 4. Upload Images */}
            <button
              onClick={() => router.push(`/shop/${slug}/upload`)}
              className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 text-left flex flex-col justify-between h-36 group relative overflow-hidden transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm group-hover:scale-105 transition-transform">
                <ImageIcon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-950 block font-outfit">Upload Images</span>
                <span className="text-[10px] text-slate-600 font-bold mt-0.5 block">JPG, PNG, Photos</span>
              </div>
            </button>

            {/* 5. Passport Photo Studio */}
            <button
              onClick={() => setActiveModal('passport')}
              className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 text-left flex flex-col justify-between h-36 group relative overflow-hidden transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-sky-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-950 block font-outfit">Passport Photo</span>
                <span className="text-[10px] text-sky-700 font-bold mt-0.5 block">8, 16, 32 Sheet Layout</span>
              </div>
            </button>

            {/* 6. Resume / CV */}
            <button
              onClick={() => setActiveModal('resume')}
              className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 text-left flex flex-col justify-between h-36 group relative overflow-hidden transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm group-hover:scale-105 transition-transform">
                <FileCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-950 block font-outfit">Resume / CV</span>
                <span className="text-[10px] text-purple-700 font-bold mt-0.5 block">High GSM Paper</span>
              </div>
            </button>

            {/* 7. ID Card & Certificate */}
            <button
              onClick={() => setActiveModal('idcard')}
              className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 text-left flex flex-col justify-between h-36 group relative overflow-hidden transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-rose-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-950 block font-outfit">ID & Certificate</span>
                <span className="text-[10px] text-rose-700 font-bold mt-0.5 block">PVC & Badge Sizing</span>
              </div>
            </button>

            {/* 8. Binding Service */}
            <button
              onClick={() => setActiveModal('binding')}
              className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 text-left flex flex-col justify-between h-36 group relative overflow-hidden transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-orange-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-950 block font-outfit">Spiral & Binding</span>
                <span className="text-[10px] text-orange-700 font-bold mt-0.5 block">Comb, Wiro & Hard</span>
              </div>
            </button>

            {/* 9. Lamination */}
            <button
              onClick={() => setActiveModal('lamination')}
              className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 text-left flex flex-col justify-between h-36 group relative overflow-hidden transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-teal-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-950 block font-outfit">Lamination</span>
                <span className="text-[10px] text-teal-700 font-bold mt-0.5 block">A4, A3, Gloss / Matte</span>
              </div>
            </button>

            {/* 10. Design Studio */}
            <button
              onClick={() => setActiveModal('design')}
              className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 text-left flex flex-col justify-between h-36 group relative overflow-hidden transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-fuchsia-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm group-hover:scale-105 transition-transform">
                <Palette className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-950 block font-outfit">Design Studio</span>
                <span className="text-[10px] text-fuchsia-700 font-bold mt-0.5 block">Posters, Cards, Covers</span>
              </div>
            </button>

            {/* 11. Bulk Photocopy / Xerox */}
            <button
              onClick={() => setActiveModal('bulk')}
              className="p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 text-left flex flex-col justify-between h-36 group relative overflow-hidden transition-all cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-cyan-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm group-hover:scale-105 transition-transform">
                <Copy className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-black text-slate-950 block font-outfit">Bulk Photocopy</span>
                <span className="text-[10px] text-cyan-700 font-bold mt-0.5 block">50+ Page Discounts</span>
              </div>
            </button>
          </div>

          {/* Pricing Info Banner with Black Outlines */}
          <div className="mt-6 p-5 rounded-3xl bg-white border-2 border-slate-900 shadow-neo flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shrink-0 mt-0.5 shadow-neo-sm">
              <Info className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="text-xs text-slate-700 flex-1">
              <div className="text-slate-950 font-black flex items-center justify-between">
                <span className="font-outfit text-sm">Verified Rates for {shop.name}</span>
                <span className="text-[10px] text-slate-950 font-black px-2.5 py-0.5 rounded-full bg-emerald-200 border-2 border-slate-900 shadow-neo-sm">
                  Live Rates
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-800">
                <div className="p-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm flex items-center justify-between">
                  <span className="font-bold">A4 B&W (Single)</span>
                  <strong className="text-slate-950 font-black">₹2.00</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm flex items-center justify-between">
                  <span className="font-bold">A4 B&W (Both)</span>
                  <strong className="text-slate-950 font-black">₹3.00</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm flex items-center justify-between">
                  <span className="font-bold">A4 Color (Single)</span>
                  <strong className="text-slate-950 font-black">₹6.00</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm flex items-center justify-between">
                  <span className="font-bold">A4 Color (Both)</span>
                  <strong className="text-slate-950 font-black">₹10.00</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm flex items-center justify-between">
                  <span className="font-bold">A3 B&W (Single)</span>
                  <strong className="text-slate-950 font-black">₹8.00</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm flex items-center justify-between">
                  <span className="font-bold">A3 Color (Single)</span>
                  <strong className="text-slate-950 font-black">₹20.00</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm flex items-center justify-between">
                  <span className="font-bold">Spiral Binding</span>
                  <strong className="text-slate-950 font-black">₹35.00</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm flex items-center justify-between">
                  <span className="font-bold">A4 Lamination</span>
                  <strong className="text-slate-950 font-black">₹20.00</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy Notice */}
        <div className="mt-8 text-center text-[10px] text-slate-500 pb-2 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit Encrypted • Auto-deleted after 24 hours</span>
          </div>
          <p>Session ID: {session?.id ? `${session.id.substring(0, 10)}...` : 'Guest'}</p>
        </div>
      </main>

      {/* ================= MODAL: 1. GOOGLE DRIVE IMPORT ================= */}
      {activeModal === 'drive' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-neo-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm">
                  <FolderDown className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="font-black text-slate-950 text-base font-outfit">Google Drive Import</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl border border-slate-300 hover:border-slate-900 hover:bg-slate-100 text-slate-600 transition-all"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-700">
              <p className="font-semibold">You can import any document or PDF from your Google Drive:</p>
              <div className="p-3.5 rounded-2xl bg-indigo-50 border-2 border-slate-900 shadow-neo-sm space-y-1.5">
                <div className="font-black text-slate-950">Option A: Native Phone Storage Picker</div>
                <p className="text-[11px] text-slate-700 font-medium">
                  Tap &quot;Select from Drive&quot; below, then choose &quot;Google Drive&quot; in your mobile file selector.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-900 uppercase mb-1">
                  Option B: Paste Shared Google Drive Link
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border-2 border-slate-900 rounded-xl text-slate-950 font-medium placeholder-slate-400 focus:outline-none shadow-neo-sm"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t-2 border-slate-900 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-950 text-xs font-black shadow-neo-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push(`/shop/${slug}/upload?source=drive`)}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 border-2 border-slate-900 text-white text-xs font-black shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all"
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
          <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400 stroke-[2.2]" />
              <span className="font-black text-sm font-outfit">Document Camera Scanner</span>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>

          {/* Viewfinder Canvas */}
          <div className="flex-1 my-3 flex flex-col items-center justify-center relative rounded-2xl overflow-hidden bg-black border-2 border-slate-800">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />

            {/* Document Edge Alignment Overlay Guide */}
            <div className="absolute inset-8 border-2 border-emerald-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
              <div className="flex justify-between text-[10px] font-mono text-emerald-300 font-bold bg-black/60 px-2 py-0.5 rounded border border-emerald-400/40">
                <span>ALIGN DOCUMENT CORNERS</span>
                <span>A4 AUTO-DETECT</span>
              </div>
              <div className="text-center text-[10px] text-emerald-300 font-bold bg-black/60 py-0.5 rounded border border-emerald-400/40">
                Keep camera flat and steady
              </div>
            </div>
          </div>

          {/* Captured Pages Strip */}
          {scannerPages.length > 0 && (
            <div className="mb-3 flex items-center gap-2 overflow-x-auto p-2 rounded-xl bg-slate-900 border-2 border-slate-800">
              <span className="text-[10px] font-black text-slate-300 px-1">Pages ({scannerPages.length}):</span>
              {scannerPages.map((p, idx) => (
                <div key={idx} className="relative w-12 h-16 rounded-lg overflow-hidden border-2 border-emerald-400 shrink-0">
                  <img src={p} alt={`Scanned page ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] text-center font-bold">#{idx + 1}</span>
                </div>
              ))}
            </div>
          )}

          {/* Filter Bar & Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setScannerFilter('bw')}
                className={`px-3 py-1 rounded-full text-xs font-black border-2 transition-all ${
                  scannerFilter === 'bw' ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-neo-sm' : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                B&W Xerox
              </button>
              <button
                onClick={() => setScannerFilter('enhanced')}
                className={`px-3 py-1 rounded-full text-xs font-black border-2 transition-all ${
                  scannerFilter === 'enhanced' ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-neo-sm' : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                Enhanced
              </button>
              <button
                onClick={() => setScannerFilter('grayscale')}
                className={`px-3 py-1 rounded-full text-xs font-black border-2 transition-all ${
                  scannerFilter === 'grayscale' ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-neo-sm' : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                Grayscale
              </button>
              <button
                onClick={() => setScannerFilter('original')}
                className={`px-3 py-1 rounded-full text-xs font-black border-2 transition-all ${
                  scannerFilter === 'original' ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-neo-sm' : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                Color
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setScannerPages([])}
                disabled={scannerPages.length === 0}
                className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-400 text-xs font-bold disabled:opacity-40"
              >
                Clear
              </button>

              <button
                onClick={captureScannerPage}
                className="w-16 h-16 rounded-full border-4 border-slate-950 flex items-center justify-center bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-neo-lg transition-transform active:scale-95"
              >
                <Camera className="w-7 h-7 stroke-[2.2]" />
              </button>

              <button
                onClick={() => {
                  setActiveModal(null);
                  router.push(`/shop/${slug}/upload`);
                }}
                disabled={scannerPages.length === 0}
                className="px-5 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-950 text-slate-950 text-xs font-black shadow-neo disabled:opacity-40"
              >
                Done ({scannerPages.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 3. PASSPORT PHOTO STUDIO ================= */}
      {activeModal === 'passport' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-neo-lg animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm">
                  <Award className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-base font-outfit">Passport Photo Studio</h3>
                  <p className="text-[11px] text-slate-600 font-semibold">Auto-crop, background tone & A4 sheet tiling</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl border border-slate-300 hover:border-slate-900 hover:bg-slate-100 text-slate-600 transition-all"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Photo Input or Upload */}
              {!passportPhoto ? (
                <div className="p-8 rounded-2xl border-2 border-dashed border-slate-900 text-center flex flex-col items-center bg-slate-50">
                  <Award className="w-10 h-10 text-slate-950 mb-2 stroke-[2.2]" />
                  <p className="text-xs font-black text-slate-950 font-outfit">Upload Your Portrait Photo</p>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">Clear front face with neutral expression</p>
                  <label className="mt-4 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 border-2 border-slate-900 text-slate-950 text-xs font-black cursor-pointer shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all">
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
                      <label className="block text-[11px] font-black text-slate-900 mb-1">Standard Preset</label>
                      <select
                        value={passportPreset}
                        onChange={(e) => setPassportPreset(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs font-bold text-slate-950 shadow-neo-sm"
                      >
                        <option value="passport">Indian Passport (3.5 × 4.5 cm)</option>
                        <option value="visa">US / Europe Visa (2 × 2 in)</option>
                        <option value="pan">PAN Card Specification</option>
                        <option value="aadhaar">Aadhaar / ID Card</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-900 mb-1">Photos Per A4 Sheet</label>
                      <select
                        value={passportLayout}
                        onChange={(e) => setPassportLayout(Number(e.target.value) as any)}
                        className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs font-bold text-slate-950 shadow-neo-sm"
                      >
                        <option value={8}>8 Photos (Standard Pack)</option>
                        <option value={16}>16 Photos (Value Pack)</option>
                        <option value={32}>32 Photos (Bulk Sheet)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="text-[11px] font-black text-slate-900">Background Tone:</span>
                    <button
                      onClick={() => setPassportBg('white')}
                      className={`px-3 py-1 rounded-lg text-xs font-black border-2 transition-all ${
                        passportBg === 'white' ? 'bg-slate-950 text-white border-slate-950 shadow-neo-sm' : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      White
                    </button>
                    <button
                      onClick={() => setPassportBg('blue')}
                      className={`px-3 py-1 rounded-lg text-xs font-black border-2 transition-all ${
                        passportBg === 'blue' ? 'bg-sky-400 text-slate-950 border-slate-900 shadow-neo-sm' : 'bg-sky-50 text-slate-800 border-slate-300'
                      }`}
                    >
                      Studio Blue
                    </button>
                    <button
                      onClick={() => setPassportBg('gray')}
                      className={`px-3 py-1 rounded-lg text-xs font-black border-2 transition-all ${
                        passportBg === 'gray' ? 'bg-slate-400 text-slate-950 border-slate-900 shadow-neo-sm' : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      Light Gray
                    </button>
                  </div>

                  {/* A4 Photo Sheet Live Canvas Preview */}
                  <div className="p-3 rounded-2xl bg-slate-100 border-2 border-slate-900 shadow-neo-sm flex justify-center">
                    <canvas
                      ref={passportCanvasRef}
                      className="w-full max-w-sm rounded-lg shadow-sm border-2 border-slate-900 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t-2 border-slate-900 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-slate-950">
                Rate: ₹40.00 <span className="text-[11px] text-slate-600 font-semibold">/ A4 Photo Glossy Sheet (8 Photos)</span>
              </span>
              <div className="flex items-center gap-2">
                {passportPhoto && (
                  <button
                    onClick={() => setPassportPhoto(null)}
                    className="px-3 py-2 rounded-xl bg-slate-100 border-2 border-slate-900 text-slate-950 text-xs font-black shadow-neo-sm"
                  >
                    Change Photo
                  </button>
                )}
                <button
                  onClick={() => {
                    sessionStorage.setItem('printx_preset_paper', 'glossy');
                    sessionStorage.setItem('printx_preset_color', 'COLOR');
                    sessionStorage.setItem('printx_preset_notes', `Passport Studio (${passportLayout} Photos on A4 Glossy)`);
                    setActiveModal(null);
                    router.push(`/shop/${slug}/upload?preset=passport`);
                  }}
                  disabled={!passportPhoto}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 border-2 border-slate-900 text-white text-xs font-black shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40 transition-all"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-neo-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm">
                  <FileCheck className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-base font-outfit">Resume & CV Printing</h3>
                  <p className="text-[11px] text-slate-600 font-semibold">Executive bond papers & sharp professional prints</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl border border-slate-300 hover:border-slate-900 hover:bg-slate-100 text-slate-600 transition-all"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-900 mb-1">Paper Weight & Finish</label>
                  <select
                    value={resumePaperGsm}
                    onChange={(e) => setResumePaperGsm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs font-bold text-slate-950 shadow-neo-sm"
                  >
                    <option value="80">80 GSM Executive Bond Paper (+₹1/sheet)</option>
                    <option value="100">100 GSM Premium Ultra-White (+₹2/sheet)</option>
                    <option value="75">75 GSM Standard Paper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-900 mb-1">Color Mode</label>
                  <select
                    value={resumeColor}
                    onChange={(e) => setResumeColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs font-bold text-slate-950 shadow-neo-sm"
                  >
                    <option value="BW">Black & White (Sharp & Crisp)</option>
                    <option value="COLOR">Full Color (Profile Photo / Badges)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border-2 border-slate-900 shadow-neo-sm space-y-1.5">
                <div className="font-black text-slate-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-700 stroke-[2.2]" />
                  <span>HR Recommended Settings</span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                  For job interviews, 80-100 GSM heavy bond paper creates a strong tactile impression. Single-sided printing is recommended.
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t-2 border-slate-900 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-950 text-xs font-black shadow-neo-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem('printx_preset_paper', resumePaperGsm);
                  sessionStorage.setItem('printx_preset_color', resumeColor);
                  sessionStorage.setItem('printx_preset_side', 'SINGLE');
                  sessionStorage.setItem('printx_preset_notes', `Executive Resume (${resumePaperGsm} GSM Paper)`);
                  setActiveModal(null);
                  router.push(`/shop/${slug}/upload?preset=resume`);
                }}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 border-2 border-slate-900 text-white text-xs font-black shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                Upload Resume PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 5. SPIRAL & HARD BINDING ================= */}
      {activeModal === 'binding' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-neo-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm">
                  <BookOpen className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-base font-outfit">Document Binding Options</h3>
                  <p className="text-[11px] text-slate-600 font-semibold">Project reports, thesis, legal files & brochures</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl border border-slate-300 hover:border-slate-900 hover:bg-slate-100 text-slate-600 transition-all"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'spiral', label: 'Spiral Coil Binding', price: '₹35.00', desc: 'Plastic spiral ring + sheet covers' },
                  { id: 'comb', label: 'Comb Binding', price: '₹35.00', desc: 'Re-openable 19-ring spine' },
                  { id: 'wiro', label: 'Wiro Twin Ring', price: '₹50.00', desc: 'Executive metal double-wire' },
                  { id: 'staple', label: 'Corner / Edge Staple', price: '₹5.00', desc: 'Heavy-duty steel staple' },
                  { id: 'softcover', label: 'Thermal Soft Cover', price: '₹75.00', desc: 'Glued spine with clear front' },
                  { id: 'hardcover', label: 'Golden Hard Cover', price: '₹220.00', desc: 'College thesis & project books' },
                ].map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setBindingType(b.id)}
                    className={`p-3 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                      bindingType === b.id
                        ? 'border-slate-900 bg-orange-100 shadow-neo'
                        : 'border-slate-900 bg-white hover:bg-slate-50 shadow-neo-sm'
                    }`}
                  >
                    <div className="font-black text-slate-950 text-xs">{b.label}</div>
                    <div className="text-[10px] text-orange-800 font-black mt-0.5">{b.price}</div>
                    <div className="text-[9px] text-slate-600 mt-1 leading-tight font-medium">{b.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t-2 border-slate-900 flex items-center justify-between">
              <span className="text-xs font-black text-slate-950">
                Selected: <span className="text-orange-700 uppercase">{bindingType}</span>
              </span>
              <button
                onClick={() => {
                  const safeBinding =
                    bindingType === 'hardcover'
                      ? 'HARDCOVER'
                      : bindingType === 'comb'
                      ? 'COMB'
                      : bindingType === 'staple'
                      ? 'STAPLE'
                      : 'SPIRAL';
                  sessionStorage.setItem('printx_preset_binding', safeBinding);
                  setActiveModal(null);
                  router.push(`/shop/${slug}/upload?preset=binding`);
                }}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 border-2 border-slate-900 text-white text-xs font-black shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                Upload Document to Bind
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 6. LAMINATION ================= */}
      {activeModal === 'lamination' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-neo-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm">
                  <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-base font-outfit">Document Lamination</h3>
                  <p className="text-[11px] text-slate-600 font-semibold">Waterproof & tearproof thermal pouch lamination</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl border border-slate-300 hover:border-slate-900 hover:bg-slate-100 text-slate-600 transition-all"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block text-[11px] font-black text-slate-900 mb-1.5 uppercase">Size Pouch</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'A4', label: 'A4 Sheet', price: '₹20.00' },
                    { id: 'A3', label: 'A3 Certificate', price: '₹35.00' },
                    { id: 'ID', label: 'ID Card / Badge', price: '₹15.00' },
                    { id: 'AADHAAR', label: 'Aadhaar / PAN', price: '₹15.00' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLaminationSize(l.id)}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                        laminationSize === l.id
                          ? 'border-slate-900 bg-teal-200 shadow-neo font-black'
                          : 'border-slate-900 bg-white hover:bg-slate-50 shadow-neo-sm'
                      }`}
                    >
                      <div className="text-xs text-slate-950 font-bold">{l.label}</div>
                      <div className="text-[10px] text-teal-800 font-black">{l.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-900 mb-1.5 uppercase">Finish</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLaminationFinish('gloss')}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-black transition-all ${
                      laminationFinish === 'gloss' ? 'bg-slate-950 text-white border-slate-950 shadow-neo-sm' : 'bg-white text-slate-950 border-slate-900 shadow-neo-sm'
                    }`}
                  >
                    High Gloss Ultra Clear
                  </button>
                  <button
                    onClick={() => setLaminationFinish('matte')}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-black transition-all ${
                      laminationFinish === 'matte' ? 'bg-slate-950 text-white border-slate-950 shadow-neo-sm' : 'bg-white text-slate-950 border-slate-900 shadow-neo-sm'
                    }`}
                  >
                    Matte Non-Reflective
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t-2 border-slate-900 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-950 text-xs font-black shadow-neo-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem('printx_preset_lamination', laminationFinish === 'matte' ? 'MATTE' : 'GLOSS');
                  sessionStorage.setItem('printx_preset_size', laminationSize === 'A3' ? 'A3' : 'A4');
                  setActiveModal(null);
                  router.push(`/shop/${slug}/upload?preset=lamination`);
                }}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 border-2 border-slate-900 text-white text-xs font-black shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: 7. BULK XEROX CALCULATOR ================= */}
      {activeModal === 'bulk' && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-neo-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm">
                  <Copy className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-base font-outfit">Bulk Xerox Calculator</h3>
                  <p className="text-[11px] text-slate-600 font-semibold">Tier discounts automatically applied on 50+ pages</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl border border-slate-300 hover:border-slate-900 hover:bg-slate-100 text-slate-600 transition-all"
              >
                <X className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-700">
              <div>
                <div className="flex items-center justify-between font-black mb-1.5 text-slate-950">
                  <span>Number of Pages / Sheets:</span>
                  <span className="text-cyan-800 font-mono text-sm px-2 py-0.5 rounded-md bg-cyan-100 border border-slate-900">{bulkPages} pages</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={600}
                  step={10}
                  value={bulkPages}
                  onChange={(e) => setBulkPages(Number(e.target.value))}
                  className="w-full accent-slate-950 cursor-pointer"
                />
              </div>

              {/* Discount Badge */}
              <div className="p-3.5 rounded-2xl bg-cyan-100 border-2 border-slate-900 shadow-neo-sm flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black text-slate-950">
                    {bulkPages >= 500 ? 'Tier 3 Wholesale Discount' : bulkPages >= 100 ? 'Tier 2 Bulk Discount' : bulkPages >= 50 ? 'Tier 1 Student / Bulk' : 'Standard Rate'}
                  </div>
                  <div className="text-[10px] text-slate-700 font-semibold">
                    {bulkPages >= 500 ? '15% Off Total Bill' : bulkPages >= 100 ? '10% Off Total Bill' : bulkPages >= 50 ? '5% Off Total Bill' : 'Add 50+ pages for discount'}
                  </div>
                </div>
                <span className="text-sm font-black text-slate-950 font-mono px-2 py-1 rounded-lg bg-white border-2 border-slate-900 shadow-neo-sm">
                  {bulkPages >= 500 ? '-15%' : bulkPages >= 100 ? '-10%' : bulkPages >= 50 ? '-5%' : '0%'}
                </span>
              </div>

              {/* Calculation Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm flex items-center justify-between">
                <div>
                  <span className="text-slate-600 text-[11px] font-bold block">Estimated Total Cost:</span>
                  <span className="text-xl font-black text-slate-950 font-outfit">
                    ₹{Math.max(
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
                    sessionStorage.setItem('printx_preset_copies', String(Math.max(1, Math.round(bulkPages / 20))));
                    setActiveModal(null);
                    router.push(`/shop/${slug}/upload?preset=bulk`);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 border-2 border-slate-900 text-white text-xs font-black shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  Upload & Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
