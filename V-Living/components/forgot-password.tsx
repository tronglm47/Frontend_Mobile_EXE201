import React, { useState } from 'react';
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

interface ForgotPasswordProps {
  onBack?: () => void;
  onNext?: (method: 'phone' | 'email') => void;
}

export default function ForgotPassword({ onBack, onNext }: ForgotPasswordProps) {
  const [selectedMethod, setSelectedMethod] = useState<'phone' | 'email'>('email');

  const handleNext = () => {
    onNext?.(selectedMethod);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff" 
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Quên Mật Khẩu</Text>
        <Text style={styles.subtitle}>
          Chọn thông tin liên hệ mà bạn muốn chúng tôi sử dụng để đặt lại mật khẩu
        </Text>
      </View>

      {/* Contact Options */}
      <View style={styles.optionsContainer}>
        {/* Phone Option */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedMethod === 'phone' && styles.selectedCard
          ]}
          onPress={() => setSelectedMethod('phone')}
        >
          <View style={styles.optionContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8E8FF' }]}>
              <Ionicons name="call" size={24} color="#E0B100" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Điện thoại</Text>
              <Text style={styles.optionValue}>+84 34 -5***488-65</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Email Option */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            selectedMethod === 'email' && styles.selectedCard
          ]}
          onPress={() => setSelectedMethod('email')}
        >
          <View style={styles.optionContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#E8E8FF' }]}>
              <Ionicons name="mail" size={24} color="#E0B100" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Email</Text>
              <Text style={styles.optionValue}>lem***@gmail.com</Text>
            </View>
          </View>
        </TouchableOpacity>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedCard: {
    borderColor: '#E0B100',
    borderWidth: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  optionValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    marginTop: 'auto',
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
