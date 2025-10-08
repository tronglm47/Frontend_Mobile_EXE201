import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from '@/components/Toast';
import { Colors } from '@/constants/theme';
import { fetchUtilities, fetchBuildings, createLandlordPostWithImages, createUserPost, Utility, Building, LandlordPostBody, UserPostBody } from '@/apis/posts';
import { router } from 'expo-router';

export default function CreatePostTab() {
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForms, setShowForms] = useState<'none' | 'user' | 'landlord'>('none');
  const [images, setImages] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [userForm, setUserForm] = useState<UserPostBody>({ title: '', description: '' });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };
  const hideToast = () => setToastVisible(false);

  const [form, setForm] = useState<LandlordPostBody>({
    title: '',
    description: '',
    price: 0,
    status: 'available',
    utilityIds: [],
    apartment: {
      buildingId: 0,
      apartmentCode: '',
      floor: 0,
      area: 0,
      apartmentType: 'studio',
      status: 'available',
      numberOfBedrooms: 1,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [utilitiesData, buildingsData] = await Promise.all([
        fetchUtilities(),
        fetchBuildings(),
      ]);
      setUtilities(utilitiesData);
      setBuildings(buildingsData);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleUtilityToggle = (utilityId: number) => {
    setForm(prev => ({
      ...prev,
      utilityIds: prev.utilityIds.includes(utilityId)
        ? prev.utilityIds.filter(id => id !== utilityId)
        : [...prev.utilityIds, utilityId]
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
      return;
    }
    if (!form.description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả');
      return;
    }
    if (form.price <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá hợp lệ');
      return;
    }
    if (form.apartment.buildingId === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn tòa nhà');
      return;
    }
    if (!form.apartment.apartmentCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã căn hộ');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createLandlordPostWithImages({
        ...form,
        images,
        primaryImageIndex,
      });
      showToast('Đăng bài thành công!', 'success');
      
      // Reset form
      setForm({
        title: '',
        description: '',
        price: 0,
        status: 'available',
        utilityIds: [],
        apartment: {
          buildingId: 0,
          apartmentCode: '',
          floor: 0,
          area: 0,
          apartmentType: 'studio',
          status: 'available',
          numberOfBedrooms: 1,
        },
      });
      setImages([]);
      setPrimaryImageIndex(0);
      setShowForms('none');
    } catch (error: any) {
      showToast(error?.message || 'Không thể đăng bài', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {showForms !== 'none' ? (
          <TouchableOpacity onPress={() => setShowForms('none')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.light.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <Text style={styles.headerTitle}>Đăng Bài</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Title moved into header */}

        {/* Post Type Selection - only chooser visible initially */}
        {showForms === 'none' && (
          <View style={styles.postTypeContainer}>
            <TouchableOpacity
              style={styles.postTypeButton}
              onPress={() => setShowForms('user')}
            >
              <Ionicons name="person-outline" size={24} color="#E0B100" />
              <Text style={styles.postTypeTitle}>Đăng bài đơn giản</Text>
              <Text style={styles.postTypeDescription}>Tìm kiếm phòng trọ, chia sẻ thông tin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.postTypeButton}
              onPress={() => setShowForms('landlord')}
            >
              <Ionicons name="business-outline" size={24} color="#E0B100" />
              <Text style={styles.postTypeTitle}>Đăng bài cho thuê/bán</Text>
              <Text style={styles.postTypeDescription}>Chủ nhà đăng bài chi tiết</Text>
            </TouchableOpacity>
          </View>
        )}

        {showForms === 'landlord' && (
        <>

        {/* Title */}
        <Field label="Tiêu đề *">
          <TextInput
            style={styles.input}
            placeholder="Nhập tiêu đề bài đăng"
            value={form.title}
            onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
            placeholderTextColor="#9BA1A6"
          />
        </Field>

        {/* Description */}
        <Field label="Mô tả *">
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nhập mô tả chi tiết"
            value={form.description}
            onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#9BA1A6"
          />
        </Field>

        {/* Price */}
        <Field label="Giá (VND) *">
          <TextInput
            style={styles.input}
            placeholder="Nhập giá"
            value={form.price > 0 ? form.price.toString() : ''}
            onChangeText={(text) => {
              const price = parseInt(text.replace(/[^0-9]/g, '')) || 0;
              setForm(prev => ({ ...prev, price }));
            }}
            keyboardType="numeric"
            placeholderTextColor="#9BA1A6"
          />
        </Field>

        {/* Building Selection */}
        <Field label="Tòa nhà *">
          <TouchableOpacity
            style={styles.picker}
            onPress={() => {
              Alert.alert(
                'Chọn tòa nhà',
                '',
                buildings.map(building => ({
                  text: building.name,
                  onPress: () => setForm(prev => ({
                    ...prev,
                    apartment: { ...prev.apartment, buildingId: building.buildingId }
                  }))
                }))
              );
            }}
          >
            <Text style={[styles.pickerText, form.apartment.buildingId === 0 && styles.placeholderText]}>
              {buildings.find(b => b.buildingId === form.apartment.buildingId)?.name || 'Chọn tòa nhà'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9BA1A6" />
          </TouchableOpacity>
        </Field>

        {/* Apartment Code */}
        <Field label="Mã căn hộ *">
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: 2209"
            value={form.apartment.apartmentCode}
            onChangeText={(text) => setForm(prev => ({
              ...prev,
              apartment: { ...prev.apartment, apartmentCode: text }
            }))}
            placeholderTextColor="#9BA1A6"
          />
        </Field>

        {/* Floor */}
        <Field label="Tầng">
          <TextInput
            style={styles.input}
            placeholder="Nhập số tầng"
            value={form.apartment.floor > 0 ? form.apartment.floor.toString() : ''}
            onChangeText={(text) => {
              const floor = parseInt(text.replace(/[^0-9]/g, '')) || 0;
              setForm(prev => ({
                ...prev,
                apartment: { ...prev.apartment, floor }
              }));
            }}
            keyboardType="numeric"
            placeholderTextColor="#9BA1A6"
          />
        </Field>

        {/* Area */}
        <Field label="Diện tích (m²)">
          <TextInput
            style={styles.input}
            placeholder="Nhập diện tích"
            value={form.apartment.area > 0 ? form.apartment.area.toString() : ''}
            onChangeText={(text) => {
              const area = parseInt(text.replace(/[^0-9]/g, '')) || 0;
              setForm(prev => ({
                ...prev,
                apartment: { ...prev.apartment, area }
              }));
            }}
            keyboardType="numeric"
            placeholderTextColor="#9BA1A6"
          />
        </Field>

        {/* Apartment Type */}
        <Field label="Loại căn hộ">
          <TouchableOpacity
            style={styles.picker}
            onPress={() => {
              const types = ['studio', '1-bedroom', '2-bedroom', '3-bedroom', 'penthouse'];
              Alert.alert(
                'Chọn loại căn hộ',
                '',
                types.map(type => ({
                  text: type,
                  onPress: () => setForm(prev => ({
                    ...prev,
                    apartment: { ...prev.apartment, apartmentType: type }
                  }))
                }))
              );
            }}
          >
            <Text style={styles.pickerText}>{form.apartment.apartmentType}</Text>
            <Ionicons name="chevron-down" size={20} color="#9BA1A6" />
          </TouchableOpacity>
        </Field>

        {/* Number of Bedrooms */}
        <Field label="Số phòng ngủ">
          <TextInput
            style={styles.input}
            placeholder="Nhập số phòng ngủ"
            value={form.apartment.numberOfBedrooms > 0 ? form.apartment.numberOfBedrooms.toString() : ''}
            onChangeText={(text) => {
              const bedrooms = parseInt(text.replace(/[^0-9]/g, '')) || 0;
              setForm(prev => ({
                ...prev,
                apartment: { ...prev.apartment, numberOfBedrooms: bedrooms }
              }));
            }}
            keyboardType="numeric"
            placeholderTextColor="#9BA1A6"
          />
        </Field>

        {/* Images */}
        <Field label="Thêm ảnh hoặc video">
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={async () => {
              try {
                // Request permission first
                const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (perm.status !== 'granted') {
                  showToast('Cần quyền truy cập thư viện ảnh', 'error');
                  return;
                }
                const res = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsMultipleSelection: true,
                  quality: 0.8,
                } as any);
                if ((res as any).canceled) return;
                const assets = (res as any).assets || [];
                const files = assets.map((a: any, idx: number) => ({
                  uri: a.uri,
                  name: `image_${Date.now()}_${idx}.jpg`,
                  type: a.mimeType || 'image/jpeg',
                }));
                setImages((prev) => [...prev, ...files]);
              } catch (e) {
                showToast('Không thể mở thư viện ảnh', 'error');
              }
            }}
          >
            <Ionicons name="cloud-upload-outline" size={36} color="#E0B100" />
            <Text style={styles.uploadHint}>Nhấn để đăng hình</Text>
          </TouchableOpacity>

          {images.length > 0 && (
            <View style={styles.previewGrid}>
              {images.map((img, idx) => (
                <TouchableOpacity key={idx} style={[styles.previewItem, idx === primaryImageIndex && styles.previewItemActive]} onPress={() => setPrimaryImageIndex(idx)}>
                  <Image source={{ uri: img.uri }} style={styles.previewImage} />
                  {idx === primaryImageIndex && (
                    <View style={styles.previewBadge}><Text style={styles.previewBadgeText}>Ảnh chính</Text></View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Field>

        {/* Utilities */}
        <Field label="Tiện ích">
          <View style={styles.utilitiesContainer}>
            {utilities.map(utility => (
              <TouchableOpacity
                key={utility.utilityId}
                style={[
                  styles.utilityChip,
                  form.utilityIds.includes(utility.utilityId) && styles.utilityChipSelected
                ]}
                onPress={() => handleUtilityToggle(utility.utilityId)}
              >
                <Text style={[
                  styles.utilityChipText,
                  form.utilityIds.includes(utility.utilityId) && styles.utilityChipTextSelected
                ]}>
                  {utility.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Đang đăng bài...' : 'Đăng bài'}
          </Text>
        </TouchableOpacity>
        </>
        )}

        {showForms === 'user' && (
          <>
            
            <Field label="Tiêu đề *">
              <TextInput
                style={styles.input}
                placeholder="Nhập tiêu đề bài đăng"
                value={userForm.title}
                onChangeText={(t) => setUserForm({ ...userForm, title: t })}
                placeholderTextColor="#9BA1A6"
              />
            </Field>
            <Field label="Mô tả *">
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập mô tả"
                value={userForm.description}
                onChangeText={(t) => setUserForm({ ...userForm, description: t })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#9BA1A6"
              />
            </Field>
            <TouchableOpacity
              style={[styles.submitButton, userSubmitting && styles.submitButtonDisabled]}
              disabled={userSubmitting}
              onPress={async () => {
                if (!userForm.title.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề'); return; }
                if (!userForm.description.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập mô tả'); return; }
                setUserSubmitting(true);
                try {
                  const res = await createUserPost(userForm);
                  showToast('Đăng bài thành công!', 'success');
                  setUserForm({ title: '', description: '' });
                  setShowForms('none');
                } catch (e: any) {
                  showToast(e?.message || 'Không thể đăng bài', 'error');
                } finally {
                  setUserSubmitting(false);
                }
              }}
            >
              <Text style={styles.submitButtonText}>{userSubmitting ? 'Đang đăng bài...' : 'Đăng bài'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHide={hideToast} />
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontWeight: '800', color: Colors.light.text, fontSize: 18 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: 'center',

  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  backText: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  postTypeContainer: {
    marginTop: 180,
    marginBottom: 24,
    alignItems: 'center',
  },
  postTypeButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
    width: '90%',
  },
  postTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  postTypeDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  uploadHint: {
    marginTop: 8,
    color: '#9BA1A6',
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  previewItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewItemActive: {
    borderColor: '#E0B100',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#E0B100',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  previewBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E6E8EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: Colors.light.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#E6E8EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  placeholderText: {
    color: '#9BA1A6',
  },
  utilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  utilityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    backgroundColor: '#fff',
  },
  utilityChipSelected: {
    backgroundColor: '#E0B100',
    borderColor: '#E0B100',
  },
  utilityChipText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  utilityChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#E0B100',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#E0B100',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});