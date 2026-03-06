'use client';

import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon, Bell, Lock, User, Globe, Save, Database,
    Smartphone, MapPin, CheckCircle, AlertCircle, Loader2, RefreshCcw, Eye, EyeOff, Server, Users, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

// Toast notification component
function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-sm font-bold ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
        >
            {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message}
        </motion.div>
    );
}

// Toggle Switch component
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
        >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${checked ? 'right-1' : 'left-1'}`} />
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
            showToast('Profile updated successfully', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return showToast('New passwords do not match', 'error');
        }
        setSubmitting(true);
        try {
            await api.patch('admin/password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            showToast('Password changed successfully', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to change password', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrefsSave = () => {
        localStorage.setItem('app_prefs', JSON.stringify(prefs));
        showToast('Preferences saved', 'success');
    };

    const handleNotifSave = () => {
        localStorage.setItem('app_notifs', JSON.stringify(notifPrefs));
        showToast('Notification settings saved', 'success');
    };

    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'privacy', label: 'Security', icon: Lock },
        { id: 'general', label: 'General', icon: SettingsIcon },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'system', label: 'System', icon: Database },
    ];

    const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all font-medium text-sm";
    const labelClass = "text-xs font-black text-slate-500 uppercase tracking-widest pl-1";

    return (
        <div className="space-y-6 max-w-4xl">
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} />}
            </AnimatePresence>

            <div>
                <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
                <p className="text-slate-500 mt-1">Configure your organization preferences and application defaults.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 mt-8">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-56 space-y-1 flex-shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === tab.id
                                ? 'bg-white text-indigo-600 shadow-sm border border-slate-100 font-black'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 font-bold'}`}
                        >
                            <tab.icon size={18} />
                            <span className="text-sm">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8"
                    >
                        {/* ACCOUNT TAB */}
                        {activeTab === 'account' && (
                            <form onSubmit={handleProfileSave} className="space-y-6">
                                <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">Profile Information</h3>
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md">
                                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'A')}&background=6366f1&color=fff&size=128`} alt="avatar" className="w-full h-full" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900">{profile.name}</p>
                                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">{user?.role}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className={labelClass}>Full Name</label>
                                        <input type="text" className={inputClass} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelClass}>Phone Number</label>
                                        <input type="text" className={inputClass} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="10-digit number" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>Email Address</label>
                                    <input type="email" className={inputClass} value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50">
                                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        Save Profile
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === 'privacy' && (
                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">Change Password</h3>
                                <p className="text-sm text-slate-500">For your security, use a strong password that you don't use elsewhere.</p>

                                {[
                                    { label: 'Current Password', key: 'current', field: 'currentPassword' as const },
                                    { label: 'New Password', key: 'newPw', field: 'newPassword' as const },
                                    { label: 'Confirm New Password', key: 'confirm', field: 'confirmPassword' as const },
                                ].map(({ label, key, field }) => (
                                    <div key={field} className="space-y-2">
                                        <label className={labelClass}>{label}</label>
                                        <div className="relative">
                                            <input
                                                type={showPw[key as keyof typeof showPw] ? 'text' : 'password'}
                                                required
                                                className={`${inputClass} pr-12`}
                                                value={passwords[field]}
                                                onChange={e => setPasswords({ ...passwords, [field]: e.target.value })}
                                                placeholder="••••••••"
                                            />
                                            <button type="button" onClick={() => setShowPw({ ...showPw, [key]: !showPw[key as keyof typeof showPw] })} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                {showPw[key as keyof typeof showPw] ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-2 flex justify-end">
                                    <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50">
                                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* GENERAL TAB */}
                        {activeTab === 'general' && (
                            <div className="space-y-8">
                                <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">General Preferences</h3>

                                <div className="space-y-2">
                                    <label className={labelClass}>Timezone</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <select
                                            className={`${inputClass} pl-10 appearance-none cursor-pointer`}
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

                                <div className="space-y-3">
                                    <h4 className="text-sm font-black text-slate-700">Data Collection Rules</h4>
                                    {[
                                        { key: 'enforceGps', icon: MapPin, label: 'Enforce GPS Tracking', desc: 'Require location data for every form submission.' },
                                        { key: 'mobileOnly', icon: Smartphone, label: 'Mobile-Only Access', desc: 'Restricts agent submissions to mobile devices only.' },
                                    ].map(({ key, icon: Icon, label, desc }) => (
                                        <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm"><Icon size={18} /></div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{label}</p>
                                                    <p className="text-xs text-slate-500">{desc}</p>
                                                </div>
                                            </div>
                                            <Toggle checked={prefs[key as keyof typeof prefs] as boolean} onChange={() => setPrefs({ ...prefs, [key]: !prefs[key as keyof typeof prefs] })} />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end">
                                    <button onClick={handlePrefsSave} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                        <Save size={18} /> Save Preferences
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-8">
                                <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">Notification Preferences</h3>
                                <div className="space-y-3">
                                    {[
                                        { key: 'newSubmission', icon: FileText, label: 'New Submission', desc: 'Notify when an agent submits a new record.' },
                                        { key: 'agentInactive', icon: Users, label: 'Agent Inactive Alert', desc: 'Notify when an agent has had no activity for 24h.' },
                                        { key: 'weeklyReport', icon: Bell, label: 'Weekly Summary Report', desc: 'Receive a weekly email summary every Monday.' },
                                        { key: 'exportComplete', icon: Database, label: 'Export Complete', desc: 'Notify when a data export has finished.' },
                                    ].map(({ key, icon: Icon, label, desc }) => (
                                        <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm"><Icon size={18} /></div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{label}</p>
                                                    <p className="text-xs text-slate-500">{desc}</p>
                                                </div>
                                            </div>
                                            <Toggle checked={notifPrefs[key as keyof typeof notifPrefs]} onChange={() => setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key as keyof typeof notifPrefs] })} />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={handleNotifSave} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                        <Save size={18} /> Save Notifications
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SYSTEM TAB */}
                        {activeTab === 'system' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <h3 className="text-lg font-black text-slate-900">System Information</h3>
                                    <button onClick={() => setActiveTab('system')} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                        <RefreshCcw size={16} className={sysLoading ? 'animate-spin' : ''} />
                                    </button>
                                </div>

                                {sysLoading ? (
                                    <div className="py-12 flex items-center justify-center gap-3 text-slate-400">
                                        <Loader2 className="animate-spin" size={20} /> Loading system data...
                                    </div>
                                ) : sysStats ? (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                { icon: FileText, label: 'Total Records', value: sysStats.totalRecords, color: 'indigo' },
                                                { icon: Users, label: 'Field Agents', value: sysStats.totalAgents, color: 'blue' },
                                                { icon: User, label: 'Admins', value: sysStats.totalAdmins, color: 'violet' },
                                            ].map((s, i) => (
                                                <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                                    <s.icon size={24} className={`text-${s.color}-500 mx-auto mb-2`} />
                                                    <p className="text-2xl font-black text-slate-900">{s.value}</p>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-sm font-black text-slate-700">Server Status</h4>
                                            {[
                                                { icon: Server, label: 'Server', value: 'Running' },
                                                { icon: Database, label: 'MongoDB Atlas', value: sysStats.dbStatus },
                                                { icon: Globe, label: 'Backend Port', value: '5000' },
                                                { icon: Globe, label: 'Server Time', value: new Date(sysStats.serverTime).toLocaleString('en-IN') },
                                            ].map(({ icon: Icon, label, value }) => (
                                                <div key={label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <Icon size={16} className="text-slate-400" />
                                                        <span className="text-sm font-bold text-slate-700">{label}</span>
                                                    </div>
                                                    <span className="text-xs font-black px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-slate-400 text-sm text-center italic py-8">No system data available.</p>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
