import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader } from '@googlemaps/js-api-loader';

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

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter address",
  className
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const initializeAutocomplete = async () => {
      try {
        // Get API key from environment - this should be set in your deployment environment
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
        
        if (!apiKey) {
          console.warn('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
          return;
        }

        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();

        if (inputRef.current && window.google) {
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
        }
      } catch (error) {
        console.warn('Google Places API not available:', error);
        // Fallback to regular input without autocomplete
      }
    };

    initializeAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

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