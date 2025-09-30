import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { resendVerification, verifyEmail } from '@/apis/auth';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string; username?: string; password?: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6 || !params?.email) return;
    try {
      setSubmitting(true);
      await verifyEmail({ token: fullCode });
      // Success toast and redirect to login, prefill username/email
      alert('Xác minh email thành công!');
      router.replace({ pathname: '/login', params: { prefill: params.username || params.email, pwd: params.password || '' } } as any);
    } catch (e: any) {
      alert(e?.message || 'Mã xác minh không đúng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!params?.email) return;
    try {
      await resendVerification(String(params.email));
      alert('Mã xác minh đã được gửi lại');
    } catch (e: any) {
      alert(e?.message || 'Không thể gửi lại mã. Vui lòng thử lại.');
    }
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
          Vui lòng nhập mã xác minh gồm 6 chữ số đã được gửi đến địa chỉ email của bạn.
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
            code.join('').length === 6 ? styles.verifyButtonActive : styles.verifyButtonInactive
          ]} 
          onPress={handleVerify}
          disabled={code.join('').length !== 6}
        >
          <Text style={styles.verifyButtonText}>{submitting ? 'Đang xác minh...' : 'Xác minh'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  otpInput: {
    flex: 1,
    maxWidth: 56,
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
