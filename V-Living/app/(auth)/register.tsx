import React from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [email, setEmail] = React.useState('leminhtrong@gmail.com');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [secure, setSecure] = React.useState(true);
  const [agree, setAgree] = React.useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>Đăng Ký Tài Khoản</Text>
        <Text style={styles.sub}>Vui lòng nhập email, username và mật khẩu để tiếp tục</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapActive}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#9BA1A6"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#9BA1A6"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secure}
              style={[styles.input, { flex: 1 }]}
              placeholderTextColor="#9BA1A6"
            />
            <TouchableOpacity onPress={() => setSecure(s => !s)} style={styles.eyeBtn}>
              <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9BA1A6" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgree(a => !a)}>
          <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
            {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>Đồng ý với điều khoản và chính sách quyền riêng tư</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={async () => {
            await AsyncStorage.setItem('authToken', 'dummy');
            const seenPlans = await AsyncStorage.getItem('hasSeenPlans');
            router.replace((seenPlans === 'true' ? '/(tabs)' : '/choose-plan') as any);
          }}
        >
          <Text style={styles.primaryText}>Đăng ký</Text>
        </TouchableOpacity>

        <View style={styles.orWrap}>
          <View style={styles.sep} />
          <Text style={styles.orText}>hoặc</Text>
          <View style={styles.sep} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="logo-facebook" size={20} color="#1877F2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="logo-google" size={20} color="#DB4437" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const GOLD = '#E0B100';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerRow: {
    paddingTop: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 8,
  },
  sub: {
    color: '#687076',
    marginTop: 8,
    lineHeight: 20,
  },
  fieldGroup: {
    marginTop: 18,
  },
  label: {
    color: '#687076',
    marginBottom: 8,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: '#E6E8EB',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  inputWrapActive: {
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  input: {
    fontSize: 16,
    color: Colors.light.text,
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  checkboxRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  checkboxLabel: {
    color: Colors.light.text,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  orWrap: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sep: {
    height: 1,
    backgroundColor: '#E6E8EB',
    flex: 1,
  },
  orText: {
    color: '#9BA1A6',
    marginHorizontal: 12,
  },
  socialRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
