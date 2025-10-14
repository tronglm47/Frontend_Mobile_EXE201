import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Illustration (replace frame with provided artwork) */}
        <View style={styles.illustrationContainer}>
          <Image 
            source={require('../assets/images/location/location.png')} 
            style={{ width: '100%', height: '100%' }} 
            contentFit="contain" 
          />
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
    paddingTop: 20,
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
    width: 300,
    height: 220,
    marginBottom: 50,
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
