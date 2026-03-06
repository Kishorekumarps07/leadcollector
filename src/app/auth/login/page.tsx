'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, BarChart3, Users, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.post('auth/login', { email, password });
            login(response.data.token, response.data.user);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left — Branding Panel */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-16"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)' }}>

                {/* Decorative circles */}
                <div className="absolute top-[-80px] right-[-80px] w-72 h-72 bg-white/5 rounded-full" />
                <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 bg-white/5 rounded-full" />
                <div className="absolute top-1/2 left-[-40px] w-32 h-32 bg-indigo-500/20 rounded-full" />

                <div className="relative z-10 max-w-md text-center">
                    {/* Logo */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl p-4 border border-white/20"
                    >
                        <img src="/logo.png" alt="Promptix Logo" className="w-full h-full object-contain" />
                    </motion.div>

                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
                        <h1 className="text-4xl font-black text-white mb-1 tracking-tight">Promptix</h1>
                        <p className="text-indigo-200 font-bold text-lg mb-1">tech solutions</p>
                        <p className="text-indigo-300/70 text-sm mt-4 leading-relaxed max-w-xs mx-auto">
                            Field Sales Intelligence Platform — track, manage and grow your sales team's performance.
                        </p>
                    </motion.div>

                    {/* Feature pills */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}
                        className="flex flex-col gap-3 mt-12 text-left"
                    >
                        {[
                            { icon: BarChart3, text: 'Real-time sales analytics' },
                            { icon: Users, text: 'Live agent location tracking' },
                            { icon: Shield, text: 'Secure role-based access' },
                        ].map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                                <div className="w-8 h-8 bg-indigo-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Icon size={15} className="text-indigo-200" />
                                </div>
                                <span className="text-sm font-bold text-white/80">{text}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <p className="absolute bottom-6 text-xs text-indigo-400/60 font-medium">© 2026 Promptix tech solutions</p>
            </div>

            {/* Right — Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="flex items-center justify-center gap-3 mb-10 lg:hidden">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center p-2">
                            <img src="/logo.png" alt="Promptix" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 text-lg leading-none">Promptix</p>
                            <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">tech solutions</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
                        <p className="text-slate-500 mt-1.5">Sign in to your admin account</p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3.5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl font-bold"
                                >
                                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all placeholder:text-slate-400"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all placeholder:text-slate-400"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group disabled:opacity-60 mt-2"
                            >
                                {loading
                                    ? <><Loader2 className="animate-spin" size={18} /> Signing in...</>
                                    : <><span>Sign In</span><ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" /></>
                                }
                            </button>
                        </form>

                    </div>

                    <p className="mt-8 text-center text-xs text-slate-400 uppercase tracking-widest font-bold lg:hidden">
                        Promptix tech solutions © 2026
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
