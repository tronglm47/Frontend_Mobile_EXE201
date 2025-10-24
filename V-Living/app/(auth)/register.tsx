import { Colors } from '@/constants/theme';
import { register as apiRegister } from '@/apis/auth';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import Toast from '@/components/Toast';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const { role } = useLocalSearchParams<{ role: string }>();
  
  const [email, setEmail] = React.useState('');
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
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastType, setToastType] = React.useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };
  const hideToast = () => setToastVisible(false);

  // Redirect to role selection if no role is provided
  React.useEffect(() => {
    if (!role || !['user', 'landlord'].includes(role)) {
      router.replace('/select-role');
    }
  }, [role]);

  const getRoleDisplayName = () => {
    return role === 'landlord' ? 'Chủ nhà' : 'Người thuê';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>Đăng Ký Tài Khoản</Text>
        <Text style={styles.sub}>Đăng ký tài khoản {getRoleDisplayName()}</Text>
        <Text style={styles.sub}>Vui lòng nhập thông tin cá nhân của bạn</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputWrapActive, fieldErrors.Email && styles.inputInvalid]}>
            <TextInput
              placeholder="user@gmail.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError(null);
                if (fieldErrors.Email) setFieldErrors(prev => { const next = { ...prev }; delete next.Email; return next; });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#9BA1A6"
            />
          </View>
          {fieldErrors.Email?.length ? (
            <Text style={styles.errorFieldText}>{fieldErrors.Email[0]}</Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Username</Text>
          <View style={[styles.inputWrap, fieldErrors.Username && styles.inputInvalid]}>
            <TextInput
              placeholder="Alex123"
              value={username}
              onChangeText={(v) => {
                setUsername(v);
                if (error) setError(null);
                if (fieldErrors.Username) setFieldErrors(prev => { const next = { ...prev }; delete next.Username; return next; });
              }}
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#9BA1A6"
            />
          </View>
          {fieldErrors.Username?.length ? (
            <Text style={styles.errorFieldText}>{fieldErrors.Username[0]}</Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mật khẩu</Text>
          <View style={[styles.inputWrap, fieldErrors.Password && styles.inputInvalid]}>
            <TextInput
              placeholder="Abcd@123"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (error) setError(null);
                if (fieldErrors.Password) setFieldErrors(prev => { const next = { ...prev }; delete next.Password; return next; });
              }}
              secureTextEntry={secure}
              //tăng độ cao input
              style={[styles.input, { flex: 1, height: 56, width: '100%' }]}
              placeholderTextColor="#9BA1A6"
            />
            <TouchableOpacity onPress={() => setSecure(s => !s)} style={styles.eyeBtn}>
              <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9BA1A6" />
            </TouchableOpacity>
          </View>
          {fieldErrors.Password?.length ? (
            <Text style={styles.errorFieldText}>{fieldErrors.Password[0]}</Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <View style={[styles.inputWrap, fieldErrors.ConfirmPassword && styles.inputInvalid]}>
            <TextInput
              placeholder="********"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                if (error) setError(null);
                if (fieldErrors.ConfirmPassword) setFieldErrors(prev => { const next = { ...prev }; delete next.ConfirmPassword; return next; });
              }}
              secureTextEntry={secureConfirm}
              style={[styles.input, { flex: 1 }]}
              placeholderTextColor="#9BA1A6"
            />
            <TouchableOpacity onPress={() => setSecureConfirm(s => !s)} style={styles.eyeBtn}>
              <Ionicons name={secureConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9BA1A6" />
            </TouchableOpacity>
          </View>
          {fieldErrors.ConfirmPassword?.length ? (
            <Text style={styles.errorFieldText}>{fieldErrors.ConfirmPassword[0]}</Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <View style={[styles.inputWrap, fieldErrors.FullName && styles.inputInvalid]}>
            <TextInput
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChangeText={(v) => {
                setFullName(v);
                if (error) setError(null);
                if (fieldErrors.FullName) setFieldErrors(prev => { const next = { ...prev }; delete next.FullName; return next; });
              }}
              autoCapitalize="words"
              style={styles.input}
              placeholderTextColor="#9BA1A6"
            />
          </View>
          {fieldErrors.FullName?.length ? (
            <Text style={styles.errorFieldText}>{fieldErrors.FullName[0]}</Text>
          ) : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <View style={[styles.inputWrap, fieldErrors.PhoneNumber && styles.inputInvalid]}>
            <TextInput
              placeholder="0123 456 789"
              value={phoneNumber}
              onChangeText={(v) => {
                setPhoneNumber(v);
                if (error) setError(null);
                if (fieldErrors.PhoneNumber) setFieldErrors(prev => { const next = { ...prev }; delete next.PhoneNumber; return next; });
              }}
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor="#9BA1A6"
            />
          </View>
          {fieldErrors.PhoneNumber?.length ? (
            <Text style={styles.errorFieldText}>{fieldErrors.PhoneNumber[0]}</Text>
          ) : null}
        </View>

        {/* <View style={styles.fieldGroup}>
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
              <Text style={styles.secondaryText}><Ionicons name="cloud-upload-outline" size={20} color="#9BA1A6" /> Upload</Text>
            </TouchableOpacity>
            <View style={[styles.inputWrap, { flex: 1 }]}> 
              <TextInput
                placeholder="Hoặc dán URL: https://..."
                value={profilePictureUrl}
                onChangeText={setProfilePictureUrl}
                autoCapitalize="none"
                keyboardType="url"
                style={[styles.input, { flex: 1 }]}
                placeholderTextColor="#9BA1A6"
              />
            </View>
          </View>
        </View> */}

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgree(a => !a)}>
          <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
            {agree && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>Đồng ý với điều khoản và chính sách bảo mật</Text>
        </TouchableOpacity>

        {/* {registererror ? <Text style={{ color: '#B00020', marginTop: 8 }}>{error}</Text> : null} */}
        <TouchableOpacity
          style={[styles.primaryBtn, (!agree || loading) && { opacity: 0.7 }]}
          disabled={!agree || loading}
          onPress={async () => {
            setError(null);
            setLoading(true);
            try {
              // Clear previous field errors
              setFieldErrors({});

              // Aggregate client-side validations so ALL errors show at once
              const errs: Record<string, string[]> = {};
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(email)) errs.Email = ['Vui lòng nhập đúng định dạng email'];
              if (username.length < 3 || username.length > 50) errs.Username = ['Username phải ít nhất 3 ký tự'];
              if (password.length < 6 || password.length > 255) errs.Password = ['Tối thiểu 6 ký tự, gồm ít nhất 1 số và 1 ký tự đặc biệt (!@#$...)'];
              if (password !== confirmPassword) errs.ConfirmPassword = ['Mật khẩu xác nhận không khớp'];
              if (fullName && fullName.trim().length < 2) errs.FullName = ['Họ và tên quá ngắn'];
              if (phoneNumber && phoneNumber.trim().length < 8) errs.PhoneNumber = ['Số điện thoại không hợp lệ'];

              if (Object.keys(errs).length > 0) {
                setFieldErrors(errs);
                setError('Vui lòng kiểm tra lại các trường');
                return; // Do not call API when client validations fail
              }

              // Call API; if backend returns multiple errors, show them all
              await apiRegister({ username, email, password, fullName, phoneNumber, role: role || 'user' });
              showToast('Đăng ký thành công! Vui lòng xác thực email.', 'success');
              // After register, go to verify email screen, pass password for later prefill
              setTimeout(() => {
                router.replace({ pathname: '/verify-email', params: { email, username, password } } as any);
              }, 1200);
            } catch (e: any) {
              const apiErrors = e?.errors || e?.data?.errors;
              if (apiErrors && typeof apiErrors === 'object') {
                setFieldErrors(apiErrors);
                setError('Vui lòng kiểm tra lại các trường');
                showToast('Vui lòng kiểm tra lại các trường', 'error');
              } else {
                const msg = e?.message || 'Đăng ký thất bại';
                setError(msg);
                showToast(msg, 'error');
              }
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
      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={hideToast} />
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
  inputInvalid: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
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
  errorFieldText: {
    color: '#B91C1C',
    marginTop: 6,
    fontSize: 12,
  },
});
