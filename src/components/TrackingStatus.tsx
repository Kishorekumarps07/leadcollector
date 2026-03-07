'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export default function TrackingStatus() {
    const { trackingStatus, permissionState, triggerTracking, user } = useAuth();

    if (!user || user.role !== 'Field Agent') return null;

    return (
        <AnimatePresence>
            {permissionState === 'denied' && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="bg-red-50 border-b border-red-100 p-4">
                        <div className="max-w-md mx-auto flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Tracking Blocked</p>
                                <p className="text-xs text-red-500 font-medium leading-tight">Location permission is required for field operations.</p>
                            </div>
                            <button
                                onClick={() => {
                                    alert("Please enable location permissions in your browser settings and try again.");
                                    triggerTracking();
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md"
                            >
                                Unlock
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {permissionState === 'prompt' && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="bg-indigo-50 border-b border-indigo-100 p-4 shadow-sm">
                        <div className="max-w-md mx-auto flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Zap size={20} className="text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Connect GPS</p>
                                <p className="text-xs text-indigo-500 font-medium leading-tight">Activate real-time telemetry to start syncing.</p>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={triggerTracking}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
                            >
                                Activate
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}

            {permissionState === 'granted' && (trackingStatus === 'active' || trackingStatus === 'syncing') && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-md mx-auto px-6 py-2 flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Telemetry Active</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-300 font-bold uppercase overflow-hidden max-w-[150px]">
                        <MapPin size={10} className="text-indigo-400" />
                        <span className="truncate">
                            {trackingStatus === 'syncing' ? 'GPS Syncing...' : 'Online & Syncing'}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
