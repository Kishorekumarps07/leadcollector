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

interface SidebarProps {
    isCollapsed: boolean;
    pathname: string;
    onLogout: () => void;
}

const SidebarContent = ({ isCollapsed, pathname, onLogout }: SidebarProps) => (
    <>
        <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm overflow-hidden p-1.5 border border-white/10">
                <img src="/logo.png" alt="P" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
                <div className="flex flex-col">
                    <span className="font-black text-lg leading-tight tracking-tight text-white">Promptix</span>
                    <span className="text-[10px] font-bold text-indigo-400 tracking-widest leading-none">tech solutions</span>
                </div>
            )}
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar no-scrollbar">
            {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <item.icon size={20} className="flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
                    </Link>
                );
            })}
        </nav>

        <div className="p-4 border-t border-slate-800">
            <button
                onClick={onLogout}
                className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 w-full transition-all"
            >
                <LogOut size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">Logout</span>}
            </button>
        </div>
    </>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

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
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:flex bg-slate-900 text-white transition-all duration-300 flex-shrink-0 flex-col overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <SidebarContent isCollapsed={!isSidebarOpen} pathname={pathname} onLogout={logout} />
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-white z-50 flex flex-col lg:hidden"
                        >
                            <SidebarContent isCollapsed={false} pathname={pathname} onLogout={() => { logout(); setIsMobileMenuOpen(false); }} />
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="absolute top-6 right-4 p-2 text-slate-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Topbar */}
                <header className="h-16 lg:h-20 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2 lg:gap-4 flex-1">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 hover:bg-slate-50 rounded-lg text-slate-500"
                        >
                            <Menu size={22} />
                        </button>

                        {/* Desktop Sidebar Toggle */}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden lg:flex p-2 hover:bg-slate-50 rounded-lg text-slate-500"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {/* Search (Responsive) */}
                        <div ref={searchRef} className="relative w-full max-w-[200px] sm:max-w-xs ml-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={e => handleSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 text-sm outline-none transition-all placeholder:text-slate-400"
                            />
                            <AnimatePresence>
                                {(searchResults.length > 0 || searching) && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 6 }}
                                        className="absolute top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 left-0"
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

                    <div className="flex items-center gap-2 lg:gap-4 ml-4">
                        {/* Notifications Bell */}
                        <div ref={bellRef} className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <Bell size={20} />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                                )}
                            </button>
                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 6 }}
                                        className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                                    >
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                                            <h4 className="font-bold text-slate-900 text-sm">Recent Activity</h4>
                                            <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                                        </div>
                                        {notifications.length === 0 ? (
                                            <p className="px-5 py-8 text-center text-sm text-slate-400 italic">No recent activity yet.</p>
                                        ) : (
                                            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto custom-scrollbar no-scrollbar">
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

                        <div className="flex items-center gap-2 lg:gap-3 pl-2 sm:pl-4 border-l border-slate-200">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-bold text-slate-900 line-clamp-1">{user?.name}</p>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{user?.role}</p>
                            </div>
                            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-indigo-50 flex-shrink-0">
                                <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`} alt="avatar" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Area */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50/50">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
