'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    LayoutGrid,
    MapPin,
    CheckCircle2,
    ArrowLeft,
    Users,
    Dumbbell,
    ShoppingBag,
    Timer,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import DynamicForm from '@/components/DynamicForm';
import AgentNav from '@/components/AgentNav';
import { useRouter } from 'next/navigation';

interface Category {
    _id: string;
    name: string;
    description: string;
}

interface Subcategory {
    _id: string;
    name: string;
}

export default function SubmitDataPage() {
    const [step, setStep] = useState(1); // 1: Category, 2: Subcategory, 3: Form
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [fields, setFields] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('admin/categories');
            setCategories(res.data.data);
        } catch (err: any) {
            setError('Failed to load categories. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = async (category: Category) => {
        setSelectedCategory(category);
        setLoading(true);
        setError('');
        try {
            const subRes = await api.get(`admin/categories/${category._id}/subcategories`);
            const subData = subRes.data.data;

            if (subData && subData.length > 0) {
                setSubcategories(subData);
                setStep(2);
            } else {
                // Skip directly to form if no subcategories
                setSubcategories([]);
                setSelectedSubcategory(null);
                const fieldRes = await api.get(`admin/categories/${category._id}/fields`);
                setFields(fieldRes.data.data);
                setStep(3);
            }
        } catch (err: any) {
            setError('Error loading category details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubcategorySelect = async (sub: Subcategory) => {
        setSelectedSubcategory(sub);
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`admin/categories/${selectedCategory?._id}/fields`);
            setFields(res.data.data);
            setStep(3);
        } catch (err: any) {
            setError('Error loading form fields.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        setError('');
        try {
            // Capture GPS
            let location = { latitude: 0, longitude: 0 };
            try {
                if ("geolocation" in navigator) {
                    const pos: any = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                    });
                    location = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                }
            } catch (locErr) {
                console.warn("Location access denied or failed:", locErr);
            }

            await api.post('agent/submit', {
                category_id: selectedCategory?._id,
                subcategory_id: selectedSubcategory?._id || undefined,
                ...location,
                values
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Submission failed. Please try again.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-white">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Submission Successful</h2>
                    <p className="text-slate-500 mt-2 mb-8">Data has been recorded with GPS coordinates.</p>
                    <button
                        onClick={() => { setStep(1); setSuccess(false); setSelectedCategory(null); setSelectedSubcategory(null); }}
                        className="btn-primary"
                    >
                        Submit Another
                    </button>
                    <button
                        onClick={() => router.push('/agent/history')}
                        className="block w-full mt-4 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                        View My History
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 sticky top-0 z-10">
                <div className="flex items-center gap-4 mb-2">
                    {step > 1 && (
                        <button onClick={() => setStep(step - 1)} className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </button>
                    )}
                    <h1 className="text-xl font-bold text-slate-900">
                        {step === 1 ? 'Select Category' : step === 2 ? 'Select Subcategory' : (selectedSubcategory?.name || selectedCategory?.name)}
                    </h1>
                </div>
                <div className="flex gap-1.5 mt-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                    ))}
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                        <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
                        <p className="text-sm font-bold text-red-700">{error}</p>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            {loading ? (
                                <div className="flex justify-center py-20"><Timer className="animate-spin text-indigo-600" /></div>
                            ) : categories.length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <LayoutGrid size={32} />
                                    </div>
                                    <p className="text-slate-500 font-bold">No categories available</p>
                                    <p className="text-xs text-slate-400 mt-1">Please ask Admin to configure data categories.</p>
                                </div>
                            ) : categories.map((cat) => (
                                <button
                                    key={cat._id}
                                    onClick={() => handleCategorySelect(cat)}
                                    className="premium-card w-full p-5 flex items-center justify-between group active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                            {cat.name.includes('Client') ? <Users size={24} /> :
                                                cat.name.includes('Coach') ? <Dumbbell size={24} /> :
                                                    cat.name.includes('Shop') ? <ShoppingBag size={24} /> : <LayoutGrid size={24} />}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-900 truncate">{cat.name}</h3>
                                            <p className="text-xs text-slate-500 line-clamp-1">{cat.description || 'Data collection for ' + cat.name}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-3"
                        >
                            <div className="mb-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-3">
                                <div className="p-2 bg-indigo-600 text-white rounded-lg"><LayoutGrid size={16} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Selected Category</p>
                                    <p className="text-sm font-bold text-slate-900">{selectedCategory?.name}</p>
                                </div>
                            </div>
                            {subcategories.map((sub) => (
                                <button
                                    key={sub._id}
                                    onClick={() => handleSubcategorySelect(sub)}
                                    className="premium-card w-full p-5 flex items-center justify-between group bg-white active:scale-[0.98] transition-all"
                                >
                                    <span className="font-bold text-slate-900">{sub.name}</span>
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="pb-10"
                        >
                            <div className="mb-6 p-4 bg-slate-100 rounded-xl flex items-center gap-3">
                                <MapPin size={18} className="text-indigo-600" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capturing Secure GPS Coordinates...</p>
                            </div>
                            <DynamicForm fields={fields} onSubmit={handleSubmit} loading={submitting} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AgentNav />

        </div>
    );
}
