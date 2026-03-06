'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon paths broken by Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createAgentIcon = (agentName: string, isSelected: boolean) => {
    const initial = agentName?.charAt(0)?.toUpperCase() || '?';
    const color = isSelected ? '#4f46e5' : '#0f172a';
    return L.divIcon({
        className: '',
        html: `
            <div style="
                width: 36px; height: 36px;
                border-radius: 50% 50% 50% 0;
                background: ${color};
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 4px 14px rgba(0,0,0,0.25);
                display: flex; align-items: center; justify-content: center;
            ">
                <span style="
                    transform: rotate(45deg);
                    color: white;
                    font-size: 13px;
                    font-weight: 900;
                    font-family: sans-serif;
                    line-height: 1;
                ">${initial}</span>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -40],
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
                { duration: 1 }
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
            className="rounded-2xl z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController selectedAgent={selectedAgent} />
            {agents.map((agent) => (
                <Marker
                    key={agent._id}
                    position={[agent.lastLocation.latitude, agent.lastLocation.longitude]}
                    icon={createAgentIcon(agent.name, selectedAgent?._id === agent._id)}
                    eventHandlers={{ click: () => onSelectAgent(agent) }}
                >
                    <Popup>
                        <div style={{ fontFamily: 'sans-serif', minWidth: '160px' }}>
                            <p style={{ fontWeight: '900', fontSize: '14px', margin: '0 0 4px' }}>{agent.name}</p>
                            <p style={{ fontSize: '11px', color: '#6366f1', fontWeight: '700', margin: '0 0 4px' }}>{agent.lastLocation.category}</p>
                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>
                                {new Date(agent.lastLocation.lastSeen).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p style={{ fontSize: '10px', color: '#cbd5e1', margin: '4px 0 0' }}>
                                {agent.lastLocation.latitude.toFixed(5)}, {agent.lastLocation.longitude.toFixed(5)}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
