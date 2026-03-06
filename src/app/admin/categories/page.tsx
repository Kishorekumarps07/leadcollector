'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Trash2,
    Settings2,
    ChevronRight,
    X,
    Settings,
    ListTree,
    GripVertical,
    Check,
    LayoutGrid as LayoutGridIcon,
    MoreVertical,
    Pencil,
    AlertTriangle,
    RefreshCcw
} from 'lucide-react';
import api from '@/lib/api';

interface Category {
    _id: string;
    name: string;
    description: string;
}

interface Field {
    _id?: string;
    field_name: string;
    field_type: string;
    required: boolean;
    options: string[];
    field_order: number;
    is_system?: boolean;
}

const FIELD_TYPES = ['Text', 'Number', 'Phone', 'Email', 'Dropdown', 'Checkbox', 'Date', 'Textarea'];

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [fields, setFields] = useState<Field[]>([]);

    // Category modal (add)
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');

    // Edit category
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');

    // Delete confirm
    const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Inline quick-add field state
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickName, setQuickName] = useState('');
    const [quickType, setQuickType] = useState('Text');
    const [quickRequired, setQuickRequired] = useState(false);
    const [quickOptions, setQuickOptions] = useState('');
    const [saving, setSaving] = useState(false);

    // Edit field
    const [editingField, setEditingField] = useState<Field | null>(null);
    const [editFieldName, setEditFieldName] = useState('');
    const [editFieldType, setEditFieldType] = useState('Text');
    const [editFieldRequired, setEditFieldRequired] = useState(false);
    const [editFieldOptions, setEditFieldOptions] = useState('');
    const [savingField, setSavingField] = useState(false);

    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchCategories(); }, []);

    // Close menu on outside click
    useEffect(() => {
        const handler = () => setActiveMenuId(null);
        window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, []);

    useEffect(() => {
        if (showQuickAdd) setTimeout(() => nameRef.current?.focus(), 50);
    }, [showQuickAdd]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('admin/categories');
            setCategories(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleSelectCategory = async (cat: Category) => {
        setSelectedCategory(cat);
        setShowQuickAdd(false);
        try {
            const res = await api.get(`admin/categories/${cat._id}/fields`);
            setFields(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleAddCategory = async () => {
        if (!newCatName.trim()) return;
        try {
            const res = await api.post('admin/categories', { name: newCatName, description: newCatDesc });
            setCategories([...categories, res.data.data]);
            setShowAddCategory(false);
            setNewCatName(''); setNewCatDesc('');
        } catch (err) { console.error(err); }
    };

    const handleEditCategory = async () => {
        if (!editingCat || !editName.trim()) return;
        try {
            const res = await api.patch(`admin/categories/${editingCat._id}`, { name: editName, description: editDesc });
            setCategories(categories.map(c => c._id === editingCat._id ? res.data.data : c));
            if (selectedCategory?._id === editingCat._id) setSelectedCategory(res.data.data);
            setEditingCat(null);
        } catch (err) { console.error(err); }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            await api.delete(`admin/categories/${id}`);
            setCategories(categories.filter(c => c._id !== id));
            if (selectedCategory?._id === id) setSelectedCategory(null);
            setDeletingCatId(null);
        } catch (err) { console.error(err); }
    };

    const handleSaveField = async () => {
        if (!quickName.trim()) return;
        setSaving(true);
        try {
            const options = quickType === 'Dropdown'
                ? quickOptions.split(',').map(s => s.trim()).filter(Boolean)
                : [];
            const res = await api.post('admin/fields', {
                field_name: quickName,
                field_type: quickType,
                required: quickRequired,
                options,
                field_order: fields.length,
                category_id: selectedCategory?._id
            });
            setFields([...fields, res.data.data]);
            setQuickName(''); setQuickType('Text'); setQuickRequired(false); setQuickOptions('');
            setShowQuickAdd(false);
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    const handleDeleteField = async (fieldId: string) => {
        try {
            await api.delete(`admin/fields/${fieldId}`);
            setFields(fields.filter(f => f._id !== fieldId));
        } catch (err) { console.error(err); }
    };

    const openEditField = (field: Field) => {
        setEditingField(field);
        setEditFieldName(field.field_name);
        setEditFieldType(field.field_type);
        setEditFieldRequired(field.required);
        setEditFieldOptions(field.options?.join(', ') || '');
    };

    const handleEditField = async () => {
        if (!editingField?._id || !editFieldName.trim()) return;
        setSavingField(true);
        try {
            const options = editFieldType === 'Dropdown'
                ? editFieldOptions.split(',').map(s => s.trim()).filter(Boolean)
                : [];
            const res = await api.patch(`admin/fields/${editingField._id}`, {
                field_name: editFieldName,
                field_type: editFieldType,
                required: editFieldRequired,
                options,
            });
            setFields(fields.map(f => f._id === editingField._id ? res.data.data : f));
            setEditingField(null);
        } catch (err) { console.error(err); } finally { setSavingField(false); }
    };

    return (
        <div className="flex flex-col h-full gap-4 lg:gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-black italic uppercase tracking-tight">Categories & Fields</h1>
                    <p className="text-slate-500 mt-1 text-sm italic">Create form categories and configure their fields.</p>
                </div>
                <button onClick={() => setShowAddCategory(true)} className="btn-primary py-2.5 px-5 flex items-center justify-center gap-2 w-full sm:w-auto uppercase font-black tracking-widest text-xs">
                    <Plus size={18} /> <span>New Category</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 flex-1 overflow-hidden min-h-0">
                {/* Categories Column */}
                <div className={`bg-white premium-card flex flex-col overflow-hidden ${selectedCategory ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-black text-black text-xs uppercase tracking-widest italic">Categories</h3>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">{categories.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {categories.length === 0 && (
                            <p className="text-center text-sm text-slate-400 py-10 italic">No categories yet.</p>
                        )}
                        {categories.map((cat) => (
                            <div
                                key={cat._id}
                                className={`w-full p-4 rounded-xl flex items-center justify-between transition-all text-left group relative ${selectedCategory?._id === cat._id
                                    ? 'bg-gold-main/10 text-gold-dark border border-gold-main/20 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <button onClick={() => handleSelectCategory(cat)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedCategory?._id === cat._id ? 'bg-gold-main text-black font-black' : 'bg-slate-100 text-slate-400'}`}>
                                        <LayoutGridIcon size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black italic">{cat.name}</h4>
                                        <p className="text-[10px] opacity-60 line-clamp-1">{cat.description || 'No description'}</p>
                                    </div>
                                </button>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingCat(cat); setEditName(cat.name); setEditDesc(cat.description || ''); }}
                                        className="lg:opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-gold-dark hover:bg-white/5 rounded-lg transition-all"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeletingCatId(cat._id); }}
                                        className="lg:opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-white/5 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fields Column */}
                <div className={`lg:col-span-2 bg-white premium-card flex flex-col overflow-hidden ${selectedCategory ? 'flex' : 'hidden lg:flex'}`}>
                    {selectedCategory ? (
                        <>
                            {/* Fields Header */}
                            <div className="p-4 lg:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-3 min-w-0">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-black"
                                    >
                                        <ChevronRight size={20} className="rotate-180" />
                                    </button>
                                    <div className="hidden xs:flex p-2 bg-gold-main text-black rounded-lg shadow-md flex-shrink-0">
                                        <Settings2 size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-black text-sm lg:text-base truncate italic uppercase tracking-tight">{selectedCategory.name}</h3>
                                        <p className="text-[10px] lg:text-xs text-slate-500 font-bold uppercase tracking-widest">{fields.length} fields configured</p>
                                    </div>
                                </div>
                                {!showQuickAdd && (
                                    <button
                                        onClick={() => setShowQuickAdd(true)}
                                        className="flex items-center gap-2 text-[10px] lg:text-xs font-black text-gold-dark hover:text-black hover:bg-gold-main bg-gold-main/10 border border-gold-main/20 px-3 lg:px-4 py-2 rounded-xl transition-all flex-shrink-0 uppercase tracking-widest italic"
                                    >
                                        <Plus size={14} /> <span className="hidden sm:inline">Add Field</span><span className="sm:hidden">Add</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                                {/* Existing Fields */}
                                {fields.map((field) => (
                                    <motion.div
                                        key={field._id}
                                        layout
                                        className={`p-4 border rounded-xl flex items-center justify-between transition-all group ${field.is_system
                                            ? 'border-gold-main/20 bg-gold-main/5'
                                            : 'border-slate-100 bg-white hover:border-gold-main/30 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {field.is_system
                                                ? <div className="text-gold-main/60"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></div>
                                                : <GripVertical className="text-slate-300 group-hover:text-gold-main/60 cursor-grab" size={20} />}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-black text-black italic">{field.field_name}</h4>
                                                    {field.required && <span className="text-[10px] font-black text-red-600 uppercase bg-red-50 px-1 py-0.5 rounded border border-red-100">Required</span>}
                                                    {field.is_system && <span className="text-[10px] font-black text-gold-dark uppercase bg-gold-main/10 px-1.5 py-0.5 rounded-full border border-gold-main/20">System</span>}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 italic">
                                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[10px] capitalize">{field.field_type}</span>
                                                    {field.field_type === 'Dropdown' && field.options?.length > 0 && (
                                                        <span className="text-slate-300">• {field.options.join(', ')}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        {field.is_system ? (
                                            <span className="text-[10px] text-slate-300 italic px-2">Mandatory</span>
                                        ) : (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => openEditField(field)}
                                                    className="p-2 text-slate-400 hover:text-gold-dark hover:bg-slate-100 rounded-lg transition-all"
                                                    title="Edit field"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    onClick={() => field._id && handleDeleteField(field._id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete field"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}

                                {/* ── INLINE QUICK-ADD FORM ── */}
                                <AnimatePresence>
                                    {showQuickAdd && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="border-2 border-gold-main/20 border-dashed rounded-2xl p-5 space-y-4 bg-slate-50"
                                        >
                                            {/* Field Name */}
                                            <input
                                                ref={nameRef}
                                                type="text"
                                                placeholder="Field name (e.g. Manager Name)"
                                                className="input-field w-full font-black text-black text-base italic uppercase"
                                                value={quickName}
                                                onChange={e => setQuickName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveField()}
                                            />

                                            {/* Type Selector — pill buttons */}
                                            <div className="flex flex-wrap gap-2">
                                                {FIELD_TYPES.map(t => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setQuickType(t)}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-black transition-all uppercase tracking-widest italic ${quickType === t
                                                            ? 'bg-gold-main text-black shadow-md border border-gold-main'
                                                            : 'bg-white border border-slate-200 text-slate-500 hover:border-gold-main/30'}`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Dropdown options — simple comma text */}
                                            {quickType === 'Dropdown' && (
                                                <input
                                                    type="text"
                                                    placeholder="Options (comma-separated): Gym, Yoga, Crossfit"
                                                    className="input-field w-full"
                                                    value={quickOptions}
                                                    onChange={e => setQuickOptions(e.target.value)}
                                                />
                                            )}

                                            {/* Required toggle + Actions */}
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                    <div
                                                        onClick={() => setQuickRequired(!quickRequired)}
                                                        className={`w-10 h-5 rounded-full transition-all relative ${quickRequired ? 'bg-gold-main' : 'bg-slate-200'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${quickRequired ? 'left-5' : 'left-0.5'}`} />
                                                    </div>
                                                    <span className="text-sm font-black text-slate-600 italic">Required Field</span>
                                                </label>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setShowQuickAdd(false); setQuickName(''); setQuickType('Text'); setQuickOptions(''); }}
                                                        className="px-4 py-2 text-sm font-black text-slate-400 hover:text-black rounded-xl transition-all uppercase italic tracking-widest"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveField}
                                                        disabled={!quickName.trim() || saving}
                                                        className="px-5 py-2 bg-gold-gradient text-black text-sm font-black rounded-xl hover:brightness-110 disabled:opacity-40 flex items-center gap-2 transition-all shadow-lg shadow-gold-main/20"
                                                    >
                                                        <Check size={16} />
                                                        {saving ? 'Creating...' : 'Create Field'}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {fields.length === 0 && !showQuickAdd && (
                                    <div className="py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gold-dark/40">
                                            <ListTree size={32} />
                                        </div>
                                        <p className="text-sm text-slate-300 font-black uppercase italic tracking-widest">No fields defined for this category.</p>
                                        <button onClick={() => setShowQuickAdd(true)} className="mt-4 text-gold-dark text-sm font-black hover:text-black tracking-widest italic animate-pulse">
                                            + ADD YOUR FIRST FIELD
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                            <div className="w-20 h-20 bg-gold-main/10 text-gold-main/40 rounded-full flex items-center justify-center mb-6 animate-pulse border border-gold-main/20 shadow-sm">
                                <Settings size={40} />
                            </div>
                            <h3 className="text-xl font-black text-black italic uppercase tracking-tight">Select a Category</h3>
                            <p className="text-slate-300 mt-2 max-w-xs text-sm italic font-medium">Choose a data category from the left panel to configure its dynamic fields.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Category Modal */}
            <AnimatePresence>
                {showAddCategory && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setShowAddCategory(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-xl font-black text-black italic">New Category</h3>
                                <button onClick={() => setShowAddCategory(false)} className="text-slate-400 hover:text-black"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-5">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Category Title</label>
                                    <input type="text" placeholder="e.g. Vendors, Gyms, Leads..." className="input-field bg-white" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} autoFocus />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Description <span className="text-slate-300 font-normal normal-case">(optional)</span></label>
                                    <input type="text" placeholder="Mission or data collection scope..." className="input-field bg-white" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} />
                                </div>
                            </div>
                            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button onClick={() => setShowAddCategory(false)} className="flex-1 py-3 text-sm font-black text-slate-400 hover:text-black uppercase tracking-widest italic">Cancel</button>
                                <button onClick={handleAddCategory} disabled={!newCatName.trim()} className="flex-1 btn-primary py-3 disabled:opacity-40 uppercase tracking-widest">Create</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Edit Category Modal */}
                {editingCat && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setEditingCat(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-xl font-black text-black italic">Edit Category Settings</h3>
                                <button onClick={() => setEditingCat(null)} className="text-slate-400 hover:text-black"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-5">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Category Title</label>
                                    <input type="text" className="input-field bg-white" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEditCategory()} autoFocus />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Description Meta</label>
                                    <input type="text" className="input-field bg-white" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                                </div>
                            </div>
                            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button onClick={() => setEditingCat(null)} className="flex-1 py-3 text-sm font-black text-slate-400 hover:text-black uppercase tracking-widest italic">Cancel</button>
                                <button onClick={handleEditCategory} disabled={!editName.trim()} className="flex-1 btn-primary py-3 disabled:opacity-40 flex items-center justify-center gap-2 uppercase tracking-widest italic"><Check size={16} /> Update</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Delete Confirm Modal */}
                {deletingCatId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setDeletingCatId(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white border border-red-100 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                            <div className="p-8 text-center text-black">
                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-100 shadow-sm">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-xl font-black italic mb-2">Nuclear Action?</h3>
                                <p className="text-sm text-slate-500">This will permanently delete the category and <span className="font-black text-red-600 underline uppercase tracking-tighter">all associated records</span>. This is irreversible.</p>
                            </div>
                            <div className="px-8 py-6 bg-slate-50 border-t border-red-50 flex gap-4">
                                <button onClick={() => setDeletingCatId(null)} className="flex-1 py-3 text-sm font-black text-slate-400 hover:text-black uppercase tracking-widest italic">Abort</button>
                                <button onClick={() => handleDeleteCategory(deletingCatId)} className="flex-1 py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest italic">Confirm</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {/* Edit Field Modal */}
                {editingField && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setEditingField(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-black italic">Modify Field Nexus</h3>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">Update operational parameters</p>
                                </div>
                                <button onClick={() => setEditingField(null)} className="text-slate-400 hover:text-black"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                {/* Field Name */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Field Label</label>
                                    <input
                                        type="text"
                                        className="input-field bg-white text-black font-black italic uppercase"
                                        value={editFieldName}
                                        onChange={e => setEditFieldName(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                {/* Field Type */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Intelligence Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {FIELD_TYPES.map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setEditFieldType(t)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all border italic ${editFieldType === t ? 'bg-gold-main text-black border-gold-main shadow-md' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-gold-main/30'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dropdown Options */}
                                {editFieldType === 'Dropdown' && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic">Selection Node Options <span className="text-slate-300 font-normal normal-case">(comma-separated)</span></label>
                                        <input
                                            type="text"
                                            className="input-field bg-white text-black font-black italic uppercase"
                                            placeholder="e.g. Value 1, Value 2, Value 3"
                                            value={editFieldOptions}
                                            onChange={e => setEditFieldOptions(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Required toggle */}
                                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-gold-main/20">
                                    <div>
                                        <p className="text-xs font-black text-black italic uppercase tracking-widest">Strict Validation</p>
                                        <p className="text-[10px] text-slate-400 italic font-bold uppercase">Enforce data entry on this node</p>
                                    </div>
                                    <button
                                        onClick={() => setEditFieldRequired(!editFieldRequired)}
                                        className={`w-12 h-6 rounded-full transition-all relative border ${editFieldRequired ? 'bg-gold-main/20 border-gold-main/40' : 'bg-slate-200 border-slate-300'}`}
                                    >
                                        <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full shadow-lg transition-all ${editFieldRequired ? 'left-6 bg-gold-main' : 'left-0.5 bg-white'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button onClick={() => setEditingField(null)} className="flex-1 py-3 text-[10px] font-black text-slate-400 hover:text-black uppercase tracking-[0.2em] italic">Abort</button>
                                <button
                                    onClick={handleEditField}
                                    disabled={!editFieldName.trim() || savingField}
                                    className="flex-1 btn-primary py-3 disabled:opacity-40 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] italic"
                                >
                                    {savingField ? <RefreshCcw className="animate-spin" size={16} /> : <Check size={16} />} Seal Field
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
