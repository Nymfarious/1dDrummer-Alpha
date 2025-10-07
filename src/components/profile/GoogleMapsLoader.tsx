import { useEffect, useState } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAXDwZ8kPQdMKdNaGNX3IVUx3GfrShCBdc';

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if already loaded
    if ((window as any).google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setHasError(true);
    };
    document.head.appendChild(script);

    // Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        console.error('Google Maps API loading timeout');
        setHasError(true);
      }
    }, 10000);

    return () => {
      clearTimeout(timeout);
    };
  }, [isLoaded]);

  return { isLoaded, hasError };
};
