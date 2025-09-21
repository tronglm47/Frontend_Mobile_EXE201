import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function VerifyEmailScreen() {
  const [code, setCode] = useState(['', '', '', '']);
  const inputRefs = useRef<TextInput[]>([]);

  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode.length === 4) {
      // Navigate to create new password screen
      router.push('/create-new-password' as any);
    }
  };

  const handleResend = () => {
    // TODO: Implement resend code logic
    alert('Mã xác minh đã được gửi lại');
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Xác Minh Email Của Bạn</Text>
        <Text style={styles.subtitle}>
          Vui lòng nhập mã xác minh gồm 4 chữ số đã được gửi đến địa chỉ email của bạn.
        </Text>
      </View>

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref!)}
            style={[
              styles.otpInput,
              digit ? styles.otpInputFilled : null
            ]}
            value={digit}
            onChangeText={(value) => handleCodeChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      {/* Resend Code */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Không nhận được mã?</Text>
        <TouchableOpacity onPress={handleResend}>
          <Text style={styles.resendLink}>Gửi lại mã</Text>
        </TouchableOpacity>
      </View>

      {/* Verify Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.verifyButton,
            code.join('').length === 4 ? styles.verifyButtonActive : styles.verifyButtonInactive
          ]} 
          onPress={handleVerify}
          disabled={code.join('').length !== 4}
        >
          <Text style={styles.verifyButtonText}>Xác minh</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  otpInputFilled: {
    borderColor: '#E0B100',
    backgroundColor: '#FFFBF0',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  resendLink: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    marginTop: 'auto',
  },
  verifyButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonActive: {
    backgroundColor: '#E0B100',
  },
  verifyButtonInactive: {
    backgroundColor: '#E0E0E0',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
