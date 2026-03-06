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
    AlertTriangle
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
        <div className="flex flex-col h-full gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Categories & Fields</h1>
                    <p className="text-slate-500 mt-1 text-sm">Create form categories and configure their fields.</p>
                </div>
                <button onClick={() => setShowAddCategory(true)} className="btn-primary py-2.5 px-5 flex items-center gap-2">
                    <Plus size={18} /> New Category
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
                {/* Categories Column */}
                <div className="bg-white premium-card flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">Categories</h3>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{categories.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {categories.length === 0 && (
                            <p className="text-center text-sm text-slate-400 py-10 italic">No categories yet.</p>
                        )}
                        {categories.map((cat) => (
                            <div
                                key={cat._id}
                                className={`w-full p-4 rounded-xl flex items-center justify-between transition-all text-left group relative ${selectedCategory?._id === cat._id
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <button onClick={() => handleSelectCategory(cat)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedCategory?._id === cat._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        <LayoutGridIcon size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold truncate">{cat.name}</h4>
                                        <p className="text-[10px] opacity-60 line-clamp-1">{cat.description || 'No description'}</p>
                                    </div>
                                </button>

                                {/* 3-dot menu */}
                                <div className="relative flex-shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => setActiveMenuId(activeMenuId === cat._id ? null : cat._id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <MoreVertical size={14} />
                                    </button>

                                    <AnimatePresence>
                                        {activeMenuId === cat._id && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                                className="absolute right-0 top-full mt-1 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => { setEditingCat(cat); setEditName(cat.name); setEditDesc(cat.description || ''); setActiveMenuId(null); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                                >
                                                    <Pencil size={14} className="text-slate-400" /> Edit
                                                </button>
                                                <button
                                                    onClick={() => { setDeletingCatId(cat._id); setActiveMenuId(null); }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fields Column */}
                <div className="lg:col-span-2 bg-white premium-card flex flex-col overflow-hidden">
                    {selectedCategory ? (
                        <>
                            {/* Fields Header */}
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-100">
                                        <Settings2 size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{selectedCategory.name}</h3>
                                        <p className="text-xs text-slate-500">{fields.length} fields configured</p>
                                    </div>
                                </div>
                                {!showQuickAdd && (
                                    <button
                                        onClick={() => setShowQuickAdd(true)}
                                        className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl transition-all"
                                    >
                                        <Plus size={14} /> Add Field
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                                {/* Existing Fields */}
                                {fields.map((field) => (
                                    <motion.div
                                        key={field._id}
                                        layout
                                        className={`p-4 bg-white border rounded-xl flex items-center justify-between transition-all group ${field.is_system
                                            ? 'border-indigo-100 bg-indigo-50/30'
                                            : 'border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {field.is_system
                                                ? <div className="text-indigo-300"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></div>
                                                : <GripVertical className="text-slate-300 group-hover:text-indigo-400 cursor-grab" size={20} />}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-bold text-slate-900">{field.field_name}</h4>
                                                    {field.required && <span className="text-[10px] font-bold text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">Required</span>}
                                                    {field.is_system && <span className="text-[10px] font-bold text-indigo-500 uppercase bg-indigo-50 px-1.5 py-0.5 rounded-full">System</span>}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">{field.field_type}</span>
                                                    {field.field_type === 'Dropdown' && field.options?.length > 0 && (
                                                        <span className="text-slate-400">• {field.options.join(', ')}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        {field.is_system ? (
                                            <span className="text-[10px] text-slate-400 italic px-2">Mandatory</span>
                                        ) : (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => openEditField(field)}
                                                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Edit field"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    onClick={() => field._id && handleDeleteField(field._id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
                                            className="border-2 border-indigo-300 border-dashed rounded-2xl p-5 space-y-4 bg-indigo-50/30"
                                        >
                                            {/* Field Name */}
                                            <input
                                                ref={nameRef}
                                                type="text"
                                                placeholder="Field name (e.g. Manager Name)"
                                                className="input-field w-full font-bold text-slate-800 text-base"
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
                                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${quickType === t
                                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'}`}
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
                                                        className={`w-10 h-5 rounded-full transition-all relative ${quickRequired ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${quickRequired ? 'left-5' : 'left-0.5'}`} />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">Required</span>
                                                </label>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setShowQuickAdd(false); setQuickName(''); setQuickType('Text'); setQuickOptions(''); }}
                                                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveField}
                                                        disabled={!quickName.trim() || saving}
                                                        className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-2 transition-all"
                                                    >
                                                        <Check size={16} />
                                                        {saving ? 'Saving...' : 'Save Field'}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {fields.length === 0 && !showQuickAdd && (
                                    <div className="py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <ListTree size={32} />
                                        </div>
                                        <p className="text-sm text-slate-400 font-medium">No fields yet for this category.</p>
                                        <button onClick={() => setShowQuickAdd(true)} className="mt-4 text-indigo-600 text-sm font-bold hover:underline">
                                            + Add your first field
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <Settings size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Select a Category</h3>
                            <p className="text-slate-500 mt-2 max-w-xs text-sm">Pick a category on the left to configure its form fields.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Category Modal */}
            <AnimatePresence>
                {showAddCategory && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowAddCategory(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900">New Category</h3>
                                <button onClick={() => setShowAddCategory(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Category Name</label>
                                    <input type="text" placeholder="e.g. Vendors, Gyms, Leads..." className="input-field" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} autoFocus />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Description <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
                                    <input type="text" placeholder="What kind of data does this collect?" className="input-field" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} />
                                </div>
                            </div>
                            <div className="px-8 py-5 bg-slate-50 flex gap-4">
                                <button onClick={() => setShowAddCategory(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                <button onClick={handleAddCategory} disabled={!newCatName.trim()} className="flex-1 btn-primary py-3 disabled:opacity-40">Create</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Edit Category Modal */}
                {editingCat && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setEditingCat(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900">Edit Category</h3>
                                <button onClick={() => setEditingCat(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Category Name</label>
                                    <input type="text" className="input-field" value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEditCategory()} autoFocus />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Description</label>
                                    <input type="text" className="input-field" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                                </div>
                            </div>
                            <div className="px-8 py-5 bg-slate-50 flex gap-4">
                                <button onClick={() => setEditingCat(null)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                <button onClick={handleEditCategory} disabled={!editName.trim()} className="flex-1 btn-primary py-3 disabled:opacity-40 flex items-center justify-center gap-2"><Check size={16} /> Save Changes</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Delete Confirm Modal */}
                {deletingCatId && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setDeletingCatId(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Delete Category?</h3>
                                <p className="text-sm text-slate-500">This will permanently delete the category, all its fields, and <span className="font-bold text-red-600">all associated records</span>. This cannot be undone.</p>
                            </div>
                            <div className="px-8 py-5 bg-slate-50 flex gap-4">
                                <button onClick={() => setDeletingCatId(null)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                <button onClick={() => handleDeleteCategory(deletingCatId)} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"><Trash2 size={16} /> Delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {/* Edit Field Modal */}
                {editingField && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setEditingField(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Edit Field</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Update field settings</p>
                                </div>
                                <button onClick={() => setEditingField(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                            </div>
                            <div className="p-8 space-y-5">
                                {/* Field Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Field Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={editFieldName}
                                        onChange={e => setEditFieldName(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                {/* Field Type */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Field Type</label>
                                    <div className="flex flex-wrap gap-2">
                                        {FIELD_TYPES.map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setEditFieldType(t)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${editFieldType === t ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dropdown Options */}
                                {editFieldType === 'Dropdown' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Options <span className="text-slate-400 font-normal normal-case">(comma-separated)</span></label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. Home services, Online services, Retail"
                                            value={editFieldOptions}
                                            onChange={e => setEditFieldOptions(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Required toggle */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Required Field</p>
                                        <p className="text-xs text-slate-400">Agents must fill this field</p>
                                    </div>
                                    <button
                                        onClick={() => setEditFieldRequired(!editFieldRequired)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${editFieldRequired ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${editFieldRequired ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="px-8 py-5 bg-slate-50 flex gap-4">
                                <button onClick={() => setEditingField(null)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                                <button
                                    onClick={handleEditField}
                                    disabled={!editFieldName.trim() || savingField}
                                    className="flex-1 btn-primary py-3 disabled:opacity-40 flex items-center justify-center gap-2"
                                >
                                    {savingField ? <ListTree className="animate-spin" size={16} /> : <Check size={16} />} Save Field
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
