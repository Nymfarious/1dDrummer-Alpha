import { useEffect, useRef } from 'react';
import { useGoogleMaps } from './GoogleMapsLoader';

interface LocationMapProps {
  city?: string;
  state?: string;
}

export const LocationMap = ({ city, state }: LocationMapProps) => {
  const { isLoaded, hasError } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || hasError) return;

    const location = city && state ? `${city}, ${state}` : city || '';
    
    if (!location) {
      // Default to center of US
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: 39.8283, lng: -98.5795 },
        zoom: 4,
      });
      mapInstanceRef.current = map;
      return;
    }

    // Geocode the location
    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ address: location }, (results: any, status: any) => {
      if (status === 'OK' && results?.[0] && mapRef.current) {
        const map = new (window as any).google.maps.Map(mapRef.current, {
          center: results[0].geometry.location,
          zoom: 12,
        });

        new (window as any).google.maps.Marker({
          map: map,
          position: results[0].geometry.location,
          title: location,
        });

        mapInstanceRef.current = map;
      }
    });
  }, [isLoaded, hasError, city, state]);

  if (hasError) {
    return (
      <div className="w-full h-64 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load map</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-64 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div ref={mapRef} className="w-full h-64 rounded-lg overflow-hidden border border-border" />
  );
};