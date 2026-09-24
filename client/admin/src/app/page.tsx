'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { getAuthToken, clearAuthSession, apiRequest } from '@/lib/api';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('printx_admin_cached_overview');
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

    // Live background auto-sync every 4 seconds
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

  const filteredShops = data?.recentShops?.filter((shop: any) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.address && shop.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === 'ALL' || shop.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-slate-900">
      {/* Top Master Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/85 border-b border-blue-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 font-['Outfit']">
                PRINT<span className="text-brand-600">X</span> SUPER ADMIN
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded text-[10px] bg-brand-50 text-brand-700 font-semibold border border-brand-200">
                MASTER PORTAL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Xerox Shop</span>
            </button>

            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-white hover:bg-blue-50 text-slate-600 hover:text-brand-600 transition-colors border border-slate-200 shadow-xs"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors border border-slate-200 shadow-xs"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Banner with Vibrant Blue Gradient */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-xl shadow-blue-500/15 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <span className="text-xs font-bold text-blue-100 tracking-wider uppercase mb-1 block">
              PLATFORM OWNER PORTAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Xerox Shops & QR Network Telemetry
            </h1>
            <p className="text-xs text-blue-100 mt-2 leading-relaxed">
              Add Xerox shops, generate their unique encrypted counter QR standees, and see live prints and customer usage across all shops.
            </p>
          </div>
        </div>

        {/* 5-Metric Master Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-8">
          <div className="p-5 rounded-2xl bg-white border border-blue-100/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Total Shops</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {data?.metrics?.totalShops || 0}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
              {data?.metrics?.activeShops || 0} Active Stations
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
              {data?.metrics?.totalCustomerSessions || 0}
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
              {data?.metrics?.totalPagesPrinted || 0}
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
              ₹{(data?.metrics?.totalRevenue || 0).toLocaleString('en-IN')}
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
              {data?.metrics?.activePrinters || 0}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Ready hardware</span>
          </div>
        </div>

        {/* Xerox Shops Master Directory */}
        <div className="p-6 rounded-3xl bg-white border border-blue-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
                All Xerox Shops & QR Codes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each shop has its unique encrypted QR code for customers to scan and print.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search shop, owner, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-blue-100 transition-all w-52 sm:w-64"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:bg-white focus:border-brand-500 transition-all"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
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
                          <span>{shop.address || 'Location not specified'}</span>
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
                          {shop.upiId || 'Not configured'}
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
                              shop.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {shop.status}
                        </span>
                      </td>

                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/standee/${shop.slug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs transition-colors"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Print QR Standee</span>
                          </Link>

                          <a
                            href={`http://localhost:3000/shop/${shop.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                            title="Open Customer QR Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => {
                              setShopToDelete(shop);
                              setDeleteError(null);
                            }}
                            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 transition-colors"
                            title="Delete Shop Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <Store className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No Xerox shops found matching criteria.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-semibold shadow-xs"
              >
                + Add First Xerox Shop
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add New Shop Modal */}
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
                  <span>{creating ? 'Adding Shop...' : 'Register & Create QR Standee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Shop Confirmation Modal */}
      {shopToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-red-100 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-['Outfit']">
                    Delete Xerox Shop?
                  </h3>
                  <p className="text-[11px] text-slate-500">Permanent Database Deletion</p>
                </div>
              </div>
              <button
                onClick={() => setShopToDelete(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deleteError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-4 p-4 rounded-2xl bg-red-50/50 border border-red-100 text-xs text-slate-700 space-y-2">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong className="text-red-700">{shopToDelete.name}</strong>?
              </p>
              <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
                <li>Counter Standee QR code will stop working</li>
                <li>All customer print orders and uploaded docs will be wiped</li>
                <li>Printers and settings linked to this shop will be removed</li>
              </ul>
            </div>

            <div className="pt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShopToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteShop}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting Shop...' : 'Yes, Delete Completely'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
