'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    BarChart3,
    LayoutGrid,
    Users,
    Map as MapIcon,
    Settings,
    Database,
    LogOut,
    Bell,
    Menu,
    X,
    Search
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

const NAV_ITEMS = [
    { icon: BarChart3, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: LayoutGrid, label: 'Categories', href: '/admin/categories' },
    { icon: Database, label: 'Data Explorer', href: '/admin/explorer' },
    { icon: Users, label: 'Agent Mgmt', href: '/admin/agents' },
    { icon: MapIcon, label: 'Tracking', href: '/admin/tracking' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Notifications state
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const bellRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('admin/stats');
            const recent = res.data.data?.recentSubmissions || [];
            setNotifications(recent.slice(0, 6).map((r: any) => ({
                id: r._id,
                message: `${r.agent_id?.name || 'Agent'} submitted in "${r.category_id?.name || 'Unknown'}"`,
                time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            })));
        } catch { /* silent */ }
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchResults([]); setSearchQuery('');
            }
            if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (!q.trim()) { setSearchResults([]); return; }
        setSearching(true);
        try {
            const res = await api.get('admin/records');
            const records: any[] = res.data.data || [];
            const filtered = records.filter((r: any) =>
                r.category_id?.name?.toLowerCase().includes(q.toLowerCase()) ||
                r.agent_id?.name?.toLowerCase().includes(q.toLowerCase())
            );
            setSearchResults(filtered.slice(0, 5));
        } catch { setSearchResults([]); } finally { setSearching(false); }
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className={`bg-slate-900 text-white transition-all duration-300 flex-shrink-0 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm overflow-hidden p-1.5">
                        <img src="/logo.png" alt="P" className="w-full h-full object-contain" />
                    </div>
                    {isSidebarOpen && (
                        <div className="flex flex-col">
                            <span className="font-black text-lg leading-tight tracking-tight text-white">Promptix</span>
                            <span className="text-[10px] font-bold text-indigo-400 tracking-widest leading-none">tech solutions</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 mt-6 px-4 space-y-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                <item.icon size={20} />
                                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={logout}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 w-full transition-all"
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Topbar */}
                <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500">
                            {isSidebarOpen ? <Menu size={20} /> : <X size={20} />}
                        </button>

                        {/* Search */}
                        <div ref={searchRef} className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search records or agents..."
                                value={searchQuery}
                                onChange={e => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 text-sm outline-none transition-all"
                            />
                            <AnimatePresence>
                                {(searchResults.length > 0 || searching) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 6 }}
                                        className="absolute top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                                    >
                                        {searching ? (
                                            <p className="px-4 py-3 text-sm text-slate-400">Searching...</p>
                                        ) : (
                                            <>
                                                <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{searchResults.length} Results</p>
                                                {searchResults.map((r: any) => (
                                                    <button
                                                        key={r._id}
                                                        onClick={() => { router.push('/admin/explorer'); setSearchResults([]); setSearchQuery(''); }}
                                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors border-t border-slate-50"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
                                                            {r.category_id?.name?.substring(0, 2) || 'RE'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 truncate">{r.category_id?.name}</p>
                                                            <p className="text-xs text-slate-400 truncate">by {r.agent_id?.name}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications Bell */}
                        <div ref={bellRef} className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <Bell size={20} />
                                {notifications.length > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                                )}
                            </button>
                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 6 }}
                                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                                    >
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                            <h4 className="font-bold text-slate-900 text-sm">Recent Activity</h4>
                                            <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                                        </div>
                                        {notifications.length === 0 ? (
                                            <p className="px-5 py-8 text-center text-sm text-slate-400 italic">No recent activity yet.</p>
                                        ) : (
                                            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                                                {notifications.map((n: any) => (
                                                    <div key={n.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                                                        <p className="text-sm text-slate-700">{n.message}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1 font-bold">{n.time}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{user?.role}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-indigo-50">
                                <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`} alt="avatar" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Area */}
                <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    {children}
                </main>
            </div>
        </div>
    );
}
