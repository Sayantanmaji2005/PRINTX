'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  ShieldCheck,
  Store,
  Users,
  Layers,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  RefreshCw,
  LogOut,
  MapPin,
  Phone,
  Plus,
  QrCode,
  X,
  CreditCard,
  Zap,
  Trash2,
  Download,
  Terminal,
  Copy,
  Check,
  FileText,
  Clock,
  Sliders,
  BarChart3,
  Package,
  Settings,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  Share2,
  FileSpreadsheet,
  Eye,
  Tag,
  Sparkles,
  Percent,
  Shield,
  Send,
  Building,
  CheckSquare,
  Menu,
} from 'lucide-react';
import { getAuthToken, clearAuthSession, apiRequest } from '@/lib/api';
import { downloadAgentZip } from '@/lib/agentBundle';

type AdminTab =
  | 'OVERVIEW'
  | 'SHOPS'
  | 'ORDERS'
  | 'PRINTERS'
  | 'PRICING'
  | 'REPORTS';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update live clock every second for countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Overview / Telemetry State
  const [data, setData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('printx_admin_cached_overview');
        if (cached && (cached.includes('maji-xerox-station') || cached.includes('Maji Xerox'))) {
          localStorage.removeItem('printx_admin_cached_overview');
          return null;
        }
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Live Orders Filter & Search State
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState('ALL');
  const [orderDateRange, setOrderDateRange] = useState('ALL');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Selected Order for Details & Receipt Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Modal State for Adding New Shop
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newShop, setNewShop] = useState({
    name: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    address: '',
    upiId: '',
  });

  // Modal & Action State for Deleting Shop
  const [shopToDelete, setShopToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Modal State for Hardware Printer Setup
  const [selectedPrinterShop, setSelectedPrinterShop] = useState<any>(null);

  // ==========================================
  // 1. PRINTER HARDWARE FLEET STATE
  // ==========================================
  const [printers, setPrinters] = useState<any[]>([
    {
      id: 'PRN-01',
      name: 'Canon PIXMA G3010',
      type: 'USB InkTank Multi-Function',
      status: 'ONLINE',
      paperLevel: 100,
      tonerLevel: 100,
      paperSizes: ['A4', 'A5', 'Photo 4x6', 'Legal'],
      capabilities: ['Color', 'B&W', 'Single', 'Borderless'],
      currentJob: 'Idle — Ready for queue',
      pagesPrintedToday: 0,
      totalLifetimePages: 0,
    },
  ]);

  // ==========================================
  // 2. SMART PRICE ENGINE STATE
  // ==========================================
  const [pricingRates, setPricingRates] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('printx_custom_rates');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      a4_bw_single: 2.0,
      a4_bw_double: 3.0,
      a4_color_single: 8.0,
      a4_color_double: 15.0,
      a3_bw_single: 3.0,
      a3_bw_double: 5.0,
      a3_color_single: 10.0,
      a3_color_double: 18.0,
      scan_per_page: 5.0,
      lamination_a4: 20.0,
      lamination_a3: 40.0,
      lamination_id: 10.0,
      binding_staple: 5.0,
      binding_spiral: 40.0,
      binding_comb: 40.0,
      binding_hardcover: 250.0,
      photo_passport_sheet: 50.0,
      resume_print_pack: 30.0,
      bulk_discount_50: 5,
      bulk_discount_100: 10,
      bulk_discount_500: 15,
      gst_percentage: 0,
      urgent_surcharge: 20.0,
    };
  });
  const [priceSavedNotice, setPriceSavedNotice] = useState(false);

  const loadData = async (silent = false) => {
    try {
      if (!silent && !data) setLoading(true);
      const res = await apiRequest('/admin/overview');
      setData(res);
      if (typeof window !== 'undefined') {
        localStorage.setItem('printx_admin_cached_overview', JSON.stringify(res));
      }
    } catch (err: any) {
      if (err.message?.includes('Unauthorized') || err.message?.includes('jwt')) {
        clearAuthSession();
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    loadData(false);

    const interval = setInterval(() => {
      loadData(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    clearAuthSession();
    router.replace('/login');
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      await apiRequest('/admin/shops', {
        method: 'POST',
        body: JSON.stringify(newShop),
      });

      setShowAddModal(false);
      setNewShop({
        name: '',
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        address: '',
        upiId: '',
      });
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create shop');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteShop = async () => {
    if (!shopToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await apiRequest(`/admin/shops/${shopToDelete.id}`, {
        method: 'DELETE',
      });
      setShopToDelete(null);
      await loadData();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete shop');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleShopStatus = async (shopId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiRequest(`/admin/shops/${shopId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update shop status');
    }
  };

  // Subscription remaining time calculation & formatting
  const getShopSubscription = (shop: any) => {
    let expiryTime: number = 0;
    if (typeof window !== 'undefined') {
      try {
        const expMap = JSON.parse(localStorage.getItem('printx_shop_subscriptions') || '{}');
        if (expMap[shop.id]) {
          expiryTime = expMap[shop.id];
        }
      } catch {}
    }
    if (!expiryTime) {
      const base = shop.createdAt ? new Date(shop.createdAt).getTime() : Date.now();
      expiryTime = base + 30 * 24 * 60 * 60 * 1000;
    }
    const ms = expiryTime - currentTime;
    const isTimeExpired = ms <= 0;
    const isLocked = isTimeExpired || shop.status === 'SUSPENDED' || shop.status === 'INACTIVE';
    const totalDuration = 30 * 24 * 60 * 60 * 1000;
    const safeMs = Math.max(0, ms);
    const percent = Math.min(100, Math.max(0, (safeMs / totalDuration) * 100));

    const seconds = Math.floor((safeMs / 1000) % 60);
    const minutes = Math.floor((safeMs / (1000 * 60)) % 60);
    const hours = Math.floor((safeMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(safeMs / (1000 * 60 * 60 * 24));

    return {
      ms,
      safeMs,
      days,
      hours,
      minutes,
      seconds,
      percent,
      isTimeExpired,
      isLocked,
      formattedTime: isTimeExpired
        ? 'Plan Expired (0d 0h 0m 0s)'
        : `${days}d ${hours}h ${minutes}m ${seconds}s`,
    };
  };

  const handleRechargeShop = async (shopId: string) => {
    try {
      await apiRequest(`/admin/shops/${shopId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      const expMap = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('printx_shop_subscriptions') || '{}') : {};
      const currentExpiry = expMap[shopId] && expMap[shopId] > Date.now() ? expMap[shopId] : Date.now();
      expMap[shopId] = currentExpiry + 30 * 24 * 60 * 60 * 1000;
      if (typeof window !== 'undefined') {
        localStorage.setItem('printx_shop_subscriptions', JSON.stringify(expMap));
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to recharge shop');
    }
  };

  const handleSaveRates = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('printx_custom_rates', JSON.stringify(pricingRates));
    }
    setPriceSavedNotice(true);
    setTimeout(() => setPriceSavedNotice(false), 3000);
  };

  // Export Financial CSV Report
  const handleExportCSV = () => {
    const ordersList = data?.recentOrders || [];
    const headers = [
      'Order ID',
      'Document Name',
      'Shop',
      'Pages',
      'Copies',
      'Color Mode',
      'Paper Size',
      'Total (INR)',
      'Payment Status',
      'Print Status',
      'Created At',
    ];

    const rows = ordersList.map((o: any) => [
      o.orderNumber || o.id,
      `"${(o.fileName || 'Doc').replace(/"/g, '""')}"`,
      `"${(o.shopName || 'PRINTX SHOP').replace(/"/g, '""')}"`,
      o.pageCount || 1,
      o.copies || 1,
      o.colorMode || 'B&W',
      o.paperSize || 'A4',
      (o.total || 0).toFixed(2),
      o.paymentStatus || 'SUCCESS',
      o.printStatus || 'PRINTED',
      new Date(o.createdAt || Date.now()).toLocaleString('en-IN'),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: string[]) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `PRINTX_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredShops = (data?.recentShops || []).filter((shop: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return filterStatus === 'ALL' || shop.status === filterStatus;
    }
    const nameMatch = (shop.name || '').toLowerCase().includes(q);
    const slugMatch = (shop.slug || '').toLowerCase().includes(q);
    const ownerNameMatch = (shop.owner?.name || shop.ownerName || '').toLowerCase().includes(q);
    const ownerPhoneMatch = (shop.owner?.phone || shop.ownerPhone || '').toLowerCase().includes(q);
    const addressMatch = (shop.address || shop.city || '').toLowerCase().includes(q);
    const upiMatch = (shop.upiId || '').toLowerCase().includes(q);

    const matchesSearch = nameMatch || slugMatch || ownerNameMatch || ownerPhoneMatch || addressMatch || upiMatch;
    const matchesStatus = filterStatus === 'ALL' || shop.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredOrders = data?.recentOrders?.filter((order: any) => {
    const matchesSearch =
      (order.orderNumber && order.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
      (order.fileName && order.fileName.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
      (order.shopName && order.shopName.toLowerCase().includes(orderSearchQuery.toLowerCase()));

    const matchesStatus =
      orderFilterStatus === 'ALL' ||
      order.paymentStatus === orderFilterStatus ||
      order.printStatus === orderFilterStatus;

    return matchesSearch && matchesStatus;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatOrderTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const formatOrderDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return '';
    }
  };

  const handleCopyOrderId = (id: string, text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedOrderId(id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-50/70 text-slate-900 font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar - 100% Fixed & Stable */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 shadow-2xl lg:shadow-none flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-slate-900 font-['Outfit']">
                    PRINT<span className="text-brand-600">X</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-brand-50 text-brand-700 font-bold border border-brand-200 uppercase">
                    OS v2.0
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online • Shop Hub</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Workstation Navigation
            </div>
            {[
              { id: 'OVERVIEW', label: 'Overview & Telemetry', icon: Activity },
              { id: 'SHOPS', label: 'Partner Shops', icon: Store, badge: data?.recentShops?.length || data?.totalShops },
              { id: 'ORDERS', label: 'Orders & Receipts', icon: FileText, badge: data?.recentOrders?.length },
              { id: 'PRINTERS', label: 'Printer Fleet', icon: Zap },
              { id: 'PRICING', label: 'Rates & Price Engine', icon: Tag },
              { id: 'REPORTS', label: 'Business Reports', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as AdminTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                      : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Bottom Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2.5 shrink-0">
          <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
              <span>Super Admin Network</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="text-xs font-bold text-slate-800 truncate">
              {data?.recentShops?.length || data?.totalShops || 0} Xerox Shops Connected
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Central Management Hub</div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Shop</span>
            </button>
            <button
              onClick={() => loadData(false)}
              className="p-2 rounded-xl bg-white hover:bg-blue-50 text-slate-600 hover:text-brand-600 transition-colors border border-slate-200 shadow-xs cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors border border-slate-200 shadow-xs cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Right Workspace Container */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Top Header for Workspace */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              aria-label="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                {[
                  { id: 'OVERVIEW', label: 'Overview & Telemetry' },
                  { id: 'SHOPS', label: 'Partner Shops & Plan Countdowns' },
                  { id: 'ORDERS', label: 'Orders & Receipts' },
                  { id: 'PRINTERS', label: 'Printer Fleet' },
                  { id: 'PRICING', label: 'Rates & Price Engine' },
                  { id: 'REPORTS', label: 'Business Reports' },
                ].find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {data?.recentShops?.length || data?.totalShops || 0} Registered Xerox Stations • Super Admin Master Dashboard
              </p>
            </div>
          </div>
        </header>

        {/* Main OS Workstation Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & MASTER TELEMETRY                                        */}
        {/* ========================================================================= */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Super Admin Clean Hero Header Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider backdrop-blur-sm">
                      Super Admin Master Hub
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                      ₹299 / Month / Station
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Direct Shop UPI Routing Active
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-['Outfit']">
                    PRINTX Multi-Shop Network & Master Dashboard
                  </h1>
                  <p className="text-xs text-blue-100 mt-1.5 leading-relaxed">
                    Centrally managing <strong>{(data?.recentShops || []).length} Xerox shops</strong>. 100% of customer print money transfers directly to each shop owner's UPI. Platform collects ₹299/mo per active shop subscription.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>Onboard New Shop</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-2 backdrop-blur-md cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Data</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 5-Metric Clean Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              <div
                onClick={() => setActiveTab('SHOPS')}
                className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold group-hover:text-brand-600 transition-colors">Partner Shops</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Store className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {data?.recentShops?.length ?? data?.totalShops ?? 0}
                </div>
                <span className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
                  <span>View All Stations</span>
                  <span>→</span>
                </span>
              </div>

              <div
                onClick={() => setActiveTab('SHOPS')}
                className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold group-hover:text-emerald-600 transition-colors">Active Subscriptions</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {(data?.recentShops || []).filter((s: any) => s.status === 'ACTIVE').length}
                </div>
                <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Active & Unlocked</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold">Monthly SaaS MRR</span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700">
                  ₹{(((data?.recentShops || []).filter((s: any) => s.status === 'ACTIVE').length || 0) * 299).toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-indigo-600 font-medium mt-1 block">₹299/shop Recurring</span>
              </div>

              <div
                onClick={() => setActiveTab('ORDERS')}
                className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold group-hover:text-amber-600 transition-colors">Customer Print Orders</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {data?.totalOrders || data?.recentOrders?.length || 0}
                </div>
                <span className="text-[11px] text-amber-600 font-medium mt-1 block">Across All Stations</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all col-span-2 md:col-span-1">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold">Shopkeeper UPI GMV</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                  ₹{(data?.metrics?.totalRevenue !== undefined ? data?.metrics?.totalRevenue : (data?.revenueAggregation?._sum?.total || 0)).toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-emerald-600 font-medium mt-1 block">100% Direct to Shop UPI</span>
              </div>
            </div>

            {/* Quick Actions Navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveTab('SHOPS')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/50 flex items-center gap-3 transition-all text-left group cursor-pointer shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Partner Shops & Plans</div>
                  <div className="text-[10px] text-slate-500">Live countdowns & locks</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('ORDERS')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/50 flex items-center gap-3 transition-all text-left group cursor-pointer shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Orders & Invoices</div>
                  <div className="text-[10px] text-slate-500">View customer prints</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('PRINTERS')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/50 flex items-center gap-3 transition-all text-left group cursor-pointer shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Printer Fleet</div>
                  <div className="text-[10px] text-slate-500">Hardware telemetry</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('PRICING')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/50 flex items-center gap-3 transition-all text-left group cursor-pointer shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Rate Config</div>
                  <div className="text-[10px] text-slate-500">Edit page prices</div>
                </div>
              </button>
            </div>

            {/* Quick Xerox Network Summary Widget */}
            <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-brand-600">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base font-['Outfit']">
                      Connected Xerox Stations Snapshot
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Overview of live counters and real-time subscription status
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('SHOPS')}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <span>Manage All Shops & Countdowns</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data?.recentShops || []).map((shop: any) => {
                  const sub = getShopSubscription(shop);
                  return (
                    <div
                      key={shop.id}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 hover:bg-white transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{shop.name}</h4>
                            <span className="text-[11px] text-brand-600 font-mono">/{shop.slug}</span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              !sub.isLocked
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${!sub.isLocked ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {!sub.isLocked ? 'Active' : 'Locked'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 my-2 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">₹299/mo Plan:</span>
                            <span className={`font-mono font-bold ${!sub.isLocked ? 'text-emerald-700' : 'text-red-600'}`}>
                              {sub.formattedTime}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                sub.percent > 40
                                  ? 'bg-emerald-500'
                                  : sub.percent > 15
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${sub.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium truncate max-w-[130px]">
                          {shop.owner?.name || shop.ownerName || 'Owner'}
                        </span>
                        <button
                          onClick={() => setActiveTab('SHOPS')}
                          className="font-bold text-brand-600 hover:text-brand-700"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Customer Order Stream */}
            <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base font-['Outfit']">
                    Recent Customer Prints Feed
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <button
                  onClick={() => setActiveTab('ORDERS')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <span>View All Orders</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {(data?.recentOrders || []).slice(0, 5).map((order: any) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between gap-3 hover:bg-blue-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                          {order.fileName || 'Document.pdf'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{order.orderNumber}</span>
                          <span>•</span>
                          <span>{order.pageCount} pages × {order.copies}</span>
                          <span>•</span>
                          <span className="font-bold text-slate-700">{order.colorMode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-900">
                        ₹{(order.total || 0).toFixed(2)}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {order.paymentStatus || 'PAID'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: SHOPS & LIVE SUBSCRIPTION COUNTDOWNS                                 */}
        {/* ========================================================================= */}
        {activeTab === 'SHOPS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                  Partner Shops & Subscription Telemetry
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live management of all onboarded Xerox shops. Live ₹299/mo plan countdown timer with automatic anti-fraud lock when expired.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search shop, owner, phone, city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-blue-100 transition-all w-52 sm:w-64"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:bg-white focus:border-brand-500 transition-all cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active (Unlocked)</option>
                  <option value="SUSPENDED">Suspended / Locked</option>
                </select>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Onboard New Shop</span>
                </button>
              </div>
            </div>

            {/* Shop Cards Grid with Live Countdowns */}
            {loading && (!data?.recentShops || data.recentShops.length === 0) ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2 bg-white rounded-3xl border border-blue-100">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                <span>Fetching all shops and live telemetry...</span>
              </div>
            ) : filteredShops && filteredShops.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredShops.map((shop: any) => {
                  const sub = getShopSubscription(shop);
                  const ownerName = shop.owner?.name || shop.ownerName || 'Owner';
                  const ownerPhone = shop.owner?.phone || shop.ownerPhone || shop.owner?.email || 'N/A';
                  const address = shop.address || shop.city || 'Dingal 4 No Canel Road';
                  const printersCount = shop.printers?.length || 0;
                  const ordersCount = shop._count?.orders ?? 0;

                  return (
                    <div
                      key={shop.id}
                      className={`p-6 rounded-3xl bg-white border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                        !sub.isLocked ? 'border-blue-100 hover:border-brand-500' : 'border-red-200 bg-red-50/20'
                      }`}
                    >
                      <div>
                        {/* Card Top Title Row */}
                        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-slate-900 text-lg font-['Outfit']">
                                {shop.name}
                              </h3>
                              <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-blue-50 text-brand-700 font-bold border border-blue-200">
                                /{shop.slug}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{address}</span>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                              !sub.isLocked
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${!sub.isLocked ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {!sub.isLocked ? 'ACTIVE (QR LIVE)' : 'LOCKED (QR BLOCKED)'}
                          </span>
                        </div>

                        {/* Owner, Contact & UPI Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4 text-xs">
                          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              OWNER & CONTACT
                            </div>
                            <div className="font-bold text-slate-800 text-sm">{ownerName}</div>
                            <div className="flex items-center gap-2 pt-1 text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-brand-600" />
                              <span className="font-mono">{ownerPhone}</span>
                              {ownerPhone !== 'N/A' && (
                                <a
                                  href={`https://wa.me/91${ownerPhone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(ownerName)},%20regarding%20your%20PRINTX%20Xerox%20counter%20subscription...`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold ml-auto"
                                >
                                  WhatsApp →
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              DIRECT SHOP UPI ID
                            </div>
                            {shop.upiId ? (
                              <div className="font-mono font-bold text-emerald-800 text-sm break-all">
                                {shop.upiId}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No UPI Configured</span>
                            )}
                            <div className="text-[10px] text-emerald-600 font-semibold pt-1">
                              ⚡ 100% Payouts Direct to Counter
                            </div>
                          </div>
                        </div>

                        {/* LIVE SUBSCRIPTION COUNTDOWN BOX (₹299/MO PLAN) */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md relative overflow-hidden my-4">
                          <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                              <Clock className="w-4 h-4 animate-spin" />
                              <span>LIVE SUBSCRIPTION COUNTDOWN (₹299/mo)</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-white/10 text-white">
                              30-Day Cycle
                            </span>
                          </div>

                          <div className="my-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                                {sub.formattedTime}
                              </div>
                              <div className="text-[11px] text-slate-300 mt-0.5">
                                {!sub.isLocked
                                  ? '🟢 Counter QR active & receiving paid print jobs'
                                  : '🔴 Subscription expired. Customer QR is automatically locked.'}
                              </div>
                            </div>

                            <button
                              onClick={() => handleRechargeShop(shop.id)}
                              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer"
                            >
                              <Zap className="w-4 h-4 fill-white" />
                              <span>Recharge (+30 Days)</span>
                            </button>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                sub.percent > 30 ? 'bg-gradient-to-r from-emerald-400 to-teal-300' : 'bg-red-500'
                              }`}
                              style={{ width: `${sub.percent}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2">
                            <span>Auto-lock on countdown expiry</span>
                            <span>{Math.round(sub.percent)}% Remaining</span>
                          </div>
                        </div>

                        {/* Connected Fleet Summary */}
                        <div className="flex items-center justify-between text-xs text-slate-600 p-3 rounded-xl bg-slate-50 border border-slate-200/60 mb-4">
                          <span className="font-semibold text-slate-800">
                            Hardware Fleet: {printersCount} {printersCount === 1 ? 'Printer' : 'Printers'}
                          </span>
                          <span className="text-slate-500">
                            Total Orders Processed: <strong>{ordersCount}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Standee QR Link */}
                          <Link
                            href={`/standee?slug=${shop.slug}`}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs transition-colors"
                            title="View Counter Standee QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>QR Standee</span>
                          </Link>

                          {/* Customer Kiosk Link */}
                          <a
                            href={`https://printx-customer.vercel.app/shop/${shop.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
                            title="Open Customer Storefront"
                          >
                            <span>Customer Kiosk</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          {/* Hardware Agent */}
                          <button
                            onClick={() => setSelectedPrinterShop(shop)}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer"
                            title="Download Hardware Agent ZIP"
                          >
                            <Printer className="w-3.5 h-3.5 text-brand-600" />
                            <span>Agent .ZIP</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Manual Toggle Lock */}
                          <button
                            onClick={() => handleToggleShopStatus(shop.id, shop.status)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                              shop.status === 'ACTIVE'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {shop.status === 'ACTIVE' ? (
                              <>
                                <Pause className="w-3 h-3" />
                                <span>Lock QR</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                <span>Unlock QR</span>
                              </>
                            )}
                          </button>

                          {/* Delete Shop */}
                          <button
                            onClick={() => setShopToDelete(shop)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 transition-colors cursor-pointer"
                            title="Delete Shop"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Xerox Shops Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery ? `No shops match the keyword "${searchQuery}".` : 'You have not onboarded any Xerox shops yet. Click below to add your first station.'}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Onboard New Shop</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ORDER MANAGEMENT & DIGITAL RECEIPTS                                */}
        {/* ========================================================================= */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                  Order Management & Digital Receipts
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete history of customer prints, digital payment verification, and tax receipt generator.
                </p>
              </div>

              {/* Search & Date Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search order #, file, phone..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 transition-all w-48 sm:w-56"
                  />
                </div>

                <select
                  value={orderFilterStatus}
                  onChange={(e) => setOrderFilterStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:bg-white focus:border-brand-500 transition-all"
                >
                  <option value="ALL">All Status</option>
                  <option value="SUCCESS">Paid (Success)</option>
                  <option value="PENDING">Pending</option>
                  <option value="PRINTED">Printed Out</option>
                </select>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm overflow-hidden">
              {filteredOrders && filteredOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                        <th className="pb-3 px-3">Order ID</th>
                        <th className="pb-3 px-3">Document Details</th>
                        <th className="pb-3 px-3">Xerox Shop</th>
                        <th className="pb-3 px-3">Amount</th>
                        <th className="pb-3 px-3 text-center">Payment Status</th>
                        <th className="pb-3 px-3 text-center">Print Status</th>
                        <th className="pb-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {order.orderNumber}
                              </span>
                              <button
                                onClick={() => handleCopyOrderId(order.id, order.orderNumber)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                title="Copy Order ID"
                              >
                                {copiedOrderId === order.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {formatOrderDate(order.createdAt)} • {formatOrderTime(order.createdAt)}
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            <div className="font-semibold text-slate-900 text-xs truncate max-w-xs" title={order.fileName}>
                              {order.fileName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-slate-500 font-medium">
                                {order.pageCount} pages × {order.copies} {order.copies === 1 ? 'copy' : 'copies'}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${order.colorMode === 'COLOR' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                {order.colorMode}
                              </span>
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {order.paperSize}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            <div className="font-semibold text-slate-800 text-xs">
                              {order.shopName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              /{order.shopSlug}
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            <div className="font-bold text-slate-900 text-sm">
                              ₹{(order.total || 0).toFixed(2)}
                            </div>
                            <span className="text-[10px] text-emerald-600 font-semibold">UPI Direct</span>
                          </td>

                          <td className="py-4 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                order.paymentStatus === 'SUCCESS'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              {order.paymentStatus}
                            </span>
                          </td>

                          <td className="py-4 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                order.printStatus === 'PRINTED'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              <Printer className="w-3 h-3" />
                              {order.printStatus}
                            </span>
                          </td>

                          <td className="py-4 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowReceiptModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Receipt</span>
                              </button>

                              {order.fileUrl && (
                                <a
                                  href={order.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                                  title="Download File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No customer print orders found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PRINTER FLEET HARDWARE MANAGER                                     */}
        {/* ========================================================================= */}
        {activeTab === 'PRINTERS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                  Printer Fleet & Hardware Diagnostics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time status of shop printers, toner/ink telemetry, paper tray sensors, and PrintX Agent bridge.
                </p>
              </div>
            </div>

            {/* Hardware Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {printers.map((prn) => (
                <div
                  key={prn.id}
                  className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          <Printer className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{prn.name}</h3>
                          <span className="text-[10px] text-slate-400">{prn.type}</span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          prn.status === 'ONLINE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : prn.status === 'PRINTING'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {prn.status}
                      </span>
                    </div>

                    {/* Gauges for Paper and Toner */}
                    <div className="space-y-3 my-4 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60">
                      <div>
                        <div className="flex items-center justify-between text-xs font-medium mb-1">
                          <span className="text-slate-600 text-[11px]">Paper Tray Capacity</span>
                          <span className="font-bold text-slate-900 text-[11px]">{prn.paperLevel}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              prn.paperLevel > 30 ? 'bg-blue-600' : 'bg-red-500'
                            }`}
                            style={{ width: `${prn.paperLevel}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs font-medium mb-1">
                          <span className="text-slate-600 text-[11px]">Toner / Ink Remaining</span>
                          <span className="font-bold text-slate-900 text-[11px]">{prn.tonerLevel}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              prn.tonerLevel > 20 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${prn.tonerLevel}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Capabilities Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {prn.capabilities.map((cap: string) => (
                        <span
                          key={cap}
                          className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-[10px] border border-blue-100"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>

                    {/* Current Spool */}
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="font-bold text-slate-800">Spool: </span>
                      <span className="truncate">{prn.currentJob}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Today: <strong>{prn.pagesPrintedToday} pp</strong></span>
                    <span>Total: <strong>{prn.totalLifetimePages.toLocaleString()} pp</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Architecture Explainer Card */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
                    <Terminal className="w-4 h-4" />
                    <span>PrintX Universal Hardware Agent</span>
                  </div>
                  <h3 className="text-lg font-bold font-['Outfit']">
                    Autonomous Print Spooler for Counter PCs
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Runs natively on Windows 10/11 using PowerShell 5.1+ or Node.js. No third-party drivers or printer software required. Automatically listens to customer UPI payments and fires physical prints.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedPrinterShop(data?.recentShops?.[0] || { name: 'PRINTX SHOP', slug: 'printx-shop' })}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Setup Shop PC</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SMART PRICE ENGINE CONFIGURATION                                    */}
        {/* ========================================================================= */}
        {activeTab === 'PRICING' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <span>Smart Price & Rate Engine</span>
                  {priceSavedNotice && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      SAVED LIVE
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure live per-page rates, bulk discounts, lamination, and binding prices. Updates calculate live in customer editor.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveRates}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Rates & Publish</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Category 1: A4 Document Printing */}
              <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    A4
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">A4 Standard Printing</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      A4 Black & White (Single-sided)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="0.5"
                        value={pricingRates.a4_bw_single}
                        onChange={(e) => setPricingRates({ ...pricingRates, a4_bw_single: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      A4 Black & White (Double-sided / Back-to-Back)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="0.5"
                        value={pricingRates.a4_bw_double}
                        onChange={(e) => setPricingRates({ ...pricingRates, a4_bw_double: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      A4 Full Color (Single-sided)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="0.5"
                        value={pricingRates.a4_color_single}
                        onChange={(e) => setPricingRates({ ...pricingRates, a4_color_single: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      A4 Full Color (Double-sided)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="0.5"
                        value={pricingRates.a4_color_double}
                        onChange={(e) => setPricingRates({ ...pricingRates, a4_color_double: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category 2: A3 Printing & Scanning */}
              <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                    A3
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">A3 Drawing & Scanning</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      A3 B&W Single Page
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="0.5"
                        value={pricingRates.a3_bw_single}
                        onChange={(e) => setPricingRates({ ...pricingRates, a3_bw_single: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      A3 Full Color Page
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="0.5"
                        value={pricingRates.a3_color_single}
                        onChange={(e) => setPricingRates({ ...pricingRates, a3_color_single: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Document High-Res Scanning (Per Page)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="0.5"
                        value={pricingRates.scan_per_page}
                        onChange={(e) => setPricingRates({ ...pricingRates, scan_per_page: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Passport Photo Sheet (8 Photos)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="1"
                        value={pricingRates.photo_passport_sheet}
                        onChange={(e) => setPricingRates({ ...pricingRates, photo_passport_sheet: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category 3: Finishing (Binding & Lamination) */}
              <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Binding & Lamination</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Spiral Binding (with PVC Cover)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="1"
                        value={pricingRates.binding_spiral}
                        onChange={(e) => setPricingRates({ ...pricingRates, binding_spiral: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Hardcover Thesis Binding
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="5"
                        value={pricingRates.binding_hardcover}
                        onChange={(e) => setPricingRates({ ...pricingRates, binding_hardcover: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      A4 Gloss Lamination (Per Sheet)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="1"
                        value={pricingRates.lamination_a4}
                        onChange={(e) => setPricingRates({ ...pricingRates, lamination_a4: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      ID Card / Aadhaar Lamination
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="1"
                        value={pricingRates.lamination_id}
                        onChange={(e) => setPricingRates({ ...pricingRates, lamination_id: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Bulk Discounts Card */}
            <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                  Automated Volume Bulk Discounts
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Applied automatically in customer cart when page thresholds are reached.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-800">50+ Pages Order</div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={pricingRates.bulk_discount_50}
                      onChange={(e) => setPricingRates({ ...pricingRates, bulk_discount_50: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                    />
                    <span className="text-xs font-bold text-slate-600">% Discount</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-800">100+ Pages Order</div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={pricingRates.bulk_discount_100}
                      onChange={(e) => setPricingRates({ ...pricingRates, bulk_discount_100: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                    />
                    <span className="text-xs font-bold text-slate-600">% Discount</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-800">500+ Pages (Bulk / Books)</div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={pricingRates.bulk_discount_500}
                      onChange={(e) => setPricingRates({ ...pricingRates, bulk_discount_500: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                    />
                    <span className="text-xs font-bold text-slate-600">% Discount</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: BUSINESS FINANCIAL REPORTS                                         */}
        {/* ========================================================================= */}
        {activeTab === 'REPORTS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                  Business Reports & Financial Analytics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated revenue reporting, B&W vs Color ratios, service breakdowns, and CSV exports for accounting.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Full CSV</span>
                </button>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Gross Platform Revenue</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  ₹{(data?.metrics?.totalRevenue !== undefined ? data?.metrics?.totalRevenue : (data?.revenueAggregation?._sum?.total || 0)).toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-emerald-600 font-medium">100% Instant UPI Settled</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Total Paper Consumption</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  {(data?.metrics?.totalPagesPrinted || (data?.recentOrders || []).reduce((acc: number, o: any) => acc + ((o.document?.pageCount || 1) * (o.configuration?.copies || 1)), 0))} sheets
                </div>
                <span className="text-[11px] text-blue-600 font-medium">
                  {(((data?.metrics?.totalPagesPrinted || 0) / 500)).toFixed(1)} Reams utilized
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Average Order Value (AOV)</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  ₹{(data?.recentOrders?.length ? ((data?.metrics?.totalRevenue || data?.revenueAggregation?._sum?.total || 0) / data?.recentOrders?.length).toFixed(2) : '0.00')}
                </div>
                <span className="text-[11px] text-purple-600 font-medium">Per customer checkout</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Total Live Orders</span>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                  {data?.totalOrders || data?.recentOrders?.length || 0}
                </div>
                <span className="text-[11px] text-slate-500">Completed & In-flight</span>
              </div>
            </div>

            {/* Service Revenue Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                  B&W vs Color Print Volume Share
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span>Black & White Documents</span>
                      <span className="font-mono text-slate-800">
                        {(data?.recentOrders || []).filter((o: any) => o.configuration?.colorMode !== 'COLOR').length} Orders
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-800 rounded-full transition-all"
                        style={{
                          width: `${(data?.recentOrders?.length ? ((data?.recentOrders.filter((o: any) => o.configuration?.colorMode !== 'COLOR').length / data?.recentOrders.length) * 100) : 0)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span>Full Color Prints & Photos</span>
                      <span className="font-mono text-purple-700">
                        {(data?.recentOrders || []).filter((o: any) => o.configuration?.colorMode === 'COLOR').length} Orders
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                        style={{
                          width: `${(data?.recentOrders?.length ? ((data?.recentOrders.filter((o: any) => o.configuration?.colorMode === 'COLOR').length / data?.recentOrders.length) * 100) : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                  Orders by Service Type
                </h3>

                <div className="space-y-2 text-xs">
                  {data?.recentOrders && data.recentOrders.length > 0 ? (
                    data.recentOrders.slice(0, 5).map((ord: any) => (
                      <div key={ord.id} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="font-medium text-slate-700 truncate max-w-[200px]">
                          {ord.document?.originalName || 'Print Document'}
                        </span>
                        <span className="font-bold text-slate-900 font-mono">₹{ord.total}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      No order transactions yet. Real service metrics will appear here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>

      {/* ========================================================================= */}
      {/* DIGITAL RECEIPT MODAL                                                     */}
      {/* ========================================================================= */}
      {showReceiptModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Digital Tax Invoice
              </span>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Card Body */}
            <div id="printable-receipt" className="py-4 space-y-4 text-slate-900">
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-2 font-bold shadow-md shadow-blue-500/20">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg font-['Outfit'] tracking-tight">PRINTX SHOP</h3>
                <p className="text-[11px] text-slate-500">{selectedOrder.shopAddress || 'Dingal 4 No Canel Road'}</p>
                <p className="text-[10px] text-slate-400">Phone: +91 9002761536 • GSTIN: Unregistered</p>
              </div>

              {/* Order Meta */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block">Order Number</span>
                  <strong className="font-mono text-slate-900 text-xs">{selectedOrder.orderNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Date & Time</span>
                  <strong className="text-slate-900">{new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Payment Mode</span>
                  <strong className="text-emerald-700">UPI Instant (Verified)</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Status</span>
                  <strong className="text-blue-700">COMPLETED</strong>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-[11px] text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
                  <span>Description</span>
                  <span>Amount</span>
                </div>

                <div className="flex items-start justify-between py-1 border-b border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900">{selectedOrder.fileName}</div>
                    <div className="text-[10px] text-slate-500">
                      {selectedOrder.pageCount} pages × {selectedOrder.copies} copy ({selectedOrder.colorMode}, {selectedOrder.paperSize})
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">₹{(selectedOrder.total || 0).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Subtotal</span>
                  <span>₹{(selectedOrder.total || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Taxes (GST 0%)</span>
                  <span>₹0.00</span>
                </div>

                <div className="flex items-center justify-between text-base font-extrabold text-slate-900 pt-2 border-t-2 border-slate-900">
                  <span>Total Paid</span>
                  <span>₹{(selectedOrder.total || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-3 text-[11px] text-slate-400 border-t border-dashed border-slate-200">
                <p className="font-semibold text-slate-600">Thank you for printing with PRINTX!</p>
                <p className="text-[10px] mt-0.5">Collect prints instantly at counter.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HARDWARE PRINTER AUTO-BRIDGE MODAL                                        */}
      {/* ========================================================================= */}
      {selectedPrinterShop && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-indigo-100 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-['Outfit'] flex items-center gap-2">
                    <span>Physical Printer Auto-Bridge</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {selectedPrinterShop.slug}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Connect {selectedPrinterShop.name}&apos;s local USB / Wi-Fi printer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrinterShop(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hardware Status Banner */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-950">
                  Zero Driver Hassle — Fully Automated
                </h4>
                <p className="text-[11px] text-blue-800/80 mt-0.5 leading-relaxed">
                  The PrintX Agent auto-detects any USB or Wi-Fi printer connected to the shop PC (Canon, HP, Epson, Brother, TVS) and automatically executes print jobs when customer payment is verified.
                </p>
              </div>
            </div>

            {/* 3-Step Setup Instructions */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                3-Step Setup for Shop Computer
              </h4>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">Shop PC Connection</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Ensure the physical printer is connected to the shop computer via USB cable or Wi-Fi.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">Run Desktop Agent</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Open the <code className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px] text-slate-800">PRINTX/agent</code> folder on the shop PC and double-click <code className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px] text-slate-800">start-agent.bat</code>.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-emerald-950">Ready to Print!</div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Customers scan the shop standee QR, upload PDFs, pay on phone, and prints immediately come out of your printer silently.
                  </div>
                </div>
              </div>
            </div>

            {/* 1-Click Download Connector Package ZIP */}
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-3 shadow-lg border border-indigo-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 font-['Outfit']">
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Download Ready-To-Run Agent Package</span>
                  </div>
                  <div className="text-[11px] text-indigo-200/80 mt-0.5">
                    Includes pre-configured <code className="text-indigo-300">start-agent.bat</code> and <code className="text-indigo-300">config.json</code> for {selectedPrinterShop.name}.
                  </div>
                </div>

                <button
                  onClick={() => downloadAgentZip(selectedPrinterShop)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Agent (.ZIP)</span>
                </button>
              </div>
            </div>

            <div className="pt-5 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedPrinterShop(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD NEW SHOP MODAL                                                        */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-blue-100 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-brand-600">
                  <Store className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base font-['Outfit']">
                  Add New Xerox Shop
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateShop} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter shop name"
                  value={newShop.name}
                  onChange={(e) => setNewShop({ ...newShop, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter owner full name"
                    value={newShop.ownerName}
                    onChange={(e) => setNewShop({ ...newShop, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    value={newShop.ownerPhone}
                    onChange={(e) => setNewShop({ ...newShop, ownerPhone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={newShop.ownerEmail}
                    onChange={(e) => setNewShop({ ...newShop, ownerEmail: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shop UPI ID (For Direct Payments)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter UPI ID (e.g. yourname@upi)"
                    value={newShop.upiId}
                    onChange={(e) => setNewShop({ ...newShop, upiId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop Physical Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter complete shop address"
                  value={newShop.address}
                  onChange={(e) => setNewShop({ ...newShop, address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>{creating ? 'Adding Shop...' : 'Register & Create Standee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE SHOP CONFIRMATION MODAL                                            */}
      {/* ========================================================================= */}
      {shopToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-red-100 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base font-['Outfit']">
                  Delete Xerox Shop
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete this shop?
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 mb-4">
              <div><strong>Shop:</strong> {shopToDelete.name}</div>
              <div><strong>Slug:</strong> /{shopToDelete.slug}</div>
              <div><strong>Owner:</strong> {shopToDelete.owner?.name || shopToDelete.ownerName || 'N/A'}</div>
            </div>

            <p className="text-[11px] text-red-500 font-medium mb-4">
              ⚠️ This action is permanent and will remove this shop, its standee QR code, and associated printer connections.
            </p>

            {deleteError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShopToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteShop}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
