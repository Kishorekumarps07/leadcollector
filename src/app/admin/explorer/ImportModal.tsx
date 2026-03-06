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
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 rounded-2xl"><FileSpreadsheet size={20} className="text-emerald-600" /></div>
                        <div>
                            <h3 className="font-black text-slate-900">Import from Excel</h3>
                            <p className="text-xs text-slate-500">Upload .xlsx, .xls, or .csv files</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"><X size={18} /></button>
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
                                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'}`}
                            >
                                <Upload size={32} className={`mx-auto mb-4 ${dragging ? 'text-emerald-500' : 'text-slate-300'}`} />
                                <p className="font-bold text-slate-700">Drag & drop your file here</p>
                                <p className="text-sm text-slate-400 mt-1">or <span className="text-emerald-600 font-bold">click to browse</span></p>
                                <p className="text-xs text-slate-300 mt-3">.xlsx / .xls / .csv supported</p>
                                <input ref={fileRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={e => { if (e.target.files?.[0]) parseFile(e.target.files[0]); }} />
                            </div>

                            {/* Tips */}
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-700">
                                    <p className="font-bold mb-1">Tips for best results:</p>
                                    <ul className="space-y-0.5 font-medium">
                                        <li>• First row must be column headers</li>
                                        <li>• Column names should match your category's field names</li>
                                        <li>• Unmatched columns will be ignored</li>
                                    </ul>
                                </div>
                            </div>

                            {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold"><AlertCircle size={16} />{error}</div>}
                        </div>
                    )}

                    {/* STEP 2: Preview */}
                    {step === 'preview' && (
                        <div className="space-y-6">
                            {/* File info */}
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <FileSpreadsheet size={20} className="text-emerald-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 text-sm truncate">{fileName}</p>
                                    <p className="text-xs text-slate-500">{rows.length} rows · {headers.length} columns detected</p>
                                </div>
                                <button onClick={() => { setStep('upload'); setRows([]); setHeaders([]); setFileName(''); }} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">Change</button>
                            </div>

                            {/* Category selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Target Category *</label>
                                <div className="relative">
                                    <select
                                        value={selectedCategoryId}
                                        onChange={e => handleCategoryChange(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all"
                                    >
                                        <option value="">— Select a category —</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Column matching preview */}
                            {selectedCategoryId && (
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Column Matching</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                                        {matchedHeaders.map(h => (
                                            <div key={h} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-xs font-bold text-emerald-700">
                                                <CheckCircle size={12} className="flex-shrink-0" /> {h}
                                            </div>
                                        ))}
                                        {unmatchedHeaders.map(h => (
                                            <div key={h} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-400">
                                                <X size={12} className="flex-shrink-0" /> {h} <span className="font-normal text-slate-300">(ignored)</span>
                                            </div>
                                        ))}
                                    </div>
                                    {matchedHeaders.length === 0 && (
                                        <p className="text-xs text-amber-600 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100">
                                            ⚠️ No columns matched the fields of this category. Please check your column names or select a different category.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Data preview table */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Data Preview (first 3 rows)</label>
                                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                    <table className="text-xs w-full">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                {headers.map(h => <th key={h} className="px-4 py-2.5 text-left font-black text-slate-500 whitespace-nowrap">{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.slice(0, 3).map((row, i) => (
                                                <tr key={i} className="border-b border-slate-50">
                                                    {headers.map(h => <td key={h} className="px-4 py-2.5 text-slate-700 whitespace-nowrap max-w-[120px] truncate">{String(row[h] ?? '')}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {rows.length > 3 && <p className="text-xs text-slate-400 text-right">…and {rows.length - 3} more rows</p>}
                            </div>

                            {error && <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold"><AlertCircle size={16} />{error}</div>}
                        </div>
                    )}

                    {/* STEP 3: Importing */}
                    {step === 'importing' && (
                        <div className="py-16 text-center">
                            <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto mb-5" />
                            <p className="text-slate-700 font-bold text-lg">Importing {rows.length} records...</p>
                            <p className="text-slate-400 text-sm mt-1">Please don't close this window.</p>
                        </div>
                    )}

                    {/* STEP 4: Done */}
                    {step === 'done' && (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={40} className="text-emerald-600" />
                            </div>
                            <p className="text-2xl font-black text-slate-900 mb-2">Import Complete!</p>
                            <p className="text-slate-500 text-sm"><span className="font-bold text-emerald-600">{importCount} records</span> were added to the database.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    {step === 'done' ? (
                        <button onClick={onClose} className="ml-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all">Done</button>
                    ) : step === 'preview' ? (
                        <>
                            <button onClick={() => { setStep('upload'); setRows([]); setHeaders([]); setFileName(''); setError(''); }} className="text-sm font-bold text-slate-500 hover:text-slate-700">← Back</button>
                            <button
                                onClick={handleImport}
                                disabled={!selectedCategoryId || matchedHeaders.length === 0}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-40 shadow-lg shadow-emerald-100"
                            >
                                <Upload size={16} /> Import {rows.length} Records
                            </button>
                        </>
                    ) : step === 'upload' ? (
                        <button onClick={onClose} className="ml-auto text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                    ) : null}
                </div>
            </motion.div>
        </motion.div>
    );
}
