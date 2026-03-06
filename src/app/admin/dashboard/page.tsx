'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Database,
    CheckCircle2,
    TrendingUp,
    MapPin,
    Calendar,
    ChevronRight,
    ArrowUpRight,
    RefreshCcw,
    Trophy,
    LayoutGrid,
    Download
} from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get('admin/stats');
            setStats(res.data.data);
        } catch (err) {
            console.error('Failed to fetch stats', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await api.get('admin/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sales_data.csv';
            a.click();
        } catch (err) { console.error(err); }
    };

    const statCards = [
        { label: 'Total Records', value: stats?.totalRecords ?? 0, icon: Database, color: 'gold-dark' },
        { label: 'Active Agents', value: stats?.activeAgents ?? 0, icon: Users, color: 'secondary' }, /* Royal Blue */
        { label: "Today's Submissions", value: stats?.todaySubmissions ?? 0, icon: CheckCircle2, color: 'gold-dark' },
        { label: 'Coverage', value: '100%', icon: MapPin, color: 'gold-main' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCcw className="w-10 h-10 text-gold-main animate-spin" />
                    <p className="text-slate-400 font-medium italic animate-pulse">Synchronizing command data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-black leading-tight italic uppercase tracking-tight">Command Center</h1>
                    <p className="text-slate-500 mt-1 text-sm italic">Real-time operational overview and performance metrics.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={fetchStats}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-gold-dark hover:border-gold-main/30 shadow-sm transition-all"
                        title="Refresh"
                    >
                        <RefreshCcw size={16} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="btn-primary py-2.5 px-6 text-xs flex items-center justify-center gap-2 w-full sm:w-auto uppercase font-black tracking-widest"
                    >
                        <Download size={16} className="flex-shrink-0" />
                        <span>Intelligence Export</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="premium-card p-5 lg:p-6 group hover:border-gold-main/20 transition-all"
                    >
                        <div className="flex items-start justify-between">
                            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 shadow-sm transition-transform group-hover:scale-110" style={{ color: `var(--${stat.color})` }}>
                                <stat.icon size={20} className="lg:w-[22px] lg:h-[22px]" />
                            </div>
                            <span className="flex items-center gap-1 text-gold-dark text-[10px] font-black bg-gold-main/10 px-2.5 py-1 rounded-full border border-gold-main/20 uppercase tracking-widest italic animate-pulse">
                                <TrendingUp size={10} /> Live
                            </span>
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{stat.label}</p>
                            <h3 className="text-3xl font-black text-black mt-1 italic tracking-tight">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Submissions */}
                <div className="lg:col-span-2 premium-card overflow-hidden flex flex-col bg-white">
                    <div className="p-5 lg:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <Database size={18} className="text-gold-dark/40" />
                            <h3 className="font-black text-black text-xs lg:text-sm uppercase tracking-widest italic">Recent Field Reports</h3>
                        </div>
                        <button
                            onClick={() => router.push('/admin/explorer')}
                            className="text-[10px] font-black text-gold-dark hover:text-black uppercase tracking-widest flex items-center gap-2 group transition-all"
                        >
                            Open Nexus <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[480px] custom-scrollbar">
                        {(!stats?.recentSubmissions || stats.recentSubmissions.length === 0) && (
                            <div className="p-16 text-center text-slate-300 font-black uppercase tracking-[0.3em] italic text-xs">No current data telemetry.</div>
                        )}
                        {stats?.recentSubmissions?.map((record: any) => (
                            <div key={record._id} className="px-5 lg:px-6 py-4 hover:bg-slate-50 transition-all flex items-center gap-3 lg:gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-gold-dark border border-slate-200 shadow-sm flex items-center justify-center font-black text-xs uppercase italic flex-shrink-0 group-hover:border-gold-main/40 transition-colors">
                                    {record.category_id?.name?.substring(0, 2) || 'RE'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-black truncate italic tracking-tight">{record.category_id?.name || 'Unknown Category'}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 truncate uppercase tracking-widest font-bold">
                                        Operator: <span className="text-slate-800">{record.agent_id?.name || 'Unknown Asset'}</span>
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0 hidden xs:block">
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5 justify-end font-black uppercase italic">
                                        <Calendar size={10} className="text-gold-dark/40" />
                                        {new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </p>
                                    <p className="text-[9px] text-gold-dark/60 mt-0.5 font-black uppercase tabular-nums">
                                        {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                    <span className="text-[9px] font-black text-gold-dark uppercase bg-gold-main/10 px-2 py-1 rounded-full border border-gold-main/20 tracking-tighter italic">
                                        Verified
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Performers */}
                <div className="premium-card p-6 flex flex-col bg-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-gold-main/10 rounded-xl border border-gold-main/20 shadow-md shadow-gold-main/5">
                            <Trophy size={20} className="text-gold-dark" />
                        </div>
                        <div>
                            <h3 className="font-black text-black text-sm uppercase tracking-widest italic">Prime Units</h3>
                            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Global Asset Ranking</p>
                        </div>
                    </div>

                    {(!stats?.topPerformers || stats.topPerformers.length === 0) ? (
                        <div className="py-10 text-center">
                            <p className="text-gold-light/20 text-sm italic">Submit data to see top agents.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.topPerformers.map((p: any, i: number) => {
                                const maxCount = stats.topPerformers[0]?.count || 1;
                                const pct = Math.round((p.count / maxCount) * 100);
                                const medals = ['🥇', '🥈', '🥉'];
                                return (
                                    <div key={p._id} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">{medals[i] || `#${i + 1}`}</span>
                                                <p className="text-sm font-black text-black truncate max-w-[130px] italic">{p.agent?.name}</p>
                                            </div>
                                            <span className="text-xs font-black text-gold-dark lowercase tracking-tighter italic">{p.count} reports</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ delay: i * 0.1, duration: 0.6 }}
                                                className="h-full bg-gold-gradient rounded-full shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button
                        onClick={() => router.push('/admin/agents')}
                        className="w-full mt-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-100 hover:text-gold-dark transition-all flex items-center justify-center gap-2 uppercase tracking-widest italic"
                    >
                        Manage Assets <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
