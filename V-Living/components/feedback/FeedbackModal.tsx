import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  title?: string; // small label at top-left
  heading?: string; // main heading
  description?: string; // sub description text
  initialRating?: number; // 1..5
  initialComment?: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void | Promise<void>;
};

const EMOJIS = ['😢', '🙁', '😐', '🙂', '😄'];
const LABELS = ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'];

export default function FeedbackModal({
  visible,
  title = 'Feedback',
  heading = 'How are you feeling?',
  description = 'Your input is valuable in helping us better understand your needs and tailor our service accordingly.',
  initialRating = 3,
  initialComment = '',
  submitting = false,
  onClose,
  onSubmit,
}: Props) {
  const [rating, setRating] = useState<number>(initialRating);
  const [comment, setComment] = useState<string>(initialComment);

  useEffect(() => {
    if (visible) {
      setRating(initialRating ?? 3);
      setComment(initialComment ?? '');
    }
  }, [visible, initialRating, initialComment]);

  // reserved for future: map rating to system label if needed

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#111827" />
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" onPress={onClose}>
              <Ionicons name="close" size={22} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.subText}>{description}</Text>

          {/* Emoji selector */}
          <View style={styles.emojiRow}>
            {EMOJIS.map((e, i) => {
              const index = i + 1; // 1..5
              const selected = index === rating;
              return (
                <TouchableOpacity key={e} style={styles.emojiWrap} onPress={() => setRating(index)}>
                  <View style={[styles.emojiOuter, selected && styles.emojiOuterActive]}>
                    <View style={[styles.emojiInner, selected && styles.emojiInnerActive]}>
                      <Text style={[styles.emojiText, selected && styles.emojiTextActive]}>{e}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected label */}
          <View style={styles.badgeWrap}>
            <Text style={styles.badge}>{LABELS[rating - 1] || 'Medium'}</Text>
          </View>

          {/* Comment */}
          <TextInput
            style={styles.textArea}
            placeholder="Add a Comment..."
            placeholderTextColor="#9CA3AF"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
            numberOfLines={Platform.OS === 'ios' ? 5 : 4}
          />

          {/* Submit */}
          <TouchableOpacity
            disabled={submitting}
            onPress={() => onSubmit(rating, comment.trim())}
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          >
            <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Now'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const BORDER = '#E5E7EB';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 14 },
  subText: { color: '#6B7280', marginTop: 8 },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 12,
  },
  emojiWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8, flex: 1 },
  emojiOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#F9FAFB',
  },
  emojiOuterActive: {
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  emojiInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  emojiInnerActive: {
    backgroundColor: '#D1FAE5',
  },
  emojiText: { fontSize: 26, opacity: 0.6 },
  emojiTextActive: { opacity: 1 },
  badgeWrap: { alignItems: 'center', marginTop: 10 },
  badge: {
    backgroundColor: '#111827',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    overflow: 'hidden',
  },
  textArea: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#fff',
    borderRadius: 14,
    minHeight: 100,
    padding: 12,
    textAlignVertical: 'top',
    color: '#111827',
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
