import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    // Check if already loaded
    if ((window as any).google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Fetch API key from Edge Function
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-maps-config');
        
        if (error) {
          console.error('Failed to fetch Maps config:', error);
          setHasError(true);
          return;
        }

        if (data?.apiKey) {
          setApiKey(data.apiKey);
        } else {
          console.error('No API key returned from Maps config');
          setHasError(true);
        }
      } catch (err) {
        console.error('Error fetching Maps config:', err);
        setHasError(true);
      }
    };

    fetchApiKey();
  }, []);

  useEffect(() => {
    if (!apiKey || hasError) return;

    // Load the script with fetched API key
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
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
  }, [apiKey, hasError, isLoaded]);

  return { isLoaded, hasError };
};
