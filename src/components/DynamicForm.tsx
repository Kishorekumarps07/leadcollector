'use client';

import React, { useState } from 'react';
import {
    Camera,
    MapPin,
    ChevronDown,
    Calendar,
    Phone,
    Mail,
    Hash,
    Type,
    Loader2,
    ArrowRight
} from 'lucide-react';

interface Field {
    _id: string;
    field_name: string;
    field_type: 'Text' | 'Number' | 'Phone' | 'Email' | 'Dropdown' | 'Checkbox' | 'Date' | 'Textarea' | 'Location' | 'Image upload';
    required: boolean;
    options?: string[];
}

interface DynamicFormProps {
    fields: Field[];
    onSubmit: (values: Record<string, any>) => void;
    loading: boolean;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ fields, onSubmit, loading }) => {
    const [formData, setFormData] = useState<Record<string, any>>({});

    const handleChange = (fieldId: string, value: any) => {
        setFormData((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const renderField = (field: Field) => {
        const base = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all placeholder:text-slate-400 mt-1";

        switch (field.field_type) {
            case 'Text':
                return (
                    <input
                        type="text"
                        required={field.required}
                        className={base}
                        placeholder={`Enter ${field.field_name}`}
                        onChange={(e) => handleChange(field._id, e.target.value)}
                    />
                );
            case 'Number':
                return (
                    <input
                        type="number"
                        required={field.required}
                        className={base}
                        placeholder="0"
                        onChange={(e) => handleChange(field._id, e.target.value)}
                    />
                );
            case 'Phone':
                return (
                    <input
                        type="tel"
                        required={field.required}
                        className={base}
                        placeholder="+91 00000 00000"
                        onChange={(e) => handleChange(field._id, e.target.value)}
                    />
                );
            case 'Email':
                return (
                    <input
                        type="email"
                        required={field.required}
                        className={base}
                        placeholder="email@example.com"
                        onChange={(e) => handleChange(field._id, e.target.value)}
                    />
                );
            case 'Dropdown':
                return (
                    <div className="relative">
                        <select
                            required={field.required}
                            className={`${base} appearance-none pr-10 cursor-pointer`}
                            onChange={(e) => handleChange(field._id, e.target.value)}
                        >
                            <option value="">Select option</option>
                            {field.options?.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                );
            case 'Date':
                return (
                    <input
                        type="date"
                        required={field.required}
                        className={base}
                        onChange={(e) => handleChange(field._id, e.target.value)}
                    />
                );
            case 'Textarea':
                return (
                    <textarea
                        required={field.required}
                        className={`${base} min-h-[100px] py-3`}
                        placeholder={`Enter ${field.field_name}...`}
                        onChange={(e) => handleChange(field._id, e.target.value)}
                    />
                );
            case 'Checkbox':
                return (
                    <div className="flex items-center gap-3 mt-2">
                        <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            onChange={(e) => handleChange(field._id, e.target.checked)}
                        />
                        <span className="text-sm text-slate-600">Yes / No</span>
                    </div>
                );
            case 'Image upload':
                return (
                    <div className="mt-1 flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                            <Camera className="w-8 h-8 mb-2 text-slate-300" />
                            <p className="text-sm text-slate-400 font-medium">Tap to upload image</p>
                            <input type="file" className="hidden" accept="image/*" />
                        </label>
                    </div>
                );
            case 'Location':
                return (
                    <div className="mt-1 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3 text-indigo-700">
                            <MapPin size={18} />
                            <span className="text-sm font-bold">GPS location will be captured automatically</span>
                        </div>
                        <div className="px-2 py-1 bg-white text-[10px] font-bold uppercase tracking-wider text-indigo-600 rounded-lg shadow-sm">Auto</div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-8">
                {fields.map((field) => (
                    <div key={field._id} className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-900 flex items-center gap-1">
                            {field.field_name}
                            {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {renderField(field)}
                    </div>
                ))}
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 mt-12 flex items-center justify-center gap-3 shadow-lg shadow-indigo-200"
            >
                {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : (
                    <>
                        <span className="font-bold">Submit Record</span>
                        <ArrowRight size={18} />
                    </>
                )}
            </button>
        </form>
    );
};

export default DynamicForm;
