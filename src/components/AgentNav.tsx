'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, PlusCircle, History, User } from 'lucide-react';

export default function AgentNav() {
    const router = useRouter();
    const pathname = usePathname();

    const tabs = [
        { label: 'Home', icon: Home, href: '/agent/dashboard' },
        { label: 'New Entry', icon: PlusCircle, href: '/agent/submit' },
        { label: 'History', icon: History, href: '/agent/history' },
        { label: 'Profile', icon: User, href: '/agent/profile' },
    ];

    return (
        <div className="bg-white border-t border-slate-100 px-4 py-3 sticky bottom-0 z-10 shadow-[0_-4px_20px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-around max-w-md mx-auto">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href || (tab.href === '/agent/dashboard' && pathname === '/agent');
                    return (
                        <button
                            key={tab.href}
                            onClick={() => router.push(tab.href)}
                            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[10px] font-bold ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
