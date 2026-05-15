import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

interface MapComponentProps {
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  height?: string;
}

// Default Dhaka coordinates
const DHAKA_CENTER = { lat: 23.8103, lng: 90.4125 };

// Demo coordinates for common Dhaka locations
const LOCATIONS: Record<string, { lat: number; lng: number }> = {
  "Dhanmondi 27": { lat: 23.7461, lng: 90.3742 },
  "Gulshan 1 Circle": { lat: 23.7805, lng: 90.4160 },
  "Motijheel": { lat: 23.7334, lng: 90.4163 },
  "Shahjalal Airport": { lat: 23.8434, lng: 90.3978 },
  "Uttara": { lat: 23.8759, lng: 90.3795 },
  "Banani": { lat: 23.7937, lng: 90.4066 },
};

export function MapComponent({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  height = "400px"
}: MapComponentProps) {
  // Use demo API key for demonstration
  const API_KEY = "AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg";

  const pickup = pickupLat && pickupLng
    ? { lat: pickupLat, lng: pickupLng }
    : null;

  const dropoff = dropoffLat && dropoffLng
    ? { lat: dropoffLat, lng: dropoffLng }
    : null;

  // Calculate center point
  const center = pickup && dropoff
    ? { lat: (pickup.lat + dropoff.lat) / 2, lng: (pickup.lng + dropoff.lng) / 2 }
    : pickup || dropoff || DHAKA_CENTER;

  return (
    <APIProvider apiKey={API_KEY}>
      <div style={{ height, width: "100%", borderRadius: "16px", overflow: "hidden" }}>
        <Map
          defaultCenter={center}
          defaultZoom={pickup && dropoff ? 12 : 13}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId="swiftride-map"
        >
          {pickup && (
            <Marker
              position={pickup}
              title="Pickup Location"
            />
          )}
          {dropoff && (
            <Marker
              position={dropoff}
              title="Drop-off Location"
            />
          )}
        </Map>
      </div>
    </APIProvider>
  );
}

// Helper function to get coordinates from location name
export function getLocationCoordinates(locationName: string): { lat: number; lng: number } | null {
  for (const [key, coords] of Object.entries(LOCATIONS)) {
    if (locationName.toLowerCase().includes(key.toLowerCase())) {
      return coords;
    }
  }
  return null;
}
