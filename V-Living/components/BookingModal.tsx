import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createBooking, BookingBody, LandlordPostItem } from '../apis/posts';
import Toast from './Toast';

const GOLD = '#E0B100';
const GRAY = '#6B7280';
const BG = '#F7F7F8';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  post: LandlordPostItem;
  onSuccess?: () => void;
}

export default function BookingModal({ visible, onClose, post, onSuccess }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Don't render if post is not available
  if (!post) {
    return null;
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const hideToast = () => setToastVisible(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedTime(date);
    }
  };

  const handleBooking = async () => {
    if (!note.trim()) {
      showToast('Vui lòng nhập ghi chú', 'error');
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const meetingDateTime = new Date(selectedDate);
      meetingDateTime.setHours(selectedTime.getHours());
      meetingDateTime.setMinutes(selectedTime.getMinutes());

      const bookingData: BookingBody = {
        postId: post.postId,
        meetingTime: meetingDateTime.toISOString(),
        placeMeet: post.apartment?.buildingId ? `Tòa ${post.apartment.buildingId}` : 'string',
        note: note.trim() || 'string',
      };

      console.log('Booking data:', JSON.stringify(bookingData, null, 2));
      const result = await createBooking(bookingData);
      console.log('Booking result:', result);
      
      showToast('Đặt lịch thành công!', 'success');
      
      // Reset form and close modal after a short delay
      setTimeout(() => {
        setNote('');
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (error: any) {
      showToast(error?.message || 'Không thể đặt lịch', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Liên hệ</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Property Info */}
          <View style={styles.propertyCard}>
            <View style={styles.propertyImage}>
              <Ionicons name="home" size={32} color={GRAY} />
            </View>
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyTitle}>{post.title}</Text>
              <View style={styles.propertyLocation}>
                <Ionicons name="location-outline" size={14} color={GRAY} />
                <Text style={styles.locationText}>
                  {post.apartment?.buildingId ? `Tòa ${post.apartment.buildingId}` : '—'}
                </Text>
              </View>
              <Text style={styles.propertyPrice}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(post.price)} / tháng
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={GOLD} />
                <Text style={styles.rating}>4.8</Text>
              </View>
            </View>
          </View>

          {/* Time Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian</Text>
            
            {/* Date Selection */}
            <TouchableOpacity style={styles.timeItem} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color={GRAY} />
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Ngày</Text>
                <Text style={styles.timeValue}>{formatDate(selectedDate)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={GRAY} />
            </TouchableOpacity>

            {/* Time Selection */}
            <TouchableOpacity style={styles.timeItem} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={20} color={GRAY} />
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Giờ</Text>
                <Text style={styles.timeValue}>{formatTime(selectedTime)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={GRAY} />
            </TouchableOpacity>
          </View>

          {/* Note Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Nhập ghi chú cho cuộc hẹn..."
              placeholderTextColor="#9BA1A6"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Booking Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.bookingBtn, loading && styles.bookingBtnDisabled]}
            onPress={handleBooking}
            disabled={loading}
          >
            <Text style={styles.bookingBtnText}>
              {loading ? 'Đang đặt lịch...' : 'Đặt lịch'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}
      </View>

      {/* Toast */}
      <Toast 
        visible={toastVisible} 
        message={toastMessage} 
        type={toastType} 
        onHide={hideToast} 
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  propertyImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  propertyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    color: GRAY,
    fontSize: 14,
    marginLeft: 4,
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: GRAY,
    fontSize: 14,
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  timeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    color: GRAY,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    minHeight: 80,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bookingBtn: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingBtnDisabled: {
    opacity: 0.6,
  },
  bookingBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
