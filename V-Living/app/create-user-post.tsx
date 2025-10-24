import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { createUserPost, UserPostBody } from '@/apis/posts';

export default function CreateUserPostScreen() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<UserPostBody>({
    title: '',
    description: '',
  });

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

    setSubmitting(true);
    try {
      const response = await createUserPost(form);
      Alert.alert('Thành công', `Đăng bài thành công! ID: ${response.postId}`);
      
      // Reset form
      setForm({
        title: '',
        description: '',
      });
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể đăng bài');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Đăng Bài Đơn Giản</Text>
        <Text style={styles.subtitle}>Chia sẻ thông tin, tìm kiếm phòng trọ...</Text>

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
            placeholder="Nhập mô tả chi tiết về nhu cầu của bạn..."
            value={form.description}
            onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor="#9BA1A6"
          />
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
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
    height: 120,
    textAlignVertical: 'top',
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
