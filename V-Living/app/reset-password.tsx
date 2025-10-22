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
import { resetPassword } from '@/apis/auth';
import Toast from '@/components/Toast';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; token?: string }>();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
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

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleResetPassword = async () => {
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      showToastMessage('Vui lòng nhập đầy đủ 6 chữ số xác thực', 'error');
      return;
    }

    if (!newPassword.trim()) {
      showToastMessage('Vui lòng nhập mật khẩu mới', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToastMessage('Mật khẩu phải có ít nhất 6 ký tự', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToastMessage('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await resetPassword({
        token: fullCode,
        newPassword: newPassword.trim(),
      });
      
      showToastMessage('Đổi mật khẩu thành công!', 'success');
      
      // Navigate to login with email and new password after 2 seconds
      setTimeout(() => {
        router.replace({ 
          pathname: '/login', 
          params: { 
            prefill: params.email || '', 
            pwd: newPassword.trim() 
          } 
        } as any);
      }, 2000);
      
    } catch (error: any) {
      showToastMessage(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error');
    } finally {
      setSubmitting(false);
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
        <Text style={styles.title}>Đặt Lại Mật Khẩu</Text>
        <Text style={styles.subtitle}>
          Nhập mã xác thực 6 chữ số đã được gửi đến email của bạn và mật khẩu mới
        </Text>
      </View>

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        <Text style={styles.otpLabel}>Mã xác thực</Text>
        <View style={styles.otpInputs}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
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
              editable={!submitting}
            />
          ))}
        </View>
      </View>

      {/* Password Inputs */}
      <View style={styles.passwordContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={20} color="#666666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            editable={!submitting}
          />
        </View>
        
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed" size={20} color="#666666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!submitting}
          />
        </View>
      </View>

      {/* Reset Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.resetButton,
            (code.join('').length !== 6 || !newPassword.trim() || !confirmPassword.trim() || submitting) && styles.resetButtonDisabled
          ]} 
          onPress={handleResetPassword}
          disabled={code.join('').length !== 6 || !newPassword.trim() || !confirmPassword.trim() || submitting}
        >
          <Text style={styles.resetButtonText}>
            {submitting ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Toast */}
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
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
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  otpInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginHorizontal: 4,
  },
  otpInputFilled: {
    borderColor: '#E0B100',
    backgroundColor: '#FFFBF0',
  },
  passwordContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    marginTop: 'auto',
  },
  resetButton: {
    backgroundColor: '#E0B100',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
