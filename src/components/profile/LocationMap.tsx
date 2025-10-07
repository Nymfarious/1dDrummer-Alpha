import { useEffect, useRef } from 'react';
import { useGoogleMaps } from './GoogleMapsLoader';

interface LocationMapProps {
  city: string;
}

export const LocationMap = ({ city }: LocationMapProps) => {
  const isLoaded = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const loadMap = async () => {
      if (!mapRef.current || !city || !isLoaded) return;

      // Initialize map centered on a default location
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new (window as any).google.maps.Map(mapRef.current, {
          zoom: 10,
          center: { lat: 0, lng: 0 },
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });
      }

      // Geocode the city to get coordinates
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: city }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0] && mapInstanceRef.current) {
          const location = results[0].geometry.location;
          mapInstanceRef.current.setCenter(location);

          // Remove old marker if exists
          if (markerRef.current) {
            markerRef.current.setMap(null);
          }

          // Add new marker
          markerRef.current = new (window as any).google.maps.Marker({
            position: location,
            map: mapInstanceRef.current,
            title: city,
          });
        }
      });
    };

    loadMap();
  }, [city, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="w-full h-64 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-border">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};
