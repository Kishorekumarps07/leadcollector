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
                    <h1 className="text-3xl font-bold text-slate-900">Agent Management</h1>
                    <p className="text-slate-500 mt-1 text-sm">Monitor performance and manage permissions of your field team.</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="btn-primary py-2.5 px-5 flex items-center gap-2">
                    <UserPlus size={18} /> Register New Agent
                </button>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {[
                    { label: 'Total Agents', value: stats.total, icon: Users, color: 'indigo' },
                    { label: 'Active Agents', value: stats.active, icon: CheckCircle, color: 'emerald' },
                    { label: 'Total Submissions', value: stats.submissions, icon: TrendingUp, color: 'blue' }
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className={`p-3 lg:p-4 bg-${s.color}-50 text-${s.color}-600 rounded-2xl`}><s.icon size={20} className="lg:w-[24px] lg:h-[24px]" /></div>
                        <div><p className="text-[10px] lg:text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</p><p className="text-xl lg:text-2xl font-black text-slate-900 leading-none">{s.value}</p></div>
                    </motion.div>
                ))}
            </div>

            {/* Content Card */}
            <div className="premium-card bg-white shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="Search team..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-300 transition-all" />
                    </div>
                    <button onClick={fetchAgents} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 text-sm font-bold">
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> <span className="sm:hidden lg:inline">Refresh</span>
                    </button>
                </div>

                <div className="overflow-x-auto pb-48 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agent Info</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Performance</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activity</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-24 text-center"><RefreshCcw className="animate-spin text-indigo-600 mx-auto mb-4" size={24} /><p className="text-slate-400 text-sm italic">Loading team data...</p></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-24 text-center"><div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><Users size={32} /></div><p className="text-slate-500 font-bold">No agents found</p><p className="text-slate-400 text-sm">Try reaching out to your field team or register a new one.</p></td></tr>
                            ) : filtered.map((agent: any, i) => (
                                <motion.tr key={agent._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100 overflow-hidden shadow-sm">
                                                {agent.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{agent.name}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{agent.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                                                <p className="text-xs font-black">{agent.totalSubmissions || 0}</p>
                                                <p className="text-[8px] uppercase tracking-wider font-bold opacity-70">Submissions</p>
                                            </div>
                                            <Link
                                                href={`/admin/explorer?agent=${agent._id}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all shadow-none hover:shadow-sm cursor-pointer relative z-10"
                                                title="View Records"
                                            >
                                                <ArrowUpRight size={18} />
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        {agent.lastActive ? (
                                            <div className="flex flex-col">
                                                <p className="text-xs font-bold text-slate-700">{new Date(agent.lastActive).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(agent.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-300 italic">Never active</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleStatus(agent._id); }}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer relative z-10 ${agent.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-red-50 hover:text-red-500 hover:border-red-100 group/status' : 'bg-red-50 text-red-600 border-red-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'}`}
                                        >
                                            {agent.is_active ? (
                                                <><CheckCircle2 size={12} /> <span className="group-hover/status:hidden">Active</span><span className="hidden group-hover/status:inline">Disable</span></>
                                            ) : (
                                                <><Ban size={12} /> Inactive</>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(agent._id); }}
                                                className={`p-2 transition-all rounded-xl font-bold text-xs cursor-pointer relative z-10 ${deletingId === agent._id ? 'bg-red-600 text-white px-4' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                                            >
                                                {deletingId === agent._id ? 'Confirm?' : <Trash2 size={16} />}
                                            </button>
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === agent._id ? null : agent._id); }}
                                                    className={`p-2 rounded-xl transition-all cursor-pointer relative z-10 ${activeMenuId === agent._id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                <AnimatePresence>
                                                    {activeMenuId === agent._id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            className={`absolute right-0 ${i >= filtered.length - 2 && i > 0 ? 'bottom-full mb-2' : 'top-full mt-2'} w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden`}
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <div className="p-2 space-y-1">
                                                                <button
                                                                    onClick={() => { setEditingAgent(agent); setActiveMenuId(null); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                                                                >
                                                                    <Activity size={16} className="text-slate-400" /> Edit Profile
                                                                </button>
                                                                <button
                                                                    onClick={() => { navigator.clipboard.writeText(agent._id); setActiveMenuId(null); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                                                                >
                                                                    <Shield size={16} className="text-slate-400" /> Copy Agent ID
                                                                </button>
                                                                <div className="h-px bg-slate-100 mx-2 !my-1" />
                                                                <button
                                                                    onClick={() => { toggleStatus(agent._id); setActiveMenuId(null); }}
                                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${agent.is_active ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                                >
                                                                    {agent.is_active ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                                                                    {agent.is_active ? 'Deactivate' : 'Activate'}
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div><h3 className="text-xl font-black text-slate-900">Register New Agent</h3><p className="text-xs text-slate-400">Create login credentials for your field team.</p></div>
                                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateAgent}>
                                <div className="p-8 space-y-5">
                                    {error && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100">{error}</motion.div>}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                                        <input type="text" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all font-medium" placeholder="Ex: Rahul Sharma" value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Email</label>
                                            <input type="email" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all font-medium text-sm" placeholder="john@company.com" value={newAgent.email} onChange={e => setNewAgent({ ...newAgent, email: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Phone</label>
                                            <input type="text" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all font-medium text-sm" placeholder="10-digit number" value={newAgent.phone} onChange={e => setNewAgent({ ...newAgent, phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Assign Password</label>
                                        <input type="password" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all font-medium" placeholder="••••••••" value={newAgent.password} onChange={e => setNewAgent({ ...newAgent, password: e.target.value })} />
                                        <p className="text-[10px] text-slate-400 pl-1 italic">Agent can change this after logging in.</p>
                                    </div>
                                </div>
                                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-sm font-black text-slate-500 hover:text-slate-700 transition-all">Discard</button>
                                    <button type="submit" disabled={submitting} className="flex-2 btn-primary py-3.5 px-8 shadow-lg shadow-indigo-100">
                                        {submitting ? 'Creating...' : 'Register Agent'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {/* Edit Agent Modal */}
                {editingAgent && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setEditingAgent(null)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div><h3 className="text-xl font-black text-slate-900">Edit Agent Member</h3><p className="text-xs text-slate-400">Update profile details for {editingAgent.name}</p></div>
                                <button onClick={() => setEditingAgent(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleUpdateAgent}>
                                <div className="p-8 space-y-5">
                                    {error && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100">{error}</motion.div>}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                                        <input type="text" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all font-medium" value={editingAgent.name} onChange={e => setEditingAgent({ ...editingAgent, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                                        <input type="email" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all font-medium" value={editingAgent.email} onChange={e => setEditingAgent({ ...editingAgent, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Phone Number</label>
                                        <input type="text" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all font-medium" value={editingAgent.phone} onChange={e => setEditingAgent({ ...editingAgent, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                                    <button type="button" onClick={() => setEditingAgent(null)} className="flex-1 py-3 text-sm font-black text-slate-500 hover:text-slate-700 transition-all">Cancel</button>
                                    <button type="submit" disabled={submitting} className="flex-2 btn-primary py-3.5 px-8 shadow-lg shadow-indigo-100">
                                        {submitting ? 'Updating...' : 'Save Changes'}
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


