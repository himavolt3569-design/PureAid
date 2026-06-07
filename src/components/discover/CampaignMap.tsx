"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { formatMoney } from "@/lib/format";

// Custom premium marker icon
const createIcon = (color: string) => L.divIcon({
  className: "custom-leaflet-icon",
  html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #fcfbf9; box-shadow: 0 4px 12px rgba(90, 102, 82, 0.4); display: flex; align-items: center; justify-content: center; transition: transform 0.2s;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const defaultIcon = createIcon("#5a6652"); // Forest green (Primary)
const urgentIcon = createIcon("#bda38b"); // Vibrant coral (Urgent)
const hoveredIcon = createIcon("#292826"); // Deep indigo (Hovered)

// Deterministic pseudo-random based on string
function stringToHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

// Map Kathmandu center (Warm Pearl & Rich Olive aesthetic fits Nepal well)
const KATHMANDU_LAT = 27.7172;
const KATHMANDU_LNG = 85.3240;

function generateCoords(id: string, locationStr: string | null): [number, number] {
  const hash1 = stringToHash(id + "lat");
  const hash2 = stringToHash(id + "lng");
  // spread pins in a 0.08 degree radius around Kathmandu
  const latOffset = (hash1 % 100) / 1200;
  const lngOffset = (hash2 % 100) / 1200;
  return [KATHMANDU_LAT + latOffset, KATHMANDU_LNG + lngOffset];
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function CampaignMap({ 
  campaigns, 
  hoveredId 
}: { 
  campaigns: any[], 
  hoveredId: string | null 
}) {
  return (
    <div className="h-full w-full relative group">
      <MapContainer
        center={[KATHMANDU_LAT, KATHMANDU_LNG]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 10 }}
        className="rounded-2xl border border-outline-variant premium-shadow"
      >
        {/* Voyager TileLayer gives a warm, premium, clean aesthetic */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {campaigns.map((camp) => {
          const coords = generateCoords(camp.id, camp.location);
          const isUrgent = (camp.goal_amount - camp.raised_amount) > 0 && (camp.raised_amount / camp.goal_amount < 0.3);
          const isHovered = hoveredId === camp.id;
          
          let icon = defaultIcon;
          if (isHovered) icon = hoveredIcon;
          else if (isUrgent) icon = urgentIcon;
          
          return (
            <Marker key={camp.id} position={coords} icon={icon} zIndexOffset={isHovered ? 1000 : 0}>
              <Popup className="premium-popup">
                <div className="p-1 min-w-[200px]">
                  <p className="label-caps text-slate-gray mb-1">{camp.category}</p>
                  <h3 className="font-bold text-primary text-sm leading-tight mb-2">{camp.title}</h3>
                  <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-forest-green" style={{ width: `${Math.min(100, (camp.raised_amount / camp.goal_amount) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-primary">{formatMoney(camp.raised_amount)} raised</span>
                  </div>
                  <Link href={`/dashboard/discover/${camp.id}`} className="block w-full text-xs text-center bg-primary text-paper-white py-2 rounded-md hover:bg-deep-indigo transition-colors font-medium">
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
