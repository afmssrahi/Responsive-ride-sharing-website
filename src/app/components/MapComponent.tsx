import { useEffect, useRef, useCallback, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon paths broken by bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ── Types ────────────────────────────────────────────────────────────
export interface RouteInfo {
  distanceKm: number;
  durationMin: number;
  pickupCoords: { lat: number; lng: number };
  dropoffCoords: { lat: number; lng: number };
}

export interface ParticipantMarker {
  id: string;
  name: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupLocation?: string | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  dropoffLocation?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
}

interface MapComponentProps {
  pickupText?: string;
  dropoffText?: string;
  onRouteChange?: (route: RouteInfo | null) => void;
  onPickupCoords?: (coords: { lat: number; lng: number }) => void;
  height?: string;
  driverLocation?: { lat: number; lng: number } | null;
  showGeolocationButton?: boolean;
  /** Participants to show as numbered pickup/dropoff markers (for shared rides) */
  participants?: ParticipantMarker[];
  /** Extra waypoints to draw on the route (for multi-stop driver view) */
  waypoints?: Array<{ lat: number; lng: number; label?: string }>;
}

// ── Dhaka coordinates ────────────────────────────────────────────────
const DHAKA_CENTER: [number, number] = [23.8103, 90.4125];

// Well-known locations for instant matching (no API call needed)
const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  "dhanmondi 27": { lat: 23.7461, lng: 90.3742 },
  "dhanmondi": { lat: 23.7461, lng: 90.3742 },
  "gulshan 1 circle": { lat: 23.7805, lng: 90.4160 },
  "gulshan 1": { lat: 23.7805, lng: 90.4160 },
  "gulshan 2": { lat: 23.7934, lng: 90.4143 },
  "gulshan": { lat: 23.7805, lng: 90.4160 },
  "motijheel": { lat: 23.7334, lng: 90.4163 },
  "shahjalal airport": { lat: 23.8434, lng: 90.3978 },
  "airport": { lat: 23.8434, lng: 90.3978 },
  "uttara": { lat: 23.8759, lng: 90.3795 },
  "banani": { lat: 23.7937, lng: 90.4066 },
  "mirpur": { lat: 23.8042, lng: 90.3688 },
  "mirpur 10": { lat: 23.8069, lng: 90.3687 },
  "mohammadpur": { lat: 23.7662, lng: 90.3586 },
  "farmgate": { lat: 23.7572, lng: 90.3876 },
  "tejgaon": { lat: 23.7635, lng: 90.3927 },
  "bashundhara": { lat: 23.8136, lng: 90.4265 },
  "badda": { lat: 23.7841, lng: 90.4264 },
  "rampura": { lat: 23.7624, lng: 90.4245 },
  "khilgaon": { lat: 23.7518, lng: 90.4306 },
  "mogbazar": { lat: 23.7495, lng: 90.4078 },
  "shantinagar": { lat: 23.7393, lng: 90.4117 },
  "new market": { lat: 23.7336, lng: 90.3848 },
  "elephant road": { lat: 23.7363, lng: 90.3873 },
  "panthapath": { lat: 23.7515, lng: 90.3886 },
  "karwan bazar": { lat: 23.7510, lng: 90.3930 },
  "shahbag": { lat: 23.7375, lng: 90.3958 },
  "dhaka university": { lat: 23.7329, lng: 90.3928 },
  "buet": { lat: 23.7266, lng: 90.3928 },
  "old dhaka": { lat: 23.7104, lng: 90.3999 },
  "sadarghat": { lat: 23.7080, lng: 90.4050 },
  "gabtoli": { lat: 23.7806, lng: 90.3462 },
  "jatrabari": { lat: 23.7107, lng: 90.4344 },
  "demra": { lat: 23.7238, lng: 90.4812 },
  "narayanganj": { lat: 23.6238, lng: 90.4993 },
  "tongi": { lat: 23.9322, lng: 90.3978 },
  "chittagong": { lat: 22.3569, lng: 91.7832 },
  "sylhet": { lat: 24.8949, lng: 91.8687 },
  "rajshahi": { lat: 24.3745, lng: 88.6042 },
  "khulna": { lat: 22.8456, lng: 89.5403 },
  "comilla": { lat: 23.4607, lng: 91.1809 },
  "cox's bazar": { lat: 21.4272, lng: 92.0058 },
};

