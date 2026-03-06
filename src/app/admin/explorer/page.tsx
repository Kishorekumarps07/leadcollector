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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={onClose}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gold-main/10 rounded-xl border border-gold-main/20"><FileDown size={18} className="text-gold-dark" /></div>
                        <div><h3 className="font-black text-black italic tracking-tight">Structured Export</h3><p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Select columns for CSV extraction</p></div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-black rounded-xl hover:bg-slate-100 transition-all"><X size={18} /></button>
                </div>
                <div className="px-6 pt-5 pb-3">
                    <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">File Label</label>
                    <div className="flex items-center mt-2 border border-slate-200 bg-slate-50/50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-gold-main/30">
                        <input type="text" value={filename} onChange={e => setFilename(e.target.value)} className="flex-1 px-4 py-3 text-sm font-black text-black outline-none bg-transparent italic" />
                        <span className="px-3 py-3 bg-slate-100 text-slate-400 text-[10px] font-black border-l border-slate-200">.CSV</span>
                    </div>
                </div>
                <div className="px-6 pb-2">
                    <div className="flex items-center justify-between mb-3 pt-2">
                        <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Columns ({selected.size}/{all.length})</label>
                        <button onClick={toggleAll} className="text-[10px] font-black text-slate-400 hover:text-gold-dark transition-all uppercase tracking-widest italic">{selected.size === all.length ? 'Deselect' : 'Select All'}</button>
                    </div>
                    <div className="space-y-1 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest pt-1 pb-1 italic">System Metadata</p>
                        {sys.map(col => (
                            <button key={col} onClick={() => toggle(col)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${selected.has(col) ? 'bg-gold-main/10' : 'hover:bg-slate-50'}`}>
                                {selected.has(col) ? <CheckSquare size={16} className="text-gold-dark flex-shrink-0" /> : <Square size={16} className="text-slate-200 flex-shrink-0" />}
                                <span className={`text-xs font-black italic ${selected.has(col) ? 'text-black' : 'text-slate-400'}`}>{col}</span>
                            </button>
                        ))}
                        {allFieldNames.length > 0 && <>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest pt-4 pb-1 italic">Collection Fields</p>
                            {allFieldNames.map(col => (
                                <button key={col} onClick={() => toggle(col)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group ${selected.has(col) ? 'bg-gold-main/10' : 'hover:bg-slate-50'}`}>
                                    {selected.has(col) ? <CheckSquare size={16} className="text-gold-dark flex-shrink-0" /> : <Square size={16} className="text-slate-200 flex-shrink-0" />}
                                    <span className={`text-xs font-black italic ${selected.has(col) ? 'text-black' : 'text-slate-400'}`}>{col}</span>
                                </button>
                            ))}
                        </>}
                    </div>
                </div>
                <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                    <p className="text-[10px] text-slate-400 font-black italic flex-1 uppercase tracking-tighter">{records.length} deep data points</p>
                    <button onClick={onClose} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-black uppercase tracking-widest italic">Abort</button>
                    <button onClick={() => { downloadCSV(records, all.filter(c => selected.has(c)), getVal, `${filename || 'export'}.csv`); onClose(); }} disabled={selected.size === 0} className="btn-primary py-2 px-6 disabled:opacity-40 uppercase tracking-widest text-xs italic font-black">
                        Export
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-black italic uppercase tracking-tight">Data Explorer</h1>
                    <p className="text-slate-500 mt-1 text-sm italic">Analysis and history of all field submissions.</p>
                </div>
                <div className="grid grid-cols-3 sm:flex items-center gap-2 flex-shrink-0">
                    <button onClick={fetchAll} className="flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-gold-dark hover:border-gold-main/30 transition-all shadow-sm" title="Refresh"><RefreshCcw size={16} /></button>
                    <button onClick={() => setShowImport(true)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] lg:text-xs font-black rounded-xl hover:bg-emerald-100/50 transition-all italic"><FileUp size={15} /> <span className="uppercase tracking-widest">Import</span></button>
                    <button onClick={() => setShowExport(true)} className="btn-primary py-2 px-4 text-[10px] lg:text-xs flex items-center justify-center gap-2 italic uppercase font-black tracking-widest"><FileDown size={15} /> <span>Export</span></button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 lg:px-5 py-4 shadow-xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input type="text" placeholder="Search data..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-main/20 border border-transparent focus:border-gold-main/30 text-black placeholder:text-slate-300 shadow-inner font-black italic uppercase" />
                </div>
                <div className="grid grid-cols-2 lg:flex items-center gap-3">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                        <select value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)} className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black text-slate-600 outline-none focus:ring-2 focus:ring-gold-main/20 appearance-none cursor-pointer hover:bg-slate-100 transition-all italic uppercase">
                            <option value="all" className="bg-white">All Agents</option>
                            {agents.map(a => <option key={a._id} value={a._id} className="bg-white">{a.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                    <div className="relative">
                        <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black text-slate-600 outline-none focus:ring-2 focus:ring-gold-main/20 appearance-none cursor-pointer hover:bg-slate-100 transition-all italic uppercase">
                            <option value="all" className="bg-white">Categories</option>
                            {categories.map(c => <option key={c} value={c} className="bg-white">{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                </div>
                <div className="hidden lg:flex ml-auto text-[10px] font-black text-gold-dark bg-gold-main/10 px-3 py-1.5 rounded-full border border-gold-main/20 uppercase tracking-widest italic">{filtered.length} entries</div>
            </div>

            {/* Table */}
            <div className="bg-white premium-card overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <RefreshCcw className="w-8 h-8 text-gold-dark animate-spin" />
                        <p className="text-slate-400 text-sm italic">Synchronizing explorer data...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-gold-dark/40 border border-slate-100 shadow-sm"><Database size={32} /></div>
                        <p className="text-black font-black italic tracking-tight uppercase">Vault Empty</p>
                        <p className="text-slate-400 text-sm italic">Adjust filters to browse existing records.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-5 py-4 text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] whitespace-nowrap italic">Timestamp</th>
                                    <th className="px-5 py-4 text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] whitespace-nowrap italic">Section</th>
                                    <th className="px-5 py-4 text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] whitespace-nowrap italic">Operator</th>
                                    {allFieldNames.map(name => (
                                        <th key={name} className="px-5 py-4 text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] whitespace-nowrap italic">{name}</th>
                                    ))}
                                    <th className="px-5 py-4 text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] text-right italic">Ops</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((record, i) => (
                                    <motion.tr key={record._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="font-black text-black text-xs italic">{new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                                            <div className="text-slate-400 text-[10px] italic font-bold uppercase">{new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 bg-gold-main/10 text-gold-dark text-[10px] font-black rounded-full border border-gold-main/20 uppercase tracking-tighter italic">{record.category_id?.name || '—'}</span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase flex-shrink-0">{record.agent_id?.name?.charAt(0) || '?'}</div>
                                                <span className="font-black text-black text-xs italic">{record.agent_id?.name || '—'}</span>
                                            </div>
                                        </td>
                                        {allFieldNames.map(name => {
                                            const val = getVal(record, name);
                                            return (
                                                <td key={name} className="px-5 py-4 text-slate-600 max-w-[180px] text-xs font-medium">
                                                    <span className="truncate block italic" title={String(val ?? '')}>
                                                        {val !== undefined && val !== '' ? String(val) : <span className="text-slate-200">—</span>}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                        <td className="px-5 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setViewRecord(record); }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-gold-dark hover:bg-slate-100 transition-all cursor-pointer relative z-10"
                                                    title="View Detail"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(record._id); }}
                                                    className={`p-1.5 rounded-lg transition-all text-[10px] font-black cursor-pointer relative z-10 uppercase tracking-tighter ${deletingId === record._id ? 'bg-red-600 text-white px-3 py-1 rounded-full shadow-lg' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                                                    title="Delete"
                                                >
                                                    {deletingId === record._id ? 'Sure?' : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 font-black italic uppercase tracking-widest">
                    Audit Log: {filtered.length} of {records.length} global entities verified
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setViewRecord(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="font-black text-black text-lg italic tracking-tight uppercase">Intelligence Report</h3>
                                    <p className="text-[10px] text-gold-dark font-black uppercase tracking-widest mt-0.5">{viewRecord.category_id?.name} · Operator: {viewRecord.agent_id?.name}</p>
                                </div>
                                <button onClick={() => setViewRecord(null)} className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-xl transition-all"><X size={18} /></button>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 flex gap-6 border-b border-slate-100">
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold italic uppercase"><Calendar size={14} className="text-gold-dark" />{new Date(viewRecord.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                {(viewRecord.latitude || viewRecord.longitude) && (
                                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-black tracking-widest uppercase italic"><MapPin size={14} />{viewRecord.latitude?.toFixed(4)}, {viewRecord.longitude?.toFixed(4)}</div>
                                )}
                            </div>
                            <div className="p-6 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                                {Object.keys(viewRecord.fieldData || {}).length === 0 ? (
                                    <p className="text-sm text-slate-300 italic text-center py-8 font-black uppercase tracking-widest">No field telemetry available.</p>
                                ) : Object.entries(viewRecord.fieldData || {}).map(([key, value]: any) => (
                                    <div key={key} className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">{key}</label>
                                        <p className="text-sm font-black text-black bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 shadow-sm italic uppercase">{String(value)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button onClick={() => setViewRecord(null)} className="px-8 py-2.5 bg-white text-slate-500 text-xs font-black rounded-xl hover:bg-slate-100 hover:text-black transition-all uppercase tracking-widest border border-slate-200 italic">Close Dispatch</button>
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
                <RefreshCcw className="w-8 h-8 text-gold-main animate-spin" />
                <p className="text-gold-light/20 text-sm italic">Initializing Global Explorer...</p>
            </div>
        }>
            <DataExplorerContent />
        </React.Suspense>
    );
}
