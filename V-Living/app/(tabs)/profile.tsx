import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout as apiLogout } from '@/lib/auth';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ padding: 16 }}>
        <Text style={styles.title}>Hồ sơ</Text>
        <Text>Đang phát triển…</Text>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            try {
              //remove token from storage and navigate to login
              // await AsyncStorage.removeItem('authToken');
              // await AsyncStorage.removeItem('hasSeenPlans');

              await apiLogout();
              router.replace('/login' as any);
            } catch (e: any) {
              Alert.alert('Lỗi', e?.message || 'Không thể đăng xuất');
            }
          }}
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  logoutBtn: { marginTop: 16, backgroundColor: '#FEE2E2', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  logoutText: { color: '#B91C1C', fontWeight: '700' },
});


