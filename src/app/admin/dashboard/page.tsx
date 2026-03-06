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
        { label: 'Total Records', value: stats?.totalRecords ?? 0, icon: Database, color: 'indigo' },
        { label: 'Active Agents', value: stats?.activeAgents ?? 0, icon: Users, color: 'blue' },
        { label: "Today's Submissions", value: stats?.todaySubmissions ?? 0, icon: CheckCircle2, color: 'emerald' },
        { label: 'Coverage', value: '100%', icon: MapPin, color: 'orange' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCcw className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-slate-500 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-1 text-sm">Welcome back — here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStats}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all"
                        title="Refresh"
                    >
                        <RefreshCcw size={16} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                    >
                        <Download size={16} /> Export Data
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="premium-card p-6 bg-white"
                    >
                        <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon size={22} />
                            </div>
                            <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                                <TrendingUp size={12} /> Live
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Submissions */}
                <div className="lg:col-span-2 premium-card bg-white overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Recent Submissions</h3>
                        <button
                            onClick={() => router.push('/admin/explorer')}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-1"
                        >
                            View All <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {(!stats?.recentSubmissions || stats.recentSubmissions.length === 0) && (
                            <div className="p-10 text-center text-slate-400 italic text-sm">No submissions yet.</div>
                        )}
                        {stats?.recentSubmissions?.map((record: any) => (
                            <div key={record._id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm uppercase flex-shrink-0">
                                    {record.category_id?.name?.substring(0, 2) || 'RE'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900">{record.category_id?.name || 'Unknown Category'}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        by <span className="font-bold text-slate-700">{record.agent_id?.name || 'Unknown Agent'}</span>
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xs text-slate-400 flex items-center gap-1 justify-end">
                                        <Calendar size={11} />
                                        {new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <span className="flex-shrink-0 text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                    Synced
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Performers */}
                <div className="premium-card bg-white p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 rounded-xl">
                            <Trophy size={18} className="text-amber-500" />
                        </div>
                        <h3 className="font-bold text-slate-900">Top Performers</h3>
                    </div>

                    {(!stats?.topPerformers || stats.topPerformers.length === 0) ? (
                        <div className="py-10 text-center">
                            <p className="text-slate-400 text-sm">Submit data to see top agents.</p>
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
                                                <span>{medals[i] || `#${i + 1}`}</span>
                                                <p className="text-sm font-bold text-slate-900 truncate max-w-[130px]">{p.agent?.name}</p>
                                            </div>
                                            <span className="text-xs font-black text-indigo-600">{p.count} records</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ delay: i * 0.1, duration: 0.6 }}
                                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <button
                        onClick={() => router.push('/admin/agents')}
                        className="w-full mt-8 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                    >
                        Manage Agents <ArrowUpRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
