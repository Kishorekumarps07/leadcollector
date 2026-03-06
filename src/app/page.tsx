'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'Admin' || user.role === 'Manager') {
        router.push('/admin/dashboard');
      } else {
        router.push('/agent/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('auth/login', { email, password });
      login(response.data.token, response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-white font-sans relative overflow-hidden">
      {/* Subtle background texture/blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-main/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-50 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Branding Section */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-white border border-gold-main/20 shadow-2xl shadow-gold-main/10 p-5 mb-8 mx-auto relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gold-gradient opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
            <img src="/logo.png" alt="Promptix Logo" className="w-full h-full object-contain relative z-10" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl font-black text-black tracking-tight uppercase italic line-clamp-1">
              Welcome <span className="gold-text">Back</span>
            </h1>
            <p className="text-slate-600 mt-2 text-sm font-black uppercase tracking-[0.2em] italic">Authorized Personnel Only</p>
          </motion.div>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white premium-card p-10 border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="p-4 text-[10px] text-red-600 bg-red-50 border border-red-100 rounded-2xl font-black uppercase tracking-widest italic flex items-center gap-3"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic pl-1">Tactical Ident</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-gold-main transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-gold-main/10 focus:border-gold-main/40 transition-all font-bold text-black text-sm italic placeholder:text-slate-500"
                  placeholder="OPERATOR@PROMPTIX.TECH"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic pl-1">Encryption Key</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-gold-main transition-colors" size={18} />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-gold-main/10 focus:border-gold-main/40 transition-all font-bold text-black text-sm italic placeholder:text-slate-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-gold-main transition-colors"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gold-main bg-gradient-to-r from-gold-dark to-gold-main text-black font-black rounded-2xl transition-all shadow-2xl shadow-gold-main/40 flex items-center justify-center gap-3 uppercase tracking-[0.2em] italic group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span className="drop-shadow-md">Establish Link</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer Credits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-[9px] text-slate-400 uppercase tracking-[0.4em] font-black italic">
            Promptix tech solutions &copy; 2026 // Secure Node 72
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
