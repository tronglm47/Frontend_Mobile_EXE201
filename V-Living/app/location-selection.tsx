import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { Colors, Fonts } from '@/constants/theme';
import { useLocation } from './location-context';

export default function LocationSelection() {
  const { setSelectedLocation } = useLocation();
  const [loading, setLoading] = useState(false);

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập vị trí để sử dụng tính năng này');
        setLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocoding to get address
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse.length > 0) {
        const address = addressResponse[0];
        const fullAddress = `${address.street || ''} ${address.district || ''} ${address.city || ''}`.trim();
        
        const locationData = {
          address: fullAddress || 'Vị trí hiện tại',
          latitude,
          longitude,
          district: address.district || '',
          city: address.city || ''
        };

        setSelectedLocation(locationData);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Lỗi', 'Không thể xác định địa chỉ hiện tại');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleChooseManually = () => {
    router.push('/location-map');
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          {/* Map with magnifying glass overlay */}
          <View style={styles.mapContainer}>
            <View style={styles.map}>
              {/* Map pins */}
              <View style={[styles.mapPin, { top: 60, left: 80 }]} />
              <View style={[styles.mapPin, { top: 120, right: 60 }]} />
              <View style={[styles.mapPin, { bottom: 80, left: 100 }]} />
              <View style={[styles.mapPin, { bottom: 120, right: 80 }]} />
              
              {/* Magnifying glass */}
              <View style={styles.magnifyingGlass}>
                <View style={styles.magnifyingGlassLens}>
                  <MaterialIcons name="home" size={24} color="#FFD700" />
                </View>
                <View style={styles.magnifyingGlassHandle} />
              </View>
              
              {/* Speech bubbles */}
              <View style={styles.speechBubble1}>
                <View style={styles.speechBubbleContent}>
                  <MaterialIcons name="check" size={16} color="#fff" />
                </View>
              </View>
              
              <View style={styles.speechBubble2}>
                <View style={styles.speechBubbleDot} />
              </View>
            </View>
            
            {/* Clouds */}
            <View style={[styles.cloud, { top: 40, left: 20 }]} />
            <View style={[styles.cloud, { top: 20, right: 40 }]} />
            <View style={[styles.cloud, { bottom: 60, right: 20 }]} />
            
            {/* Plant */}
            <View style={styles.plant}>
              <MaterialIcons name="local-florist" size={32} color="#8B4513" />
            </View>
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Hi, Nice to meet you!</Text>
          <Text style={styles.subtitle}>
            Chọn khu vực bạn muốn để bắt đầu sử dụng ứng dụng
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleUseCurrentLocation}
            disabled={loading}
          >
            <MaterialIcons name="my-location" size={20} color="#000" />
            <Text style={styles.primaryButtonText}>
              {loading ? 'Đang lấy vị trí...' : 'Sử dụng địa chỉ hiện tại'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleChooseManually}
          >
            <Text style={styles.secondaryButtonText}>Chọn thủ công</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  skipButton: {
    backgroundColor: '#F2F3F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    color: '#9BA1A6',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    width: 280,
    height: 280,
    position: 'relative',
    marginBottom: 50,
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8E8E8',
    borderRadius: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapPin: {
    width: 10,
    height: 10,
    backgroundColor: '#FFD700',
    borderRadius: 5,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  magnifyingGlass: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  magnifyingGlassLens: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  magnifyingGlassHandle: {
    width: 16,
    height: 16,
    backgroundColor: '#FF8C00',
    position: 'absolute',
    bottom: -8,
    right: -8,
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
  },
  speechBubble1: {
    position: 'absolute',
    top: 35,
    left: 35,
    width: 35,
    height: 25,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  speechBubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speechBubble2: {
    position: 'absolute',
    top: 70,
    left: 55,
    width: 18,
    height: 18,
    backgroundColor: '#fff',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  speechBubbleDot: {
    width: 6,
    height: 6,
    backgroundColor: '#FF8C00',
    borderRadius: 3,
  },
  cloud: {
    width: 25,
    height: 16,
    backgroundColor: '#E6E6FA',
    borderRadius: 12,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  plant: {
    position: 'absolute',
    bottom: 15,
    right: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Fonts.rounded,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BA1A6',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 30,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    paddingHorizontal: 10,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.rounded,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FFD700',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.rounded,
  },
});
