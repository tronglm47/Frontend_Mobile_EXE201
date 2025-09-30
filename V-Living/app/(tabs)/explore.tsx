import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Fonts } from '@/constants/theme';
import { fetchLocations, LocationItem } from '@/apis/locations';
import { fetchPropertyTypes, fetchPropertyForms, fetchPostTypes, fetchAmenities, attachPostAmenities, Amenity, PropertyForm, PropertyType, PostType } from '@/apis/master-data';
import * as ImagePicker from 'expo-image-picker';
import { createPost } from '@/apis/posts';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreatePostTab() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [propertyForms, setPropertyForms] = useState<PropertyForm[]>([]);
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);

  const [form, setForm] = useState({
    userId: 0,
    locationId: 0,
    propertyTypeId: 0,
    propertyFormId: 0,
    postTypeId: 0,
    title: '',
    content: '',
    price: '' as any,
    selectedAmenityIds: [] as number[],
    images: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const tokenUserId = await AsyncStorage.getItem('userId');
      const parsedId = tokenUserId ? parseInt(tokenUserId, 10) : 0;
      if (mounted) setForm((f) => ({ ...f, userId: parsedId }));
      const [locs, types, forms, ptypes, ams] = await Promise.all([
        fetchLocations(),
        fetchPropertyTypes(),
        fetchPropertyForms(),
        fetchPostTypes(),
        fetchAmenities(),
      ]);
      if (!mounted) return;
      setLocations(locs);
      setPropertyTypes(types);
      setPropertyForms(forms);
      setPostTypes(ptypes);
      setAmenities(ams);
    })();
    return () => { mounted = false; };
  }, []);

  const canSubmit = useMemo(() => {
    return !!(form.userId && form.locationId && form.propertyTypeId && form.propertyFormId && form.postTypeId && form.title && form.price);
  }, [form]);

  const submit = async () => {
    if (!canSubmit) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đủ các trường bắt buộc');
      return;
    }
    try {
      setSubmitting(true);
      const postId = await createPost({
        userId: form.userId,
        locationId: form.locationId,
        propertyTypeId: form.propertyTypeId,
        propertyFormId: form.propertyFormId,
        postTypeId: form.postTypeId,
        title: form.title,
        content: form.content,
        images: form.images,
        price: Number(form.price),
      });
      if (postId) {
        await attachPostAmenities(postId, form.selectedAmenityIds);
      }
      Alert.alert('Thành công', 'Đăng bài thành công');
      setForm((f) => ({ ...f, title: '', content: '', price: '' as any, selectedAmenityIds: [], images: [] }));
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể đăng bài');
    } finally {
      setSubmitting(false);
    }
  };

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập ảnh để tải ảnh');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) {
      const uris = ('assets' in result ? result.assets : []).map((a) => a.uri).filter(Boolean) as string[];
      setForm((f) => ({ ...f, images: [...f.images, ...uris] }));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={{ padding: 16 }} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.title}>Đăng Bài</Text>

        <Field label="Chọn tòa">
          <Picker
            value={String(form.locationId)}
            onChange={(v) => setForm((f) => ({ ...f, locationId: Number(v) }))}
            placeholder="Vui lòng chọn tòa"
            options={locations.map((l) => ({ label: l.name, value: String(l.locationId) }))}
          />
        </Field>

        <Field label="Chọn loại căn hộ">
          <Picker
            value={String(form.propertyTypeId)}
            onChange={(v) => setForm((f) => ({ ...f, propertyTypeId: Number(v) }))}
            placeholder="Loại căn hộ"
            options={propertyTypes.map((t) => ({ label: t.name, value: String(t.propertyTypeId) }))}
          />
        </Field>

        <Field label="Loại hình">
          <Picker
            value={String(form.postTypeId)}
            onChange={(v) => setForm((f) => ({ ...f, postTypeId: Number(v) }))}
            placeholder="Chọn loại hình"
            options={postTypes.map((t) => ({ label: t.name, value: String(t.postTypeId) }))}
          />
        </Field>

        <Field label="Hình thức">
          <Picker
            value={String(form.propertyFormId)}
            onChange={(v) => setForm((f) => ({ ...f, propertyFormId: Number(v) }))}
            placeholder="Chọn hình thức"
            options={propertyForms.map((t) => ({ label: t.name, value: String(t.propertyFormId) }))}
          />
        </Field>

        <Field label="Giá (VND)">
          <Input
            keyboardType="numeric"
            placeholder="Nhập giá"
            value={String(form.price || '')}
            onChangeText={(t) => setForm((f) => ({ ...f, price: t.replace(/[^0-9]/g, '') }))}
          />
        </Field>

        <Field label="Tiêu đề">
          <Input placeholder="Nhập tiêu đề" value={form.title} onChangeText={(t) => setForm((f) => ({ ...f, title: t }))} />
        </Field>

        <Field label="Mô tả">
          <Input multiline placeholder="Nhập mô tả" value={form.content} onChangeText={(t) => setForm((f) => ({ ...f, content: t }))} />
        </Field>

        <Field label="Tiện ích">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {amenities.map((a) => {
              const checked = form.selectedAmenityIds.includes(a.amenityId);
              return (
                <TouchableOpacity key={a.amenityId} style={[styles.amenityChip, checked && styles.amenityChipActive]} onPress={() => {
                  setForm((f) => ({
                    ...f,
                    selectedAmenityIds: checked ? f.selectedAmenityIds.filter((id) => id !== a.amenityId) : [...f.selectedAmenityIds, a.amenityId],
                  }));
                }}>
                  <Text style={[styles.amenityChipText, checked && { color: '#000' }]}>{a.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Field>

        <Field label="Thêm ảnh">
          <View style={{ gap: 10 }}>
            <TouchableOpacity style={styles.upload} onPress={pickImages}>
              <MaterialIcons name="cloud-upload" size={20} color="#E0B100" />
              <Text style={{ color: '#6B7280' }}>Nhấn để chọn ảnh</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {form.images.map((uri, idx) => (
                <View key={`${uri}-${idx}`} style={styles.previewBox}>
                  <View style={{ flex: 1, backgroundColor: '#EEE', borderRadius: 8 }} />
                </View>
              ))}
            </ScrollView>
          </View>
        </Field>

        <TouchableOpacity style={[styles.submitBtn, !canSubmit && { opacity: 0.6 }]} onPress={submit} disabled={!canSubmit || submitting}>
          <Text style={styles.submitText}>{submitting ? 'Đang đăng...' : 'Đăng bài'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Input({ multiline, ...props }: any) {
  return (
    <TextInput
      {...props}
      multiline={!!multiline}
      style={[styles.input, multiline && { height: 120, textAlignVertical: 'top' }]}
      placeholderTextColor="#9BA1A6"
    />
  );
}

function Picker({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: { label: string; value: string }[] }) {
  return (
    <View style={styles.pickerWrap}>
      <Text style={[styles.pickerValue, !value && { color: '#9BA1A6' }]}>
        {options.find((o) => o.value === value)?.label || placeholder}
      </Text>
      <TouchableOpacity onPress={() => Alert.alert('Chọn', '', options.map((o) => ({ text: o.label, onPress: () => onChange(o.value) })))}>
        <MaterialIcons name="expand-more" size={20} color="#9BA1A6" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700' as const, marginBottom: 12 },
  label: { marginBottom: 8, color: '#4B5563' },
  input: { borderWidth: 1, borderColor: '#F5D55B', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  pickerWrap: { borderWidth: 1, borderColor: '#F5D55B', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerValue: { fontSize: 14 },
  submitBtn: { backgroundColor: '#E0B100', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: '700' as const },
});
