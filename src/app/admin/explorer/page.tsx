'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Download, RefreshCcw, Database, ChevronDown,
    User, Eye, Trash2, X, MapPin, Calendar,
    CheckSquare, Square, FileDown, FileUp
} from 'lucide-react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import ImportModal from './ImportModal';

// ── CSV Download ─────────────────────────────────────────────────────────────
function downloadCSV(rows: any[], columns: string[], getVal: (r: any, col: string) => any, filename: string) {
    const esc = (v: any) => { const s = String(v ?? '').replace(/"/g, '""'); return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s; };
    const header = columns.map(esc).join(',');
    const body = rows.map(row =>
        columns.map(col => {
            if (col === 'Date') return esc(new Date(row.created_at).toLocaleString('en-IN'));
            if (col === 'Category') return esc(row.category_id?.name);
            if (col === 'Agent') return esc(row.agent_id?.name);
            if (col === 'GPS') return esc(row.latitude && row.longitude ? `${row.latitude},${row.longitude}` : '');
            return esc(getVal(row, col));
        }).join(',')
    ).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ── Export Modal ─────────────────────────────────────────────────────────────
function ExportModal({ records, allFieldNames, getVal, onClose }: { records: any[]; allFieldNames: string[]; getVal: (r: any, col: string) => any; onClose: () => void }) {
    const sys = ['Date', 'Category', 'Agent', 'GPS'];
    const all = [...sys, ...allFieldNames];
    const [selected, setSelected] = useState<Set<string>>(new Set(all));
    const [filename, setFilename] = useState('sales_export');

    const toggle = (c: string) => setSelected(prev => { const s = new Set(prev); s.has(c) ? s.delete(c) : s.add(c); return s; });
    const toggleAll = () => setSelected(selected.size === all.length ? new Set() : new Set(all));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl"><FileDown size={18} className="text-indigo-600" /></div>
                        <div><h3 className="font-bold text-slate-900">Customise Export</h3><p className="text-xs text-slate-500">Pick columns to include in your CSV</p></div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"><X size={18} /></button>
                </div>
                <div className="px-6 pt-5 pb-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">File Name</label>
                    <div className="flex items-center mt-1.5 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-300">
                        <input type="text" value={filename} onChange={e => setFilename(e.target.value)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none" />
                        <span className="px-3 py-2.5 bg-slate-50 text-slate-400 text-xs font-bold border-l border-slate-200">.csv</span>
                    </div>
                </div>
                <div className="px-6 pb-2">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Columns ({selected.size}/{all.length})</label>
                        <button onClick={toggleAll} className="text-xs font-bold text-indigo-600 hover:underline">{selected.size === all.length ? 'Deselect All' : 'Select All'}</button>
                    </div>
                    <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1 pb-0.5">System Columns</p>
                        {sys.map(col => (
                            <button key={col} onClick={() => toggle(col)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all text-left">
                                {selected.has(col) ? <CheckSquare size={16} className="text-indigo-600 flex-shrink-0" /> : <Square size={16} className="text-slate-300 flex-shrink-0" />}
                                <span className="text-sm font-medium text-slate-700">{col}</span>
                            </button>
                        ))}
                        {allFieldNames.length > 0 && <>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 pb-0.5">Form Fields</p>
                            {allFieldNames.map(col => (
                                <button key={col} onClick={() => toggle(col)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all text-left">
                                    {selected.has(col) ? <CheckSquare size={16} className="text-indigo-600 flex-shrink-0" /> : <Square size={16} className="text-slate-300 flex-shrink-0" />}
                                    <span className="text-sm font-medium text-slate-700">{col}</span>
                                </button>
                            ))}
                        </>}
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                    <p className="text-xs text-slate-400 flex-1">{records.length} rows · {selected.size} cols selected</p>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                    <button onClick={() => { downloadCSV(records, all.filter(c => selected.has(c)), getVal, `${filename || 'export'}.csv`); onClose(); }} disabled={selected.size === 0} className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-2 transition-all">
                        <Download size={16} /> Export
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Content Component ──────────────────────────────────────────────────────
function DataExplorerContent() {
    const searchParams = useSearchParams();
    const agentParam = searchParams.get('agent');

    const [records, setRecords] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedAgent, setSelectedAgent] = useState(agentParam || 'all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [viewRecord, setViewRecord] = useState<any>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showExport, setShowExport] = useState(false);
    const [showImport, setShowImport] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [recRes, agentRes] = await Promise.all([api.get('admin/records'), api.get('admin/agents')]);
            setRecords(recRes.data.data || []);
            setAgents(agentRes.data.data || []);
        } catch (err: any) {
            console.error('FetchAll Error:', err.response?.data?.message || err.message);
            console.error('Full Error Object:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (deletingId === id) {
            try { await api.delete(`admin/records/${id}`); setRecords(prev => prev.filter(r => r._id !== id)); } catch (err) { console.error(err); }
            setDeletingId(null);
        } else {
            setDeletingId(id);
            setTimeout(() => setDeletingId(prev => prev === id ? null : prev), 3000);
        }
    };

    const categories = [...new Set(records.map(r => r.category_id?.name).filter(Boolean))];

    const filtered = records.filter(r => {
        const matchAgent = selectedAgent === 'all' || r.agent_id?._id === selectedAgent;
        const matchCat = selectedCategory === 'all' || r.category_id?.name === selectedCategory;
        const matchSearch = !search ||
            r.agent_id?.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.category_id?.name?.toLowerCase().includes(search.toLowerCase()) ||
            Object.values(r.fieldData || {}).some((v: any) => String(v).toLowerCase().includes(search.toLowerCase()));
        return matchAgent && matchCat && matchSearch;
    });

    // Case-insensitive dedup: "Name" + "NAME" → one column
    const canonicalMap = new Map<string, string>();
    filtered.forEach(r => Object.keys(r.fieldData || {}).forEach(k => {
        const lower = k.trim().toLowerCase();
        if (!canonicalMap.has(lower)) canonicalMap.set(lower, k.trim());
    }));

    // Sort: Identify Name and Phone variants to move to front
    const allFieldNames = [...canonicalMap.values()].sort((a, b) => {
        const aLow = a.toLowerCase();
        const bLow = b.toLowerCase();
        const isA_Name = aLow === 'name';
        const isB_Name = bLow === 'name';
        const isA_Phone = aLow.includes('phone') || aLow.includes('ph no');
        const isB_Phone = bLow.includes('phone') || bLow.includes('ph no');

        if (isA_Name) return -1;
        if (isB_Name) return 1;
        if (isA_Phone && !isB_Name) return -1;
        if (isB_Phone && !isA_Name) return 1;
        return 0;
    });

    // Lookup field value regardless of casing in the source record
    const getVal = (record: any, col: string) => {
        const lower = col.trim().toLowerCase();
        const fd = record.fieldData || {};
        const key = Object.keys(fd).find(k => k.trim().toLowerCase() === lower);
        return key !== undefined ? fd[key] : undefined;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Data Explorer</h1>
                    <p className="text-slate-500 mt-1 text-sm">All data submitted by your field agents.</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={fetchAll} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all" title="Refresh"><RefreshCcw size={16} /></button>
                    <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-emerald-300 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-50 transition-all"><FileUp size={15} /> <span className="hidden sm:inline">Import</span></button>
                    <button onClick={() => setShowExport(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all"><FileDown size={15} /> <span className="hidden sm:inline">Export</span></button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input type="text" placeholder="Search by agent, category, or any value..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 border border-transparent focus:border-indigo-300" />
                </div>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 appearance-none cursor-pointer">
                        <option value="all">All Agents</option>
                        {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
                <div className="relative">
                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-200 appearance-none cursor-pointer">
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
                <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <RefreshCcw className="w-8 h-8 text-indigo-600 animate-spin" />
                        <p className="text-slate-400 text-sm">Loading submissions...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"><Database size={32} /></div>
                        <p className="text-slate-500 font-bold">No records found</p>
                        <p className="text-slate-400 text-sm">Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Date & Time</th>
                                    <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Category</th>
                                    <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Agent</th>
                                    {allFieldNames.map(name => (
                                        <th key={name} className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">{name}</th>
                                    ))}
                                    <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((record, i) => (
                                    <motion.tr key={record._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 text-xs">
                                            <div className="font-medium">{new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                                            <div className="text-slate-400">{new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-full">{record.category_id?.name || '—'}</span>
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600 uppercase flex-shrink-0">{record.agent_id?.name?.charAt(0) || '?'}</div>
                                                <span className="font-medium text-slate-800">{record.agent_id?.name || '—'}</span>
                                            </div>
                                        </td>
                                        {allFieldNames.map(name => {
                                            const val = getVal(record, name);
                                            return (
                                                <td key={name} className="px-5 py-3.5 text-slate-700 max-w-[180px]">
                                                    <span className="truncate block" title={String(val ?? '')}>
                                                        {val !== undefined && val !== '' ? String(val) : <span className="text-slate-300">—</span>}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setViewRecord(record); }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer relative z-10"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(record._id); }}
                                                    className={`p-1.5 rounded-lg transition-all text-sm font-bold cursor-pointer relative z-10 ${deletingId === record._id ? 'bg-red-500 text-white px-3 py-1 text-[10px] rounded-full' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                                    title="Delete"
                                                >
                                                    {deletingId === record._id ? 'Confirm?' : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 text-xs text-slate-400 font-medium">
                    Showing {filtered.length} of {records.length} total submissions
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showImport && (
                    <ImportModal onClose={() => setShowImport(false)} onImported={() => { fetchAll(); }} />
                )}
                {showExport && (
                    <ExportModal records={filtered} allFieldNames={allFieldNames} getVal={getVal} onClose={() => setShowExport(false)} />
                )}
                {viewRecord && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setViewRecord(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">Submission Details</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{viewRecord.category_id?.name} · by {viewRecord.agent_id?.name}</p>
                                </div>
                                <button onClick={() => setViewRecord(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><X size={18} /></button>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 flex gap-6 border-b border-slate-100">
                                <div className="flex items-center gap-2 text-xs text-slate-500"><Calendar size={14} />{new Date(viewRecord.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                {(viewRecord.latitude || viewRecord.longitude) && (
                                    <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold"><MapPin size={14} />{viewRecord.latitude?.toFixed(4)}, {viewRecord.longitude?.toFixed(4)}</div>
                                )}
                            </div>
                            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                                {Object.keys(viewRecord.fieldData || {}).length === 0 ? (
                                    <p className="text-sm text-slate-400 italic text-center py-8">No field data for this submission.</p>
                                ) : Object.entries(viewRecord.fieldData || {}).map(([key, value]: any) => (
                                    <div key={key} className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key}</label>
                                        <p className="text-sm font-medium text-slate-900 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">{String(value)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button onClick={() => setViewRecord(null)} className="px-5 py-2 bg-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-300 transition-all">Close</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main Page (Wrapped in Suspense) ──────────────────────────────────────────
export default function DataExplorerPage() {
    return (
        <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <RefreshCcw className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-slate-400 text-sm">Initializing Explorer...</p>
            </div>
        }>
            <DataExplorerContent />
        </React.Suspense>
    );
}
