import { Colors } from '@/constants/theme';
import { login as apiLogin } from '@/apis/auth';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Animated, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from '@/components/Toast';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ prefill?: string; pwd?: string }>();
  const [email, setEmail] = React.useState<string>(() => (params?.prefill ? String(params.prefill) : 'admin'));
  const [password, setPassword] = React.useState<string>(() => (params?.pwd ? String(params.pwd) : ''));
  const [remember, setRemember] = React.useState(true);
  const [secure, setSecure] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  
  // Toast states
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastType, setToastType] = React.useState<'success' | 'error' | 'info'>('info');

  // Function to show toast
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Function to hide toast
  const hideToast = () => {
    setToastVisible(false);
  };

  // Smooth error banner fade and prevent layout jump
  const errorOpacity = React.useRef(new Animated.Value(0)).current;
  const lastErrorRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (error) lastErrorRef.current = error;
    Animated.timing(errorOpacity, {
      toValue: error ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [error, errorOpacity]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.welcomeSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="home-outline" size={48} color={GOLD} />
            </View>
            <Text style={styles.heading}>Chào mừng đã quay trở lại!</Text>
            <Text style={styles.sub}>Vui lòng đăng nhập bằng email, mật khẩu hoặc tài khoản mạng xã hội để tiếp tục</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Username</Text>
          <View style={[styles.inputWrapActive, fieldErrors.Username && styles.inputInvalid]}>
            <TextInput
              placeholder="Username"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError(null);
                if (fieldErrors.Username) {
                  setFieldErrors(prev => {
                    const next = { ...prev };
                    delete next.Username;
                    return next;
                  });
                }
              }}
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#9BA1A6"
              onBlur={() => {
                const v = email.trim();
                setFieldErrors(prev => {
                  const next = { ...prev };
                  if (v.length < 3 || v.length > 50) {
                    next.Username = ['Tên đăng nhập phải từ 3 đến 50 ký tự'];
                  } else {
                    delete next.Username;
                  }
                  return next;
                });
              }}
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
              placeholder="Password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (error) setError(null);
                if (fieldErrors.Password) {
                  setFieldErrors(prev => {
                    const next = { ...prev };
                    delete next.Password;
                    return next;
                  });
                }
              }}
              secureTextEntry={secure}
              style={[styles.input, { flex: 1 }]}
              placeholderTextColor="#9BA1A6"
              onBlur={() => {
                setFieldErrors(prev => {
                  const next = { ...prev };
                  if (password.length < 6 || password.length > 255) {
                    next.Password = ['Mật khẩu phải từ 6 đến 255 ký tự'];
                  } else {
                    delete next.Password;
                  }
                  return next;
                });
              }}
            />
            <TouchableOpacity onPress={() => setSecure(s => !s)} style={styles.eyeBtn}>
              <Ionicons name={secure ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9BA1A6" />
            </TouchableOpacity>
          </View>
          {fieldErrors.Password?.length ? (
            <Text style={styles.errorFieldText}>{fieldErrors.Password[0]}</Text>
          ) : null}
        </View>

        <View style={styles.rowBetween}>
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setRemember(r => !r)}>
            <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
              {remember && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Ghi nhớ tài khoản</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/forgot-password' as any)}>
            <Text style={styles.linkText}>Quên mật khẩu ?</Text>
          </TouchableOpacity>
        </View>

        {/* Error area reserves space to avoid layout shift */}
        {/* <View style={styles.errorArea}>
          <Animated.View style={[styles.errorBanner, { opacity: errorOpacity }]}> 
            <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.errorText} numberOfLines={2}>
              {lastErrorRef.current || ''}
            </Text>
          </Animated.View>
        </View> */}

        <TouchableOpacity
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={async () => {
            setLoading(true);
            try {
              // Client-side validations: show ALL issues at once
           
              const errs: Record<string, string[]> = {};
              if (email.trim().length < 3 || email.trim().length > 50) {
                errs.Username = ['Tên đăng nhập phải từ 3 đến 50 ký tự'];
              }
              if (password.length < 6 || password.length > 255) {
                errs.Password = ['Mật khẩu phải từ 6 đến 255 ký tự'];
              }

              if (Object.keys(errs).length > 0) {
                setFieldErrors(errs);
                setError('Vui lòng kiểm tra lại các trường');
                return;
              }

              // API expects username + password
              await apiLogin({ username: email, password });
              
              // Show success toast
              showToast('Đăng nhập thành công!', 'success');
              
              // Delay navigation to show toast
              setTimeout(() => {
                const seenPlans = AsyncStorage.getItem('hasSeenPlans');
                const hasLocation = AsyncStorage.getItem('selectedLocation');
                
                Promise.all([seenPlans, hasLocation]).then(([seenPlansResult, hasLocationResult]) => {
                  if (seenPlansResult === 'true') {
                    // Đã xem combo, check location
                    router.replace((hasLocationResult ? '/(tabs)' : '/location-selection') as any);
                  } else {
                    // Chưa xem combo
                    router.replace('/choose-plan' as any);
                  }
                });
              }, 1500);
            } catch (e: any) {
              const apiErrors = e?.errors || e?.data?.errors;
              if (apiErrors && typeof apiErrors === 'object') {
                setFieldErrors(apiErrors);
                showToast('Vui lòng kiểm tra lại thông tin đăng nhập', 'error');
              } else {
                const errorMessage = e?.message || 'Đăng nhập thất bại';
                setError(errorMessage);
                showToast(errorMessage, 'error');
              }
            } finally {
              setLoading(false);
            }
          }}
        >
          <Text style={styles.primaryText}>{loading ? 'Đang xử lý…' : 'Đăng nhập'}</Text>
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

          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Bạn chưa có tài khoản ? </Text>
            <TouchableOpacity onPress={() => router.push('/select-role' as any)}>
              <Text style={[styles.footerText, styles.footerLink]}>Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const GOLD = '#E0B100';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontWeight: '400',
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
  },
  fieldGroup: {
    marginTop: 20,
  },
  label: {
    color: '#374151',
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '500',
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputWrapActive: {
    borderWidth: 2,
    borderColor: GOLD,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputInvalid: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  input: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 8,
  },
  rowBetween: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxRow: {
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
  linkText: {
    color: GOLD,
    fontWeight: '600',
  },
  primaryBtn: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  footerRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#687076',
  },
  footerLink: {
    color: GOLD,
    fontWeight: '600',
  },
  // Error display styles
  errorArea: {
    marginTop: 8,
    minHeight: 40, // reserve space to prevent layout shift
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2', // red-100
    borderWidth: 1,
    borderColor: '#FCA5A5', // red-300
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  errorText: {
    color: '#B91C1C', // red-700
    flex: 1,
  },
  errorFieldText: {
    color: '#B91C1C',
    marginTop: 6,
    fontSize: 12,
  },
});
