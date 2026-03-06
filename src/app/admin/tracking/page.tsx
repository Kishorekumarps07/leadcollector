'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Users, Navigation, RefreshCcw, AlertCircle, Clock, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import dynamic from 'next/dynamic';

interface TrackingMapProps {
    agents: any[];
    selectedAgent: any;
    onSelectAgent: (agent: any) => void;
}

// Dynamically import the map to avoid SSR issues with Leaflet
const TrackingMap = dynamic<TrackingMapProps>(() => import('./TrackingMap'), {
    ssr: false,
    loading: () => (
        <div className="flex-1 flex items-center justify-center bg-slate-100 rounded-2xl">
            <div className="text-center">
                <RefreshCcw className="animate-spin text-indigo-600 mx-auto mb-3" size={28} />
                <p className="text-slate-500 text-sm font-medium">Loading map...</p>
            </div>
        </div>
    )
});

export default function TrackingPage() {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAgent, setSelectedAgent] = useState<any>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const fetchTracking = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('admin/tracking');
            setAgents(res.data.data || []);
            setLastRefresh(new Date());
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load tracking data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTracking();
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchTracking, 60000);
        return () => clearInterval(interval);
    }, [fetchTracking]);

    const agentsWithLocation = agents.filter(a => a.lastLocation);
    const agentsWithoutLocation = agents.filter(a => !a.lastLocation);

    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Agent Tracking</h1>
                    <p className="text-slate-500 mt-1 text-sm">Live field locations from latest submissions.</p>
                </div>
                <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full font-bold text-[10px] lg:text-xs">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Live
                    </div>
                    {mounted && (
                        <span className="text-[10px] lg:text-xs text-slate-400 font-medium">
                            {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <button
                        onClick={fetchTracking}
                        disabled={loading}
                        className="flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all font-bold shadow-sm disabled:opacity-50"
                    >
                        <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setSelectedAgent(null)}
                        className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${!selectedAgent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-500'}`}
                    >
                        List
                    </button>
                    {agentsWithLocation.length > 0 && (
                        <button
                            onClick={() => !selectedAgent && setSelectedAgent(agentsWithLocation[0])}
                            className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedAgent ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-500'}`}
                        >
                            Map
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
                {/* Agent List */}
                <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden ${selectedAgent ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-slate-400" />
                            <h3 className="font-bold text-sm text-slate-900">Field Agents</h3>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{agents.length} total</span>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="p-4 animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-slate-100 rounded w-3/4" />
                                            <div className="h-2 bg-slate-100 rounded w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : agents.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">No agents found.</div>
                        ) : (
                            <>
                                {agentsWithLocation.map((agent, i) => (
                                    <motion.div
                                        key={agent._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedAgent(agent)}
                                        className={`p-4 cursor-pointer transition-all group ${selectedAgent?._id === agent._id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    className="w-10 h-10 rounded-full bg-slate-100"
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=6366f1&color=fff`}
                                                    alt=""
                                                />
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${agent.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{agent.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                    <Clock size={9} />
                                                    {new Date(agent.lastLocation.lastSeen).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-[10px] text-indigo-500 font-bold truncate">{agent.lastLocation.category}</p>
                                            </div>
                                            <Navigation size={14} className={`flex-shrink-0 transition-colors ${selectedAgent?._id === agent._id ? 'text-indigo-600' : 'text-slate-300 group-hover:text-indigo-400'}`} />
                                        </div>
                                    </motion.div>
                                ))}
                                {agentsWithoutLocation.length > 0 && (
                                    <>
                                        <div className="px-4 py-2 bg-slate-50">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Location Data</p>
                                        </div>
                                        {agentsWithoutLocation.map((agent) => (
                                            <div key={agent._id} className="p-4 opacity-50">
                                                <div className="flex items-center gap-3">
                                                    <img className="w-10 h-10 rounded-full bg-slate-100 grayscale" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=cbd5e1&color=fff`} alt="" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-700 truncate">{agent.name}</p>
                                                        <p className="text-[10px] text-slate-400">No submissions with GPS</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Map */}
                <div className={`lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col ${selectedAgent ? 'flex' : 'hidden lg:flex'}`} style={{ minHeight: '400px', height: '100%' }}>
                    {agentsWithLocation.length === 0 && !loading ? (
                        <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center p-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                                <MapPin size={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700">No Location Data Available</h3>
                                <p className="text-sm text-slate-400 mt-1 max-w-sm">Agents appear on the map once they submit data with GPS coordinates enabled.</p>
                            </div>
                        </div>
                    ) : (
                        <TrackingMap agents={agentsWithLocation} selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} />
                    )}
                </div>
            </div>
        </div>
    );
}
