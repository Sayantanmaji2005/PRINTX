'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { loginAdmin, setAuthSession } from '@/lib/api';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await loginAdmin(email, password);
      setAuthSession(data.accessToken, data.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid Super Admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-b from-blue-50/70 via-white to-slate-100 relative overflow-hidden">
      {/* Ambient Accent Orbs */}
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 border-2 border-slate-900 flex items-center justify-center shadow-neo mx-auto mb-3">
            <ShieldCheck className="w-7 h-7 text-white stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-black text-slate-950 font-outfit tracking-tight">
            PRINT<span className="text-brand-600">X</span> SUPER ADMIN
          </h1>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-0.5 rounded-full border border-slate-900 bg-amber-200 text-slate-950 text-[11px] font-bold shadow-neo-sm">
            <span>Platform Master Portal • Authorized Access</span>
          </div>
        </div>

        {/* Modern Login Card with Black Outline */}
        <div className="p-8 rounded-3xl bg-white border-2 border-slate-900 shadow-neo-lg">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border-2 border-slate-900 text-rose-950 text-xs font-bold flex items-center gap-2.5 shadow-neo-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 stroke-2" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Super Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-900">
                  <Mail className="w-4 h-4 stroke-2" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="admin@printx.io"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 shadow-neo-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-900">
                  <Lock className="w-4 h-4 stroke-2" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 shadow-neo-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs border-2 border-slate-900 shadow-neo hover:shadow-neo-hover active:translate-x-0.5 active:translate-y-0.5 active:shadow-neo-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Super Admin Dashboard'}</span>
              <ArrowRight className="w-4 h-4 stroke-2" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