// ── Icons ────────────────────────────────────────────────────────────
const pickupIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;
    background:#16a34a;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 2px 8px rgba(22,163,74,0.5);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const dropoffIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;
    background:#111827;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const driverIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:36px;height:36px;">
    <div style="
      position:absolute;inset:0;
      background:rgba(37,99,235,0.2);
      border-radius:50%;
      animation:driver-pulse 1.5s ease-out infinite;
    "></div>
    <div style="
      position:absolute;inset:6px;
      background:#2563eb;
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(37,99,235,0.6);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;
    ">🚗</div>
  </div>
  <style>@keyframes driver-pulse{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.2);opacity:0}}</style>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function makeParticipantPickupIcon(index: number, status: string) {
  const color = status === "APPROVED" ? "#16a34a" : status === "PENDING" ? "#d97706" : "#dc2626";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:24px;height:24px;
      background:${color};
      border:2px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:11px;font-weight:700;font-family:sans-serif;
    ">${index + 1}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function makeParticipantDropoffIcon(index: number, status: string) {
  const color = status === "APPROVED" ? "#111827" : status === "PENDING" ? "#92400e" : "#7f1d1d";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:20px;height:20px;
      background:${color};
      border:2px solid #fff;
      border-radius:4px;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:10px;font-weight:700;font-family:sans-serif;
    ">${index + 1}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function makeWaypointIcon(label?: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;
      background:#8b5cf6;
      border:2px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(139,92,246,0.5);
    " title="${label || ""}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// ── Geocode ──────────────────────────────────────────────────────────
async function geocode(text: string): Promise<{ lat: number; lng: number } | null> {
  if (!text || text.trim().length < 2) return null;
  const lower = text.trim().toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }
  try {
    const query = encodeURIComponent(text.trim() + ", Bangladesh");
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=bd`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* silent */ }
  return null;
}

// ── OSRM Route ────────────────────────────────────────────────────────
async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<{ distanceKm: number; durationMin: number; geometry: any } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code === "Ok" && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
        geometry: route.geometry,
      };
    }
  } catch { /* silent */ }
  return null;
}

// ── MapComponent ──────────────────────────────────────────────────────
export function MapComponent({
  pickupText,
  dropoffText,
  onRouteChange,
  onPickupCoords,
  height = "400px",
  driverLocation = null,
  showGeolocationButton = true,
  participants = [],
  waypoints = [],
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const participantMarkersRef = useRef<L.Marker[]>([]);
  const waypointMarkersRef = useRef<L.Marker[]>([]);
  const abortRef = useRef(0);

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const onRouteChangeRef = useRef(onRouteChange);
  onRouteChangeRef.current = onRouteChange;
  const onPickupCoordsRef = useRef(onPickupCoords);
  onPickupCoordsRef.current = onPickupCoords;

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: DHAKA_CENTER,
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update driver marker when driverLocation changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (driverLocation) {
      const latlng: [number, number] = [driverLocation.lat, driverLocation.lng];
      if (driverMarkerRef.current) {
        driverMarkerRef.current.setLatLng(latlng);
      } else {
        driverMarkerRef.current = L.marker(latlng, { icon: driverIcon })
          .addTo(map)
          .bindPopup("<b>Your Driver</b>");
      }
    } else {
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
    }
  }, [driverLocation]);

  // ── Render participant pickup/dropoff markers ─────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old participant markers
    participantMarkersRef.current.forEach(m => m.remove());
    participantMarkersRef.current = [];

    participants.forEach((p, i) => {
      if (p.pickupLat && p.pickupLng) {
        const pickupM = L.marker([p.pickupLat, p.pickupLng], {
          icon: makeParticipantPickupIcon(i, p.status),
        })
          .addTo(map)
          .bindPopup(`<b>${p.name}</b><br/>📍 Pickup${p.pickupLocation ? `: ${p.pickupLocation}` : ""}<br/><span style="font-size:11px;color:${p.status === "APPROVED" ? "#16a34a" : "#d97706"}">${p.status}</span>`);
        participantMarkersRef.current.push(pickupM);
      }
      if (p.dropoffLat && p.dropoffLng) {
        const dropoffM = L.marker([p.dropoffLat, p.dropoffLng], {
          icon: makeParticipantDropoffIcon(i, p.status),
        })
          .addTo(map)
          .bindPopup(`<b>${p.name}</b><br/>🏁 Drop-off${p.dropoffLocation ? `: ${p.dropoffLocation}` : ""}`);
        participantMarkersRef.current.push(dropoffM);
      }
    });
  }, [participants]);

  // ── Render waypoint markers ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    waypointMarkersRef.current.forEach(m => m.remove());
    waypointMarkersRef.current = [];

    waypoints.forEach(wp => {
      const m = L.marker([wp.lat, wp.lng], { icon: makeWaypointIcon(wp.label) })
        .addTo(map);
      if (wp.label) m.bindPopup(`<b>${wp.label}</b>`);
      waypointMarkersRef.current.push(m);
    });
  }, [waypoints]);

  // Geocode and route whenever pickup/dropoff text changes
  useEffect(() => {
    const currentId = ++abortRef.current;
    const map = mapRef.current;
    if (!map) return;

    const timer = setTimeout(async () => {
      if (abortRef.current !== currentId) return;

      const [pickupCoords, dropoffCoords] = await Promise.all([
        geocode(pickupText || ""),
        geocode(dropoffText || ""),
      ]);

      if (abortRef.current !== currentId) return;

      // Pickup marker
      if (pickupCoords) {
        const latlng: [number, number] = [pickupCoords.lat, pickupCoords.lng];
        if (pickupMarkerRef.current) {
          pickupMarkerRef.current.setLatLng(latlng);
        } else {
          pickupMarkerRef.current = L.marker(latlng, { icon: pickupIcon })
            .addTo(map)
            .bindPopup(`<b>Pickup</b><br/>${pickupText || ""}`);
        }
        pickupMarkerRef.current.setPopupContent(`<b>📍 Pickup</b><br/>${pickupText || ""}`);
        onPickupCoordsRef.current?.(pickupCoords);
      } else {
        pickupMarkerRef.current?.remove();
        pickupMarkerRef.current = null;
      }

      // Dropoff marker
      if (dropoffCoords) {
        const latlng: [number, number] = [dropoffCoords.lat, dropoffCoords.lng];
        if (dropoffMarkerRef.current) {
          dropoffMarkerRef.current.setLatLng(latlng);
        } else {
          dropoffMarkerRef.current = L.marker(latlng, { icon: dropoffIcon })
            .addTo(map)
            .bindPopup(`<b>Drop-off</b><br/>${dropoffText || ""}`);
        }
        dropoffMarkerRef.current.setPopupContent(`<b>🏁 Drop-off</b><br/>${dropoffText || ""}`);
      } else {
        dropoffMarkerRef.current?.remove();
        dropoffMarkerRef.current = null;
      }

      // Clear old route
      polylineRef.current?.remove();
      polylineRef.current = null;

      // Draw route
      if (pickupCoords && dropoffCoords) {
        const route = await fetchRoute(pickupCoords, dropoffCoords);
        if (abortRef.current !== currentId) return;

        if (route && route.geometry?.coordinates?.length > 0) {
          const latLngs = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
          polylineRef.current = L.polyline(latLngs, {
            color: "#16a34a",
            weight: 5,
            opacity: 0.85,
          }).addTo(map);
          const bounds = L.latLngBounds(latLngs).pad(0.12);
          map.fitBounds(bounds);
          onRouteChangeRef.current?.({
            distanceKm: route.distanceKm,
            durationMin: route.durationMin,
            pickupCoords,
            dropoffCoords,
          });
        } else {
          // Straight-line fallback with haversine estimate
          const p: [number, number] = [pickupCoords.lat, pickupCoords.lng];
          const d: [number, number] = [dropoffCoords.lat, dropoffCoords.lng];
          polylineRef.current = L.polyline([p, d], {
            color: "#16a34a", weight: 3, dashArray: "8, 8", opacity: 0.8,
          }).addTo(map);
          const bounds = L.latLngBounds([p, d]).pad(0.25);
          map.fitBounds(bounds);
          const R = 6371;
          const dLat = ((dropoffCoords.lat - pickupCoords.lat) * Math.PI) / 180;
          const dLon = ((dropoffCoords.lng - pickupCoords.lng) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((pickupCoords.lat * Math.PI) / 180) *
            Math.cos((dropoffCoords.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
          const estDist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.3;
          onRouteChangeRef.current?.({
            distanceKm: estDist,
            durationMin: estDist * 3,
            pickupCoords,
            dropoffCoords,
          });
        }
      } else if (pickupCoords) {
        map.setView([pickupCoords.lat, pickupCoords.lng], 14);
        onRouteChangeRef.current?.(null);
      } else if (dropoffCoords) {
        map.setView([dropoffCoords.lat, dropoffCoords.lng], 14);
        onRouteChangeRef.current?.(null);
      } else {
        map.setView(DHAKA_CENTER, 13);
        onRouteChangeRef.current?.(null);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [pickupText, dropoffText]);

  // Geolocation handler
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapRef.current;
        if (map) map.setView([latitude, longitude], 15);
        onPickupCoordsRef.current?.({ lat: latitude, lng: longitude });
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.code === 1 ? "Location access denied." : "Could not get your location.");
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  return (
    <div style={{ position: "relative", height, width: "100%" }}>
      <div
        ref={containerRef}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          zIndex: 0,
        }}
      />

      {/* Geolocation button */}
      {showGeolocationButton && (
        <div style={{ position: "absolute", bottom: 12, right: 12, zIndex: 999 }}>
          <button
            onClick={handleGeolocate}
            disabled={geoLoading}
            title="Use my current location"
            style={{
              background: "#fff",
              border: "2px solid #e5e7eb",
              borderRadius: "10px",
              padding: "8px 12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#374151",
              cursor: geoLoading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              transition: "background 0.15s",
            }}
          >
            {geoLoading ? "⏳" : "📍"} {geoLoading ? "Locating…" : "My location"}
          </button>
          {geoError && (
            <div style={{
              marginTop: 4,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: "0.7rem",
              color: "#dc2626",
              maxWidth: 180,
            }}>
              {geoError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
