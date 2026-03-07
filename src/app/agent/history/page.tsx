'use client';

import React, { useState, useEffect } from 'react';
import {
    History,
    MapPin,
    Calendar,
    Database,
    RefreshCcw,
    LayoutGrid
} from 'lucide-react';
import api from '@/lib/api';
import AgentNav from '@/components/AgentNav';
import TrackingStatus from '@/components/TrackingStatus';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

export default function AgentHistoryPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('agent/my-submissions');
            setRecords(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col">
            <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 sticky top-0 z-10">
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <History size={24} className="text-indigo-600" />
                    My Submissions
                </h1>
                <p className="text-xs text-slate-500 mt-1">Your recent field collection activity.</p>
            </div>

            <TrackingStatus />

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <RefreshCcw className="w-8 h-8 text-indigo-600 animate-spin" />
                        <p className="text-slate-400 text-sm">Fetching history...</p>
                    </div>
                ) : records.length === 0 ? (
                    <div className="premium-card p-10 text-center bg-white border-dashed border-2">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Database size={32} />
                        </div>
                        <p className="text-slate-500 font-bold">No submissions yet</p>
                        <p className="text-xs text-slate-400 mt-1">Your data will appear here once you submit your first record.</p>
                    </div>
                ) : (
                    records.map((record: any) => (
                        <div key={record._id} className="premium-card bg-white p-5 flex items-start gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                <LayoutGrid size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-slate-900 truncate">{record.category_id?.name || 'Unknown Category'}</h3>
                                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase">Synced</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-3">{record.subcategory_id?.name || 'General'}</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Calendar size={12} />
                                        <span className="text-[10px] font-medium">{formatDate(record.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <MapPin size={12} />
                                        <span className="text-[10px] font-medium">Captured</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AgentNav />
        </div>
    );
}
