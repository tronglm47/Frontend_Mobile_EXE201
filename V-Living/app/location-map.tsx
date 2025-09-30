import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, FlatList, Alert } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { Colors } from '@/constants/theme';
import { useLocation } from './location-context';

interface SearchResult {
  place_id: string;
  description: string;
  formatted_address: string;
}

export default function LocationMap() {
  const { setSelectedLocation } = useLocation();
  const [selectedAddress, setSelectedAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchPlaces(searchQuery);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  const searchPlaces = async (query: string) => {
    try {
      setLoading(true);
      // Mock search results - trong thực tế sẽ gọi Google Places API
      const mockResults: SearchResult[] = [
        {
          place_id: '1',
          description: 'Tòa nhà S702, Đại học Quốc gia TP.HCM',
          formatted_address: 'Tòa nhà S702, Đại học Quốc gia TP.HCM, Quận Thủ Đức, TP Hồ Chí Minh'
        },
        {
          place_id: '2', 
          description: 'NVH Sinh viên, Đại học Quốc gia TP.HCM',
          formatted_address: 'NVH Sinh viên, Đại học Quốc gia TP.HCM, Quận Thủ Đức, TP Hồ Chí Minh'
        },
        {
          place_id: '3',
          description: 'S10 Vinhomes Grand Park',
          formatted_address: 'S10 Vinhomes Grand Park, Quận 9, TP Hồ Chí Minh'
        },
        {
          place_id: '4',
          description: 'Origami S10.02',
          formatted_address: 'Origami S10.02, Vinhomes Grand Park, Quận 9, TP Hồ Chí Minh'
        },
        {
          place_id: '5',
          description: 'Beverly B2',
          formatted_address: 'Beverly B2, Vinhomes Grand Park, Quận 9, TP Hồ Chí Minh'
        }
      ].filter(result => 
        result.description.toLowerCase().includes(query.toLowerCase()) ||
        result.formatted_address.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(mockResults);
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
  };

  const handleSelect = () => {
    if (!selectedAddress) {
      Alert.alert('Lỗi', 'Vui lòng chọn một địa chỉ');
      return;
    }

    const locationData = {
      address: selectedAddress,
      district: selectedAddress.includes('Quận 9') ? 'Quận 9' : 'Quận Thủ Đức',
      city: 'TP Hồ Chí Minh'
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

      {/* Map Interface */}
      <View style={styles.mapContainer}>
        <View style={styles.map}>
          {/* Map Labels */}
          <View style={[styles.mapLabel, { top: 60, left: 40 }]}>
            <MaterialIcons name="place" size={16} color="#9BA1A6" />
            <Text style={styles.labelText}>Toà S10.02 Origami</Text>
          </View>
          
          <View style={[styles.mapLabel, { top: 100, right: 60 }]}>
            <Text style={styles.labelText}>Origami - S10.07</Text>
          </View>
          
          <View style={[styles.mapLabel, { bottom: 140, left: 20 }]}>
            <Text style={styles.labelText}>Wallace Vinhomes Grand Park</Text>
          </View>
          
          <View style={[styles.mapLabel, { bottom: 100, right: 80 }]}>
            <MaterialIcons name="restaurant" size={16} color="#FF8C00" />
            <Text style={styles.labelText}>Fried Chicken</Text>
          </View>
          
          <View style={[styles.mapLabel, { bottom: 60, left: 100 }]}>
            <MaterialIcons name="local-cafe" size={16} color="#FF8C00" />
            <Text style={styles.labelText}>Trà Sữa The Shan Cha</Text>
          </View>
          
          {/* Central Location Pin */}
          <View style={styles.centralPin}>
            <View style={styles.pinIcon}>
              <MaterialIcons name="place" size={24} color="#fff" />
            </View>
          </View>
        </View>
        
        {/* Address Selection Dialog */}
        <View style={styles.addressDialog}>
          <View style={styles.addressHeader}>
            <Text style={styles.addressTitle}>Địa chỉ</Text>
          </View>
          
          <View style={styles.addressContent}>
            <View style={styles.addressIcon}>
              <MaterialIcons name="place" size={16} color="#fff" />
            </View>
            <Text style={styles.addressText}>
              {selectedAddress || 'Chọn địa chỉ từ danh sách bên trên'}
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
});
