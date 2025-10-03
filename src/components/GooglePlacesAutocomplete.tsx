import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

declare global {
  interface Window {
    google: typeof google;
  }
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Singleton to load Google Maps API only once
let googleMapsLoaded = false;
let googleMapsLoading = false;
let googleMapsLoadPromise: Promise<void> | null = null;

const loadGoogleMapsAPI = async (): Promise<void> => {
  if (googleMapsLoaded) return;
  if (googleMapsLoading && googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoading = true;
  googleMapsLoadPromise = new Promise<void>((resolve) => {
    // Google Places API disabled - use regular input
    // To enable, add your API key to Supabase Edge Functions secrets
    googleMapsLoaded = false;
    googleMapsLoading = false;
    resolve();
  });

  return googleMapsLoadPromise;
};

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter address",
  className
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        await loadGoogleMapsAPI();
        
        if (inputRef.current && window.google?.maps?.places) {
          autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'au' },
            fields: ['formatted_address', 'geometry']
          });

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();
            if (place?.formatted_address) {
              onChange(place.formatted_address);
            }
          });
          
          setIsReady(true);
        }
      } catch (error) {
        // Fallback to regular input without autocomplete
        setIsReady(true);
      }
    };

    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default GooglePlacesAutocomplete;