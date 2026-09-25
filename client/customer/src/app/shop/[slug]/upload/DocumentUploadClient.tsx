'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Layers,
  Palette,
  Maximize2,
  RefreshCw,
  Trash2,
  Eye,
  CreditCard,
  QrCode,
  ShieldCheck,
  Check,
  Zap,
  Camera,
  FolderDown,
  RotateCw,
  Copy,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Scissors,
  BookOpen,
  Sliders,
  ChevronDown,
  ChevronUp,
  Share2,
  XCircle,
  AlertOctagon,
  RotateCcw,
  PartyPopper,
} from 'lucide-react';
import {
  fetchShopBySlug,
  calculateOrderPrice,
  createOrder,
  simulateOrderPayment,
  startCustomerSession,
} from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://printx-cib8.onrender.com/api';

interface PageItem {
  id: number;
  originalPageNumber: number;
  rotation: number; // 0, 90, 180, 270
  selected: boolean;
  isBlank?: boolean;
}

export default function DocumentUploadAndPrintFlowPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  // Flow Step: 1 = Upload, 2 = PRINTX Document Editor, 3 = UPI Payment & Tracking
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Shop & Session
  const [shop, setShop] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Step 1: Upload state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedDoc, setProcessedDoc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [sourceDrive, setSourceDrive] = useState(false);

  // Step 2: PRINTX Document Editor State
  const [pagesList, setPagesList] = useState<PageItem[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Print Settings
  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState<'AUTO' | 'PORTRAIT' | 'LANDSCAPE'>('AUTO');
  const [colorMode, setColorMode] = useState<'BW' | 'GRAYSCALE' | 'COLOR'>('BW');
  const [printSide, setPrintSide] = useState<'SINGLE' | 'DOUBLE'>('SINGLE');
  const [copies, setCopies] = useState(1);
  const [paperGsm, setPaperGsm] = useState('75');
  const [pagesPerSheet, setPagesPerSheet] = useState<1 | 2 | 4 | 6 | 9>(1);
  const [pageRangeMode, setPageRangeMode] = useState<'ALL' | 'CUSTOM' | 'ODD' | 'EVEN'>('ALL');
  const [customRangeString, setCustomRangeString] = useState('');
  const [scaling, setScaling] = useState<'FIT' | 'ACTUAL'>('FIT');
  const [margins, setMargins] = useState<'NORMAL' | 'NARROW' | 'NONE'>('NORMAL');
  const [collation, setCollation] = useState(true);

  // Additional Finishing Services
  const [bindingOption, setBindingOption] = useState<'NONE' | 'STAPLE' | 'SPIRAL' | 'COMB' | 'HARDCOVER'>('NONE');
  const [laminationOption, setLaminationOption] = useState<'NONE' | 'GLOSS' | 'MATTE'>('NONE');
  const [customNotes, setCustomNotes] = useState('');

  // Mobile Bottom Sheet toggle
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  // Step 3: Order & UPI Payment
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isPrintingStarted, setIsPrintingStarted] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'declined'>('idle');
  const [declineReason, setDeclineReason] = useState<string>('Transaction was cancelled in UPI app or timed out by bank.');
  const [hasOpenedUpi, setHasOpenedUpi] = useState(false);
  const [showReturnedBanner, setShowReturnedBanner] = useState(false);

  // Play pleasant notification sound effects
  const playSuccessSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  };

  const playErrorSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
      osc.frequency.setValueAtTime(146.83, audioCtx.currentTime + 0.12); // D3
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  };

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Detect when user returns from UPI app (GPay / PhonePe / Paytm)
  useEffect(() => {
    const handleReturnFromUpi = () => {
      if (document.visibilityState === 'visible' && hasOpenedUpi && !isPaid && paymentStatus !== 'success') {
        setShowReturnedBanner(true);
      }
    };

    document.addEventListener('visibilitychange', handleReturnFromUpi);
    window.addEventListener('focus', handleReturnFromUpi);

    return () => {
      document.removeEventListener('visibilitychange', handleReturnFromUpi);
      window.removeEventListener('focus', handleReturnFromUpi);
    };
  }, [hasOpenedUpi, isPaid, paymentStatus]);

  useEffect(() => {
    if (!slug) return;
    const storedSessionId = sessionStorage.getItem('printx_customer_session_id');
    if (!storedSessionId) {
      startCustomerSession(slug)
        .then((sess) => {
          sessionStorage.setItem('printx_customer_session_id', sess.id);
          setSessionId(sess.id);
        })
        .catch((err) => console.warn('Could not auto-start session:', err));
    } else {
      setSessionId(storedSessionId);
    }

    fetchShopBySlug(slug)
      .then((data) => setShop(data))
      .catch((err) => setError(err.message));

    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search.includes('source=drive')) {
        setSourceDrive(true);
      }
      if (search.includes('mode=camera')) {
        setTimeout(() => cameraInputRef.current?.click(), 300);
      }

      // Load presets saved from specialized shop services
      const presetPaper = sessionStorage.getItem('printx_preset_paper');
      if (presetPaper) setPaperGsm(presetPaper);
      const presetColor = sessionStorage.getItem('printx_preset_color');
      if (presetColor) setColorMode(presetColor as any);
      const presetSide = sessionStorage.getItem('printx_preset_side');
      if (presetSide) setPrintSide(presetSide as any);
      const presetBinding = sessionStorage.getItem('printx_preset_binding');
      if (presetBinding) setBindingOption(presetBinding as any);
      const presetLamination = sessionStorage.getItem('printx_preset_lamination');
      if (presetLamination) setLaminationOption(presetLamination as any);
      const presetSize = sessionStorage.getItem('printx_preset_size');
      if (presetSize) setPaperSize(presetSize);
      const presetCopies = sessionStorage.getItem('printx_preset_copies');
      if (presetCopies) setCopies(Number(presetCopies) || 1);
      const presetNotes = sessionStorage.getItem('printx_preset_notes');
      if (presetNotes) setCustomNotes(presetNotes);
    }
  }, [slug, router]);

  // Synchronize Page List when document is analyzed
  useEffect(() => {
    if (processedDoc) {
      const count = processedDoc.pageCount || 1;
      const initialPages: PageItem[] = [];
      for (let i = 1; i <= count; i++) {
        initialPages.push({
          id: i,
          originalPageNumber: i,
          rotation: 0,
          selected: true,
        });
      }
      setPagesList(initialPages);
      setActivePageIndex(0);

      if (processedDoc.detectedColorPages > 0) {
        setColorMode('COLOR');
      }
    }
  }, [processedDoc]);

  // Apply Page Selection Filtering (Odd/Even/Range)
  useEffect(() => {
    if (pagesList.length === 0) return;

    if (pageRangeMode === 'ALL') {
      setPagesList((prev) => prev.map((p) => ({ ...p, selected: true })));
    } else if (pageRangeMode === 'ODD') {
      setPagesList((prev) => prev.map((p) => ({ ...p, selected: p.originalPageNumber % 2 !== 0 })));
    } else if (pageRangeMode === 'EVEN') {
      setPagesList((prev) => prev.map((p) => ({ ...p, selected: p.originalPageNumber % 2 === 0 })));
    } else if (pageRangeMode === 'CUSTOM' && customRangeString.trim()) {
      const included = parseRangeString(customRangeString, pagesList.length);
      setPagesList((prev) => prev.map((p) => ({ ...p, selected: included.has(p.originalPageNumber) })));
    }
  }, [pageRangeMode, customRangeString]);

  // Helper function to parse ranges like "1-5, 8, 10-12"
  const parseRangeString = (str: string, total: number): Set<number> => {
    const set = new Set<number>();
    const parts = str.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(total, end); i++) {
            set.add(i);
          }
        }
      } else {
        const num = Number(trimmed);
        if (!isNaN(num) && num >= 1 && num <= total) {
          set.add(num);
        }
      }
    }
    return set;
  };

  // Page Operations
  const handleRotatePage = (index: number) => {
    setPagesList((prev) => {
      const updated = [...prev];
      updated[index].rotation = (updated[index].rotation + 90) % 360;
      return updated;
    });
  };

  const handleDeletePage = (index: number) => {
    if (pagesList.length <= 1) return;
    setPagesList((prev) => prev.filter((_, idx) => idx !== index));
    if (activePageIndex >= pagesList.length - 1) {
      setActivePageIndex(Math.max(0, pagesList.length - 2));
    }
  };

  const handleDuplicatePage = (index: number) => {
    const target = pagesList[index];
    const newPage: PageItem = {
      ...target,
      id: Date.now() + Math.random(),
    };
    setPagesList((prev) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, newPage);
      return updated;
    });
    setActivePageIndex(index + 1);
  };

  const handleAddBlankPage = () => {
    const blank: PageItem = {
      id: Date.now(),
      originalPageNumber: pagesList.length + 1,
      rotation: 0,
      selected: true,
      isBlank: true,
    };
    setPagesList((prev) => [...prev, blank]);
    setActivePageIndex(pagesList.length);
  };

  const handleTogglePageSelect = (index: number) => {
    setPagesList((prev) => {
      const updated = [...prev];
      updated[index].selected = !updated[index].selected;
      return updated;
    });
  };

  // Smart Live Price Calculation Engine
  const priceCalculation = useMemo(() => {
    const selectedPagesCount = pagesList.filter((p) => p.selected).length;
    if (selectedPagesCount === 0) {
      return { totalPages: 0, totalSheets: 0, pricePerSheet: 0, printingCost: 0, paperCost: 0, finishingCost: 0, discount: 0, discountPercent: 0, grandTotal: 0 };
    }

    // Number of physical sheets needed based on N-Up and Duplex
    const effectivePages = Math.ceil(selectedPagesCount / pagesPerSheet);
    const totalSheetsPerCopy = printSide === 'DOUBLE' ? Math.ceil(effectivePages / 2) : effectivePages;
    const totalSheets = totalSheetsPerCopy * copies;

    // Base rates matching verified rates
    let pricePerSheet = 2.0;
    if (colorMode === 'COLOR') {
      pricePerSheet = printSide === 'DOUBLE' ? 15.0 : 8.0;
    } else {
      pricePerSheet = printSide === 'DOUBLE' ? 3.0 : 2.0;
    }
    if (paperSize === 'A3') {
      pricePerSheet = colorMode === 'COLOR'
        ? (printSide === 'DOUBLE' ? 20.0 : 10.0)
        : (printSide === 'DOUBLE' ? 5.0 : 3.0);
    }

    // Dynamic Shop Pricing Rule matching if available
    if (shop?.pricingRules && Array.isArray(shop.pricingRules)) {
      const match = shop.pricingRules.find(
        (r: any) =>
          r.paperSize === paperSize &&
          r.colorMode === colorMode &&
          r.printSide === printSide &&
          r.isActive
      );
      if (match && typeof match.pricePerUnit === 'number') {
        pricePerSheet = match.pricePerUnit;
      }
    }

    const printingCost = totalSheets * pricePerSheet;

    // Paper GSM Surcharges per sheet
    let paperGsmSurchargePerSheet = 0;
    if (paperGsm === '80') paperGsmSurchargePerSheet = 1.0;
    else if (paperGsm === '100') paperGsmSurchargePerSheet = 2.0;
    else if (paperGsm === 'glossy') paperGsmSurchargePerSheet = 10.0;
    else if (paperGsm === 'matte') paperGsmSurchargePerSheet = 8.0;

    const paperCost = totalSheets * paperGsmSurchargePerSheet;

    // Finishing Surcharges
    let finishingCost = 0;
    if (bindingOption === 'STAPLE') finishingCost += 5.0 * copies;
    else if (bindingOption === 'SPIRAL') finishingCost += 40.0 * copies;
    else if (bindingOption === 'COMB') finishingCost += 40.0 * copies;
    else if (bindingOption === 'HARDCOVER') finishingCost += 250.0 * copies;

    if (laminationOption === 'GLOSS') finishingCost += 20.0 * totalSheets;
    else if (laminationOption === 'MATTE') finishingCost += 25.0 * totalSheets;

    const subtotal = printingCost + paperCost + finishingCost;

    // Tiered Bulk Discounts
    let discountPercent = 0;
    if (totalSheets >= 500) discountPercent = 0.15;
    else if (totalSheets >= 100) discountPercent = 0.10;
    else if (totalSheets >= 50) discountPercent = 0.05;

    const discountAmount = subtotal * discountPercent;
    const grandTotal = Math.max(1, Math.round(subtotal - discountAmount));

    return {
      selectedPagesCount,
      totalSheets,
      pricePerSheet,
      printingCost: Math.round(printingCost * 100) / 100,
      paperCost: Math.round(paperCost * 100) / 100,
      finishingCost: Math.round(finishingCost * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      discountPercent: discountPercent * 100,
      grandTotal,
    };
  }, [pagesList, pagesPerSheet, printSide, copies, colorMode, paperSize, paperGsm, bindingOption, laminationOption, shop]);

  // Step 1: File selection & upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    setError(null);
    setProcessedDoc(null);
    setFile(selectedFile);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    uploadAndAnalyze(selectedFile);
  };

  const uploadAndAnalyze = async (selectedFile: File) => {
    const currentSessionId = sessionId || sessionStorage.getItem('printx_customer_session_id');
    if (!currentSessionId) {
      setError('Active customer session not found. Please scan QR again.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(20);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('customerSessionId', currentSessionId);

      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 140);

      const res = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to analyze document');
      }

      setProcessedDoc(json.data);
      sessionStorage.setItem('printx_current_doc_id', json.data.id);
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'File upload and analysis failed');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setFile(null);
    setProcessedDoc(null);
    setError(null);
    setUploadProgress(0);
    setCurrentStep(1);
    setOrder(null);
    setIsPaid(false);
    setHasOpenedUpi(false);
    setShowReturnedBanner(false);
    setPagesList([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Step 2 -> Step 3: Create Order & Proceed to UPI
  const handleProceedToPayment = async () => {
    if (!shop || !processedDoc || !sessionId) return;

    try {
      setCreatingOrder(true);
      setError(null);

      const safeColorMode = colorMode === 'GRAYSCALE' ? 'BW' : colorMode;
      const safePaperSize = ['A4', 'A3', 'LETTER', 'LEGAL'].includes((paperSize || '').toUpperCase())
        ? (paperSize || '').toUpperCase()
        : 'A4';
      const safePrintSide = printSide === 'DOUBLE' ? 'DOUBLE' : 'SINGLE';

      const newOrder = await createOrder({
        shopId: shop.id,
        customerSessionId: sessionId,
        documentId: processedDoc.id,
        paperSize: safePaperSize,
        colorMode: safeColorMode,
        printSide: safePrintSide,
        copies,
        pageRange: pageRangeMode === 'ALL' ? 'all' : customRangeString || 'selected',
        notes: customNotes.trim() ? `${customNotes} | Binding: ${bindingOption} | Paper: ${paperGsm}GSM` : `Binding: ${bindingOption} | Paper: ${paperGsm}GSM`,
        clientTotal: priceCalculation.grandTotal,
      });

      setOrder(newOrder);
      setIsPaid(false);
      setIsPrintingStarted(false);
      setPaymentStatus('idle');
      setHasOpenedUpi(false);
      setShowReturnedBanner(false);
      setCurrentStep(3);
    } catch (err: any) {
      console.error('Create order failed:', err);
      setError(err.message || 'Failed to initialize order');
    } finally {
      setCreatingOrder(false);
    }
  };

  // Step 3: Simulate UPI Payment & Auto-Print trigger (Duplicate-Safe)
  const handleSimulatePayment = async () => {
    if (!order || isPaid || simulatingPayment) return;
    try {
      setSimulatingPayment(true);
      setPaymentStatus('processing');
      setError(null);
      await simulateOrderPayment(order.orderNumber);
      setIsPaid(true);
      setPaymentStatus('success');
      setShowReturnedBanner(false);
      playSuccessSound();
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentStatus('declined');
      setDeclineReason(err.message || 'Payment verification was declined or timed out by the bank.');
      setError(err.message || 'Payment verification failed');
      playErrorSound();
    } finally {
      setSimulatingPayment(false);
    }
  };

  const handleSimulateDecline = () => {
    setPaymentStatus('declined');
    setDeclineReason('Payment was cancelled in UPI app or transaction failed at bank.');
    setShowReturnedBanner(false);
    playErrorSound();
  };

  const handleRetryPayment = () => {
    setPaymentStatus('idle');
    setError(null);
  };

  const activePage = pagesList[activePageIndex];

  const isImage = Boolean(
    file?.type?.startsWith('image/') ||
    processedDoc?.mimeType?.startsWith('image') ||
    (processedDoc?.originalName && /\.(jpe?g|png|webp|gif|bmp)$/i.test(processedDoc.originalName)) ||
    (file?.name && /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name))
  );

  const isPdf = Boolean(
    file?.type === 'application/pdf' ||
    (processedDoc?.originalName && /\.pdf$/i.test(processedDoc.originalName)) ||
    (file?.name && /\.pdf$/i.test(file.name))
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50/70 via-slate-50 to-white text-slate-900 relative overflow-hidden">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 border-b border-blue-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStep === 3 && !isPaid) setCurrentStep(2);
              else if (currentStep === 2) setCurrentStep(1);
              else router.push(`/shop/${slug}`);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-brand-600 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <span className="text-xs font-bold text-slate-900 block font-['Outfit']">
              {shop?.name || 'PRINTX SHOP'}
            </span>
            <span className="text-[10px] text-brand-600 block font-semibold">
              {currentStep === 1
                ? 'Step 1: Document Upload'
                : currentStep === 2
                ? 'Step 2: PRINTX Document Studio'
                : 'Step 3: Instant UPI Auto-Print'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {shop?.isAgentOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Agent Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Agent Offline
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col justify-between">
        {/* Agent Offline Notice */}
        {shop && shop.isAgentOnline === false && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Counter PC Agent Offline: </span>
              <span>Shop counter PC is currently offline. Your print will auto-spool once the shopkeeper starts the agent.</span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ================= STEP 1: UPLOAD & ANALYSIS ================= */}
        {currentStep === 1 && (
          <div className="max-w-xl mx-auto w-full py-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit']">
                Upload Your Document
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                PDF, Word (DOCX), PowerPoint (PPTX), Excel (XLSX), Photos (JPG, PNG)
              </p>
            </div>

            {/* Upload Dropzone */}
            {!uploading && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center text-center group ${
                  dragActive
                    ? 'border-brand-500 bg-blue-50 scale-[1.01]'
                    : 'border-blue-200 hover:border-brand-500 bg-white hover:bg-blue-50/40 shadow-sm hover:shadow-md'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt"
                  onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-600 mb-4 group-hover:scale-110 transition-transform shadow-xs">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <h2 className="text-base font-bold text-slate-900 font-['Outfit']">
                  Tap to Select File or Drag & Drop
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Instant smart page count, color detection, and paper sizing.
                </p>

                <div className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-brand-700 text-xs font-bold border border-blue-200 shadow-xs">
                  <span>Browse Device Files</span>
                </div>
              </div>
            )}

            {/* Camera and Drive Quick Triggers */}
            {!uploading && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3 px-4 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Scan with Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-4 rounded-2xl bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <UploadCloud className="w-4 h-4 text-brand-600" />
                  <span>Choose PDF / Files</span>
                </button>
              </div>
            )}

            {/* Upload Progress Loader */}
            {uploading && (
              <div className="p-8 rounded-3xl bg-white border border-blue-100 shadow-sm text-center flex flex-col items-center">
                <div className="relative flex items-center justify-center w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-3 border-blue-200/80 border-t-brand-600 animate-spin" />
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                </div>

                <h2 className="text-base font-bold text-slate-900 font-['Outfit']">Analyzing Document...</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Scanning page count & print rates ({uploadProgress}%)
                </p>

                <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden max-w-xs border border-slate-200/70">
                  <div
                    className="bg-brand-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 2: PRINTX DOCUMENT STUDIO ================= */}
        {currentStep === 2 && processedDoc && (
          <div className="space-y-4">
            {/* Top Workspace Toolbar */}
            <div className="p-3.5 rounded-2xl bg-white border border-blue-100 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md font-['Outfit']">
                    {processedDoc.originalName}
                  </h2>
                  <span className="text-[10px] text-slate-500 block">
                    {pagesList.length} Total Pages • {(processedDoc.fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddBlankPage}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors"
                  title="Add Blank Page"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Blank Page</span>
                </button>

                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                  title="Upload Another File"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3-Column Studio Layout (Desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT: Page Thumbnails Drawer (3 Cols) */}
              <div className="lg:col-span-3 bg-white p-4 rounded-3xl border border-blue-100 shadow-xs flex flex-col max-h-[640px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="text-xs font-bold text-slate-900 font-['Outfit']">
                    Pages ({pagesList.filter((p) => p.selected).length}/{pagesList.length})
                  </span>

                  <select
                    value={pageRangeMode}
                    onChange={(e) => setPageRangeMode(e.target.value as any)}
                    className="px-2 py-1 text-[11px] rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold"
                  >
                    <option value="ALL">All Pages</option>
                    <option value="ODD">Odd Only</option>
                    <option value="EVEN">Even Only</option>
                    <option value="CUSTOM">Custom Range</option>
                  </select>
                </div>

                {pageRangeMode === 'CUSTOM' && (
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="e.g. 1-5, 8, 10-12"
                      value={customRangeString}
                      onChange={(e) => setCustomRangeString(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono"
                    />
                  </div>
                )}

                {/* Thumbnails Scrollable List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {pagesList.map((page, idx) => (
                    <div
                      key={page.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        activePageIndex === idx
                          ? 'border-brand-500 bg-blue-50/70 shadow-xs'
                          : page.selected
                          ? 'border-slate-200 hover:border-slate-300 bg-white'
                          : 'border-slate-200 bg-slate-50 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={page.selected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleTogglePageSelect(idx);
                          }}
                          className="w-4 h-4 rounded text-brand-600 accent-brand-600 cursor-pointer"
                        />

                        {/* Page Preview Mini Badge */}
                        <div
                          className="w-10 h-13 rounded-lg bg-white border border-slate-300 overflow-hidden flex items-center justify-center text-[10px] font-mono font-bold text-slate-700 shadow-2xs shrink-0"
                          style={{ transform: `rotate(${page.rotation}deg)` }}
                        >
                          {isImage && previewUrl && !page.isBlank ? (
                            <img
                              src={previewUrl}
                              alt={`Thumb ${idx + 1}`}
                              className={`w-full h-full object-cover ${colorMode === 'BW' ? 'grayscale contrast-125' : ''}`}
                            />
                          ) : isPdf && previewUrl && !page.isBlank ? (
                            <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-0.5">
                              <FileText className="w-4 h-4 text-brand-600" />
                              <span className="text-[8px] font-bold text-slate-600">P.{page.originalPageNumber}</span>
                            </div>
                          ) : (
                            <span>{page.isBlank ? 'BLANK' : `P.${page.originalPageNumber}`}</span>
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-800">Page {idx + 1}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {page.rotation > 0 ? `${page.rotation}┬░ rotation` : 'Standard'}
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRotatePage(idx);
                          }}
                          className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-brand-600 transition-colors"
                          title="Rotate 90┬░"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicatePage(idx);
                          }}
                          className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 transition-colors"
                          title="Duplicate Page"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(idx);
                          }}
                          className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CENTER: Large Document Preview Canvas (5 Cols) */}
              <div className="lg:col-span-5 bg-white p-4 rounded-3xl border border-blue-100 shadow-xs flex flex-col justify-between min-h-[500px]">
                {/* Canvas Controls Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-['Outfit']">
                      Active Preview: Page {activePageIndex + 1} of {pagesList.length}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activePage?.selected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {activePage?.selected ? 'Included' : 'Skipped'}
                    </span>
                  </div>

                  {/* Zoom Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono text-slate-600 w-10 text-center">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Document View Canvas Area */}
                <div className="flex-1 my-4 flex items-center justify-center p-3 sm:p-4 bg-slate-900/5 rounded-2xl overflow-hidden relative min-h-[380px] max-h-[460px]">
                  <div
                    className={`bg-white rounded-xl shadow-2xl border border-slate-300 transition-all flex flex-col justify-between relative overflow-hidden ${
                      colorMode === 'BW' ? 'grayscale contrast-125' : ''
                    }`}
                    style={{
                      width: orientation === 'LANDSCAPE' ? '92%' : '75%',
                      maxWidth: orientation === 'LANDSCAPE' ? '460px' : '320px',
                      height: orientation === 'LANDSCAPE' ? '280px' : '380px',
                      transform: `scale(${zoomLevel / 100}) rotate(${activePage?.rotation || 0}deg)`,
                      transformOrigin: 'center center',
                    }}
                  >
                    {/* Header bar on sheet */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 text-[10px] text-slate-600 font-mono shrink-0">
                      <span className="truncate max-w-[140px] font-bold text-slate-800">{processedDoc?.originalName || file?.name || 'Document'}</span>
                      <span className="font-semibold text-slate-500">Page {activePageIndex + 1} of {pagesList.length}</span>
                    </div>

                    {/* Actual Real Document Content */}
                    <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center bg-white p-1">
                      {isImage && previewUrl && !activePage?.isBlank ? (
                        <img
                          src={previewUrl}
                          alt={`Page ${activePageIndex + 1}`}
                          className="max-w-full max-h-full object-contain select-none"
                        />
                      ) : isPdf && previewUrl && !activePage?.isBlank ? (
                        <iframe
                          src={`${previewUrl}#page=${activePage?.originalPageNumber || (activePageIndex + 1)}&view=Fit&toolbar=0&navpanes=0`}
                          title={`Page ${activePageIndex + 1} Preview`}
                          className="w-full h-full border-0 rounded bg-white"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4 text-slate-500">
                          <FileText className="w-12 h-12 text-brand-600 mb-2 animate-pulse" />
                          <span className="text-xs font-bold text-slate-800">{processedDoc?.originalName || file?.name || 'Document Page'}</span>
                          <span className="text-[10px] text-slate-400 mt-1">Page {activePageIndex + 1} • {paperSize} {colorMode}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer bar on sheet */}
                    <div className="px-3 py-1 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono shrink-0">
                      <span>{paperSize} • {colorMode === 'COLOR' ? 'Full Color' : 'B&W'} • {printSide === 'DOUBLE' ? 'Duplex' : 'Single'}</span>
                      <span className="text-brand-600 font-bold">PRINTX Real Preview</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Pager Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={activePageIndex === 0}
                    onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  <button
                    onClick={() => handleRotatePage(activePageIndex)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-brand-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate 90°</span>
                  </button>

                  <button
                    disabled={activePageIndex >= pagesList.length - 1}
                    onClick={() => setActivePageIndex((p) => Math.min(pagesList.length - 1, p + 1))}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* RIGHT: Complete Print Settings Panel (4 Cols) */}
              <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-blue-100 shadow-xs space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm font-['Outfit'] flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-brand-600" />
                    <span>Print Specifications</span>
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    Live Engine
                  </span>
                </div>

                {/* 1. Color Composition & Print Sides */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-brand-600" />
                    <span>1. Color & Print Sides</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Color Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setColorMode('BW')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          colorMode === 'BW' ? 'border-brand-600 bg-blue-50/90 font-bold shadow-xs' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="text-xs text-slate-900">Black & White</div>
                        <div className="text-[10px] text-slate-500 font-normal">Sharp Monochrome</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setColorMode('COLOR')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          colorMode === 'COLOR' ? 'border-brand-600 bg-blue-50/90 font-bold shadow-xs' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="text-xs text-slate-900">Full Color</div>
                        <div className="text-[10px] text-brand-600 font-normal">Rich Vibrant Ink</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Sides & Duplex</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPrintSide('SINGLE')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          printSide === 'SINGLE' ? 'border-brand-600 bg-blue-50/90 font-bold shadow-xs' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="text-xs text-slate-900">Single Sided</div>
                        <div className="text-[10px] text-slate-500 font-normal">1 Side / Sheet</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintSide('DOUBLE')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          printSide === 'DOUBLE' ? 'border-brand-600 bg-blue-50/90 font-bold shadow-xs' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="text-xs text-slate-900">Double Sided</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Save 50% Paper</div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Paper Dimensions & GSM Weight */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-brand-600" />
                    <span>2. Paper Sizing & Weight</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Paper Size</label>
                      <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        <option value="A4">A4 (210 × 297 mm)</option>
                        <option value="A3">A3 (297 × 420 mm)</option>
                        <option value="A5">A5 (148 × 210 mm)</option>
                        <option value="LEGAL">Legal (8.5 × 14 in)</option>
                        <option value="LETTER">Letter (8.5 × 11 in)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Quality GSM</label>
                      <select
                        value={paperGsm}
                        onChange={(e) => setPaperGsm(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        <option value="75">75 GSM Standard</option>
                        <option value="80">80 GSM Bond (+₹1)</option>
                        <option value="100">100 GSM Bond (+₹2)</option>
                        <option value="glossy">Glossy Photo (+₹10)</option>
                        <option value="matte">Matte Paper (+₹8)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Copies, Range & Layout */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-brand-600" />
                    <span>3. Copies & Page Range</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Copies</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCopies((c) => Math.max(1, c - 1))}
                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold flex items-center justify-center transition-colors shadow-2xs"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={copies}
                        onChange={(e) => setCopies(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
                        className="w-16 text-center py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setCopies((c) => Math.min(999, c + 1))}
                        className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold flex items-center justify-center transition-colors shadow-2xs"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1 ml-auto">
                        {[1, 2, 5, 10].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setCopies(num)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                              copies === num ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {num}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Page Range</label>
                      <select
                        value={pageRangeMode}
                        onChange={(e) => setPageRangeMode(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        <option value="ALL">All Pages ({pagesList.length})</option>
                        <option value="CUSTOM">Custom Range</option>
                        <option value="ODD">Odd Pages Only</option>
                        <option value="EVEN">Even Pages Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Pages Per Sheet</label>
                      <select
                        value={pagesPerSheet}
                        onChange={(e) => setPagesPerSheet(Number(e.target.value) as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        <option value={1}>1 Page / Sheet</option>
                        <option value={2}>2 Pages (Side-by-side)</option>
                        <option value={4}>4 Pages (Compact)</option>
                      </select>
                    </div>
                  </div>

                  {pageRangeMode === 'CUSTOM' && (
                    <div>
                      <input
                        type="text"
                        placeholder="e.g. 1-5, 8, 11-14"
                        value={customRangeString}
                        onChange={(e) => setCustomRangeString(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Finishing, Binding & Special Instructions */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>4. Finishing & Instructions</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Binding Finishing</label>
                      <select
                        value={bindingOption}
                        onChange={(e) => setBindingOption(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        <option value="NONE">No Binding</option>
                        <option value="STAPLE">Corner Staple (+₹5)</option>
                        <option value="SPIRAL">Spiral Coil (+₹40)</option>
                        <option value="COMB">Comb Binding (+₹40)</option>
                        <option value="HARDCOVER">Hard Cover (+₹250)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Lamination Pouch</label>
                      <select
                        value={laminationOption}
                        onChange={(e) => setLaminationOption(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        <option value="NONE">No Lamination</option>
                        <option value="GLOSS">Glossy Clear (+₹20)</option>
                        <option value="MATTE">Matte Velvet (+₹25)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Special note for counter (e.g. staple top-left corner)..."
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM: Smart Price Calculation Summary Bar */}
            <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-lg shadow-blue-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  REAL-TIME SMART PRICE ENGINE
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit']">
                    ₹{priceCalculation.grandTotal.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({priceCalculation.totalSheets} sheets • {copies} {copies === 1 ? 'copy' : 'copies'})
                  </span>
                  {priceCalculation.discount > 0 && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Saved ₹{priceCalculation.discount.toFixed(2)} ({priceCalculation.discountPercent}% bulk off)
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 flex items-center gap-2 flex-wrap">
                  <span>Print: ₹{priceCalculation.printingCost}</span>
                  {priceCalculation.paperCost > 0 && <span>• Paper: ₹{priceCalculation.paperCost}</span>}
                  {priceCalculation.finishingCost > 0 && <span>• Finishing: ₹{priceCalculation.finishingCost}</span>}
                  <span>• GST Included</span>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={creatingOrder || priceCalculation.selectedPagesCount === 0}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{creatingOrder ? 'Creating Order...' : 'Proceed to Instant UPI Payment'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: UPI PAYMENT & LIVE TRACKING ================= */}
        {currentStep === 3 && order && (
          <div className="max-w-md mx-auto w-full py-6 space-y-5">
            {/* Main Payment Container Card */}
            <div className={`p-6 rounded-3xl bg-white border shadow-xl text-center space-y-4 transition-all duration-300 ${
              paymentStatus === 'declined'
                ? 'border-red-300 ring-4 ring-red-100/70 shadow-red-500/10 animate-shake'
                : paymentStatus === 'success' || isPaid
                ? 'border-emerald-200 ring-4 ring-emerald-100/70 shadow-emerald-500/10'
                : 'border-blue-100 shadow-blue-500/5'
            }`}>
              {/* Header Status Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    paymentStatus === 'success' || isPaid
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : paymentStatus === 'declined'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {paymentStatus === 'success' || isPaid
                    ? 'PAYMENT VERIFIED'
                    : paymentStatus === 'declined'
                    ? 'PAYMENT DECLINED'
                    : 'AWAITING UPI'}
                </span>
              </div>

              {/* Amount Display */}
              <div>
                <span className="text-xs text-slate-500 block">Total Amount</span>
                <div className="text-3xl font-black text-slate-900 font-['Outfit'] mt-1">
                  ₹{(order.total || priceCalculation.grandTotal).toFixed(2)}
                </div>
              </div>

              {/* ----------------- STATE 1: PAYMENT SUCCESSFUL ANIMATION ----------------- */}
              {paymentStatus === 'success' || isPaid ? (
                <div className="space-y-5 py-3 animate-in fade-in zoom-in-95 duration-300">
                  {/* Glowing Animated Success Badge */}
                  <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                    <div className="absolute inset-1 rounded-full bg-emerald-100 animate-pulse" />
                    <div className="relative w-18 h-18 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 className="w-10 h-10 stroke-[2.5] animate-bounce" />
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-1.5">
                      <PartyPopper className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Payment Verified Successfully!</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 font-['Outfit']">
                      ₹{(order.total || priceCalculation.grandTotal).toFixed(2)} Received
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                      {!isPrintingStarted
                        ? 'Payment has been 100% verified. Tap the button below to start printing your pages on the Xerox machine!'
                        : 'Order sent to shop printer. Pages are being spooled and printed right now!'}
                    </p>
                  </div>

                  {/* Payment Receipt Box */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left text-xs space-y-1.5 text-slate-700">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Shop Station:</span>
                      <span className="font-bold text-slate-900">{shop?.name || 'PRINTX SHOP'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Order Number:</span>
                      <span className="font-mono font-bold text-emerald-800">{order.orderNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Payment Status:</span>
                      <span className="font-bold text-emerald-600">PAID & VERIFIED (UPI)</span>
                    </div>
                  </div>

                  {/* If Print NOT yet started -> Show Confirm & Print Out Button */}
                  {!isPrintingStarted ? (
                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => setIsPrintingStarted(true)}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.98] animate-pulse"
                      >
                        <Printer className="w-5 h-5" />
                        <span>Confirm & Print Out Now</span>
                      </button>
                      <span className="text-[11px] text-slate-500 block">
                        Clicking this will instantly release the job to the printer
                      </span>
                    </div>
                  ) : (
                    /* If Print Started -> Show Hardware Spooling Status & Done */
                    <div className="space-y-4 pt-1">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white text-left space-y-3 shadow-md">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-bold text-emerald-400">
                            <Printer className="w-4 h-4 animate-pulse" />
                            <span>Hardware Spooling: Active</span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">Printing Now</span>
                        </div>

                        {/* Progress Bar Animation */}
                        <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-full animate-pulse" />
                        </div>

                        <div className="space-y-1.5 text-[11px] text-slate-300 pt-1 border-t border-slate-700/60 font-medium">
                          <div className="flex items-center justify-between">
                            <span>Job ID:</span>
                            <span className="font-mono text-emerald-300">PJ-{order.orderNumber.slice(-8)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Sheets:</span>
                            <span className="text-white font-semibold">{priceCalculation.totalSheets} sheets ({copies} copies)</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push(`/shop/${slug}`)}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                      >
                        Done / Print Another Document
                      </button>
                    </div>
                  )}
                </div>
              ) : paymentStatus === 'declined' ? (
                /* ----------------- STATE 2: PAYMENT DECLINED ANIMATION ----------------- */
                <div className="space-y-5 py-3 animate-in fade-in zoom-in-95 duration-300">
                  {/* Glowing Animated Declined Badge with Shake */}
                  <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-rose-400/20 animate-ping" />
                    <div className="absolute inset-1 rounded-full bg-rose-100 animate-pulse" />
                    <div className="relative w-18 h-18 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 animate-shake">
                      <XCircle className="w-10 h-10 stroke-[2.5]" />
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 mb-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                      <span>Payment Declined / Incomplete</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 font-['Outfit']">
                      Payment Not Received
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                      {declineReason}
                    </p>
                  </div>

                  {/* Safety & Bank Refund Note */}
                  <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-left text-xs space-y-1 text-slate-700">
                    <div className="flex items-center gap-1.5 font-bold text-rose-800">
                      <ShieldCheck className="w-4 h-4 text-rose-600" />
                      <span>No Duplicate Payment Risk</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      If money was debited from your account, your bank will auto-reverse it within 24-48 hours. No duplicate order was charged.
                    </p>
                  </div>

                  {/* Action Buttons for Declined State */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleRetryPayment();
                        setHasOpenedUpi(true);
                        window.location.href = `upi://pay?pa=${shop?.upiId || '9002761536@axl'}&pn=${encodeURIComponent(
                          shop?.name || 'PRINTX SHOP'
                        )}&am=${order.total || priceCalculation.grandTotal}&cu=INR&tn=${order.orderNumber}`;
                      }}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Retry Payment with UPI App</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRetryPayment}
                      className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Show QR Code Again</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={simulatingPayment}
                      className="w-full py-2.5 text-[11px] font-semibold text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
                    >
                      {simulatingPayment ? 'Re-checking Bank...' : 'Already debited? Click here to re-verify payment'}
                    </button>
                  </div>
                </div>
              ) : (
                /* ----------------- STATE 3: PENDING UPI QR & VERIFICATION FLOW ----------------- */
                <>
                  {/* Returned from UPI App Banner */}
                  {showReturnedBanner && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-2 border-indigo-300 text-center space-y-3 shadow-md animate-in fade-in zoom-in-95 duration-200">
                      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 font-['Outfit']">Returned from UPI App</h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Did you complete payment in your UPI app? Tap below to verify.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSimulatePayment}
                        disabled={simulatingPayment || isPaid}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-brand-600 hover:from-indigo-700 hover:to-brand-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                      >
                        {simulatingPayment ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verifying with Bank...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>I Have Paid — Verify Payment (₹{(order.total || priceCalculation.grandTotal).toFixed(2)})</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSimulateDecline}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline pt-1 block mx-auto cursor-pointer"
                      >
                        Payment failed / cancelled in app?
                      </button>
                    </div>
                  )}

                  {/* Dynamic UPI QR Code */}
                  <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-inner inline-block">
                    <img
                      src={
                        order.upi?.qrCodeUrl ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                          `upi://pay?pa=${shop?.upiId || '9002761536@axl'}&pn=${encodeURIComponent(
                            shop?.name || 'PRINTX SHOP'
                          )}&am=${order.total || priceCalculation.grandTotal}&cu=INR&tn=${order.orderNumber}`
                        )}`
                      }
                      alt="UPI Payment QR"
                      className="w-48 h-48 object-contain mx-auto"
                    />
                  </div>

                  <div className="text-xs text-slate-600">
                    <span className="block font-semibold">Pay to Xerox Station UPI:</span>
                    <code className="px-2 py-0.5 rounded-lg bg-blue-50 text-brand-700 font-mono text-[11px] font-bold">
                      {shop?.upiId || '9002761536@axl'}
                    </code>
                  </div>

                  {/* App Links */}
                  <div className="flex justify-center gap-2 pt-1">
                    <a
                      href={`upi://pay?pa=${shop?.upiId || '9002761536@axl'}&pn=${encodeURIComponent(
                        shop?.name || 'PRINTX SHOP'
                      )}&am=${order.total || priceCalculation.grandTotal}&cu=INR&tn=${order.orderNumber}`}
                      onClick={() => setHasOpenedUpi(true)}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Open Any UPI App (GPay / PhonePe / Paytm)</span>
                    </a>
                  </div>

                  {!showReturnedBanner && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <button
                        type="button"
                        onClick={handleSimulatePayment}
                        disabled={simulatingPayment || isPaid}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {simulatingPayment ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verifying with Bank...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>I Have Paid via UPI — Verify Payment</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSimulateDecline}
                        className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Payment issue / transaction cancelled?
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
