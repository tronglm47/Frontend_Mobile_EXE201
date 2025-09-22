import React, { useRef, useState } from 'react';
import {
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#E0B100';
const TEXT = '#111827';
const MUTED = '#6B7280';

type Message = { id: string; fromMe?: boolean; text?: string; image?: any; time?: string };

const AVATAR = require('../../assets/images/screenKhoa/1.png');
const ROOM_IMG = require('../../assets/images/screenKhoa/3.png');

export default function ConversationScreen() {
  useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', image: ROOM_IMG },
    { id: 'm2', fromMe: true, text: 'Hello we are interested in this how about the price ?', time: '1:22 AM' },
    { id: 'm3', fromMe: true, text: 'can it be negotiated ?', time: '1:22 AM' },
    { id: 'm4', text: 'Hi there, the price is negotiable', time: '1:30 AM' },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const onSend = () => {
    if (!input.trim()) return;
    setMessages((arr) => [...arr, { id: String(Date.now()), fromMe: true, text: input, time: 'now' }]);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const renderItem = ({ item }: { item: Message }) => {
    if (item.image) {
      return (
        <View style={styles.imageWrap}>
          <Image source={item.image} style={styles.imageMsg} />
        </View>
      );
    }
    const mine = !!item.fromMe;
    return (
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, mine ? styles.textMine : styles.textOther]}>{item.text}</Text>
        {!!item.time && <Text style={styles.time}>{item.time}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />

      {/* KAV bao toàn màn → input sẽ nổi khi bàn phím mở */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={56} // đúng bằng chiều cao header custom
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </TouchableOpacity>
          <Image source={AVATAR} style={styles.headerAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>Cody Fisher</Text>
            <Text style={styles.headerStatus}>• Online</Text>
          </View>
          <TouchableOpacity style={styles.headerIcon}><Ionicons name="call-outline" size={25} color={GOLD} /></TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}><Ionicons name="videocam-outline" size={25} color={GOLD} /></TouchableOpacity>
        </View>

        {/* Danh sách tin nhắn */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 16 + 44 + 12 }} 
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input bar (nằm trong KAV) */}
        <View style={[styles.inputBar, { backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB',marginBottom: 8 }]}>
          <TouchableOpacity style={styles.plusBtn}>
            <Ionicons name="add" size={25} color={GOLD} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="write your message"
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={onSend}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
            <Ionicons name="arrow-forward" size={25} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  headerName: { fontWeight: '700', color: TEXT },
  headerStatus: { color: '#10B981', fontWeight: '600', marginTop: 2 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  imageWrap: { alignItems: 'center', marginBottom: 8 },
  imageMsg: { width: '90%', height: 160, borderRadius: 12, resizeMode: 'cover' },
  bubble: { maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, marginBottom: 8 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: GOLD, borderTopRightRadius: 4 },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#ECEFF1', borderTopLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  textMine: { color: '#fff' },
  textOther: { color: TEXT },
  time: { fontSize: 11, color: MUTED, marginTop: 4, alignSelf: 'flex-end' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
