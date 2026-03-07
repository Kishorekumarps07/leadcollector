'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';

// Fix default icon paths broken by Webpack
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
}

const createAgentIcon = (agentName: string, isSelected: boolean) => {
    const initial = agentName?.charAt(0)?.toUpperCase() || '?';
    // Alabaster/White theme
    const bg = isSelected ? '#c5a059' : '#ffffff';
    const border = isSelected ? '#c5a059' : '#e2e8f0'; // slate-200
    const textColor = isSelected ? '#ffffff' : '#1e293b'; // slate-800

    return L.divIcon({
        className: '',
        html: `
            <div style="
                width: 40px; height: 40px;
                border-radius: 20px 20px 20px 4px;
                background: ${bg};
                transform: rotate(-45deg);
                border: 2px solid ${border};
                box-shadow: 0 4px 12px rgba(0,0,0,0.1), inset 0 0 10px rgba(255,255,255,0.5);
                display: flex; align-items: center; justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            ">
                <span style="
                    transform: rotate(45deg);
                    color: ${textColor};
                    font-size: 14px;
                    font-weight: 900;
                    font-family: 'Inter', sans-serif;
                    line-height: 1;
                    text-transform: uppercase;
                    font-style: italic;
                ">${initial}</span>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -44],
    });
};

// Component to fly to selected agent
function MapController({ selectedAgent }: { selectedAgent: any }) {
    const map = useMap();
    useEffect(() => {
        if (selectedAgent?.lastLocation) {
            map.flyTo(
                [selectedAgent.lastLocation.latitude, selectedAgent.lastLocation.longitude],
                15,
                { duration: 1.5, easeLinearity: 0.25 }
            );
        }
    }, [selectedAgent, map]);
    return null;
}

interface Props {
    agents: any[];
    selectedAgent: any;
    onSelectAgent: (agent: any) => void;
}

export default function TrackingMap({ agents, selectedAgent, onSelectAgent }: Props) {
    const [hasMounted, setHasMounted] = React.useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) return null;

    const defaultCenter: [number, number] = agents.length > 0 && agents[0].lastLocation
        ? [agents[0].lastLocation.latitude, agents[0].lastLocation.longitude]
        : [20.5937, 78.9629]; // India center as fallback

    return (
        <MapContainer
            key={agents.length > 0 ? 'has-data' : 'no-data'}
            center={defaultCenter}
            zoom={12}
            style={{ height: '100%', width: '100%', minHeight: '500px' }}
            className="z-0 premium-map-container"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                className="light-map"
            />
            <MapController selectedAgent={selectedAgent} />
            {agents.map((agent) => (
                <Marker
                    key={agent._id}
                    position={[agent.lastLocation.latitude, agent.lastLocation.longitude]}
                    icon={createAgentIcon(agent.name, selectedAgent?._id === agent._id)}
                    eventHandlers={{ click: () => onSelectAgent(agent) }}
                >
                    <Popup className="premium-popup">
                        <div style={{
                            background: '#ffffff',
                            padding: '12px',
                            borderRadius: '16px',
                            border: '1px solid #f1f5f9',
                            minWidth: '180px',
                            color: '#0f172a',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                        }}>
                            <p style={{
                                fontWeight: '900',
                                fontSize: '12px',
                                margin: '0 0 6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontStyle: 'italic',
                                color: '#000000'
                            }}>{agent.name}</p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{
                                    fontSize: '9px',
                                    background: '#f8fafc',
                                    color: '#c5a059',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    border: '1px solid #f1f5f9'
                                }}>{agent.lastLocation.category}</span>
                            </div>

                            <p style={{ fontSize: '9px', color: '#64748b', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#c5a059', fontWeight: '900' }}>SYNC:</span>
                                {formatRelativeTime(agent.lastLocation.lastSeen)}
                            </p>

                            <p style={{ fontSize: '8px', color: '#94a3b8', margin: 0, fontFamily: 'monospace' }}>
                                GPS: {agent.lastLocation.latitude.toFixed(6)}, {agent.lastLocation.longitude.toFixed(6)}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Custom CSS for map styling */}
            <style jsx global>{`
                .light-map {
                    filter: saturate(0.5) brightness(1.05);
                }
                .premium-map-container {
                    background: #f8fafc !important;
                }
                .leaflet-popup-content-wrapper, .leaflet-popup-tip {
                    background: transparent !important;
                    box-shadow: none !important;
                }
                .leaflet-popup-content {
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .leaflet-container {
                    border: none !important;
                    font-family: inherit !important;
                }
                .leaflet-control-zoom-in, .leaflet-control-zoom-out {
                    background: #ffffff !important;
                    color: #c5a059 !important;
                    border: 1px solid #f1f5f9 !important;
                    font-weight: 900 !important;
                }
                .leaflet-control-attribution {
                    background: rgba(255,255,255,0.8) !important;
                    color: #94a3b8 !important;
                    font-size: 8px !important;
                }
                .leaflet-control-attribution a {
                    color: #c5a059 !important;
                }
            `}</style>
        </MapContainer>
    );
}
