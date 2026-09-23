'use client';

import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import {
  fetchShopBySlug,
  calculateOrderPrice,
  createOrder,
  simulateOrderPayment,
} from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function DocumentUploadAndPrintFlowPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  // Flow Step: 1 = Upload & Analysis, 2 = Configure & Price, 3 = Pay & Auto Print
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

  // Step 2: Print Configuration
  const [paperSize, setPaperSize] = useState('A4');
  const [colorMode, setColorMode] = useState('BW');
  const [printSide, setPrintSide] = useState('SINGLE');
  const [copies, setCopies] = useState(1);
  const [pageRangeType, setPageRangeType] = useState<'all' | 'custom'>('all');
  const [customPageRange, setCustomPageRange] = useState('');
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  // Step 3: Order & UPI Payment
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const storedSessionId = sessionStorage.getItem('printx_customer_session_id');
    if (!storedSessionId) {
      router.replace(`/shop/${slug}`);
      return;
    }
    setSessionId(storedSessionId);

    fetchShopBySlug(slug)
      .then((data) => setShop(data))
      .catch((err) => setError(err.message));
  }, [slug, router]);

  // Recalculate price whenever print options change
  useEffect(() => {
    if (!processedDoc || !shop) return;

    const calculate = async () => {
      try {
        setCalculatingPrice(true);
        const result = await calculateOrderPrice({
          shopId: shop.id,
          documentId: processedDoc.id,
          paperSize,
          colorMode,
          printSide,
          copies,
          pageRange: pageRangeType === 'all' ? 'all' : customPageRange,
        });
        setPriceBreakdown(result);
      } catch (err: any) {
        console.error('Pricing error:', err);
      } finally {
        setCalculatingPrice(false);
      }
    };

    calculate();
  }, [processedDoc, shop, paperSize, colorMode, printSide, copies, pageRangeType, customPageRange]);

  // Step 1: File selection & upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
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
      setError('Active customer session not found. Please scan the QR again.');
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
      }, 150);

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
      // Auto-set color mode if document has color pages
      if (json.data.detectedColorPages > 0) {
        setColorMode('COLOR');
      }
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Step 2 -> Step 3: Create Order & Proceed to UPI
  const handleProceedToPayment = async () => {
    if (!shop || !processedDoc || !sessionId) return;

    try {
      setCreatingOrder(true);
      setError(null);

      const newOrder = await createOrder({
        shopId: shop.id,
        customerSessionId: sessionId,
        documentId: processedDoc.id,
        paperSize,
        colorMode,
        printSide,
        copies,
        pageRange: pageRangeType === 'all' ? 'all' : customPageRange,
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50/70 via-slate-50 to-white text-slate-900 relative overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="fixed -top-32 -left-32 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-blue-100 shadow-xs">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStep === 3 && !isPaid) setCurrentStep(2);
              else if (currentStep === 2) setCurrentStep(1);
              else router.push(`/shop/${slug}`);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-brand-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <span className="text-xs font-bold text-slate-900 block">{shop?.name || 'Xerox Station'}</span>
            <span className="text-[10px] text-brand-600 block font-semibold">
              Step {currentStep} of 3: {currentStep === 1 ? 'Upload' : currentStep === 2 ? 'Options & Price' : 'UPI Payment'}
            </span>
          </div>

          <div className="w-8" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 flex flex-col justify-between relative z-10">
        <div>
          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: DOCUMENT UPLOAD & ANALYSIS ================= */}
          {currentStep === 1 && (
            <div>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                  Upload Your Document
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Supported: PDF, Images (JPG, PNG), Word (DOCX) up to 50MB
                </p>
              </div>

              {/* Upload Dropzone */}
              {!processedDoc && !uploading && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center text-center group ${
                    dragActive
                      ? 'border-brand-500 bg-blue-50 scale-[1.02]'
                      : 'border-blue-200 hover:border-brand-500 bg-white hover:bg-blue-50/40 shadow-sm hover:shadow-md'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc"
                    onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
                    className="hidden"
                  />

                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-600 mb-4 group-hover:scale-110 transition-transform shadow-xs">
                    <UploadCloud className="w-8 h-8" />
                  </div>

                  <h2 className="text-sm font-bold text-slate-900">
                    Tap to Select File or Drag & Drop
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
                    Auto-detects page count, color elements, and paper dimensions instantly.
                  </p>

                  <div className="mt-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200 shadow-xs">
                    <span>Browse Phone / PC Storage</span>
                  </div>
                </div>
              )}

              {/* Uploading Progress */}
              {uploading && (
                <div className="p-8 rounded-3xl bg-white border border-blue-100 shadow-md text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-600 mb-4 animate-pulse">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">Analyzing Document...</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Scanning pages, paper size, and color composition
                  </p>

                  <div className="w-full bg-slate-100 rounded-full h-2 mt-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Document Summary & Preview */}
              {processedDoc && (
                <div className="space-y-4">
                  <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-md shadow-blue-500/5 relative overflow-hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-600 shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="overflow-hidden">
                          <h2 className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                            {processedDoc.originalName}
                          </h2>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {(processedDoc.fileSize / (1024 * 1024)).toFixed(2)} MB • {processedDoc.mimeType.split('/')[1]?.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleReset}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Total Pages</span>
                        <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                          {processedDoc.pageCount}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                        <span className="text-[10px] text-blue-600 block font-semibold">Paper Size</span>
                        <span className="text-base font-extrabold text-blue-700 mt-0.5 block">
                          {processedDoc.detectedPaperSize}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                        <span className="text-[10px] text-indigo-600 block font-semibold">Orientation</span>
                        <span className="text-base font-extrabold text-indigo-700 mt-0.5 block capitalize">
                          {processedDoc.detectedOrientation.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Palette className="w-3.5 h-3.5 text-amber-500" />
                        <span>Color Detection:</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-semibold">
                        <span className="text-slate-700">{processedDoc.detectedBwPages} B&W</span>
                        <span>•</span>
                        <span className="text-blue-600">{processedDoc.detectedColorPages} Color</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Window */}
                  <div className="p-4 rounded-3xl bg-white border border-blue-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Eye className="w-4 h-4 text-brand-600" />
                        <span>Instant Document Preview</span>
                      </div>
                      <a
                        href={`${API_BASE_URL}/documents/file/${processedDoc.fileKey}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-brand-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>Full Screen</span>
                        <Maximize2 className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                      {processedDoc.mimeType === 'application/pdf' ? (
                        <iframe
                          src={`${API_BASE_URL}/documents/file/${processedDoc.fileKey}#toolbar=0&navpanes=0`}
                          className="w-full h-full border-0"
                          title="PDF Preview"
                        />
                      ) : (
                        <img
                          src={`${API_BASE_URL}/documents/file/${processedDoc.fileKey}`}
                          alt="Uploaded Document"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: PRINT CONFIGURATION & PRICING ================= */}
          {currentStep === 2 && processedDoc && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h1 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                  Print Options & Pricing
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Configure paper, color mode, sides, and copies
                </p>
              </div>

              {/* Color Mode Selection */}
              <div className="p-4 rounded-3xl bg-white border border-blue-100 shadow-sm">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Color Mode
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setColorMode('BW')}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      colorMode === 'BW'
                        ? 'border-brand-600 bg-blue-50/80 text-brand-700 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs block">Black & White</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">₹1.00/page</span>
                    </div>
                    {colorMode === 'BW' && <Check className="w-4 h-4 text-brand-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setColorMode('COLOR')}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      colorMode === 'COLOR'
                        ? 'border-brand-600 bg-blue-50/80 text-brand-700 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs block">Full Color</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">₹5.00/page</span>
                    </div>
                    {colorMode === 'COLOR' && <Check className="w-4 h-4 text-brand-600" />}
                  </button>
                </div>
              </div>

              {/* Print Side Selection */}
              <div className="p-4 rounded-3xl bg-white border border-blue-100 shadow-sm">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Print Sides
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPrintSide('SINGLE')}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      printSide === 'SINGLE'
                        ? 'border-brand-600 bg-blue-50/80 text-brand-700 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs block">Single Side</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">1 page per sheet</span>
                    </div>
                    {printSide === 'SINGLE' && <Check className="w-4 h-4 text-brand-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintSide('DOUBLE')}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      printSide === 'DOUBLE'
                        ? 'border-brand-600 bg-blue-50/80 text-brand-700 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-xs block">Both Side (Duplex)</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Save paper (2 pgs/sheet)</span>
                    </div>
                    {printSide === 'DOUBLE' && <Check className="w-4 h-4 text-brand-600" />}
                  </button>
                </div>
              </div>

              {/* Paper Size & Copies */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-3xl bg-white border border-blue-100 shadow-sm">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Paper Size
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-brand-500"
                  >
                    <option value="A4">A4 (Standard)</option>
                    <option value="A3">A3 (Poster)</option>
                    <option value="LETTER">Letter</option>
                    <option value="LEGAL">Legal</option>
                  </select>
                </div>

                <div className="p-4 rounded-3xl bg-white border border-blue-100 shadow-sm">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Copies
                  </label>
                  <div className="flex items-center justify-between border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setCopies((c) => Math.max(1, c - 1))}
                      className="w-7 h-7 rounded-lg bg-white shadow-xs text-slate-800 font-bold flex items-center justify-center hover:bg-blue-50"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-slate-900">{copies}</span>
                    <button
                      type="button"
                      onClick={() => setCopies((c) => Math.min(100, c + 1))}
                      className="w-7 h-7 rounded-lg bg-white shadow-xs text-slate-800 font-bold flex items-center justify-center hover:bg-blue-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Page Range */}
              <div className="p-4 rounded-3xl bg-white border border-blue-100 shadow-sm">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Page Selection
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setPageRangeType('all')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      pageRangeType === 'all'
                        ? 'bg-blue-50 text-brand-700 border border-blue-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    All Pages ({processedDoc.pageCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageRangeType('custom')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      pageRangeType === 'custom'
                        ? 'bg-blue-50 text-brand-700 border border-blue-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>

                {pageRangeType === 'custom' && (
                  <input
                    type="text"
                    placeholder="e.g. 1-5, 8, 10-12"
                    value={customPageRange}
                    onChange={(e) => setCustomPageRange(e.target.value)}
                    className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500"
                  />
                )}
              </div>

              {/* Live Pricing Breakdown Card */}
              {priceBreakdown && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                  <div className="flex items-center justify-between text-xs text-blue-100 mb-2">
                    <span>
                      {priceBreakdown.pagesToPrint} Pages × {priceBreakdown.copies} Copy = {priceBreakdown.totalSheets} Sheets
                    </span>
                    <span>@ ₹{priceBreakdown.pricePerUnit.toFixed(2)} / sheet</span>
                  </div>

                  <div className="pt-3 border-t border-white/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-blue-200 block uppercase tracking-wider font-semibold">
                        Total Amount Payable
                      </span>
                      <div className="text-3xl font-black font-['Outfit'] mt-0.5">
                        ₹{priceBreakdown.total.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-blue-100">
                      <div>UPI Payment</div>
                      <div className="font-semibold text-white">Instant Auto-Print</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 3: UPI QR & INSTANT AUTO PRINT ================= */}
          {currentStep === 3 && order && (
            <div className="space-y-4 text-center">
              {!isPaid ? (
                <div>
                  <div className="mb-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-block mb-1">
                      AWAITING UPI PAYMENT
                    </span>
                    <h1 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                      Scan UPI QR to Pay & Print
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Order: <span className="font-mono font-bold text-slate-800">{order.orderNumber}</span>
                    </p>
                  </div>

                  {/* QR Code Card */}
                  <div className="p-6 rounded-3xl bg-white border-2 border-blue-200 shadow-xl flex flex-col items-center">
                    <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-inner mb-3">
                      <img
                        src={order.upi?.qrCodeUrl}
                        alt="UPI Payment QR"
                        className="w-48 h-48 object-contain"
                      />
                    </div>

                    <div className="text-2xl font-black text-slate-900 font-['Outfit']">
                      ₹{order.total.toFixed(2)}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pay to: <span className="font-semibold text-slate-800">{order.upi?.payeeName}</span> ({order.upi?.upiId})
                    </p>

                    {/* Deep Link Button for Mobile */}
                    <a
                      href={order.upi?.intentUrl}
                      className="w-full mt-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay via GPay / PhonePe / Paytm</span>
                    </a>
                  </div>

                  {/* Payment Simulation Trigger */}
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-emerald-800 block">
                          Instant Print Verification
                        </span>
                        <span className="text-[10px] text-emerald-600 block mt-0.5">
                          Tap to confirm UPI payment & send job to shop printer
                        </span>
                      </div>
                      <button
                        onClick={handleSimulatePayment}
                        disabled={simulatingPayment}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        {simulatingPayment ? 'Verifying...' : 'Confirm Paid'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Payment Success & Live Print Queue Dispatch */
                <div className="p-6 rounded-3xl bg-white border-2 border-emerald-200 shadow-xl animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mb-2">
                    PAYMENT CONFIRMED • SENT TO PRINTER
                  </span>

                  <h2 className="text-2xl font-black text-slate-900 font-['Outfit']">
                    Printing Your Document!
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Your order <span className="font-mono font-bold text-slate-800">{order.orderNumber}</span> has been dispatched to {shop?.name}&apos;s printer tray.
                  </p>

                  <div className="my-5 p-4 rounded-2xl bg-blue-50/80 border border-blue-100 text-left text-xs text-slate-700 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Document:</span>
                      <span className="font-semibold">{processedDoc.originalName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Sheets:</span>
                      <span className="font-semibold">{order.configuration?.totalSheets} Sheets</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Paid:</span>
                      <span className="font-bold text-emerald-700">₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
                  >
                    Print Another Document
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Footer for Step Transitions */}
        <div className="mt-6 pt-4">
          {currentStep === 1 && processedDoc && (
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-blue-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Print Options ({processedDoc.pageCount} Pages)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {currentStep === 2 && priceBreakdown && (
            <button
              onClick={handleProceedToPayment}
              disabled={creatingOrder}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-blue-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{creatingOrder ? 'Creating Order...' : `Proceed to Pay UPI (₹${priceBreakdown.total.toFixed(2)})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
