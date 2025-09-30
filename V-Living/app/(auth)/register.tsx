import React from 'react';
import { router } from 'expo-router';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { register as apiRegister } from '@/apis/auth';
import * as ImagePicker from 'expo-image-picker';

export default function RegisterScreen() {
  const [email, setEmail] = React.useState('leminhtrong@gmail.com');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [profilePictureUrl, setProfilePictureUrl] = React.useState('');
  const [secure, setSecure] = React.useState(true);
  const [secureConfirm, setSecureConfirm] = React.useState(true);
  const [agree, setAgree] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>Đăng Ký Tài Khoản</Text>
  <Text style={styles.sub}>Vui lòng nhập thông tin cá nhân của bạn</Text>

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

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={secureConfirm}
              style={[styles.input, { flex: 1 }]}
              placeholderTextColor="#9BA1A6"
            />
            <TouchableOpacity onPress={() => setSecureConfirm(s => !s)} style={styles.eyeBtn}>
              <Ionicons name={secureConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9BA1A6" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Họ và tên"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              style={styles.input}
              placeholderTextColor="#9BA1A6"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Số điện thoại"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor="#9BA1A6"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Ảnh đại diện</Text>
          {profilePictureUrl ? (
            <View style={styles.avatarRow}>
              <Image source={{ uri: profilePictureUrl }} style={styles.avatar} />
              <TouchableOpacity onPress={() => setProfilePictureUrl('')} style={styles.clearBtn}>
                <Text style={styles.clearText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.secondaryBtn]}
              onPress={async () => {
                const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (perm.status !== 'granted') {
                  setError('Cần quyền truy cập thư viện để chọn ảnh');
                  return;
                }
                const res = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.7,
                  base64: true,
                });
                if (!res.canceled && res.assets && res.assets[0]) {
                  const asset = res.assets[0];
                  const base64 = asset.base64;
                  const mime = asset.type === 'video' ? 'image/jpeg' : (asset.mimeType || 'image/jpeg');
                  if (base64) {
                    const dataUri = `data:${mime};base64,${base64}`;
                    setProfilePictureUrl(dataUri);
                  } else if (asset.uri) {
                    // Fallback to file URI if base64 missing
                    setProfilePictureUrl(asset.uri);
                  }
                }
              }}
            >
              <Text style={styles.secondaryText}>Choose from library</Text>
            </TouchableOpacity>
            {/* <View style={[styles.inputWrap, { flex: 1 }]}> 
              <TextInput
                placeholder="Hoặc dán URL: https://..."
                value={profilePictureUrl}
                onChangeText={setProfilePictureUrl}
                autoCapitalize="none"
                keyboardType="url"
                style={[styles.input, { flex: 1 }]}
                placeholderTextColor="#9BA1A6"
              />
            </View> */}
          </View>
        </View>

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgree(a => !a)}>
          <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
            {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>Đồng ý với điều khoản và chính sách bảo mật</Text>
        </TouchableOpacity>

        {error ? <Text style={{ color: '#B00020', marginTop: 8 }}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.primaryBtn, (!agree || loading) && { opacity: 0.7 }]}
          disabled={!agree || loading}
          onPress={async () => {
            setError(null);
            setLoading(true);
            try {
              if (!email || !username || !password) throw new Error('Vui lòng nhập đầy đủ Email, Username, Mật khẩu');
              if (password !== confirmPassword) throw new Error('Mật khẩu xác nhận không khớp');
              await apiRegister({ username, email, password, fullName, phoneNumber, profilePictureUrl });
              // After register, go to verify email screen, pass password for later prefill
              router.replace({ pathname: '/verify-email', params: { email, username, password } } as any);
            } catch (e: any) {
              setError(e?.message || 'Đăng ký thất bại');
            } finally {
              setLoading(false);
            }
          }}
        >
          <Text style={styles.primaryText}>{loading ? 'Đang xử lý…' : 'Đăng ký'}</Text>
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
  secondaryBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#F2F3F5',
  },
  secondaryText: { color: Colors.light.text, fontWeight: '600' },
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
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F2F3F5' },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },
  clearText: { color: '#B91C1C', fontWeight: '600' },
});
