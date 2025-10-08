import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { fetchUtilities, fetchBuildings, createLandlordPost, Utility, Building, LandlordPostBody } from '@/apis/posts';
import { router } from 'expo-router';

export default function CreatePostTab() {
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      const response = await createLandlordPost(form);
      Alert.alert('Thành công', `Đăng bài thành công! ID: ${response.postId}`);
      
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
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể đăng bài');
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Đăng Bài</Text>
        
        {/* Post Type Selection */}
        <View style={styles.postTypeContainer}>
          <TouchableOpacity
            style={styles.postTypeButton}
            onPress={() => router.push('/create-user-post' as any)}
          >
            <Ionicons name="person-outline" size={24} color="#E0B100" />
            <Text style={styles.postTypeTitle}>Đăng bài đơn giản</Text>
            <Text style={styles.postTypeDescription}>Tìm kiếm phòng trọ, chia sẻ thông tin</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.postTypeButton}
            onPress={() => {
              // Already in landlord post form
            }}
          >
            <Ionicons name="business-outline" size={24} color="#E0B100" />
            <Text style={styles.postTypeTitle}>Đăng bài cho thuê/bán</Text>
            <Text style={styles.postTypeDescription}>Chủ nhà đăng bài chi tiết</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Đăng Bài Cho Thuê/Bán</Text>

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
      </ScrollView>
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
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  postTypeContainer: {
    marginBottom: 24,
  },
  postTypeButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6E8EB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  postTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
  },
  postTypeDescription: {
    fontSize: 14,
    color: '#6B7280',
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