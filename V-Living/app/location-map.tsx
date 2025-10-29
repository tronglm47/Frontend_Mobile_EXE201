import { updateBooking } from '@/apis/posts';
import { searchPlaces as nominatimSearch, PlaceResult, reverseGeocode } from '@/services/nominatim';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from './location-context';

type SearchResult = PlaceResult;

export default function LocationMap() {
  const { setSelectedLocation } = useLocation();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const [selectedAddress, setSelectedAddress] = useState('');
  // Default center near Vinhomes Grand Park, Thu Duc, HCMC
  const [region, setRegion] = useState({ latitude: 10.8426, longitude: 106.8297, latitudeDelta: 0.02, longitudeDelta: 0.02 });
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;
  const tileUrl = MAPTILER_KEY
    ? `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
    : undefined;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.length > 2) {
      debounceRef.current = setTimeout(() => {
        searchPlaces(searchQuery);
      }, 350);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const searchPlaces = async (query: string) => {
    try {
      setLoading(true);
      const results = await nominatimSearch(query);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setSelectedAddress(result.formatted_address);
    setSearchQuery(result.description);
    setShowResults(false);
    setRegion({ latitude: result.latitude, longitude: result.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    setPin({ latitude: result.latitude, longitude: result.longitude });
  };

  const handleSelect = () => {
    if (!selectedAddress) {
      Alert.alert('Lỗi', 'Vui lòng chọn một địa chỉ');
      return;
    }

    const coords = pin ?? { latitude: region.latitude, longitude: region.longitude };

    // If coming from booking flow, update booking via PUT /Booking/{id}
    if (params.bookingId) {
      (async () => {
        try {
          await updateBooking(params.bookingId as string, {
            meetingAddress: selectedAddress,
            meetingLatitude: coords.latitude,
            meetingLongitude: coords.longitude,
          });
          Alert.alert('Đã lưu vị trí hẹn', 'Điểm hẹn đã được cập nhật thành công');
          router.back();
        } catch (e: any) {
          Alert.alert('Lỗi', e?.message || 'Không thể lưu vị trí hẹn');
        }
      })();
      return;
    }

    const locationData = {
      address: selectedAddress,
      district: '—',
      city: 'TP Hồ Chí Minh',
      coordinates: coords,
    };
    setSelectedLocation(locationData);
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#FFD700" />
          <TextInput 
            placeholder="Tìm kiếm theo vị trí"
            placeholderTextColor="#9BA1A6"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowResults(searchResults.length > 0)}
          />
          {loading && <MaterialIcons name="hourglass-empty" size={20} color="#9BA1A6" />}
        </View>
      </View>

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <View style={styles.searchResults}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.searchResultItem}
                onPress={() => handleSelectResult(item)}
              >
                <MaterialIcons name="place" size={20} color="#9BA1A6" />
                <View style={styles.searchResultText}>
                  <Text style={styles.searchResultTitle}>{item.description}</Text>
                  <Text style={styles.searchResultSubtitle}>{item.formatted_address}</Text>
                </View>
              </TouchableOpacity>
            )}
            style={styles.searchResultsList}
          />
        </View>
      )}

      {/* Map Interface (OSM tiles) */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={(r) => setRegion(r)}
          onPress={async (e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setPin({ latitude, longitude });
            const addr = await reverseGeocode(latitude, longitude);
            if (addr) setSelectedAddress(addr);
          }}
        >
          {/* Tile overlay - MapTiler (free tier) */}
          {tileUrl ? (
            <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} />
          ) : null}
          {pin && (
            <Marker
              coordinate={pin}
              draggable
              onDragEnd={async (e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                setPin({ latitude, longitude });
                const addr = await reverseGeocode(latitude, longitude);
                if (addr) setSelectedAddress(addr);
              }}
            />
          )}
        </MapView>
        {!tileUrl && (
          <View style={styles.tileWarning}>
            <Text style={styles.tileWarningText}>
              Cần cấu hình EXPO_PUBLIC_MAPTILER_KEY để hiển thị bản đồ chi tiết.
            </Text>
          </View>
        )}
        {/* Address Selection */}
        <View style={styles.addressDialog}>
          <View style={styles.addressHeader}>
            <Text style={styles.addressTitle}>Địa chỉ</Text>
          </View>
          <View style={styles.addressContent}>
            <View style={styles.addressIcon}>
              <MaterialIcons name="place" size={16} color="#fff" />
            </View>
            <Text style={styles.addressText}>
              {selectedAddress || 'Kéo thả ghim để chọn vị trí chính xác'}
            </Text>
          </View>
        </View>
      </View>

      {/* Select Button */}
      <TouchableOpacity style={styles.selectButton} onPress={handleSelect}>
        <Text style={styles.selectButtonText}>Chọn</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    margin: 16,
  },
  map: {
    flex: 1,
    backgroundColor: '#E8E8E8',
    borderRadius: 16,
    position: 'relative',
  },
  mapLabel: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 120,
  },
  labelText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  centralPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -25 }],
  },
  pinIcon: {
    width: 30,
    height: 40,
    backgroundColor: '#FFD700',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  addressDialog: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  addressHeader: {
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7B68EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  selectButton: {
    backgroundColor: '#FFD700',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchResults: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1000,
    maxHeight: 300,
  },
  searchResultsList: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F3F5',
  },
  searchResultText: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#9BA1A6',
    lineHeight: 20,
  },
  tileWarning: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
  },
  tileWarningText: {
    fontSize: 12,
    color: '#111',
  },
});
