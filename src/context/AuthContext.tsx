'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    loading: boolean;
    trackingStatus: 'idle' | 'syncing' | 'active' | 'error';
    permissionState: 'prompt' | 'granted' | 'denied' | 'unsupported';
    triggerTracking: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const [trackingStatus, setTrackingStatus] = useState<'idle' | 'syncing' | 'active' | 'error'>('idle');
    const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');

    const updatePermissionState = async () => {
        if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' as any });
                setPermissionState(result.state as any);
                result.onchange = () => setPermissionState(result.state as any);
            } catch (err) {
                console.warn("[Auth] Permissions API check failed:", err);
            }
        } else if (typeof navigator !== 'undefined' && !('geolocation' in navigator)) {
            setPermissionState('unsupported');
        }
    };

    useEffect(() => {
        updatePermissionState();
    }, []);

    const triggerTracking = () => {
        if (user && user.role === 'Field Agent') {
            console.log("[Auth] Manually triggering tracking...");
            sendHeartbeat();
        }
    };

    // Heartbeat Tracking for Field Agents
    useEffect(() => {
        if (loading) return;

        let interval: NodeJS.Timeout;

        if (user && user.role === 'Field Agent') {
            // Initial heartbeat
            sendHeartbeat();
            // Every 2 minutes
            interval = setInterval(sendHeartbeat, 120000);
        } else {
            setTrackingStatus('idle');
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [user, loading]);

    const sendHeartbeat = async () => {
        try {
            if ("geolocation" in navigator) {
                setTrackingStatus('syncing');
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    try {
                        await api.post('agent/track', {
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude
                        });
                        console.log(`[Heartbeat] Success at ${new Date().toLocaleTimeString()}`);
                        setTrackingStatus('active');
                        setPermissionState('granted');
                    } catch (apiErr) {
                        console.error("[Heartbeat] API Error:", apiErr);
                        setTrackingStatus('error');
                    }
                }, (err) => {
                    console.warn("[Heartbeat] Geolocation failed:", err.message);
                    setTrackingStatus('error');
                    if (err.code === 1) setPermissionState('denied');
                }, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 30000
                });
            } else {
                console.error("[Heartbeat] Geolocation not supported");
                setTrackingStatus('error');
                setPermissionState('unsupported');
            }
        } catch (err) {
            console.error("[Heartbeat] unexpected error:", err);
            setTrackingStatus('error');
        }
    };

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // Redirect based on role
        if (userData.role === 'Admin' || userData.role === 'Manager') {
            router.push('/admin/dashboard');
        } else {
            router.push('/agent/submit');
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, trackingStatus, permissionState, triggerTracking }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
