import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { forgotPassword } from '@/apis/auth';
import Toast from '@/components/Toast';

interface ForgotPasswordProps {
  onBack?: () => void;
  onNext?: (email: string) => void;
}

export default function ForgotPassword({ onBack, onNext }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      showToastMessage('Vui lòng nhập email của bạn', 'error');
      return;
    }

    if (!email.includes('@')) {
      showToastMessage('Vui lòng nhập email hợp lệ', 'error');
      return;
    }

    try {
      setLoading(true);
      await forgotPassword({ email: email.trim() });
      
      showToastMessage('Mã xác thực đã được gửi đến email của bạn', 'success');
      
      // Navigate to reset password screen after showing toast
      setTimeout(() => {
        onNext?.(email.trim());
      }, 1500);
      
    } catch (error: any) {
      console.error('Forgot password error:', error);
      showToastMessage(error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
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
1        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Quên Mật Khẩu</Text>
        <View style={{ width: 36 }} />
      </View>
      
      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu
        </Text>
      </View>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail" size={20} color="#666666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nhập email của bạn"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>
      </View>

      {/* Send Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!email.trim() || loading) && styles.sendButtonDisabled
          ]} 
          onPress={handleSendEmail}
          disabled={!email.trim() || loading}
        >
          <Text style={styles.sendButtonText}>
            {loading ? 'Đang gửi...' : 'Gửi mã xác thực'}
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
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    marginTop: 0,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontWeight: '800',
    fontSize: 18,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  inputContainer: {
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
  sendButton: {
    backgroundColor: '#E0B100',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
