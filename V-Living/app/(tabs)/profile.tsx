import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { logout as apiLogout, getUserInfo, UserInfo } from '@/apis/auth';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '@/constants/theme';

export default function ProfileTab() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const info = await getUserInfo();
        if (mounted) setUser(info);
      } catch (e) {
        console.warn('Load user info failed:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    // Xác nhận trước khi đăng xuất
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await apiLogout();
              // Chuyển về màn hình login
              router.replace('/login' as any);
            } catch (e: any) {
              console.error('Logout error:', e);
              Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleMenuPress = (menuItem: string) => {
    Alert.alert('Thông báo', `${menuItem} sẽ được phát triển trong phiên bản tiếp theo.`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Hồ sơ</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {user?.profilePictureUrl ? (
            <View style={styles.profileImageContainer}>
              <Image 
                source={{ uri: user.profilePictureUrl }}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.cameraButton}>
                <MaterialIcons name="camera-alt" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
          
          <Text style={styles.userName}>{user?.fullName || user?.username || 'Người dùng'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Cài đặt')}>
            <View style={styles.menuIcon}>
              <MaterialIcons name="settings" size={24} color="#E0B100" />
            </View>
            <Text style={styles.menuText}>Cài đặt</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9BA1A6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Phương thức thanh toán')}>
            <View style={styles.menuIcon}>
              <MaterialIcons name="account-balance-wallet" size={24} color="#E0B100" />
            </View>
            <Text style={styles.menuText}>Phương thức thanh toán</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9BA1A6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Thông báo')}>
            <View style={styles.menuIcon}>
              <MaterialIcons name="notifications" size={24} color="#E0B100" />
            </View>
            <Text style={styles.menuText}>Thông báo</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9BA1A6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Lịch sử xem')}>
            <View style={styles.menuIcon}>
              <MaterialIcons name="history" size={24} color="#E0B100" />
            </View>
            <Text style={styles.menuText}>Lịch sử xem</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9BA1A6" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Thông tin ứng dụng')}>
            <View style={styles.menuIcon}>
              <MaterialIcons name="info" size={24} color="#E0B100" />
            </View>
            <Text style={styles.menuText}>Thông tin ứng dụng</Text>
            <MaterialIcons name="chevron-right" size={24} color="#9BA1A6" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]} 
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <View style={styles.logoutLoadingContainer}>
                <ActivityIndicator size="small" color="#DC2626" />
                <Text style={[styles.logoutText, styles.logoutTextLoading]}>Đang đăng xuất...</Text>
              </View>
            ) : (
              <Text style={styles.logoutText}>Đăng xuất</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: Colors.light.text,
    fontFamily: Fonts.rounded,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#F2F3F5',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0B100',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    fontFamily: Fonts.rounded,
  },
  userEmail: {
    fontSize: 16,
    color: '#9BA1A6',
    fontWeight: '400',
  },
  menuSection: {
    paddingHorizontal: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#E6E8EB',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  menuIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 12,
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  logoutButton: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: { 
    color: '#DC2626', 
    fontSize: 16,
    fontWeight: '600',
  },
  logoutTextLoading: {
    color: '#DC2626',
  },
});


