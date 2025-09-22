import React, { useState } from 'react';
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

export default function CreateNewPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = () => {
    if (newPassword && confirmPassword && newPassword === confirmPassword) {
      // Navigate to success screen
      router.push('/password-changed-success' as any);
    } else {
      alert('Mật khẩu không khớp hoặc chưa nhập đầy đủ');
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
        <Text style={styles.title}>Tạo Mật Khẩu Mới</Text>
        <Text style={styles.subtitle}>
          Vui lòng nhập mật khẩu mới của bạn
        </Text>
      </View>

      {/* Password Fields */}
      <View style={styles.fieldsContainer}>
        {/* New Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mật khẩu mới</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              placeholderTextColor="#9BA1A6"
            />
            <TouchableOpacity 
              onPress={() => setShowNewPassword(!showNewPassword)} 
              style={styles.eyeButton}
            >
              <Ionicons 
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color="#9BA1A6" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholderTextColor="#9BA1A6"
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
              style={styles.eyeButton}
            >
              <Ionicons 
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color="#9BA1A6" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Change Password Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.changePasswordButton,
            newPassword && confirmPassword ? styles.changePasswordButtonActive : styles.changePasswordButtonInactive
          ]} 
          onPress={handleChangePassword}
          disabled={!newPassword || !confirmPassword}
        >
          <Text style={styles.changePasswordButtonText}>Đổi mật khẩu</Text>
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
  fieldsContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    marginTop: 'auto',
  },
  changePasswordButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePasswordButtonActive: {
    backgroundColor: '#E0B100',
  },
  changePasswordButtonInactive: {
    backgroundColor: '#E0E0E0',
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
