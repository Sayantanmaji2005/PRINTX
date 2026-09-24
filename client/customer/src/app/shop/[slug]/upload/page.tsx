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
  Download,
  Share2,
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
      return { totalPages: 0, totalSheets: 0, printingCost: 0, paperCost: 0, finishingCost: 0, discount: 0, grandTotal: 0 };
    }

    // Number of physical sheets needed based on N-Up and Duplex
    const effectivePages = Math.ceil(selectedPagesCount / pagesPerSheet);
    const totalSheetsPerCopy = printSide === 'DOUBLE' ? Math.ceil(effectivePages / 2) : effectivePages;
    const totalSheets = totalSheetsPerCopy * copies;

    // Base rates
    let baseRatePerPage = 1.0;
    if (colorMode === 'COLOR') {
      baseRatePerPage = printSide === 'DOUBLE' ? 8.0 : 5.0;
    } else {
      baseRatePerPage = printSide === 'DOUBLE' ? 1.5 : 2.0;
    }
    if (paperSize === 'A3') baseRatePerPage *= 2.0;

    let printingCost = selectedPagesCount * baseRatePerPage * copies;

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
      printingCost: Math.round(printingCost * 100) / 100,
      paperCost: Math.round(paperCost * 100) / 100,
      finishingCost: Math.round(finishingCost * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      discountPercent: discountPercent * 100,
      grandTotal,
    };
  }, [pagesList, pagesPerSheet, printSide, copies, colorMode, paperSize, paperGsm, bindingOption, laminationOption]);

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
    setFile(null);
    setProcessedDoc(null);
    setError(null);
    setUploadProgress(0);
    setCurrentStep(1);
    setOrder(null);
    setIsPaid(false);
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
      });

      setOrder(newOrder);
      setCurrentStep(3);
    } catch (err: any) {
      console.error('Create order failed:', err);
      setError(err.message || 'Failed to initialize order');
    } finally {
      setCreatingOrder(false);
    }
  };

  // Step 3: Simulate UPI Payment & Auto-Print trigger
  const handleSimulatePayment = async () => {
    if (!order) return;
    try {
      setSimulatingPayment(true);
      await simulateOrderPayment(order.orderNumber);
      setIsPaid(true);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment verification failed');
    } finally {
      setSimulatingPayment(false);
    }
  };

  const activePage = pagesList[activePageIndex];

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
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Machine Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col justify-between">
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
              <div className="p-10 rounded-3xl bg-white border border-blue-100 shadow-md text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-600 mb-4 animate-pulse">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
                <h2 className="text-base font-bold text-slate-900 font-['Outfit']">Analyzing Document...</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Scanning pages, color saturation & paper dimensions
                </p>

                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-6 overflow-hidden max-w-sm">
                  <div
                    className="bg-gradient-to-r from-brand-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
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
                          className="w-9 h-12 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-[10px] font-mono font-bold text-slate-700 shadow-2xs"
                          style={{ transform: `rotate(${page.rotation}deg)` }}
                        >
                          {page.isBlank ? 'BLANK' : `P.${page.originalPageNumber}`}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-800">Page {idx + 1}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
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
                          className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-brand-600 transition-colors"
                          title="Rotate 90°"
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
                <div className="flex-1 my-4 flex items-center justify-center p-4 bg-slate-100 rounded-2xl overflow-hidden relative">
                  <div
                    className={`bg-white rounded-lg shadow-xl border border-slate-300 transition-all p-6 flex flex-col justify-between relative ${
                      colorMode === 'BW' ? 'grayscale contrast-125' : ''
                    }`}
                    style={{
                      width: orientation === 'LANDSCAPE' ? '360px' : '260px',
                      height: orientation === 'LANDSCAPE' ? '260px' : '360px',
                      transform: `scale(${zoomLevel / 100}) rotate(${activePage?.rotation || 0}deg)`,
                      transformOrigin: 'center center',
                    }}
                  >
                    {/* Simulated Document Layout Page Content */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="w-16 h-3 bg-slate-200 rounded" />
                        <span className="text-[9px] font-mono text-slate-400 font-bold">
                          PRINTX AUTO-SPOOL #{activePage?.originalPageNumber}
                        </span>
                      </div>

                      {/* N-Up Layout Grid Demonstration */}
                      {pagesPerSheet === 1 ? (
                        <div className="space-y-2 pt-2">
                          <div className="w-3/4 h-3 bg-slate-300 rounded font-bold" />
                          <div className="w-full h-2 bg-slate-200 rounded" />
                          <div className="w-full h-2 bg-slate-200 rounded" />
                          <div className="w-4/5 h-2 bg-slate-200 rounded" />
                          <div className="w-full h-16 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                            Document Content Simulation
                          </div>
                        </div>
                      ) : (
                        <div className={`grid gap-1.5 pt-2 ${pagesPerSheet === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                          {Array.from({ length: pagesPerSheet }).map((_, idx) => (
                            <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded text-[9px] text-center text-slate-500 font-mono">
                              Page #{idx + 1}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                      <span>{paperSize} • {colorMode}</span>
                      <span>Page {activePageIndex + 1}</span>
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
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Auto-Bridge</span>
                </div>

                {/* 1. Color Mode */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Color Composition</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setColorMode('BW')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        colorMode === 'BW' ? 'border-brand-600 bg-blue-50/80 font-bold' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="text-xs text-slate-900">Black & White</div>
                      <div className="text-[10px] text-slate-500 font-normal">Sharp Monochrome</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorMode('COLOR')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        colorMode === 'COLOR' ? 'border-brand-600 bg-blue-50/80 font-bold' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="text-xs text-slate-900">Full Color</div>
                      <div className="text-[10px] text-brand-600 font-normal">Rich Vibrant Ink</div>
                    </button>
                  </div>
                </div>

                {/* 2. Sides (Single vs Double / Duplex) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Sides & Duplex</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPrintSide('SINGLE')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        printSide === 'SINGLE' ? 'border-brand-600 bg-blue-50/80 font-bold' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="text-xs text-slate-900">Single Sided</div>
                      <div className="text-[10px] text-slate-500 font-normal">1 Side per Sheet</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintSide('DOUBLE')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        printSide === 'DOUBLE' ? 'border-brand-600 bg-blue-50/80 font-bold' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="text-xs text-slate-900">Double Sided</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Save 50% Paper</div>
                    </button>
                  </div>
                </div>

                {/* 3. Paper Size & Quality GSM */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Paper Dimensions</label>
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                    >
                      <option value="A4">A4 (Standard 210 × 297 mm)</option>
                      <option value="A3">A3 (Poster 297 × 420 mm)</option>
                      <option value="A5">A5 (Half Sheet 148 × 210 mm)</option>
                      <option value="LEGAL">Legal (8.5 × 14 in)</option>
                      <option value="LETTER">Letter (8.5 × 11 in)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Paper Weight (GSM)</label>
                    <select
                      value={paperGsm}
                      onChange={(e) => setPaperGsm(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                    >
                      <option value="75">75 GSM (Standard Xerox)</option>
                      <option value="80">80 GSM (Executive Bond +₹1)</option>
                      <option value="100">100 GSM (Heavyweight +₹2)</option>
                      <option value="glossy">Glossy Photo Paper (+₹10)</option>
                      <option value="matte">Matte Fine Paper (+₹8)</option>
                    </select>
                  </div>
                </div>

                {/* 4. Copies Counter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Copies Required</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCopies((c) => Math.max(1, c - 1))}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={copies}
                      onChange={(e) => setCopies(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
                      className="w-20 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900"
                    />
                    <button
                      onClick={() => setCopies((c) => Math.min(999, c + 1))}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] text-slate-500 font-medium">
                      = {priceCalculation.totalSheets} Total Printed Sheets
                    </span>
                  </div>
                </div>

                {/* 5. Finishing & Binding Addons */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Binding Finishing</label>
                    <select
                      value={bindingOption}
                      onChange={(e) => setBindingOption(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                    >
                      <option value="NONE">No Binding (Loose Sheets)</option>
                      <option value="STAPLE">Corner Staple (+₹5)</option>
                      <option value="SPIRAL">Spiral Coil (+₹40)</option>
                      <option value="COMB">Comb Binding (+₹40)</option>
                      <option value="HARDCOVER">Golden Hard Cover (+₹250)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Lamination Pouch</label>
                    <select
                      value={laminationOption}
                      onChange={(e) => setLaminationOption(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                    >
                      <option value="NONE">No Lamination</option>
                      <option value="GLOSS">Glossy Clear (+₹20/sheet)</option>
                      <option value="MATTE">Matte Velvet (+₹25/sheet)</option>
                    </select>
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
            {/* Payment Card */}
            <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-xl text-center space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {isPaid ? 'PAYMENT VERIFIED' : 'AWAITING UPI'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Total Amount to Pay</span>
                <div className="text-3xl font-black text-slate-900 font-['Outfit'] mt-1">
                  ₹{(order.total || priceCalculation.grandTotal).toFixed(2)}
                </div>
              </div>

              {!isPaid ? (
                <>
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
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      Open Any UPI App
                    </a>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={simulatingPayment}
                      className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <span>{simulatingPayment ? 'Verifying with Bank...' : 'Verify UPI Payment / Auto-Print'}</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Payment Success View */
                <div className="space-y-4 py-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
                      Payment Confirmed!
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Your document was sent to the shop printer. Prints are coming out now!
                    </p>
                  </div>

                  {/* Order Timeline */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <Check className="w-4 h-4" />
                      <span>Order Recorded (#{order.orderNumber})</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <Check className="w-4 h-4" />
                      <span>UPI Payment Verified</span>
                    </div>
                    <div className="flex items-center gap-2 text-brand-600 font-bold">
                      <Printer className="w-4 h-4 animate-pulse" />
                      <span>Spooling on Shop Hardware Printer...</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Print Receipt</span>
                    </button>

                    <button
                      onClick={() => router.push(`/shop/${slug}`)}
                      className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                    >
                      Done / Print Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
