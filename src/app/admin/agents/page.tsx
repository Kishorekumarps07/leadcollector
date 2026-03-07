'use client';

import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, MoreVertical, Mail, Phone, Shield,
    Trash2, CheckCircle2, XCircle, Search, RefreshCcw, X,
    TrendingUp, Activity, Clock, ArrowUpRight, Ban, CheckCircle
} from 'lucide-react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { formatDate, formatTime } from '@/lib/utils';

export default function AgentManagementPage() {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAgent, setNewAgent] = useState({
        name: '', email: '', phone: '', password: '', role: 'Field Agent'
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingAgent, setEditingAgent] = useState<any>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    useEffect(() => {
        fetchAgents();
        const closeMenu = () => setActiveMenuId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await api.get('admin/agents');
            setAgents(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await api.post('auth/register', newAgent);
            setShowAddModal(false);
            setNewAgent({ name: '', email: '', phone: '', password: '', role: 'Field Agent' });
            fetchAgents();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create agent');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAgent) return;
        setSubmitting(true);
        setError('');
        try {
            await api.patch(`admin/agents/${editingAgent._id}`, editingAgent);
            setEditingAgent(null);
            fetchAgents();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update agent');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (id: string) => {
        if (!id) {
            console.error('Toggle Status failed: No ID provided');
            return;
        }
        console.log(`Toggling status for Agent ID: ${id}`);
        try {
            await api.patch(`admin/agents/${id}/status`);
            setAgents(prev => prev.map(a => a._id === id ? { ...a, is_active: !a.is_active } : a));
        } catch (err) {
            console.error('Toggle Status Error:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (deletingId === id) {
            try {
                await api.delete(`admin/agents/${id}`);
                setAgents(prev => prev.filter(a => a._id !== id));
            } catch (err) { console.error(err); }
            setDeletingId(null);
        } else {
            setDeletingId(id);
            setTimeout(() => setDeletingId(prev => prev === id ? null : prev), 3000);
        }
    };

    const filtered = agents.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
    );

    const stats = {
        total: agents.length,
        active: agents.filter(a => a.is_active).length,
        submissions: agents.reduce((acc, curr) => acc + (curr.totalSubmissions || 0), 0)
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-black italic tracking-tight uppercase">Agent Command</h1>
                    <p className="text-slate-500 mt-1 text-sm italic">Operational oversight and team deployment.</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="btn-primary py-2.5 px-6 flex items-center gap-2 uppercase tracking-widest text-xs font-black italic">
                    <UserPlus size={18} /> Register Operator
                </button>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { label: 'Total Operators', value: stats.total, icon: Users, color: 'gold' },
                    { label: 'Active Status', value: stats.active, icon: CheckCircle, color: 'gold' },
                    { label: 'Intelligence Feed', value: stats.submissions, icon: TrendingUp, color: 'gold' }
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white premium-card p-6 flex items-center gap-5 border border-slate-100 shadow-xl">
                        <div className="p-4 bg-gold-main/10 text-gold-dark rounded-2xl border border-gold-main/20 shadow-sm"><s.icon size={24} /></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic mb-1">{s.label}</p><p className="text-2xl font-black text-black leading-none italic">{s.value}</p></div>
                    </motion.div>
                ))}
            </div>

            {/* Content Card */}
            <div className="premium-card bg-white border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Filter operational team..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-black placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-gold-main/20 transition-all font-black italic uppercase shadow-sm" />
                    </div>
                    <button onClick={fetchAgents} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-gold-dark hover:border-gold-main/30 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest italic outline-none shadow-sm">
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> <span className="sm:hidden lg:inline">Refresh Sync</span>
                    </button>
                </div>

                <div className="overflow-x-auto pb-48 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-5 text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Operator Info</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic hidden sm:table-cell">Intelligence Yield</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Last Activity</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic text-center">Protocol</th>
                                <th className="px-6 py-5 text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic text-right">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-24 text-center"><RefreshCcw className="animate-spin text-gold-dark mx-auto mb-4" size={32} /><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Synchronizing tactical team...</p></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-24 text-center"><div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-gold-dark/40 border border-slate-100 shadow-sm"><Users size={32} /></div><p className="text-black font-black italic tracking-tight uppercase">No Operators Commissioned</p><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 italic">Register new field members to begin collection.</p></td></tr>
                            ) : filtered.map((agent: any, i) => (
                                <motion.tr key={agent._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-gold-main/10 flex items-center justify-center text-gold-dark font-black border border-gold-main/20 overflow-hidden shadow-sm uppercase italic">
                                                {agent.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-black italic tracking-tight uppercase">{agent.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{agent.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="px-4 py-1.5 bg-slate-50 text-gold-dark rounded-xl border border-slate-100 shadow-sm text-center min-w-[100px]">
                                                <p className="text-sm font-black italic">{agent.totalSubmissions || 0}</p>
                                                <p className="text-[7px] uppercase tracking-[0.2em] font-black opacity-40">Intelligence Units</p>
                                            </div>
                                            <Link
                                                href={`/admin/explorer?agent=${agent._id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2.5 text-slate-400 hover:text-gold-dark hover:bg-white border border-slate-100 rounded-xl transition-all cursor-pointer relative z-10 shadow-sm"
                                                title="Intel Feed"
                                            >
                                                <ArrowUpRight size={18} />
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        {agent.lastActive ? (
                                            <div className="flex flex-col">
                                                <p className="text-xs font-black text-black italic">{formatDate(agent.lastActive)}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatTime(agent.lastActive)}</p>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-200 font-black uppercase tracking-widest italic">Signal Lost</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleStatus(agent._id); }}
                                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all border cursor-pointer relative z-10 italic ${agent.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 group/status' : 'bg-red-50 text-red-600 border-red-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'}`}
                                        >
                                            {agent.is_active ? (
                                                <><CheckCircle2 size={12} /> <span className="group-hover/status:hidden">Operational</span><span className="hidden group-hover/status:inline">Disconnect</span></>
                                            ) : (
                                                <><Ban size={12} /> Offline</>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2 relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(agent._id); }}
                                                className={`p-2.5 transition-all rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer relative z-10 ${deletingId === agent._id ? 'bg-red-600 text-white px-5 shadow-lg shadow-red-200' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                                            >
                                                {deletingId === agent._id ? 'Sure?' : <Trash2 size={16} />}
                                            </button>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === agent._id ? null : agent._id); }}
                                                    className={`p-2.5 rounded-xl transition-all cursor-pointer relative z-10 border shadow-sm ${activeMenuId === agent._id ? 'bg-gold-main/10 text-gold-dark border-gold-main/20' : 'bg-white border-slate-100 text-slate-500 hover:text-black hover:border-slate-200'}`}
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                                <AnimatePresence>
                                                    {activeMenuId === agent._id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            className={`absolute right-0 ${i >= filtered.length - 2 && i > 0 ? 'bottom-full mb-2' : 'top-full mt-2'} w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden backdrop-blur-xl`}
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <div className="p-2 space-y-1">
                                                                <button
                                                                    onClick={() => { setEditingAgent(agent); setActiveMenuId(null); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black hover:bg-slate-50 rounded-xl transition-all italic text-left"
                                                                >
                                                                    <Activity size={16} className="text-gold-dark opacity-50" /> Update Profile
                                                                </button>
                                                                <button
                                                                    onClick={() => { navigator.clipboard.writeText(agent._id); setActiveMenuId(null); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black hover:bg-slate-50 rounded-xl transition-all italic text-left"
                                                                >
                                                                    <Shield size={16} className="text-gold-dark opacity-50" /> Secure Asset ID
                                                                </button>
                                                                <div className="h-px bg-slate-100 mx-2 !my-1" />
                                                                <button
                                                                    onClick={() => { toggleStatus(agent._id); setActiveMenuId(null); }}
                                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all italic text-left ${agent.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                                >
                                                                    {agent.is_active ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                                                                    {agent.is_active ? 'Purge Protocol' : 'Deploy Protocol'}
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Agent Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div><h3 className="text-xl font-black text-black italic tracking-tight uppercase">Commission Operator</h3><p className="text-[10px] text-gold-dark font-black uppercase tracking-widest mt-1 italic">Deploy new intelligence asset to field.</p></div>
                                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateAgent}>
                                <div className="p-8 space-y-6">
                                    {error && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-red-100 italic">{error}</motion.div>}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic pl-1">Full Alias</label>
                                        <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-gold-main/10 focus:border-gold-main/40 transition-all font-black text-black shadow-sm italic uppercase" placeholder="Ex: Agent Shadow" value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic pl-1">Comms Link</label>
                                            <input type="email" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-gold-main/10 focus:border-gold-main/40 transition-all font-black text-black text-sm shadow-sm italic" placeholder="email@nexus.com" value={newAgent.email} onChange={e => setNewAgent({ ...newAgent, email: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic pl-1">Secure Line</label>
                                            <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-gold-main/10 focus:border-gold-main/40 transition-all font-black text-black text-sm shadow-sm italic" placeholder="+91 00000 00000" value={newAgent.phone} onChange={e => setNewAgent({ ...newAgent, phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic pl-1">Tactical Key</label>
                                        <input type="password" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-gold-main/10 focus:border-gold-main/40 transition-all font-black text-black shadow-sm italic" placeholder="••••••••" value={newAgent.password} onChange={e => setNewAgent({ ...newAgent, password: e.target.value })} />
                                        <p className="text-[9px] text-slate-300 pl-1 italic font-black uppercase tracking-tighter mt-1">Operator can modify security protocols post-entry.</p>
                                    </div>
                                </div>
                                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:text-black transition-all uppercase tracking-widest italic font-black">Abort</button>
                                    <button type="submit" disabled={submitting} className="flex-2 btn-primary py-3.5 px-10 uppercase tracking-widest text-xs font-black italic">
                                        {submitting ? 'COMMISSIONING...' : 'Confirm Deployment'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Edit Agent Modal */}
                {editingAgent && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setEditingAgent(null)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div><h3 className="text-xl font-black text-black italic tracking-tight uppercase">Modify Operator Profile</h3><p className="text-[10px] text-gold-dark font-black uppercase tracking-widest mt-1 italic">Updating operational parameters for {editingAgent.name}</p></div>
                                <button onClick={() => setEditingAgent(null)} className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleUpdateAgent}>
                                <div className="p-8 space-y-6">
                                    {error && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-red-100 italic">{error}</motion.div>}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic pl-1">Identity Tag</label>
                                        <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-gold-main/10 focus:border-gold-main/40 transition-all font-black text-black shadow-sm italic uppercase" value={editingAgent.name} onChange={e => setEditingAgent({ ...editingAgent, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic pl-1">Nexus Email</label>
                                        <input type="email" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-gold-main/10 focus:border-gold-main/40 transition-all font-black text-black shadow-sm font-mono text-xs italic uppercase" value={editingAgent.email} onChange={e => setEditingAgent({ ...editingAgent, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic pl-1">Encrypted Phone</label>
                                        <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-gold-main/10 focus:border-gold-main/40 transition-all font-black text-black shadow-sm italic" value={editingAgent.phone} onChange={e => setEditingAgent({ ...editingAgent, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                                    <button type="button" onClick={() => setEditingAgent(null)} className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:text-black transition-all uppercase tracking-widest italic">Discard Changes</button>
                                    <button type="submit" disabled={submitting} className="flex-2 btn-primary py-3.5 px-10 uppercase tracking-widest text-xs font-black italic">
                                        {submitting ? 'RECONFIGURING...' : 'Apply Overrides'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


