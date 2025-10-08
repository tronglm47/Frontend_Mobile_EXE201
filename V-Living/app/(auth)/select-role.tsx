import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectRoleScreen() {
  const handleRoleSelect = (role: 'user' | 'landlord') => {
    router.push({
      pathname: '/register',
      params: { role }
    } as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.heading}>Chọn loại tài khoản</Text>
            <Text style={styles.subtitle}>
              Vui lòng chọn loại tài khoản phù hợp với nhu cầu của bạn
            </Text>
          </View>

          <View style={styles.roleOptions}>
            <TouchableOpacity 
              style={styles.roleCard}
              onPress={() => handleRoleSelect('user')}
            >
              <View style={styles.roleIcon}>
                <Ionicons name="person-outline" size={32} color={GOLD} />
              </View>
              <Text style={styles.roleTitle}>Người thuê</Text>
              <Text style={styles.roleDescription}>
                Tìm kiếm và thuê phòng trọ, căn hộ phù hợp với nhu cầu của bạn
              </Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>Tìm kiếm phòng trọ</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>Đặt lịch xem phòng</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>Quản lý đơn đặt phòng</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.roleCard}
              onPress={() => handleRoleSelect('landlord')}
            >
              <View style={styles.roleIcon}>
                <Ionicons name="business-outline" size={32} color={GOLD} />
              </View>
              <Text style={styles.roleTitle}>Chủ nhà</Text>
              <Text style={styles.roleDescription}>
                Đăng tin cho thuê và quản lý các phòng trọ, căn hộ của bạn
              </Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>Đăng tin cho thuê</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>Quản lý phòng trọ</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.featureText}>Theo dõi đơn đặt phòng</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.noteSection}>
            <View style={styles.noteCard}>
              <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
              <Text style={styles.noteText}>
                Bạn có thể thay đổi loại tài khoản sau khi đăng ký thành công
              </Text>
            </View>
          </View>
        </View>
      </View>
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
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#687076',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  roleOptions: {
    gap: 20,
    marginBottom: 30,
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E6E8EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  roleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  noteSection: {
    alignItems: 'center',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    maxWidth: '90%',
  },
  noteText: {
    fontSize: 13,
    color: '#3B82F6',
    flex: 1,
    lineHeight: 18,
  },
});
