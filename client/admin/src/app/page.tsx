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
} from 'lucide-react';
import { getAuthToken, clearAuthSession, apiRequest } from '@/lib/api';
import { downloadAgentZip } from '@/lib/agentBundle';

type AdminTab =
  | 'OVERVIEW'
  | 'PRINT_QUEUE'
  | 'ORDERS'
  | 'PRINTERS'
  | 'PRICING'
  | 'INVENTORY'
  | 'CUSTOMERS'
  | 'REPORTS'
  | 'SETTINGS';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');

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
  // 1. PRINT QUEUE STATE
  // ==========================================
  const [printQueue, setPrintQueue] = useState<any[]>([
    {
      id: 'PX-260924-00482',
      customer: 'Sayantan Maji',
      phone: '9002761536',
      document: 'Annual_Project_Thesis_Final.pdf',
      pages: 48,
      copies: 2,
      color: 'B&W',
      paper: 'A4 75 GSM',
      sides: 'Double-sided',
      printer: 'Canon PIXMA G3010 (USB)',
      priority: 'URGENT',
      status: 'PRINTING',
      progress: 65,
      createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    },
    {
      id: 'PX-260924-00481',
      customer: 'Rohan Sharma',
      phone: '9830129845',
      document: 'Passport_Photo_Sheet_8x.pdf',
      pages: 1,
      copies: 4,
      color: 'COLOR',
      paper: 'Glossy 200 GSM',
      sides: 'Single-sided',
      printer: 'Canon PIXMA G3010 (USB)',
      priority: 'NORMAL',
      status: 'QUEUED',
      progress: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
    {
      id: 'PX-260924-00480',
      customer: 'Priya Sen',
      phone: '9748231920',
      document: 'Legal_Property_Deed_Scan.pdf',
      pages: 14,
      copies: 1,
      color: 'B&W',
      paper: 'Legal 80 GSM',
      sides: 'Single-sided',
      printer: 'HP LaserJet Enterprise M506',
      priority: 'NORMAL',
      status: 'QUALITY_CHECK',
      progress: 100,
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'PX-260924-00479',
      customer: 'Aniket Banerjee',
      phone: '9433182901',
      document: 'Engineering_Drawing_Plan_A3.pdf',
      pages: 6,
      copies: 3,
      color: 'COLOR',
      paper: 'A3 Matte 100 GSM',
      sides: 'Single-sided',
      printer: 'Epson EcoTank L805 Series',
      priority: 'NORMAL',
      status: 'READY',
      progress: 100,
      createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    },
    {
      id: 'PX-260924-00478',
      customer: 'Debjit Roy',
      phone: '9836102934',
      document: 'Resume_Professional_Template.pdf',
      pages: 2,
      copies: 5,
      color: 'COLOR',
      paper: 'Bond 85 GSM',
      sides: 'Single-sided',
      printer: 'Canon PIXMA G3010 (USB)',
      priority: 'NORMAL',
      status: 'COLLECTED',
      progress: 100,
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
  ]);

  // ==========================================
  // 2. PRINTER HARDWARE FLEET STATE
  // ==========================================
  const [printers, setPrinters] = useState<any[]>([
    {
      id: 'PRN-01',
      name: 'Canon PIXMA G3010',
      type: 'USB InkTank Multi-Function',
      status: 'PRINTING',
      paperLevel: 82,
      tonerLevel: 68,
      paperSizes: ['A4', 'A5', 'Photo 4x6', 'Legal'],
      capabilities: ['Color', 'B&W', 'Single', 'Borderless'],
      currentJob: 'PX-260924-00482 (Annual_Project_Thesis_Final.pdf)',
      pagesPrintedToday: 214,
      totalLifetimePages: 14820,
    },
    {
      id: 'PRN-02',
      name: 'HP LaserJet Enterprise M506',
      type: 'Network High-Speed Monochrome',
      status: 'ONLINE',
      paperLevel: 94,
      tonerLevel: 85,
      paperSizes: ['A4', 'A5', 'Legal', 'Letter'],
      capabilities: ['B&W', 'Duplex', 'High-Speed 45ppm'],
      currentJob: 'Idle — Ready for queue',
      pagesPrintedToday: 418,
      totalLifetimePages: 92450,
    },
    {
      id: 'PRN-03',
      name: 'Epson EcoTank L805 Series',
      type: 'Wi-Fi 6-Color Photo & A3 Specialist',
      status: 'ONLINE',
      paperLevel: 60,
      tonerLevel: 74,
      paperSizes: ['A3', 'A4', 'Glossy', 'ID Card Tray'],
      capabilities: ['6-Color Photo', 'PVC ID Card', 'A3 Size'],
      currentJob: 'Idle — Ready for queue',
      pagesPrintedToday: 68,
      totalLifetimePages: 8430,
    },
  ]);

  // ==========================================
  // 3. SMART PRICE ENGINE STATE
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

  // ==========================================
  // 4. INVENTORY SUPPLIES STATE
  // ==========================================
  const [inventory, setInventory] = useState<any[]>([
    {
      id: 'INV-01',
      name: 'JK Copier A4 75 GSM Paper',
      category: 'Paper',
      stock: 14,
      unit: 'Reams (500 sheets/ream)',
      threshold: 5,
      purchasePrice: 220,
      supplier: 'JK Paper Mills Ltd',
      status: 'NORMAL',
    },
    {
      id: 'INV-02',
      name: 'Century Star A4 80 GSM Paper',
      category: 'Paper',
      stock: 4,
      unit: 'Reams',
      threshold: 5,
      purchasePrice: 260,
      supplier: 'Stationery Wholesale Hub',
      status: 'LOW',
    },
    {
      id: 'INV-03',
      name: 'B2B A3 75 GSM Drafting Paper',
      category: 'Paper',
      stock: 6,
      unit: 'Reams',
      threshold: 3,
      purchasePrice: 480,
      supplier: 'Stationery Wholesale Hub',
      status: 'NORMAL',
    },
    {
      id: 'INV-04',
      name: 'Kodak Glossy Photo Paper 200 GSM',
      category: 'Specialty Paper',
      stock: 8,
      unit: 'Packs (50 sheets)',
      threshold: 3,
      purchasePrice: 310,
      supplier: 'Photo World Kolkata',
      status: 'NORMAL',
    },
    {
      id: 'INV-05',
      name: 'A4 Lamination Pouches (125 Micron)',
      category: 'Lamination',
      stock: 2,
      unit: 'Packs (100 pouches)',
      threshold: 4,
      purchasePrice: 280,
      supplier: 'National Binder Co',
      status: 'CRITICAL',
    },
    {
      id: 'INV-06',
      name: 'Spiral Binding Coils (8mm & 12mm)',
      category: 'Binding',
      stock: 140,
      unit: 'Coils',
      threshold: 50,
      purchasePrice: 3.5,
      supplier: 'National Binder Co',
      status: 'NORMAL',
    },
    {
      id: 'INV-07',
      name: 'Black Ink Bottle GI-790 (Canon)',
      category: 'Ink / Toner',
      stock: 3,
      unit: 'Bottles (135ml)',
      threshold: 2,
      purchasePrice: 490,
      supplier: 'Canon Authorized Distributor',
      status: 'NORMAL',
    },
    {
      id: 'INV-08',
      name: 'HP 87A Black LaserJet Toner Cartridge',
      category: 'Ink / Toner',
      stock: 1,
      unit: 'Cartridge (9,000 pages)',
      threshold: 1,
      purchasePrice: 3800,
      supplier: 'HP Hardware Direct',
      status: 'LOW',
    },
  ]);

  // ==========================================
  // 5. CUSTOMER CRM STATE
  // ==========================================
  const [customers, setCustomers] = useState<any[]>([
    {
      id: 'CUST-01',
      name: 'Sayantan Maji',
      phone: '9002761536',
      email: 'sayantan@example.com',
      totalOrders: 18,
      totalSpend: 1840.0,
      lastOrder: 'Today, 02:40 PM',
      favoriteService: 'Document B&W Duplex',
      tier: 'VIP Gold',
    },
    {
      id: 'CUST-02',
      name: 'Rohan Sharma',
      phone: '9830129845',
      email: 'rohan.sharma@gmail.com',
      totalOrders: 9,
      totalSpend: 750.0,
      lastOrder: 'Today, 01:15 PM',
      favoriteService: 'Passport Photo Studio',
      tier: 'Regular',
    },
    {
      id: 'CUST-03',
      name: 'Priya Sen',
      phone: '9748231920',
      email: 'priya.sen@outlook.com',
      totalOrders: 14,
      totalSpend: 1420.0,
      lastOrder: 'Yesterday',
      favoriteService: 'Legal Scanning & Lamination',
      tier: 'Silver',
    },
    {
      id: 'CUST-04',
      name: 'Aniket Banerjee',
      phone: '9433182901',
      email: 'aniket.b@engineering.edu',
      totalOrders: 27,
      totalSpend: 3120.0,
      lastOrder: '2 days ago',
      favoriteService: 'A3 Color CAD Plans',
      tier: 'VIP Gold',
    },
    {
      id: 'CUST-05',
      name: 'Debjit Roy',
      phone: '9836102934',
      email: 'debjit.roy@tcs.com',
      totalOrders: 5,
      totalSpend: 380.0,
      lastOrder: '3 days ago',
      favoriteService: 'Resume Printing',
      tier: 'Regular',
    },
  ]);

  // ==========================================
  // 6. BUSINESS SETTINGS STATE
  // ==========================================
  const [shopSettings, setShopSettings] = useState({
    name: 'PRINTX SHOP',
    slug: 'printx-shop',
    tagline: 'Print anything. Pay digitally. Collect instantly.',
    address: 'Dingal 4 No Canel Road',
    phone: '9002761536',
    email: 'contact@printx.in',
    upiId: '9002761536@axl',
    openingHours: '08:30 AM - 10:00 PM',
    status: 'OPEN', // OPEN, BUSY, MAINTENANCE, CLOSED
    autoPrintOnlineOrders: true,
    notifyOnWhatsApp: true,
  });

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

  const handleSaveRates = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('printx_custom_rates', JSON.stringify(pricingRates));
    }
    setPriceSavedNotice(true);
    setTimeout(() => setPriceSavedNotice(false), 3000);
  };

  // Queue Item Actions
  const handleUpdateQueueStatus = (id: string, newStatus: string) => {
    setPrintQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const handleMoveQueueItem = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === printQueue.length - 1) return;

    const newQueue = [...printQueue];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const temp = newQueue[index];
    newQueue[index] = newQueue[targetIndex];
    newQueue[targetIndex] = temp;
    setPrintQueue(newQueue);
  };

  const handleAssignPrinter = (id: string, newPrinter: string) => {
    setPrintQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, printer: newPrinter } : item))
    );
  };

  // Inventory Stock Adjustment
  const handleAdjustStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStock = Math.max(0, item.stock + delta);
          let nextStatus = 'NORMAL';
          if (nextStock <= 2) nextStatus = 'CRITICAL';
          else if (nextStock <= item.threshold) nextStatus = 'LOW';
          return { ...item, stock: nextStock, status: nextStatus };
        }
        return item;
      })
    );
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

  const filteredShops = data?.recentShops?.filter((shop: any) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.address && shop.address.toLowerCase().includes(searchQuery.toLowerCase()));

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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-slate-900 font-sans">
      {/* Top Master Header matching reference branding */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-blue-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Visual PRINTX Logo concept matching reference */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 font-['Outfit']">
                  PRINT<span className="text-brand-600">X</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-brand-50 text-brand-700 font-bold border border-brand-200 uppercase tracking-wider">
                  SHOP OPERATING SYSTEM
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Print anything. Pay digitally. Collect instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Printer Connection Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Printer: Canon G3010</span>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Shop</span>
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

        {/* Commercial Workstation Tab Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-slate-100 py-1.5 text-xs font-semibold">
          {[
            { id: 'OVERVIEW', label: 'Overview & Telemetry', icon: Activity },
            { id: 'PRINT_QUEUE', label: 'Live Print Queue', icon: Printer, badge: printQueue.filter(q => q.status === 'PRINTING' || q.status === 'QUEUED').length },
            { id: 'ORDERS', label: 'Orders & Receipts', icon: FileText, badge: data?.recentOrders?.length },
            { id: 'PRINTERS', label: 'Printer Fleet', icon: Zap },
            { id: 'PRICING', label: 'Rates & Price Engine', icon: Tag },
            { id: 'INVENTORY', label: 'Inventory & Supplies', icon: Package, badge: inventory.filter(i => i.status !== 'NORMAL').length },
            { id: 'CUSTOMERS', label: 'Customer CRM', icon: Users },
            { id: 'REPORTS', label: 'Business Reports', icon: BarChart3 },
            { id: 'SETTINGS', label: 'Shop Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-bold'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 ? (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
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
      </header>

      {/* Main OS Workstation Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW & MASTER TELEMETRY                                        */}
        {/* ========================================================================= */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Hero Banner with Soft Visual Gradient matching prompt */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="max-w-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider backdrop-blur-sm">
                      Commercial OS v2.0
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Socket Connected
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-['Outfit']">
                    Welcome to PRINTX Shop Hub
                  </h1>
                  <p className="text-xs text-blue-100 mt-1.5 leading-relaxed">
                    Connected Xerox Shop: <strong>Dingal 4 No Canel Road</strong>. Automated print spooling, live UPI payments, cloud queue management, and printer telemetry active.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setActiveTab('PRINT_QUEUE')}
                    className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-blue-600" />
                    <span>Open Print Queue</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-2 backdrop-blur-md cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 5-Metric Master Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              <div className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold">Total Shops</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Store className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {data?.metrics?.totalShops || 1}
                </div>
                <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                  {data?.metrics?.activeShops || 1} Active Stations
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold">Customers</span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {data?.metrics?.totalCustomerSessions || 48}
                </div>
                <span className="text-[11px] text-indigo-600 font-medium mt-1 block">QR Guest Scans</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold">Pages Printed</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {data?.metrics?.totalPagesPrinted || 700}
                </div>
                <span className="text-[11px] text-amber-600 font-medium mt-1 block">Automated sheets</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold">Platform Revenue</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  ₹{(data?.metrics?.totalRevenue || 7510).toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-emerald-600 font-medium mt-1 block">UPI Settlements</span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all col-span-2 md:col-span-1">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold">Printers Online</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {data?.metrics?.activePrinters || 3}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Ready hardware</span>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveTab('PRINT_QUEUE')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 flex items-center gap-3 transition-all text-left group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Print Queue</div>
                  <div className="text-[10px] text-slate-500">Manage active jobs</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('PRICING')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 flex items-center gap-3 transition-all text-left group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Rate Config</div>
                  <div className="text-[10px] text-slate-500">Edit page prices</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('INVENTORY')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 flex items-center gap-3 transition-all text-left group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Paper Inventory</div>
                  <div className="text-[10px] text-slate-500">Check reams & ink</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('REPORTS')}
                className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 flex items-center gap-3 transition-all text-left group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Financial Reports</div>
                  <div className="text-[10px] text-slate-500">Daily revenue & charts</div>
                </div>
              </button>
            </div>

            {/* Xerox Shops Master Directory */}
            <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
                    Xerox Station & Counter QR Standee
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customers scan this counter QR standee with any smartphone camera to upload documents and print.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search shop, owner, city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-blue-100 transition-all w-48 sm:w-60"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-600" />
                  <span>Loading Xerox network data...</span>
                </div>
              ) : filteredShops && filteredShops.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                        <th className="pb-3 px-3">Xerox Station</th>
                        <th className="pb-3 px-3">Owner & Contact</th>
                        <th className="pb-3 px-3">UPI ID</th>
                        <th className="pb-3 px-3 text-center">Status</th>
                        <th className="pb-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredShops.map((shop: any) => (
                        <tr key={shop.id} className="hover:bg-blue-50/40 transition-colors group">
                          <td className="py-4 px-3">
                            <div className="font-bold text-slate-900 text-sm">{shop.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{shop.address || 'Dingal 4 No Canel Road'}</span>
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            <div className="text-slate-800 font-semibold">{shop.ownerName}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{shop.ownerPhone || 'N/A'}</span>
                            </div>
                          </td>

                          <td className="py-4 px-3">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-medium">
                              {shop.upiId || '9002761536@axl'}
                            </span>
                          </td>

                          <td className="py-4 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                shop.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  shop.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                }`}
                              />
                              {shop.status}
                            </span>
                          </td>

                          <td className="py-4 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedPrinterShop(shop)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs transition-colors cursor-pointer"
                                title="Hardware Printer Auto-Connect"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Agent Bridge</span>
                              </button>

                              <Link
                                href={`/standee?slug=${shop.slug}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs transition-colors"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Standee (Print A4)</span>
                              </Link>

                              <a
                                href={`${process.env.NEXT_PUBLIC_CUSTOMER_URL || 'https://no1printx.netlify.app'}/shop/${shop.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                                title="Open Customer Portal"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
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
        {/* TAB 2: LIVE PRINT QUEUE WORKSTATION                                       */}
        {/* ========================================================================= */}
        {activeTab === 'PRINT_QUEUE' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit'] flex items-center gap-2">
                  <span>Live Print Spooler Queue</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    AUTO-PRINT READY
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time document queue dispatched directly to connected shop USB & Wi-Fi printers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newItem = {
                      id: `PX-${Date.now().toString().slice(-6)}`,
                      customer: 'Counter Walk-in',
                      phone: '9002761536',
                      document: 'Express_Document_Print.pdf',
                      pages: 4,
                      copies: 1,
                      color: 'B&W',
                      paper: 'A4 75 GSM',
                      sides: 'Single-sided',
                      printer: 'Canon PIXMA G3010 (USB)',
                      priority: 'URGENT',
                      status: 'QUEUED',
                      progress: 0,
                      createdAt: new Date().toISOString(),
                    };
                    setPrintQueue([newItem, ...printQueue]);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Quick Counter Job</span>
                </button>
              </div>
            </div>

            {/* Queue KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Printing Now</span>
                <div className="text-2xl font-extrabold text-blue-600 mt-1">
                  {printQueue.filter((q) => q.status === 'PRINTING').length}
                </div>
                <span className="text-[10px] text-slate-400">Spooling to Canon G3010</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Waiting in Queue</span>
                <div className="text-2xl font-extrabold text-amber-600 mt-1">
                  {printQueue.filter((q) => q.status === 'QUEUED').length}
                </div>
                <span className="text-[10px] text-slate-400">Next in line</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Ready for Pickup</span>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                  {printQueue.filter((q) => q.status === 'READY').length}
                </div>
                <span className="text-[10px] text-slate-400">At counter tray</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Urgent Priority</span>
                <div className="text-2xl font-extrabold text-red-600 mt-1">
                  {printQueue.filter((q) => q.priority === 'URGENT').length}
                </div>
                <span className="text-[10px] text-slate-400">Fast-track jobs</span>
              </div>
            </div>

            {/* Print Queue Table */}
            <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                      <th className="pb-3 px-3">Order / Customer</th>
                      <th className="pb-3 px-3">Document & Specs</th>
                      <th className="pb-3 px-3">Assigned Printer</th>
                      <th className="pb-3 px-3 text-center">Priority</th>
                      <th className="pb-3 px-3 text-center">Job Status</th>
                      <th className="pb-3 px-3 text-right">Queue Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {printQueue.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-4 px-3">
                          <div className="font-bold text-slate-900 font-mono">{item.id}</div>
                          <div className="text-slate-800 font-medium text-xs mt-0.5">
                            {item.customer}
                          </div>
                          <div className="text-[10px] text-slate-400">{item.phone}</div>
                        </td>

                        <td className="py-4 px-3">
                          <div className="font-semibold text-slate-900 truncate max-w-xs">
                            {item.document}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                              {item.pages} pp × {item.copies} cp
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.color === 'COLOR'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.color}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                              {item.paper}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-3">
                          <select
                            value={item.printer}
                            onChange={(e) => handleAssignPrinter(item.id, e.target.value)}
                            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                          >
                            <option value="Canon PIXMA G3010 (USB)">Canon G3010 (USB)</option>
                            <option value="HP LaserJet Enterprise M506">HP LaserJet M506</option>
                            <option value="Epson EcoTank L805 Series">Epson L805 (A3/Photo)</option>
                          </select>
                        </td>

                        <td className="py-4 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.priority === 'URGENT'
                                ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </td>

                        <td className="py-4 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              item.status === 'PRINTING'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : item.status === 'QUEUED'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : item.status === 'READY'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {item.status === 'PRINTING' && (
                              <Printer className="w-3 h-3 animate-bounce" />
                            )}
                            {item.status === 'READY' && <CheckCircle2 className="w-3 h-3" />}
                            {item.status}
                          </span>
                        </td>

                        <td className="py-4 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reorder Buttons */}
                            <button
                              onClick={() => handleMoveQueueItem(idx, 'UP')}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                              title="Move Up in Queue"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveQueueItem(idx, 'DOWN')}
                              disabled={idx === printQueue.length - 1}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 cursor-pointer"
                              title="Move Down in Queue"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Start/Pause/Ready Controls */}
                            {item.status === 'QUEUED' && (
                              <button
                                onClick={() => handleUpdateQueueStatus(item.id, 'PRINTING')}
                                className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3 h-3" />
                                <span>Print</span>
                              </button>
                            )}

                            {item.status === 'PRINTING' && (
                              <button
                                onClick={() => handleUpdateQueueStatus(item.id, 'READY')}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                                <span>Mark Ready</span>
                              </button>
                            )}

                            {item.status === 'READY' && (
                              <button
                                onClick={() => handleUpdateQueueStatus(item.id, 'COLLECTED')}
                                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-black text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <span>Handover</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleUpdateQueueStatus(item.id, 'QUEUED')}
                              className="p-1.5 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Reprint Spool"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ORDER MANAGEMENT & DIGITAL RECEIPTS                                */}
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

              <button
                onClick={() => setSelectedPrinterShop(data?.recentShops?.[0] || { name: 'PRINTX SHOP', slug: 'printx-shop' })}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PrintX Agent (.ZIP)</span>
              </button>
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
        {/* TAB 6: INVENTORY & STOCK TRACKING                                         */}
        {/* ========================================================================= */}
        {activeTab === 'INVENTORY' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                  Shop Supplies & Paper Inventory
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track physical paper reams, toner cartridges, ink bottles, and binding materials with low-stock warnings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>2 Items Below Threshold</span>
                </span>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                      <th className="pb-3 px-3">Item & Specification</th>
                      <th className="pb-3 px-3">Category</th>
                      <th className="pb-3 px-3">Stock Level</th>
                      <th className="pb-3 px-3">Wholesale Cost</th>
                      <th className="pb-3 px-3">Supplier</th>
                      <th className="pb-3 px-3 text-center">Status</th>
                      <th className="pb-3 px-3 text-right">Adjust Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-4 px-3">
                          <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.unit}</div>
                        </td>

                        <td className="py-4 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-4 px-3">
                          <div className="font-bold text-slate-900 text-sm">
                            {item.stock} <span className="text-[10px] text-slate-500 font-normal">units</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Alert at: {item.threshold}</div>
                        </td>

                        <td className="py-4 px-3">
                          <span className="font-mono font-bold text-slate-800">
                            ₹{item.purchasePrice}
                          </span>
                        </td>

                        <td className="py-4 px-3 text-slate-600 text-xs">
                          {item.supplier}
                        </td>

                        <td className="py-4 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'NORMAL'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'LOW'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="py-4 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAdjustStock(item.id, -1)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                              title="Used 1 unit"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-slate-800">{item.stock}</span>
                            <button
                              onClick={() => handleAdjustStock(item.id, 1)}
                              className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                              title="Restocked +1 unit"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: CUSTOMER CRM DIRECTORY                                             */}
        {/* ========================================================================= */}
        {activeTab === 'CUSTOMERS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                  Customer Profiles & Loyalty CRM
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registered customer contacts, lifetime printing spend, frequency, and WhatsApp outreach.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Total Customers: </span>
                <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs">
                  {customers.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {customers.map((cust) => (
                <div
                  key={cust.id}
                  className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                          {cust.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{cust.name}</h3>
                          <span className="text-[10px] text-slate-400 font-mono">{cust.phone}</span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          cust.tier.includes('Gold')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {cust.tier}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-2xl bg-slate-50 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Orders</span>
                        <strong className="text-slate-800 text-sm">{cust.totalOrders} prints</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Lifetime Spend</span>
                        <strong className="text-emerald-600 text-sm">₹{cust.totalSpend.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div>
                        <span className="text-slate-400">Favorite: </span>
                        <span className="font-medium text-slate-800">{cust.favoriteService}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Last visit: </span>
                        <span className="font-medium text-slate-800">{cust.lastOrder}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={`https://wa.me/91${cust.phone}?text=Hello%20${encodeURIComponent(
                        cust.name
                      )},%20your%20print%20order%20from%20PRINTX%20is%20ready!`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`tel:${cust.phone}`}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Call Customer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: BUSINESS FINANCIAL REPORTS                                         */}
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
                <span className="text-xs font-semibold text-slate-500">Gross Monthly Revenue</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">₹34,850.00</div>
                <span className="text-[11px] text-emerald-600 font-medium">↑ 18.4% vs last month</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Total Paper Consumption</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">4,280 sheets</div>
                <span className="text-[11px] text-blue-600 font-medium">8.5 Reams dispatched</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Average Order Value (AOV)</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">₹68.50</div>
                <span className="text-[11px] text-purple-600 font-medium">UPI instant collected</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-blue-100 shadow-sm">
                <span className="text-xs font-semibold text-slate-500">Net Operating Margin</span>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">68.2%</div>
                <span className="text-[11px] text-slate-500">After paper & toner costs</span>
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
                      <span>Black & White Xerox & Documents</span>
                      <span className="font-mono text-slate-800">76% (3,250 pages)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-800 rounded-full" style={{ width: '76%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span>Full Color Document & Photo Prints</span>
                      <span className="font-mono text-purple-700">24% (1,030 pages)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '24%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                  Revenue Share by Service Category
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="font-medium text-slate-700">1. Document & Xerox Printing</span>
                    <span className="font-bold text-slate-900">₹18,450 (53%)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="font-medium text-slate-700">2. Spiral & Hardcover Binding</span>
                    <span className="font-bold text-slate-900">₹6,800 (20%)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="font-medium text-slate-700">3. Passport Photo Studio</span>
                    <span className="font-bold text-slate-900">₹4,200 (12%)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="font-medium text-slate-700">4. High-Res Lamination</span>
                    <span className="font-bold text-slate-900">₹3,400 (10%)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="font-medium text-slate-700">5. Scanning & Others</span>
                    <span className="font-bold text-slate-900">₹2,000 (5%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 9: SHOP SETTINGS & STAFF MANAGEMENT                                   */}
        {/* ========================================================================= */}
        {activeTab === 'SETTINGS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 font-['Outfit']">
                  Shop Profile & Role Settings
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage public storefront status, business hours, staff roles, and direct payment UPI handle.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Live Status:</span>
                <select
                  value={shopSettings.status}
                  onChange={(e) => setShopSettings({ ...shopSettings, status: e.target.value })}
                  className={`px-3 py-1 text-xs font-bold rounded-xl border ${
                    shopSettings.status === 'OPEN'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : shopSettings.status === 'BUSY'
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-red-50 text-red-700 border-red-300'
                  }`}
                >
                  <option value="OPEN">● OPEN FOR PRINTING</option>
                  <option value="BUSY">● BUSY (SLIGHT DELAY)</option>
                  <option value="CLOSED">● SHOP CLOSED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shop Profile Details */}
              <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                  Storefront Information
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Shop Business Name
                    </label>
                    <input
                      type="text"
                      value={shopSettings.name}
                      onChange={(e) => setShopSettings({ ...shopSettings, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Physical Address
                    </label>
                    <input
                      type="text"
                      value={shopSettings.address}
                      onChange={(e) => setShopSettings({ ...shopSettings, address: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={shopSettings.phone}
                        onChange={(e) => setShopSettings({ ...shopSettings, phone: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Shop UPI VPA
                      </label>
                      <input
                        type="text"
                        value={shopSettings.upiId}
                        onChange={(e) => setShopSettings({ ...shopSettings, upiId: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Daily Operating Hours
                    </label>
                    <input
                      type="text"
                      value={shopSettings.openingHours}
                      onChange={(e) => setShopSettings({ ...shopSettings, openingHours: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Staff Role-Based Permissions Matrix */}
              <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                  Staff Role-Based Permissions
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
                    <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-950 block">OWNER (Sayantan Maji)</strong>
                      <span className="text-[11px] text-blue-800">
                        Full platform authority: delete shops, alter prices, withdraw revenue, staff management.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <Users className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block">MANAGER</strong>
                      <span className="text-[11px] text-slate-500">
                        Order management, printer fleet diagnostics, business reports, inventory adjustments.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <Printer className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block">OPERATOR (Print Spooler)</strong>
                      <span className="text-[11px] text-slate-500">
                        Print Queue execution, start/pause jobs, reprint spools, hardware diagnostics.
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <Store className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block">COUNTER_STAFF</strong>
                      <span className="text-[11px] text-slate-500">
                        Handover pickup, customer queries, cash/UPI receipt generation.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

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
    </div>
  );
}
