import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationData {
  address: string;
  latitude?: number;
  longitude?: number;
  district?: string;
  city?: string;
}

interface LocationContextType {
  selectedLocation: LocationData | null;
  setSelectedLocation: (location: LocationData | null) => void;
  isLocationSelected: boolean;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [selectedLocation, setSelectedLocationState] = useState<LocationData | null>(null);
  const [isLocationSelected, setIsLocationSelected] = useState(false);

  // Load saved location on app start
  useEffect(() => {
    loadSavedLocation();
  }, []);

  // Update isLocationSelected when selectedLocation changes
  useEffect(() => {
    setIsLocationSelected(selectedLocation !== null);
  }, [selectedLocation]);

  const loadSavedLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem('selectedLocation');
      if (savedLocation) {
        setSelectedLocationState(JSON.parse(savedLocation));
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
    }
  };

  const setSelectedLocation = async (location: LocationData | null) => {
    try {
      setSelectedLocationState(location);
      if (location) {
        await AsyncStorage.setItem('selectedLocation', JSON.stringify(location));
      } else {
        await AsyncStorage.removeItem('selectedLocation');
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const clearLocation = async () => {
    try {
      setSelectedLocationState(null);
      await AsyncStorage.removeItem('selectedLocation');
    } catch (error) {
      console.error('Error clearing location:', error);
    }
  };

  return (
    <LocationContext.Provider 
      value={{ 
        selectedLocation, 
        setSelectedLocation, 
        isLocationSelected, 
        clearLocation 
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

// Default export để tránh warning
export default LocationProvider;
