'use client';

import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon, Bell, Lock, User, Globe, Save, Database,
    Smartphone, MapPin, CheckCircle, AlertCircle, Loader2, RefreshCcw, Eye, EyeOff, Server, Users, FileText, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

// Toast notification component
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 right-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl ${type === 'success' ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-red-600 border-red-100'}`}
        >
            <div className={`p-2 rounded-xl scale-90 ${type === 'success' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <span className="text-xs font-black uppercase tracking-widest italic">{message}</span>
        </motion.div>
    );
}

// Toggle Switch component
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`w-14 h-7 rounded-full relative transition-all duration-500 shadow-inner flex items-center px-1 border ${checked ? 'bg-gold-main/20 border-gold-main/40' : 'bg-slate-100 border-slate-200'}`}
        >
            <motion.div
                animate={{ x: checked ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-5 h-5 rounded-full shadow-lg ${checked ? 'bg-gold-main bg-gradient-to-tr from-gold-main to-gold-dark shadow-gold-main/20' : 'bg-white'}`}
            />
        </button>
    );
}

export default function SettingsPage() {
    const { user, login } = useAuth();
    const [activeTab, setActiveTab] = useState('account');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // --- Account State ---
    const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: '' });

    // --- Security State ---
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });

    // --- General / Preferences (localStorage) ---
    const [prefs, setPrefs] = useState({
        enforceGps: true,
        mobileOnly: false,
        timezone: 'Asia/Kolkata',
    });

    // --- Notifications (localStorage) ---
    const [notifPrefs, setNotifPrefs] = useState({
        newSubmission: true,
        agentInactive: true,
        weeklyReport: false,
        exportComplete: true,
    });

    // --- System Stats ---
    const [sysStats, setSysStats] = useState<any>(null);
    const [sysLoading, setSysLoading] = useState(false);

    // Load preferences from localStorage
    useEffect(() => {
        const savedPrefs = localStorage.getItem('app_prefs');
        if (savedPrefs) setPrefs(JSON.parse(savedPrefs));
        const savedNotifs = localStorage.getItem('app_notifs');
        if (savedNotifs) setNotifPrefs(JSON.parse(savedNotifs));
    }, []);

    // Fetch profile on load
    useEffect(() => {
        api.get('admin/profile').then(res => {
            const u = res.data.data;
            setProfile({ name: u.name || '', email: u.email || '', phone: u.phone || '' });
        }).catch(() => { });
    }, []);

    // Fetch system stats when tab is opened
    useEffect(() => {
        if (activeTab === 'system') {
            setSysLoading(true);
            api.get('admin/system-stats')
                .then(res => setSysStats(res.data.data))
                .catch(() => showToast('Failed to load system stats', 'error'))
                .finally(() => setSysLoading(false));
        }
    }, [activeTab]);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.patch('admin/profile', profile);
            showToast('Operational profile synchronized', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Profile sync failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return showToast('Credential mismatch', 'error');
        }
        setSubmitting(true);
        try {
            await api.patch('admin/password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            showToast('Security protocol updated', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Protocol update failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrefsSave = () => {
        localStorage.setItem('app_prefs', JSON.stringify(prefs));
        showToast('System preferences committed', 'success');
    };

    const handleNotifSave = () => {
        localStorage.setItem('app_notifs', JSON.stringify(notifPrefs));
        showToast('Comms settings committed', 'success');
    };

    const tabs = [
        { id: 'account', label: 'Identity', icon: User },
        { id: 'privacy', label: 'Security', icon: Lock },
        { id: 'general', label: 'Operations', icon: SettingsIcon },
        { id: 'notifications', label: 'Comms', icon: Bell },
        { id: 'system', label: 'Nexus Info', icon: Database },
    ];

    const inputClass = "w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-gold-main/10 focus:border-gold-main/40 transition-all font-bold text-black shadow-sm text-sm italic uppercase placeholder:text-slate-300";
    const labelClass = "text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic pl-1";

    return (
        <div className="space-y-8 max-w-5xl">
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} />}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-black italic tracking-tight uppercase">Strategic Controls</h1>
                    <p className="text-slate-500 mt-1 text-sm italic">Configure organizational protocols and tactical parameters.</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-gold-dark uppercase tracking-widest italic">Encrypted Connection Active</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-4 lg:mt-8 items-start">
                {/* Sidebar Tabs - Horizontal Scroll on Mobile */}
                <div className="w-full lg:w-64 flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 gap-2 flex-shrink-0 custom-scrollbar no-scrollbar sticky top-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left whitespace-nowrap min-w-max lg:min-w-0 lg:w-full border italic ${activeTab === tab.id
                                ? 'bg-gold-main text-white shadow-2xl shadow-gold-main/20 font-black border-gold-main'
                                : 'bg-white text-slate-400 hover:text-gold-dark hover:bg-slate-50 border-slate-100'}`}
                        >
                            <tab.icon size={20} className={activeTab === tab.id ? 'stroke-[3px]' : 'opacity-40'} />
                            <span className="text-[11px] uppercase tracking-[0.15em] font-black">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 w-full mb-24">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white premium-card border border-slate-100 p-6 lg:p-10 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-main/5 blur-[100px] -z-10 rounded-full" />

                        {/* ACCOUNT TAB */}
                        {activeTab === 'account' && (
                            <form onSubmit={handleProfileSave} className="space-y-8">
                                <div className="border-b border-slate-100 pb-6">
                                    <h3 className="text-xl font-black text-black italic tracking-tight uppercase">Operator Identity</h3>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-black italic">Personal tactical markers and communication links.</p>
                                </div>
                                <div className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border-2 border-gold-main/20">
                                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'A')}&background=c5a059&color=ffffff&size=128&bold=true`} alt="avatar" className="w-full h-full" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-black italic tracking-tight uppercase">{profile.name}</p>
                                        <p className="text-[10px] text-gold-dark font-black uppercase tracking-[0.2em] italic mt-1 bg-gold-main/10 px-3 py-1 rounded-full border border-gold-main/20 inline-block tracking-widest">{user?.role}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={labelClass}>Call Sign (Alias)</label>
                                        <input type="text" className={inputClass} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelClass}>secure Line (Voice)</label>
                                        <input type="text" className={inputClass} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 00000 00000" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>Nexus Comms (Email)</label>
                                    <input type="email" className={inputClass} value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <button type="submit" disabled={submitting} className="btn-primary py-4 px-10 uppercase tracking-widest text-xs">
                                        {submitting ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
                                        Update Profile
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === 'privacy' && (
                            <form onSubmit={handlePasswordChange} className="space-y-8">
                                <div className="border-b border-slate-100 pb-6">
                                    <h3 className="text-xl font-black text-black italic tracking-tight uppercase">Encryption Override</h3>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-black italic">Rotation of tactical access keys and security nodes.</p>
                                </div>

                                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4">
                                    <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
                                    <p className="text-[10px] text-red-600 uppercase tracking-widest font-black italic leading-relaxed">Warning: Rotating access keys will terminate all active sessions. Ensure you have backup protocols in place.</p>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { label: 'Current Access Key', key: 'current', field: 'currentPassword' as const },
                                        { label: 'New Tactical Key', key: 'newPw', field: 'newPassword' as const },
                                        { label: 'Verify Authorization', key: 'confirm', field: 'confirmPassword' as const },
                                    ].map(({ label, key, field }) => (
                                        <div key={field} className="space-y-2">
                                            <label className={labelClass}>{label}</label>
                                            <div className="relative">
                                                <input
                                                    type={showPw[key as keyof typeof showPw] ? 'text' : 'password'}
                                                    required
                                                    className={`${inputClass} pr-14`}
                                                    value={passwords[field]}
                                                    onChange={e => setPasswords({ ...passwords, [field]: e.target.value })}
                                                    placeholder="••••••••"
                                                />
                                                <button type="button" onClick={() => setShowPw({ ...showPw, [key]: !showPw[key as keyof typeof showPw] })} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-gold-main transition-colors">
                                                    {showPw[key as keyof typeof showPw] ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button type="submit" disabled={submitting} className="btn-primary py-4 px-10 uppercase tracking-widest text-xs">
                                        {submitting ? <RefreshCcw size={18} className="animate-spin" /> : <Lock size={18} />}
                                        Seal Credentials
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <div className="space-y-10">
                                <div className="border-b border-slate-100 pb-6">
                                    <h3 className="text-xl font-black text-black italic tracking-tight uppercase">Operational Bounds</h3>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-black italic">Global system parameters and field deployment rules.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className={labelClass}>Standard Synchronization Zone</label>
                                    <div className="relative">
                                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <select
                                            className={`${inputClass} pl-12 appearance-none cursor-pointer`}
                                            value={prefs.timezone}
                                            onChange={e => setPrefs({ ...prefs, timezone: e.target.value })}
                                        >
                                            <option value="Asia/Kolkata">(GMT+05:30) India Standard Time</option>
                                            <option value="UTC">(GMT+00:00) UTC</option>
                                            <option value="America/New_York">(GMT-05:00) Eastern Time</option>
                                            <option value="Europe/London">(GMT+01:00) London</option>
                                            <option value="Asia/Dubai">(GMT+04:00) Dubai</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-gold-dark uppercase tracking-[0.2em] italic mb-4">Deployment Protocols</h4>
                                    {[
                                        { key: 'enforceGps', icon: MapPin, label: 'Geo-Verification Enforced', desc: 'Secure location lock required for all intelligence packets.' },
                                        { key: 'mobileOnly', icon: Smartphone, label: 'Mobile-Tactical Interface Only', desc: 'Restricts submission vectors to verified handheld hardware.' },
                                    ].map(({ key, icon: Icon, label, desc }) => (
                                        <div key={key} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:border-gold-main/20 transition-all shadow-sm">
                                            <div className="flex items-center gap-5">
                                                <div className="p-4 bg-gold-main/5 rounded-2xl text-gold-dark border border-gold-main/10 shadow-sm group-hover:scale-110 transition-transform"><Icon size={24} /></div>
                                                <div>
                                                    <p className="text-sm font-black text-black italic uppercase">{label}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1 max-w-xs italic">{desc}</p>
                                                </div>
                                            </div>
                                            <Toggle checked={prefs[key as keyof typeof prefs] as boolean} onChange={() => setPrefs({ ...prefs, [key]: !prefs[key as keyof typeof prefs] })} />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button onClick={handlePrefsSave} className="btn-primary py-4 px-10 uppercase tracking-widest text-xs">
                                        <Save size={18} /> Commit Protocols
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-10">
                                <div className="border-b border-slate-100 pb-6">
                                    <h3 className="text-xl font-black text-black italic tracking-tight uppercase">Comms Frequency</h3>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-black italic">Signal relay settings and intelligence report alerts.</p>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { key: 'newSubmission', icon: FileText, label: 'Intelligence Packet Alert', desc: 'Instant relay when fresh field data is uploaded.' },
                                        { key: 'agentInactive', icon: Users, label: 'Silent Node Warning', desc: 'Critical alert if operator signal is lost for > 24h.' },
                                        { key: 'weeklyReport', icon: Bell, label: 'Strategic Nexus Summary', desc: 'Consolidated intelligence brief delivered weekly.' },
                                        { key: 'exportComplete', icon: Database, label: 'Data Extraction sync', desc: 'Confirmation when major data nodes are offloaded.' },
                                    ].map(({ key, icon: Icon, label, desc }) => (
                                        <div key={key} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:border-gold-main/20 transition-all shadow-sm">
                                            <div className="flex items-center gap-5">
                                                <div className="p-4 bg-gold-main/5 rounded-2xl text-gold-dark border border-gold-main/10 shadow-sm group-hover:scale-110 transition-transform"><Icon size={24} /></div>
                                                <div>
                                                    <p className="text-sm font-black text-black italic uppercase">{label}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1 max-w-xs italic">{desc}</p>
                                                </div>
                                            </div>
                                            <Toggle checked={notifPrefs[key as keyof typeof notifPrefs]} onChange={() => setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key as keyof typeof notifPrefs] })} />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button onClick={handleNotifSave} className="btn-primary py-4 px-10 uppercase tracking-widest text-xs">
                                        <Save size={18} /> Seal Comms
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SYSTEM TAB */}
                        {activeTab === 'system' && (
                            <div className="space-y-10">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-black italic tracking-tight text-gold-dark uppercase">Nexus Intelligence</h3>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-black italic">Real-time telemetry from core server nodes.</p>
                                    </div>
                                    <button onClick={() => setActiveTab('system')} className="p-3 bg-white border border-slate-200 rounded-2xl text-gold-dark hover:bg-slate-50 transition-all shadow-sm">
                                        <RefreshCcw size={18} className={sysLoading ? 'animate-spin' : ''} />
                                    </button>
                                </div>

                                {sysLoading ? (
                                    <div className="py-24 flex flex-col items-center justify-center gap-4 text-slate-300">
                                        <RefreshCcw className="animate-spin text-gold-main/40" size={48} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] italic mt-2 animate-pulse">Syncing with Mainframe...</p>
                                    </div>
                                ) : sysStats ? (
                                    <>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                            {[
                                                { icon: FileText, label: 'Archived Intel', value: sysStats.totalRecords, color: 'gold' },
                                                { icon: Users, label: 'Active Assets', value: sysStats.totalAgents, color: 'gold' },
                                                { icon: User, label: 'Command Staff', value: sysStats.totalAdmins, color: 'gold' },
                                            ].map((s, i) => (
                                                <div key={i} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 text-center shadow-sm group hover:border-gold-main/20 transition-all">
                                                    <div className="w-12 h-12 bg-gold-main/5 rounded-2xl flex items-center justify-center text-gold-dark mx-auto mb-4 border border-gold-main/10 shadow-sm group-hover:scale-110 transition-transform"><s.icon size={24} /></div>
                                                    <p className="text-3xl font-black text-black italic tracking-tighter">{s.value}</p>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 mb-1 italic">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-gold-dark uppercase tracking-[0.2em] italic mb-4 pl-1">Server Telemetry</h4>
                                            {[
                                                { icon: Server, label: 'Core Process', value: 'ONLINE / STEADY', active: true },
                                                { icon: Database, label: 'DBS Atlas Relay', value: sysStats.dbStatus, active: sysStats.dbStatus === 'Connected' },
                                                { icon: Globe, label: 'Strategic Port', value: '5000 / ENCRYPTED', active: true },
                                                { icon: Clock, label: 'System Uptime', value: formatDateTime(sysStats.serverTime), active: true },
                                            ].map(({ icon: Icon, label, value, active }) => (
                                                <div key={label} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-4">
                                                        <Icon size={20} className="text-slate-300" />
                                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">{label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black italic text-gold-dark uppercase">{value}</span>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20 animate-pulse' : 'bg-red-500'}`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-24 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200 border border-slate-100 shadow-sm"><Database size={40} /></div>
                                        <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest italic">Signal Interrupt: Nexus Data Unreachable</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
