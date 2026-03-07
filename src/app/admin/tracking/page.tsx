'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Users, Navigation, RefreshCcw, AlertCircle, Clock, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import dynamic from 'next/dynamic';
import { formatTime, formatRelativeTime } from '@/lib/utils';

interface TrackingMapProps {
    agents: any[];
    selectedAgent: any;
    onSelectAgent: (agent: any) => void;
}

// Dynamically import the map to avoid SSR issues with Leaflet
const TrackingMap = dynamic<TrackingMapProps>(() => import('./TrackingMap'), {
    ssr: false,
    loading: () => (
        <div className="flex-1 flex flex-col items-center justify-center bg-black/5 rounded-2xl border border-gold-main/10 animate-pulse">
            <RefreshCcw className="animate-spin text-gold-dark mb-4" size={32} />
            <p className="text-gold-dark/40 text-[10px] font-black uppercase tracking-widest italic">Initializing Geospatial Nexus...</p>
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
        // Auto-refresh every 10 seconds for real-time feel
        const interval = setInterval(fetchTracking, 10000);
        return () => clearInterval(interval);
    }, [fetchTracking]);

    const isValidCoord = (loc: any) => {
        if (!loc) return false;
        const lat = Number(loc.latitude);
        const lng = Number(loc.longitude);
        return !isNaN(lat) && !isNaN(lng) && loc.latitude !== null && loc.longitude !== null;
    };

    const agentsWithLocation = agents.filter(a => isValidCoord(a.lastLocation));
    const agentsWithoutLocation = agents.filter(a => !isValidCoord(a.lastLocation));

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-black italic tracking-tight uppercase">Field Intelligence</h1>
                    <p className="text-slate-500 mt-1 text-sm italic">Real-time telemetry and geospatial positioning of operational assets.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className={`flex items-center gap-2.5 px-4 py-2 ${loading ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'} rounded-full border font-black text-[10px] uppercase tracking-widest italic transition-all duration-500`}>
                        <div className={`w-2 h-2 ${loading ? 'bg-indigo-500 animate-spin rounded-sm' : 'bg-emerald-500 animate-pulse rounded-full'} shadow-[0_0_8px_rgba(16,185,129,0.4)]`}></div>
                        {loading ? 'Resyncing...' : 'Live Feed'}
                    </div>
                    {mounted && (
                        <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] italic">
                                Sync: {formatTime(lastRefresh, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={fetchTracking}
                        disabled={loading}
                        className="p-3 bg-white border border-slate-200 rounded-xl text-gold-dark hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                    >
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="lg:hidden flex gap-2">
                        <button
                            onClick={() => setSelectedAgent(null)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic border shadow-sm ${!selectedAgent ? 'bg-gold-main text-white border-gold-main' : 'bg-white border-slate-100 text-slate-400'}`}
                        >
                            Log
                        </button>
                        {agentsWithLocation.length > 0 && (
                            <button
                                onClick={() => !selectedAgent && setSelectedAgent(agentsWithLocation[0])}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic border shadow-sm ${selectedAgent ? 'bg-gold-main text-white border-gold-main' : 'bg-white border-slate-100 text-slate-400'}`}
                            >
                                Mapping
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-black uppercase tracking-widest italic">
                    <AlertCircle size={20} className="shrink-0" />
                    Signal Interrupt: {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-[500px]">
                {/* Agent List */}
                <div className={`bg-white premium-card border border-slate-100 flex flex-col overflow-hidden shadow-2xl ${selectedAgent ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <Users size={18} className="text-gold-dark/60" />
                            <h3 className="text-xs font-black text-gold-dark uppercase tracking-[0.2em] italic">Tactical Assets</h3>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{agents.length} Nodes</span>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                        {loading ? (
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="p-5 animate-pulse">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex-shrink-0" />
                                        <div className="flex-1 space-y-3">
                                            <div className="h-3 bg-slate-50 rounded w-3/4" />
                                            <div className="h-2 bg-slate-50 rounded w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : agents.length === 0 ? (
                            <div className="p-12 text-center text-slate-200 text-[10px] font-black uppercase tracking-widest italic">No Signal Detected</div>
                        ) : (
                            <>
                                {agentsWithLocation.map((agent, i) => (
                                    <motion.div
                                        key={agent._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedAgent(agent)}
                                        className={`p-5 cursor-pointer transition-all group border-l-2 ${selectedAgent?._id === agent._id ? 'bg-gold-main/5 border-gold-main' : 'hover:bg-slate-50 border-transparent'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative flex-shrink-0">
                                                <div className="w-12 h-12 rounded-xl bg-gold-main/10 flex items-center justify-center text-gold-dark font-black border border-gold-main/20 overflow-hidden shadow-sm uppercase italic">
                                                    {agent.name.charAt(0)}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${agent.is_active ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.4)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.4)]'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-black italic tracking-tight truncate group-hover:text-gold-dark transition-colors uppercase">{agent.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-gold-dark font-black uppercase tracking-widest truncate max-w-[100px] italic">{agent.lastLocation.category}</p>
                                                    <span className="w-1 h-1 bg-slate-100 rounded-full" />
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1 italic">
                                                        <Clock size={10} className="stroke-[3px]" />
                                                        {formatRelativeTime(agent.lastLocation.lastSeen)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Navigation size={18} className={`flex-shrink-0 transition-all ${selectedAgent?._id === agent._id ? 'text-gold-dark scale-110' : 'text-slate-400 group-hover:text-gold-dark/40'}`} />
                                        </div>
                                    </motion.div>
                                ))}
                                {agentsWithoutLocation.length > 0 && (
                                    <>
                                        <div className="px-5 py-3 bg-slate-50 border-y border-slate-100">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 italic">Offline / Silent Nodes</p>
                                        </div>
                                        {agentsWithoutLocation.map((agent) => (
                                            <div key={agent._id} className="p-5 opacity-40 grayscale group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 font-black border border-slate-100 uppercase italic">
                                                        {agent.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-black text-slate-400 italic tracking-tight truncate uppercase">{agent.name}</p>
                                                        <p className="text-[10px] text-slate-300 uppercase tracking-widest font-black mt-1 italic">No GPS Signal Detected</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    {/* Bottom Padding for scroll */}
                    <div className="h-12 bg-gradient-to-t from-slate-50 to-transparent flex-shrink-0" />
                </div>

                {/* Map Container */}
                <div className={`lg:col-span-3 bg-white premium-card border border-slate-100 overflow-hidden flex flex-col shadow-2xl relative ${selectedAgent ? 'flex' : 'hidden lg:flex'}`} style={{ minHeight: '500px', height: '100%' }}>
                    {!loading && agentsWithLocation.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center flex-col gap-6 text-center p-12">
                            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-gold-dark/40 border border-slate-100 shadow-sm animate-pulse">
                                <MapPin size={48} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-black italic tracking-tight uppercase">Geospatial Data Missing</h3>
                                <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mt-3 max-w-sm italic">Nodes will materialize once encrypted GPS packets are received from field assets.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 relative">
                            {/* Modern Overlay HUD for the map */}
                            <div className="absolute top-6 left-6 z-[1000] hidden md:block">
                                <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gold-main/10 rounded-xl flex items-center justify-center text-gold-dark">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gold-dark font-black uppercase tracking-[0.2em] italic">Network Status</p>
                                        <p className="text-sm text-black font-black italic mt-0.5 uppercase tracking-tight">{agentsWithLocation.length} Assets Online</p>
                                    </div>
                                </div>
                            </div>
                            <TrackingMap agents={agentsWithLocation} selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
