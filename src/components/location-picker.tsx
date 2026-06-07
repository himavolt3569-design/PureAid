"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";

interface LocationPickerProps {
  value?: string;
  onChange: (value: string) => void;
}

// Custom map icon to match modern aesthetic
const customIcon = L.divIcon({
  className: "custom-leaflet-icon",
  html: `<div style="background-color: #4F46E5; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapEvents({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);

  // default center to Kathmandu
  const defaultCenter: [number, number] = [27.7172, 85.3240];

  const fetchAddress = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      if (!res.ok) throw new Error("Failed to fetch address");
      const data = await res.json();
      if (data && data.display_name) {
        onChange(data.display_name);
      } else {
        onChange(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      }
    } catch (error) {
      console.error(error);
      onChange(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lon: number) => {
    setPosition([lat, lon]);
    fetchAddress(lat, lon);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-outline-variant shadow-sm group">
      <div className="h-[300px] w-full bg-slate-100 relative">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", zIndex: 10 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />
          {position && <Marker position={position} icon={customIcon} />}
          <MapEvents onLocationSelect={handleLocationSelect} />
        </MapContainer>
        {loading && (
          <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>
      {value && (
        <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/90 backdrop-blur border border-outline-variant p-3 rounded-lg shadow-lg text-sm text-slate-800 font-medium">
          <span className="text-primary font-bold mr-2">Selected:</span>
          {value}
        </div>
      )}
    </div>
  );
}
