'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, History, MapPin, TrendingUp, ClipboardList, ChevronRight, CheckCircle2, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import AgentNav from '@/components/AgentNav';
import { useRouter } from 'next/navigation';

export default function AgentDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('agent/my-submissions')
            .then(res => setSubmissions(res.data.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const today = submissions.filter(s => {
        const d = new Date(s.created_at);
        const now = new Date();
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
    }).length;

    const thisWeek = submissions.filter(s => {
        const d = new Date(s.created_at);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo;
    }).length;

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const firstName = user?.name?.split(' ')[0] || 'Agent';

    return (
        <div className="max-w-md mx-auto min-h-screen flex flex-col" style={{ background: '#f8fafc' }}>
            {/* Header */}
            <div className="relative overflow-hidden px-6 pt-12 pb-8"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 60%, #6d28d9 100%)' }}>
                {/* Decorative circles */}
                <div className="absolute top-[-30px] right-[-30px] w-40 h-40 bg-white/5 rounded-full" />
                <div className="absolute bottom-[-20px] right-12 w-24 h-24 bg-white/5 rounded-full" />

                <div className="relative z-10 flex items-center justify-between mb-6">
                    <div>
                        <p className="text-indigo-300 text-sm font-medium">{greeting()},</p>
                        <h1 className="text-2xl font-black text-white mt-0.5">{firstName} 👋</h1>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-lg border border-white/20 backdrop-blur-sm">
                        {firstName.charAt(0).toUpperCase()}
                    </div>
                </div>

                {/* Stat cards inside header */}
                <div className="relative z-10 grid grid-cols-3 gap-3">
                    {[
                        { label: "Total", value: loading ? '–' : submissions.length, icon: ClipboardList },
                        { label: "Today", value: loading ? '–' : today, icon: TrendingUp },
                        { label: "This Week", value: loading ? '–' : thisWeek, icon: Calendar },
                    ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
                            <Icon size={16} className="text-indigo-300 mx-auto mb-1" />
                            <p className="text-xl font-black text-white">{value}</p>
                            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-5 space-y-5 overflow-y-auto pb-24">
                {/* Quick Actions */}
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-3">
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push('/agent/submit')}
                            className="flex flex-col items-center justify-center gap-2.5 p-5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                        >
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <LayoutGrid size={22} />
                            </div>
                            <span className="font-black text-sm">New Entry</span>
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push('/agent/history')}
                            className="flex flex-col items-center justify-center gap-2.5 p-5 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-700 active:scale-95 transition-all"
                        >
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                <History size={22} className="text-indigo-600" />
                            </div>
                            <span className="font-black text-sm">My History</span>
                        </motion.button>
                    </div>
                </div>

                {/* Recent Submissions */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Submissions</p>
                        <button onClick={() => router.push('/agent/history')} className="text-xs text-indigo-600 font-bold flex items-center gap-0.5">
                            View all <ChevronRight size={12} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-indigo-400" size={24} />
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                            <ClipboardList size={28} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-500">No submissions yet</p>
                            <p className="text-xs text-slate-400 mt-1">Start by tapping "New Entry"</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {submissions.slice(0, 4).map((record: any, i) => (
                                <motion.div
                                    key={record._id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06 }}
                                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 size={18} className="text-indigo-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 text-sm truncate">{record.category_id?.name || 'Unknown'}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {record.latitude && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold">
                                                    <MapPin size={9} /> GPS
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold flex-shrink-0">Synced</span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AgentNav />
        </div>
    );
}
