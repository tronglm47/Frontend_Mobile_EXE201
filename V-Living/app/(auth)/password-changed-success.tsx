import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function PasswordChangedSuccessScreen() {
  const handleNext = () => {
    // Navigate back to login screen
    router.replace('/(auth)/login' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff" 
        translucent={false}
      />
      
      {/* Success Content */}
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Ionicons name="shield-checkmark" size={48} color="#E0B100" />
          </View>
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark" size={24} color="#ffffff" />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Thành công!</Text>
        <Text style={styles.message}>
          Mật khẩu của bạn đã được thay đổi.
        </Text>
        <Text style={styles.subMessage}>
          Vui lòng đăng nhập lại bằng mật khẩu mới
        </Text>
      </View>

      {/* Next Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Tiếp theo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E9ECEF',
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0B100',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  subMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  nextButton: {
    backgroundColor: '#E0B100',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
