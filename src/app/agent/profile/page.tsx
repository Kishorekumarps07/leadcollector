'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    User,
    Mail,
    Shield,
    LogOut,
    CheckCircle2,
    BarChart3,
    Clock,
    MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import AgentNav from '@/components/AgentNav';
import TrackingStatus from '@/components/TrackingStatus';

export default function AgentProfilePage() {
    const { user, logout } = useAuth();

    const stats = [
        { label: 'Submissions', value: '—', icon: BarChart3, color: 'text-indigo-600 bg-indigo-50' },
        { label: 'This Week', value: '—', icon: Clock, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Locations', value: '—', icon: MapPin, color: 'text-violet-600 bg-violet-50' },
    ];

    return (
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100">
                <h1 className="text-xl font-bold text-slate-900">My Profile</h1>
                <p className="text-xs text-slate-500 mt-1">Your account details and session info.</p>
            </div>

            <TrackingStatus />

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Avatar Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="premium-card bg-white p-6 flex items-center gap-5"
                >
                    <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-black uppercase shadow-lg shadow-indigo-200 flex-shrink-0">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xl font-black text-slate-900 truncate">{user?.name || 'Agent'}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                <CheckCircle2 size={10} /> Active
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                                <Shield size={10} /> {user?.role || 'Field Agent'}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                    {stats.map((stat) => (
                        <div key={stat.label} className="premium-card bg-white p-4 text-center">
                            <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                                <stat.icon size={16} />
                            </div>
                            <p className="text-lg font-black text-slate-900">{stat.value}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Account Details */}
                <div className="premium-card bg-white overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Information</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                        <div className="px-5 py-4 flex items-center gap-4">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                <User size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Full Name</p>
                                <p className="text-sm font-bold text-slate-900">{user?.name || '—'}</p>
                            </div>
                        </div>
                        <div className="px-5 py-4 flex items-center gap-4">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                <Mail size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
                                <p className="text-sm font-bold text-slate-900">{user?.email || '—'}</p>
                            </div>
                        </div>
                        <div className="px-5 py-4 flex items-center gap-4">
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                <Shield size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Role</p>
                                <p className="text-sm font-bold text-slate-900">{user?.role || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signout Button */}
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 active:scale-[0.98] transition-all"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>

                <p className="text-center text-[10px] text-slate-300 pb-4">SalesForce v1.0 • MrCoach Fitness Center</p>
            </div>

            <AgentNav />
        </div>
    );
}
