'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ChevronDown, Loader2, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';

interface ImportModalProps {
    onClose: () => void;
    onImported: () => void;
}

type Step = 'upload' | 'preview' | 'importing' | 'done';

export default function ImportModal({ onClose, onImported }: ImportModalProps) {
    const [step, setStep] = useState<Step>('upload');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [categoryFields, setCategoryFields] = useState<any[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [importCount, setImportCount] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [loadingCats, setLoadingCats] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Load categories on mount
    React.useEffect(() => {
        setLoadingCats(true);
        api.get('admin/categories')
            .then(res => setCategories(res.data.data || []))
            .catch(() => setError('Failed to load categories'))
            .finally(() => setLoadingCats(false));
    }, []);

    const handleCategoryChange = async (catId: string) => {
        setSelectedCategoryId(catId);
        if (!catId) return;
        try {
            const res = await api.get(`admin/categories/${catId}/fields`);
            setCategoryFields(res.data.data || []);
        } catch { }
    };

    const parseFile = (file: File) => {
        setError('');
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
            setError('Please upload an .xlsx, .xls, or .csv file.');
            return;
        }
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
                if (json.length === 0) { setError('The file is empty or has no data rows.'); return; }
                setHeaders(Object.keys(json[0]));
                setRows(json);
                setStep('preview');
            } catch {
                setError('Failed to parse the file. Make sure it is a valid Excel or CSV file.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) parseFile(file);
    }, []);

    const handleImport = async () => {
        if (!selectedCategoryId) { setError('Please select a category.'); return; }
        setStep('importing');
        setError('');
        try {
            const res = await api.post('admin/import', { category_id: selectedCategoryId, rows });
            setImportCount(res.data.count);
            setStep('done');
            onImported();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Import failed. Please try again.');
            setStep('preview');
        }
    };

    // field names from selected category (lowercase for matching)
    const fieldNames = categoryFields.map(f => f.field_name.toLowerCase());
    const matchedHeaders = headers.filter(h => fieldNames.includes(h.trim().toLowerCase()));
    const unmatchedHeaders = headers.filter(h => !fieldNames.includes(h.trim().toLowerCase()));

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gold-main/10 rounded-2xl border border-gold-main/20"><FileSpreadsheet size={20} className="text-gold-dark" /></div>
                        <div>
                            <h3 className="font-black text-black italic tracking-tight uppercase">Bulk Pipeline</h3>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Ingest .xlsx, .xls, or .csv intelligence</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-black rounded-xl hover:bg-slate-100 transition-all"><X size={18} /></button>
                </div>

                <div className="p-8 overflow-y-auto max-h-[60vh]">
                    {/* STEP 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            {/* Drop zone */}
                            <div
                                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={onDrop}
                                onClick={() => fileRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragging ? 'border-gold-main bg-gold-main/5' : 'border-slate-100 hover:border-gold-main/30 hover:bg-slate-50'}`}
                            >
                                <Upload size={32} className={`mx-auto mb-4 ${dragging ? 'text-gold-dark' : 'text-slate-200'}`} />
                                <p className="font-black text-black italic tracking-tight uppercase">Drop satellite data here</p>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-black">or <span className="text-gold-dark">browse local archives</span></p>
                                <p className="text-[10px] text-slate-300 mt-4 font-black italic uppercase tracking-widest">LEGACY FORMATS: .XLSX / .XLS / .CSV</p>
                                <input ref={fileRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={e => { if (e.target.files?.[0]) parseFile(e.target.files[0]); }} />
                            </div>

                            {/* Tips */}
                            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                <Info size={16} className="text-gold-dark flex-shrink-0 mt-0.5" />
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                                    <p className="text-black italic mb-1 font-black">DATA INTEGRITY PROTOCOL:</p>
                                    <ul className="space-y-1">
                                        <li>• Row 1 must define field headers</li>
                                        <li>• Headers must align with target category structure</li>
                                        <li>• Non-conforming columns will be purged during ingest</li>
                                    </ul>
                                </div>
                            </div>

                            {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-black italic uppercase"><AlertCircle size={16} />{error}</div>}
                        </div>
                    )}

                    {/* STEP 2: Preview */}
                    {step === 'preview' && (
                        <div className="space-y-6">
                            {/* File info */}
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                <FileSpreadsheet size={20} className="text-gold-dark flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-black text-sm truncate uppercase tracking-tight italic">{fileName}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{rows.length} rows · {headers.length} columns detected</p>
                                </div>
                                <button onClick={() => { setStep('upload'); setRows([]); setHeaders([]); setFileName(''); }} className="text-[10px] font-black text-slate-300 hover:text-red-600 transition-colors uppercase tracking-widest italic">Clear Source</button>
                            </div>

                            {/* Category selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Archive Destination *</label>
                                <div className="relative">
                                    <select
                                        value={selectedCategoryId}
                                        onChange={e => handleCategoryChange(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-black appearance-none outline-none focus:ring-4 focus:ring-gold-main/10 focus:border-gold-main/30 transition-all shadow-sm italic uppercase"
                                    >
                                        <option value="" className="bg-white">Select target category</option>
                                        {categories.map(c => <option key={c._id} value={c._id} className="bg-white">{c.name}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                </div>
                            </div>

                            {/* Column matching preview */}
                            {selectedCategoryId && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Schema Alignment</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                                        {matchedHeaders.map(h => (
                                            <div key={h} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">
                                                <CheckCircle size={12} className="flex-shrink-0" /> {h}
                                            </div>
                                        ))}
                                        {unmatchedHeaders.map(h => (
                                            <div key={h} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                                                <X size={12} className="flex-shrink-0" /> {h} <span className="text-[8px] opacity-40 font-black ml-auto">PURGED</span>
                                            </div>
                                        ))}
                                    </div>
                                    {matchedHeaders.length === 0 && (
                                        <p className="text-[10px] text-amber-600 font-black bg-amber-50 p-4 rounded-xl border border-amber-100 italic tracking-widest uppercase">
                                            ⚠️ CRITICAL: ZERO schema matches detected. Target category structure does not align with source headers.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Data preview table */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Ingest Preview (Head)</label>
                                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50 shadow-sm">
                                    <table className="text-[10px] w-full">
                                        <thead>
                                            <tr className="bg-slate-100 border-b border-slate-200">
                                                {headers.map(h => <th key={h} className="px-4 py-3 text-left font-black text-slate-400 uppercase tracking-widest whitespace-nowrap italic">{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.slice(0, 3).map((row, i) => (
                                                <tr key={i} className="border-b border-slate-100">
                                                    {headers.map(h => <td key={h} className="px-4 py-3 text-slate-600 font-black whitespace-nowrap max-w-[120px] truncate italic uppercase">{String(row[h] ?? '')}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {rows.length > 3 && <p className="text-[9px] text-slate-300 text-right uppercase font-black italic">… + {rows.length - 3} additional satellite entries</p>}
                            </div>

                            {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-black italic uppercase"><AlertCircle size={16} />{error}</div>}
                        </div>
                    )}

                    {/* STEP 3: Importing */}
                    {step === 'importing' && (
                        <div className="py-24 text-center">
                            <Loader2 size={40} className="animate-spin text-gold-dark mx-auto mb-6 opacity-80" />
                            <p className="text-black font-black text-xl italic tracking-tight uppercase">Syncing Archives...</p>
                            <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mt-2 italic">Injecting {rows.length} global records</p>
                        </div>
                    )}

                    {/* STEP 4: Done */}
                    {step === 'done' && (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={40} className="text-emerald-600" />
                            </div>
                            <p className="text-2xl font-black text-slate-900 mb-2 uppercase italic tracking-tight">Import Complete!</p>
                            <p className="text-slate-500 text-sm font-black uppercase italic tracking-widest"><span className="font-black text-emerald-600">{importCount} records</span> were added to the database.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    {step === 'done' ? (
                        <button onClick={onClose} className="ml-auto btn-primary py-3 px-10 uppercase tracking-widest text-xs font-black italic">Acknowledge</button>
                    ) : step === 'preview' ? (
                        <>
                            <button onClick={() => { setStep('upload'); setRows([]); setHeaders([]); setFileName(''); setError(''); }} className="text-[10px] font-black text-slate-400 hover:text-black uppercase tracking-widest transition-all italic">← Backtrack</button>
                            <button
                                onClick={handleImport}
                                disabled={!selectedCategoryId || matchedHeaders.length === 0}
                                className="btn-primary py-3 px-8 flex items-center gap-2 disabled:opacity-40 uppercase tracking-widest text-xs font-black italic"
                            >
                                <Upload size={16} /> Ingest {rows.length} Records
                            </button>
                        </>
                    ) : step === 'upload' ? (
                        <button onClick={onClose} className="ml-auto text-[10px] font-black text-slate-400 hover:text-black uppercase tracking-widest transition-all italic">Abort Mission</button>
                    ) : null}
                </div>
            </motion.div>
        </motion.div>
    );
}
