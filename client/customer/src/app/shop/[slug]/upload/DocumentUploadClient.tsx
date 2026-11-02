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
  PhonePeIcon,
  GooglePayIcon,
  PaytmIcon,
  BhimUpiIcon,
  PaymentAppsBadgeRow,
} from '@/components/PaymentLogos';
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
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleCopyUpi = (upiId: string) => {
    try {
      navigator.clipboard?.writeText(upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch (e) {}
  };

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

    // Base rates matching verified landing page rates
    let pricePerSheet = 2.0;
    if (colorMode === 'COLOR') {
      pricePerSheet = printSide === 'DOUBLE' ? 10.0 : 6.0;
    } else {
      pricePerSheet = printSide === 'DOUBLE' ? 3.0 : 2.0;
    }
    if (paperSize === 'A3') {
      pricePerSheet = colorMode === 'COLOR'
        ? (printSide === 'DOUBLE' ? 30.0 : 20.0)
        : (printSide === 'DOUBLE' ? 12.0 : 8.0);
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

    // Finishing Surcharges matching official landing page
    let finishingCost = 0;
    if (bindingOption === 'STAPLE') finishingCost += 5.0 * copies;
    else if (bindingOption === 'SPIRAL') finishingCost += 35.0 * copies;
    else if (bindingOption === 'COMB') finishingCost += 35.0 * copies;
    else if (bindingOption === 'HARDCOVER') finishingCost += 220.0 * copies;

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
    setError(null);
    let currentSessionId = sessionId || (typeof window !== 'undefined' ? sessionStorage.getItem('printx_customer_session_id') : null);

    // Auto-create customer session on the fly if not yet active
    if (!currentSessionId) {
      try {
        setUploading(true);
        setUploadProgress(10);
        const newSession = await startCustomerSession(slug);
        if (newSession?.id) {
          currentSessionId = newSession.id;
          setSessionId(newSession.id);
          sessionStorage.setItem('printx_customer_session_id', newSession.id);
        }
      } catch (sessErr: any) {
        console.warn('Could not auto-create session before upload:', sessErr);
      }
    }

    if (!currentSessionId) {
      setUploading(false);
      setError('Active customer session could not be established. PrintX cloud server may be waking up. Please tap Retry in a few seconds.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(25);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('customerSessionId', currentSessionId);

      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 10 : prev));
      }, 200);

      let response: Response | null = null;
      let lastErrorMessage = '';

      // Auto-retry up to 2 times in case Render free tier is cold-starting
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await fetch(`${API_BASE_URL}/documents/upload`, {
            method: 'POST',
            body: formData,
          });
          if (response) break;
        } catch (fetchErr: any) {
          lastErrorMessage = fetchErr?.message || 'Network error';
          if (attempt === 1) {
            console.warn('First upload attempt timed out/failed. Cloud server might be waking up. Retrying in 2.5s...');
            await new Promise((resolve) => setTimeout(resolve, 2500));
          }
        }
      }

      clearInterval(interval);
      setUploadProgress(100);

      if (!response) {
        throw new Error(
          'Failed to connect to PrintX backend server. Cloud instance was asleep (Render cold start) or network was interrupted. Please tap "Choose PDF / Files" again.'
        );
      }

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Failed to analyze document');
      }

      setProcessedDoc(json.data);
      sessionStorage.setItem('printx_current_doc_id', json.data.id);
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Upload failed:', err);
      let msg = err?.message || 'File upload and analysis failed';
      if (msg.toLowerCase().includes('failed to fetch')) {
        msg = 'Connection to PrintX Cloud Server timed out. Free cloud instances take ~30 seconds to wake up from sleep mode. Please try selecting the file again now!';
      }
      setError(msg);
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 relative overflow-hidden">
      {/* Top Header with Crisp Modern Black Outline */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 border-b-2 border-slate-900 shadow-neo-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStep === 3 && !isPaid) setCurrentStep(2);
              else if (currentStep === 2) setCurrentStep(1);
              else router.push(`/shop/${slug}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-xs text-slate-950 font-black shadow-neo-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <span className="text-xs font-black text-slate-950 block font-outfit uppercase tracking-wider">
              {shop?.name || 'PRINTX SHOP'}
            </span>
            <span className="text-[10px] text-brand-600 block font-extrabold">
              {currentStep === 1
                ? 'Step 1: Document Upload'
                : currentStep === 2
                ? 'Step 2: PRINTX Document Studio'
                : 'Step 3: Instant UPI Auto-Print'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {shop?.isAgentOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-200 text-slate-950 border-2 border-slate-900 shadow-neo-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse border border-slate-900" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-200 text-slate-950 border-2 border-slate-900 shadow-neo-sm">
                <span className="w-2 h-2 rounded-full bg-rose-600 border border-slate-900" />
                Offline
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col justify-between">
        {/* Agent Offline Notice */}
        {shop && shop.isAgentOnline === false && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-100 border-2 border-slate-900 text-slate-950 text-xs flex items-center gap-3 shadow-neo-sm">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 stroke-[2.2]" />
            <div>
              <span className="font-black">Counter PC Agent Offline: </span>
              <span className="font-medium">Shop counter PC is currently offline. Your print will auto-spool once the shopkeeper starts the agent.</span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-100 border-2 border-slate-900 text-slate-950 text-xs flex items-center justify-between gap-3 shadow-neo-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 stroke-[2.2]" />
              <span className="font-bold">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-white border border-slate-900 hover:bg-slate-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ================= STEP 1: UPLOAD & ANALYSIS ================= */}
        {currentStep === 1 && (
          <div className="max-w-xl mx-auto w-full py-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-outfit">
                Upload Your Document
              </h1>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                PDF, Word (DOCX), PowerPoint (PPTX), Excel (XLSX), Photos (JPG, PNG)
              </p>
            </div>

            {/* Upload Dropzone with Crisp Black Outline */}
            {!uploading && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 rounded-3xl border-2 border-dashed border-slate-900 transition-all cursor-pointer flex flex-col items-center text-center group bg-white ${
                  dragActive
                    ? 'bg-blue-100 shadow-neo scale-[1.01]'
                    : 'shadow-neo hover:shadow-neo-hover hover:bg-slate-50'
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

                <div className="w-16 h-16 rounded-2xl bg-blue-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 mb-4 group-hover:scale-105 transition-transform shadow-neo-sm">
                  <UploadCloud className="w-8 h-8 stroke-[2.2]" />
                </div>

                <h2 className="text-base font-black text-slate-950 font-outfit">
                  Tap to Select File or Drag & Drop
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-1 max-w-xs">
                  Instant smart page count, color detection, and paper sizing.
                </p>

                <div className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-black border-2 border-slate-900 shadow-neo-sm transition-all">
                  <span>Browse Device Files</span>
                </div>
              </div>
            )}

            {/* Camera and Drive Quick Triggers with Black Outlines */}
            {!uploading && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3 px-4 rounded-2xl bg-white border-2 border-slate-900 hover:bg-emerald-50 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-700 stroke-[2.2]" />
                  <span>Scan with Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-4 rounded-2xl bg-white border-2 border-slate-900 hover:bg-blue-50 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-brand-600 stroke-[2.2]" />
                  <span>Choose PDF / Files</span>
                </button>
              </div>
            )}

            {/* Upload Progress Loader with Black Outline */}
            {uploading && (
              <div className="p-8 rounded-3xl bg-white border-2 border-slate-900 shadow-neo-lg text-center flex flex-col items-center">
                <div className="relative flex items-center justify-center w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-3 border-slate-300 border-t-slate-950 animate-spin" />
                  <div className="w-10 h-10 rounded-2xl bg-slate-950 border-2 border-slate-900 flex items-center justify-center text-white shadow-neo-sm">
                    <UploadCloud className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>

                <h2 className="text-base font-black text-slate-950 font-outfit">Analyzing Document...</h2>
                <p className="text-xs text-slate-600 font-semibold mt-1">
                  Scanning page count & print rates ({uploadProgress}%)
                </p>

                <div className="w-full bg-slate-100 rounded-full h-3 mt-4 overflow-hidden max-w-xs border-2 border-slate-900 shadow-neo-sm">
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
            {/* Top Workspace Toolbar with Black Outline */}
            <div className="p-3.5 rounded-2xl bg-white border-2 border-slate-900 shadow-neo flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 border-2 border-slate-900 flex items-center justify-center text-slate-950 shadow-neo-sm">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-slate-950 truncate max-w-xs sm:max-w-md font-outfit">
                    {processedDoc.originalName}
                  </h2>
                  <span className="text-[10px] text-slate-600 font-bold block">
                    {pagesList.length} Total Pages • {(processedDoc.fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddBlankPage}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-black flex items-center gap-1.5 border-2 border-slate-900 shadow-neo-sm transition-all cursor-pointer"
                  title="Add Blank Page"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Add Blank Page</span>
                </button>

                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-slate-900 shadow-neo-sm transition-all cursor-pointer"
                  title="Upload Another File"
                >
                  <Trash2 className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>
            </div>

            {/* 3-Column Studio Layout (Desktop) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT: Page Thumbnails Drawer (3 Cols) */}
              <div className="lg:col-span-3 bg-white p-4 rounded-3xl border-2 border-slate-900 shadow-neo flex flex-col max-h-[640px]">
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-3">
                  <span className="text-xs font-black text-slate-950 font-outfit">
                    Pages ({pagesList.filter((p) => p.selected).length}/{pagesList.length})
                  </span>

                  <select
                    value={pageRangeMode}
                    onChange={(e) => setPageRangeMode(e.target.value as any)}
                    className="px-2 py-1 text-[11px] rounded-lg bg-slate-50 border-2 border-slate-900 text-slate-950 font-black shadow-neo-sm"
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
                      className="w-full px-3 py-1.5 text-xs bg-white border-2 border-slate-900 rounded-xl text-slate-950 font-mono font-bold shadow-neo-sm"
                    />
                  </div>
                )}

                {/* Thumbnails Scrollable List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {pagesList.map((page, idx) => (
                    <div
                      key={page.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`p-2.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                        activePageIndex === idx
                          ? 'border-slate-900 bg-blue-100 shadow-neo font-bold'
                          : page.selected
                          ? 'border-slate-900 hover:bg-slate-50 bg-white shadow-neo-sm'
                          : 'border-slate-400 bg-slate-100 opacity-60'
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
                          className="w-4 h-4 rounded text-brand-600 accent-slate-950 cursor-pointer"
                        />

                        {/* Page Preview Mini Badge */}
                        <div
                          className="w-10 h-13 rounded-lg bg-white border-2 border-slate-900 overflow-hidden flex items-center justify-center text-[10px] font-mono font-black text-slate-950 shadow-neo-sm shrink-0"
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
                              <FileText className="w-4 h-4 text-slate-950 stroke-[2.2]" />
                              <span className="text-[8px] font-black text-slate-800">P.{page.originalPageNumber}</span>
                            </div>
                          ) : (
                            <span>{page.isBlank ? 'BLANK' : `P.${page.originalPageNumber}`}</span>
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-black text-slate-950">Page {idx + 1}</div>
                          <div className="text-[10px] text-slate-600 font-mono font-semibold">
                            {page.rotation > 0 ? `${page.rotation}° rotation` : 'Standard'}
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
                          className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-950 transition-colors"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5 stroke-[2.2]" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicatePage(idx);
                          }}
                          className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-950 transition-colors"
                          title="Duplicate Page"
                        >
                          <Copy className="w-3.5 h-3.5 stroke-[2.2]" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(idx);
                          }}
                          className="p-1 rounded-lg hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CENTER: Large Document Preview Canvas (5 Cols) */}
              <div className="lg:col-span-5 bg-white p-4 rounded-3xl border-2 border-slate-900 shadow-neo flex flex-col justify-between min-h-[500px]">
                {/* Canvas Controls Header */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-950 font-outfit">
                      Preview: Page {activePageIndex + 1} of {pagesList.length}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border border-slate-900 ${activePage?.selected ? 'bg-emerald-200 text-slate-950' : 'bg-amber-200 text-slate-950'}`}>
                      {activePage?.selected ? 'Included' : 'Skipped'}
                    </span>
                  </div>

                  {/* Zoom Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-900 text-slate-950 shadow-neo-sm"
                    >
                      <ZoomOut className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="text-[11px] font-mono font-bold text-slate-950 w-10 text-center">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-900 text-slate-950 shadow-neo-sm"
                    >
                      <ZoomIn className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Document View Canvas Area */}
                <div className="flex-1 my-4 flex items-center justify-center p-3 sm:p-4 bg-slate-100 rounded-2xl overflow-hidden relative min-h-[380px] max-h-[460px] border-2 border-slate-900 shadow-inner">
                  <div
                    className={`bg-white rounded-xl shadow-neo-lg border-2 border-slate-900 transition-all flex flex-col justify-between relative overflow-hidden ${
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
                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 border-b-2 border-slate-900 text-[10px] text-slate-700 font-mono shrink-0">
                      <span className="truncate max-w-[140px] font-bold text-slate-950">{processedDoc?.originalName || file?.name || 'Document'}</span>
                      <span className="font-bold text-slate-600">Page {activePageIndex + 1} of {pagesList.length}</span>
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
                          <FileText className="w-12 h-12 text-slate-950 mb-2 stroke-[2.2]" />
                          <span className="text-xs font-black text-slate-950">{processedDoc?.originalName || file?.name || 'Document Page'}</span>
                          <span className="text-[10px] text-slate-600 font-semibold mt-1">Page {activePageIndex + 1} • {paperSize} {colorMode}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer bar on sheet */}
                    <div className="px-3 py-1 bg-slate-100 border-t-2 border-slate-900 flex items-center justify-between text-[9px] text-slate-700 font-mono shrink-0">
                      <span>{paperSize} • {colorMode === 'COLOR' ? 'Color' : 'B&W'} • {printSide === 'DOUBLE' ? 'Duplex' : 'Single'}</span>
                      <span className="text-slate-950 font-black">PRINTX Real Preview</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Pager Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={activePageIndex === 0}
                    onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-950 text-xs font-black shadow-neo-sm disabled:opacity-40 transition-all cursor-pointer"
                  >
                    ← Previous
                  </button>

                  <button
                    onClick={() => handleRotatePage(activePageIndex)}
                    className="px-3 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 border-2 border-slate-900 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-neo-sm transition-all cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Rotate 90°</span>
                  </button>

                  <button
                    disabled={activePageIndex >= pagesList.length - 1}
                    onClick={() => setActivePageIndex((p) => Math.min(pagesList.length - 1, p + 1))}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-950 text-xs font-black shadow-neo-sm disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* RIGHT: Complete Print Settings Panel (4 Cols) */}
              <div className="lg:col-span-4 bg-white p-5 rounded-3xl border-2 border-slate-900 shadow-neo space-y-4">
                <div className="pb-3 border-b-2 border-slate-900 flex items-center justify-between">
                  <h3 className="font-black text-slate-950 text-sm font-outfit flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-slate-950 stroke-[2.2]" />
                    <span>Print Specifications</span>
                  </h3>
                  <span className="text-[10px] text-slate-950 font-black px-2.5 py-0.5 rounded-full bg-emerald-200 border-2 border-slate-900 shadow-neo-sm">
                    Live Engine
                  </span>
                </div>

                {/* 1. Color Composition & Print Sides */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm space-y-3">
                  <div className="text-[11px] font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-950 stroke-[2.2]" />
                    <span>1. Color & Print Sides</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-900 mb-1.5">Color Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setColorMode('BW')}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                          colorMode === 'BW'
                            ? 'border-slate-900 bg-slate-950 text-white shadow-neo font-bold'
                            : 'border-slate-900 bg-white text-slate-950 hover:bg-slate-50 shadow-neo-sm'
                        }`}
                      >
                        <div className="text-xs font-black">Black & White</div>
                        <div className={`text-[10px] font-medium ${colorMode === 'BW' ? 'text-slate-300' : 'text-slate-500'}`}>Sharp Monochrome</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setColorMode('COLOR')}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                          colorMode === 'COLOR'
                            ? 'border-slate-900 bg-blue-600 text-white shadow-neo font-bold'
                            : 'border-slate-900 bg-white text-slate-950 hover:bg-slate-50 shadow-neo-sm'
                        }`}
                      >
                        <div className="text-xs font-black">Full Color</div>
                        <div className={`text-[10px] font-medium ${colorMode === 'COLOR' ? 'text-blue-100' : 'text-brand-600'}`}>Rich Vibrant Ink</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-900 mb-1.5">Sides & Duplex</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPrintSide('SINGLE')}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                          printSide === 'SINGLE'
                            ? 'border-slate-900 bg-slate-950 text-white shadow-neo font-bold'
                            : 'border-slate-900 bg-white text-slate-950 hover:bg-slate-50 shadow-neo-sm'
                        }`}
                      >
                        <div className="text-xs font-black">Single Sided</div>
                        <div className={`text-[10px] font-medium ${printSide === 'SINGLE' ? 'text-slate-300' : 'text-slate-500'}`}>1 Side / Sheet</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintSide('DOUBLE')}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                          printSide === 'DOUBLE'
                            ? 'border-slate-900 bg-emerald-600 text-white shadow-neo font-bold'
                            : 'border-slate-900 bg-white text-slate-950 hover:bg-slate-50 shadow-neo-sm'
                        }`}
                      >
                        <div className="text-xs font-black">Double Sided</div>
                        <div className={`text-[10px] font-semibold ${printSide === 'DOUBLE' ? 'text-emerald-100' : 'text-emerald-700'}`}>Save 50% Paper</div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Paper Dimensions & GSM Weight */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm space-y-3">
                  <div className="text-[11px] font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-950 stroke-[2.2]" />
                    <span>2. Paper Sizing & Weight</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-black text-slate-900 mb-1">Paper Size</label>
                      <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs font-bold text-slate-950 shadow-neo-sm"
                      >
                        <option value="A4">A4 (210 × 297 mm)</option>
                        <option value="A3">A3 (297 × 420 mm)</option>
                        <option value="A5">A5 (148 × 210 mm)</option>
                        <option value="LEGAL">Legal (8.5 × 14 in)</option>
                        <option value="LETTER">Letter (8.5 × 11 in)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-900 mb-1">Quality GSM</label>
                      <select
                        value={paperGsm}
                        onChange={(e) => setPaperGsm(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-white border-2 border-slate-900 text-xs font-bold text-slate-950 shadow-neo-sm"
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
                <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm space-y-3">
                  <div className="text-[11px] font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-950 stroke-[2.2]" />
                    <span>3. Copies & Page Range</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-900 mb-1">Copies</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCopies((c) => Math.max(1, c - 1))}
                        className="w-9 h-9 rounded-xl bg-white border-2 border-slate-900 hover:bg-slate-100 text-slate-950 font-black flex items-center justify-center transition-all shadow-neo-sm cursor-pointer"
                      >
                        <Minus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={copies}
                        onChange={(e) => setCopies(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
                        className="w-16 text-center py-1.5 bg-white border-2 border-slate-900 rounded-xl font-black text-xs text-slate-950 shadow-neo-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setCopies((c) => Math.min(999, c + 1))}
                        className="w-9 h-9 rounded-xl bg-white border-2 border-slate-900 hover:bg-slate-100 text-slate-950 font-black flex items-center justify-center transition-all shadow-neo-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      <div className="flex items-center gap-1 ml-auto">
                        {[1, 2, 5, 10].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setCopies(num)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all border-2 border-slate-900 ${
                              copies === num ? 'bg-slate-950 text-white shadow-neo-sm' : 'bg-white text-slate-950 hover:bg-slate-100 shadow-neo-sm'
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
                      <label className="block text-[11px] font-black text-slate-900 mb-1">Page Range</label>
                      <select
                        value={pageRangeMode}
                        onChange={(e) => setPageRangeMode(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border-2 border-slate-900 text-xs font-bold text-slate-950 shadow-neo-sm"
                      >
                        <option value="ALL">All Pages ({pagesList.length})</option>
                        <option value="CUSTOM">Custom Range</option>
                        <option value="ODD">Odd Pages Only</option>
                        <option value="EVEN">Even Pages Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-900 mb-1">Pages Per Sheet</label>
                      <select
                        value={pagesPerSheet}
                        onChange={(e) => setPagesPerSheet(Number(e.target.value) as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border-2 border-slate-900 text-xs font-bold text-slate-950 shadow-neo-sm"
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
                        className="w-full px-3 py-1.5 text-xs bg-white border-2 border-slate-900 rounded-xl text-slate-950 font-bold placeholder-slate-400 shadow-neo-sm"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Finishing, Binding & Special Instructions */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-neo-sm space-y-3">
                  <div className="text-[11px] font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-slate-950 stroke-[2.2]" />
                    <span>4. Finishing & Instructions</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-black text-slate-900 mb-1">Binding Finishing</label>
                      <select
                        value={bindingOption}
                        onChange={(e) => setBindingOption(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border-2 border-slate-900 text-xs font-bold text-slate-950 shadow-neo-sm"
                      >
                        <option value="NONE">No Binding</option>
                        <option value="STAPLE">Corner Staple (+₹5)</option>
                        <option value="SPIRAL">Spiral Coil (+₹40)</option>
                        <option value="COMB">Comb Binding (+₹40)</option>
                        <option value="HARDCOVER">Hard Cover (+₹250)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-900 mb-1">Lamination Pouch</label>
                      <select
                        value={laminationOption}
                        onChange={(e) => setLaminationOption(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white border-2 border-slate-900 text-xs font-bold text-slate-950 shadow-neo-sm"
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
                      className="w-full px-3 py-2 text-xs bg-white border-2 border-slate-900 rounded-xl text-slate-950 font-medium placeholder-slate-400 shadow-neo-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM: Smart Price Calculation Summary Bar */}
            <div className="p-5 rounded-3xl bg-white border-2 border-slate-900 shadow-neo-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-black text-slate-900 uppercase tracking-wider">
                  REAL-TIME SMART PRICE ENGINE
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-950 font-outfit">
                    ₹{priceCalculation.grandTotal.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-600 font-bold">
                    ({priceCalculation.totalSheets} sheets • {copies} {copies === 1 ? 'copy' : 'copies'})
                  </span>
                  {priceCalculation.discount > 0 && (
                    <span className="text-[11px] font-black text-slate-950 bg-emerald-200 px-2.5 py-0.5 rounded-full border-2 border-slate-900 shadow-neo-sm">
                      Saved ₹{priceCalculation.discount.toFixed(2)} ({priceCalculation.discountPercent}% bulk off)
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-700 font-bold flex items-center gap-2 flex-wrap">
                  <span>Print: ₹{priceCalculation.printingCost}</span>
                  {priceCalculation.paperCost > 0 && <span>• Paper: ₹{priceCalculation.paperCost}</span>}
                  {priceCalculation.finishingCost > 0 && <span>• Finishing: ₹{priceCalculation.finishingCost}</span>}
                  <span>• GST Included</span>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={creatingOrder || priceCalculation.selectedPagesCount === 0}
                className="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 border-2 border-slate-900 text-white font-black text-sm shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{creatingOrder ? 'Creating Order...' : 'Proceed to Instant UPI Payment'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: UPI PAYMENT & LIVE TRACKING ================= */}
        {currentStep === 3 && order && (
          <div className="max-w-md mx-auto w-full py-6 space-y-5">
            {/* Main Payment Container Card with Crisp 3px Black Border */}
            <div className={`p-6 rounded-3xl bg-white border-3 border-slate-900 text-center space-y-4 shadow-neo-lg transition-all duration-300 ${
              paymentStatus === 'declined'
                ? 'bg-rose-50 animate-shake'
                : paymentStatus === 'success' || isPaid
                ? 'bg-emerald-50'
                : 'bg-white'
            }`}>
              {/* Header Status Bar */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 text-xs">
                <span className="font-mono font-black text-slate-950">{order.orderNumber}</span>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black border-2 border-slate-900 shadow-neo-sm ${
                    paymentStatus === 'success' || isPaid
                      ? 'bg-emerald-300 text-slate-950'
                      : paymentStatus === 'declined'
                      ? 'bg-rose-300 text-slate-950'
                      : 'bg-amber-300 text-slate-950'
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
                <span className="text-xs text-slate-600 font-bold block uppercase tracking-wider">Total Amount</span>
                <div className="text-3xl font-black text-slate-950 font-outfit mt-1">
                  ₹{(order.total || priceCalculation.grandTotal).toFixed(2)}
                </div>
              </div>

              {/* ----------------- STATE 1: PAYMENT SUCCESSFUL ANIMATION ----------------- */}
              {paymentStatus === 'success' || isPaid ? (
                <div className="space-y-5 py-3 animate-in fade-in zoom-in-95 duration-300">
                  {/* Glowing Animated Success Badge */}
                  <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
                    <div className="relative w-20 h-20 rounded-2xl bg-emerald-400 border-2 border-slate-900 text-slate-950 flex items-center justify-center shadow-neo">
                      <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-200 text-slate-950 text-xs font-black border-2 border-slate-900 shadow-neo-sm mb-1.5">
                      <PartyPopper className="w-3.5 h-3.5 text-slate-950 stroke-[2.2]" />
                      <span>Payment Verified Successfully!</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-950 font-outfit">
                      ₹{(order.total || priceCalculation.grandTotal).toFixed(2)} Received
                    </h2>
                    <p className="text-xs text-slate-700 font-medium mt-1 max-w-xs mx-auto">
                      {!isPrintingStarted
                        ? 'Payment has been verified. Tap the button below to start printing your pages on the Xerox machine!'
                        : 'Order sent to shop printer. Pages are being spooled and printed right now!'}
                    </p>
                  </div>

                  {/* Payment Receipt Box */}
                  <div className="p-3.5 rounded-2xl bg-white border-2 border-slate-900 shadow-neo-sm text-left text-xs space-y-1.5 text-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-bold">Shop Station:</span>
                      <span className="font-black text-slate-950">{shop?.name || 'PRINTX SHOP'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-bold">Order Number:</span>
                      <span className="font-mono font-black text-slate-950">{order.orderNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-bold">Payment Status:</span>
                      <span className="font-black text-emerald-700">PAID & VERIFIED (UPI)</span>
                    </div>
                  </div>

                  {/* If Print NOT yet started -> Show Confirm & Print Out Button */}
                  {!isPrintingStarted ? (
                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => setIsPrintingStarted(true)}
                        className="w-full py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 text-slate-950 font-black text-sm shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                      >
                        <Printer className="w-5 h-5 stroke-[2.2]" />
                        <span>Confirm & Print Out Now</span>
                      </button>
                      <span className="text-[11px] text-slate-600 font-medium block">
                        Clicking this will instantly release the job to the printer
                      </span>
                    </div>
                  ) : (
                    /* If Print Started -> Show Hardware Spooling Status & Done */
                    <div className="space-y-4 pt-1">
                      <div className="p-4 rounded-2xl bg-slate-950 border-2 border-slate-900 text-white text-left space-y-3 shadow-neo">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-black text-emerald-400">
                            <Printer className="w-4 h-4 stroke-[2.2] animate-pulse" />
                            <span>Hardware Spooling: Active</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-300">Printing Now</span>
                        </div>

                        {/* Progress Bar Animation */}
                        <div className="w-full h-2.5 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full w-full animate-pulse" />
                        </div>

                        <div className="space-y-1.5 text-[11px] text-slate-300 pt-1 border-t border-slate-800 font-medium">
                          <div className="flex items-center justify-between">
                            <span>Job ID:</span>
                            <span className="font-mono text-emerald-300 font-bold">PJ-{order.orderNumber.slice(-8)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Sheets:</span>
                            <span className="text-white font-bold">{priceCalculation.totalSheets} sheets ({copies} copies)</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push(`/shop/${slug}`)}
                        className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 border-2 border-slate-900 text-white text-xs font-black shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
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
                    <div className="absolute inset-0 rounded-full bg-rose-400/30 animate-ping" />
                    <div className="relative w-20 h-20 rounded-2xl bg-rose-400 border-2 border-slate-900 text-slate-950 flex items-center justify-center shadow-neo animate-shake">
                      <XCircle className="w-10 h-10 stroke-[2.5]" />
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-200 text-slate-950 text-xs font-black border-2 border-slate-900 shadow-neo-sm mb-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-700 stroke-[2.2]" />
                      <span>Payment Declined / Incomplete</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-950 font-outfit">
                      Payment Not Received
                    </h2>
                    <p className="text-xs text-slate-700 font-medium mt-1 max-w-xs mx-auto">
                      {declineReason}
                    </p>
                  </div>

                  {/* Safety & Bank Refund Note */}
                  <div className="p-3.5 rounded-2xl bg-white border-2 border-slate-900 shadow-neo-sm text-left text-xs space-y-1 text-slate-800">
                    <div className="flex items-center gap-1.5 font-black text-rose-800">
                      <ShieldCheck className="w-4 h-4 text-rose-700 stroke-[2.2]" />
                      <span>Security & Bank Refund Guarantee</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                      {declineReason}
                    </p>
                    <p className="text-[10px] text-slate-500 pt-0.5">
                      💡 <em>Tip: Banks decline self-payments if paying your own UPI ID from the same phone. Please scan the QR code directly or use a different UPI app/account.</em>
                    </p>
                  </div>

                  {/* Action Buttons for Declined State */}
                  <div className="space-y-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleRetryPayment();
                        setHasOpenedUpi(true);
                        setShowReturnedBanner(true);
                        window.location.href = `upi://pay?pa=${shop?.upiId || '9002761536@axl'}&pn=${encodeURIComponent(
                          shop?.name || 'PRINTX SHOP'
                        )}&am=${(order.total || priceCalculation.grandTotal).toFixed(2)}&cu=INR&tn=${order.orderNumber}`;
                      }}
                      className="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-400 border-2 border-slate-900 text-slate-950 text-xs font-black shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                      <span>Retry Payment with UPI App</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRetryPayment}
                      className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-950 text-xs font-black shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4 stroke-[2.2]" />
                      <span>Show QR Code Again</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={simulatingPayment}
                      className="w-full py-2.5 text-[11px] font-bold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
                    >
                      {simulatingPayment ? 'Re-checking Bank...' : 'Already debited? Click here to re-verify payment'}
                    </button>
                  </div>
                </div>
              ) : (
                /* ----------------- STATE 3: PENDING UPI QR & VERIFICATION FLOW ----------------- */
                <>
                  {/* PHASE B: Returned from UPI App / Waiting for Confirmation */}
                  {showReturnedBanner ? (
                    <div className="p-5 rounded-2xl bg-indigo-50 border-2 border-slate-900 text-center space-y-3.5 shadow-neo animate-in fade-in zoom-in-95 duration-200">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-200 border-2 border-slate-900 text-slate-950 flex items-center justify-center mx-auto shadow-neo-sm">
                        <CreditCard className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-950 font-outfit">Complete Payment in UPI App</h3>
                        <p className="text-xs text-slate-700 font-medium mt-1 max-w-xs mx-auto">
                          After completing your <strong>₹{(order.total || priceCalculation.grandTotal).toFixed(2)}</strong> transfer, tap below to confirm and trigger printing.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSimulatePayment}
                        disabled={simulatingPayment || isPaid}
                        className="w-full py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 text-slate-950 text-xs font-black shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {simulatingPayment ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin stroke-[2.5]" />
                            <span>Verifying Payment with Bank...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                            <span>I Have Paid via UPI — Start Printing</span>
                          </>
                        )}
                      </button>

                      <div className="pt-2 flex items-center justify-between text-[11px] border-t-2 border-slate-900">
                        <button
                          type="button"
                          onClick={() => {
                            setShowReturnedBanner(false);
                            setHasOpenedUpi(false);
                          }}
                          className="text-slate-700 hover:text-slate-950 font-bold cursor-pointer"
                        >
                          ← Change App / View QR
                        </button>
                        <button
                          type="button"
                          onClick={handleSimulateDecline}
                          className="text-rose-700 hover:text-rose-900 font-bold cursor-pointer"
                        >
                          Payment Failed / Cancelled?
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* PHASE A: Initial Clean State Before User Taps Pay */
                    <div className="space-y-4">
                      {/* Dynamic UPI QR Code with Black Outline */}
                      <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-neo-sm inline-block">
                        <img
                          src={
                            order.upi?.qrCodeUrl ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                              `upi://pay?pa=${shop?.upiId || '9002761536@axl'}&pn=${encodeURIComponent(
                                shop?.name || 'PRINTX SHOP'
                              )}&am=${(order.total || priceCalculation.grandTotal).toFixed(2)}&cu=INR&tn=${order.orderNumber}`
                            )}`
                          }
                          alt="UPI Payment QR"
                          className="w-44 h-44 object-contain mx-auto"
                        />
                        <div className="pt-2 flex flex-col items-center gap-2">
                          <div className="text-[10px] text-slate-600 font-black uppercase tracking-wider">
                            Scan with Any UPI App
                          </div>
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-950 bg-purple-100 px-2 py-0.5 rounded-lg border-2 border-slate-900 shadow-neo-sm">
                              <PhonePeIcon className="w-3.5 h-3.5" />
                              <span>PhonePe</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-950 bg-blue-100 px-2 py-0.5 rounded-lg border-2 border-slate-900 shadow-neo-sm">
                              <GooglePayIcon className="w-3.5 h-3.5" />
                              <span>GPay</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-950 bg-sky-100 px-2 py-0.5 rounded-lg border-2 border-slate-900 shadow-neo-sm">
                              <PaytmIcon className="w-4 h-3.5" />
                              <span>Paytm</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-950 bg-emerald-100 px-2 py-0.5 rounded-lg border-2 border-slate-900 shadow-neo-sm">
                              <BhimUpiIcon className="w-3.5 h-3.5" />
                              <span>BHIM</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Copy Shop UPI ID */}
                      <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-50 border-2 border-slate-900 max-w-xs mx-auto shadow-neo-sm">
                        <span className="text-xs text-slate-600 font-bold">Payee UPI:</span>
                        <span className="font-mono font-black text-slate-950 text-xs truncate">
                          {shop?.upiId || '9002761536@axl'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyUpi(shop?.upiId || '9002761536@axl')}
                          className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-slate-950 font-black text-[10px] border border-slate-900 transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-neo-sm"
                        >
                          {copiedUpi ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-700 stroke-[2.5]" />
                              <span className="text-emerald-700 font-black">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 stroke-[2.2]" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Primary Call to Action: Open UPI App with Clean Link */}
                      <div className="space-y-2 pt-1">
                        <a
                          href={`upi://pay?pa=${shop?.upiId || '9002761536@axl'}&pn=${encodeURIComponent(
                            shop?.owner?.name || shop?.name || 'Sayantan Maji'
                          )}&am=${(order.total || priceCalculation.grandTotal).toFixed(2)}&cu=INR`}
                          onClick={() => {
                            setHasOpenedUpi(true);
                            setShowReturnedBanner(true);
                          }}
                          className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 border-2 border-slate-900 text-white text-xs font-black shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <BhimUpiIcon className="w-4 h-4 shrink-0 rounded-sm" />
                          <span>Pay ₹{(order.total || priceCalculation.grandTotal).toFixed(2)} with Any UPI App</span>
                        </a>

                        {/* Individual Direct App Buttons for seamless compatibility */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <a
                            href={`phonepe://pay?pa=${shop?.upiId || '9002761536@axl'}&pn=${encodeURIComponent(
                              shop?.owner?.name || shop?.name || 'Sayantan Maji'
                            )}&am=${(order.total || priceCalculation.grandTotal).toFixed(2)}&cu=INR`}
                            onClick={() => {
                              setHasOpenedUpi(true);
                              setShowReturnedBanner(true);
                            }}
                            className="py-2.5 px-2 rounded-2xl bg-purple-100 hover:bg-purple-200 border-2 border-slate-900 text-slate-950 text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 shadow-neo-sm hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 group"
                          >
                            <PhonePeIcon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                            <span>PhonePe</span>
                          </a>

                          <a
                            href={`tez://upi/pay?pa=${shop?.upiId || '9002761536@axl'}&pn=${encodeURIComponent(
                              shop?.owner?.name || shop?.name || 'Sayantan Maji'
                            )}&am=${(order.total || priceCalculation.grandTotal).toFixed(2)}&cu=INR`}
                            onClick={() => {
                              setHasOpenedUpi(true);
                              setShowReturnedBanner(true);
                            }}
                            className="py-2.5 px-2 rounded-2xl bg-blue-100 hover:bg-blue-200 border-2 border-slate-900 text-slate-950 text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 shadow-neo-sm hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 group"
                          >
                            <GooglePayIcon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                            <span>GPay</span>
                          </a>

                          <a
                            href={`paytmmp://pay?pa=${shop?.upiId || '9002761536@axl'}&pn=${encodeURIComponent(
                              shop?.owner?.name || shop?.name || 'Sayantan Maji'
                            )}&am=${(order.total || priceCalculation.grandTotal).toFixed(2)}&cu=INR`}
                            onClick={() => {
                              setHasOpenedUpi(true);
                              setShowReturnedBanner(true);
                            }}
                            className="py-2.5 px-2 rounded-2xl bg-sky-100 hover:bg-sky-200 border-2 border-slate-900 text-slate-950 text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 shadow-neo-sm hover:shadow-neo active:translate-x-0.5 active:translate-y-0.5 group"
                          >
                            <PaytmIcon className="w-5 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                            <span>Paytm</span>
                          </a>
                        </div>

                        {/* Subtle helper text link */}
                        <button
                          type="button"
                          onClick={() => setShowReturnedBanner(true)}
                          className="text-[11px] text-slate-600 hover:text-slate-950 font-bold transition-colors pt-1.5 block mx-auto underline cursor-pointer"
                        >
                          Paid from counter standee or another phone? Tap to verify
                        </button>
                      </div>
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
