import React, { useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#E0B100';
const TEXT = '#111827';

type BotMsg = { id: string; fromBot?: boolean; text: string; time?: string };
const BOT_ICON = require('../../assets/images/chatboticon/bott.svg');

export function ChatbotSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<BotMsg[]>([
    { id: 'b1', fromBot: true, text: 'Rapidly build stunning Web Apps with Frest 🚀\nDeveloper friendly, Highly customizable & Carefully crafted HTML Admin Dashboard Template.', time: '7:20' },
    { id: 'u1', text: "Hi, i'm weidro. Nice to meet you!", time: '7:20' },
    { id: 'b2', fromBot: true, text: 'Rapidly build stunning Web Apps with Frest', time: '7:20' },
    { id: 'u2', text: 'Minimum text check, Hide check icon .I miss my ex.Can you tell me the solluton to escape this feeling?', time: '7:20' },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: BotMsg = { id: String(Date.now()), text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((arr) => [...arr, userMsg]);
    setInput('');
    setTimeout(() => {
      const reply: BotMsg = { id: String(Date.now() + 1), fromBot: true, text: 'Cảm ơn bạn! Chúng tôi sẽ phản hồi sớm.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages((arr) => [...arr, reply]);
      listRef.current?.scrollToEnd({ animated: true });
    }, 600);
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <Image source={BOT_ICON} style={styles.botAvatar} />
              <Text style={styles.botTitle}>V-Living Bot</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.headerCloseBtn}>
              <Ionicons name="remove" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(it) => it.id}
            contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
            renderItem={({ item, index }) => (
              <View>
                {!!item.time && (
                  <Text style={styles.timestamp}>{item.time}</Text>
                )}
                <View style={[styles.botBubble, item.fromBot ? styles.fromBot : styles.fromUser]}>
                  <Text style={[styles.bubbleText, { color: item.fromBot ? '#fff' : TEXT }]}>{item.text}</Text>
                </View>
              </View>
            )}
          />
          {/* Quick replies */}
          <View style={styles.quickRepliesWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
              {[
                { id: 'qr1', label: 'What is WappGPT? 🤖' },
                { id: 'qr2', label: 'Pricing 💳' },
                { id: 'qr3', label: 'FAQs 🧠' },
              ].map((q) => (
                <TouchableOpacity key={q.id} style={styles.quickChip} onPress={() => setInput(q.label.replace(/ [^ ]+$/, ''))}>
                  <Text style={styles.quickChipText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                placeholder="Type your message here..."
                value={input}
                onChangeText={setInput}
                returnKeyType="send"
                onSubmitEditing={send}
              />
              <TouchableOpacity style={styles.sendFab} onPress={send}>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', maxHeight: '95%', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  sheetHeader: { height: 56, backgroundColor: GOLD, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botAvatar: { width: 26, height: 26, resizeMode: 'contain' },
  botTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
  headerCloseBtn: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  botBubble: { maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginBottom: 10 },
  fromBot: { backgroundColor: GOLD, alignSelf: 'flex-start', borderTopLeftRadius: 4 },
  fromUser: { backgroundColor: '#ECEFF1', alignSelf: 'flex-end', borderTopRightRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  timestamp: { alignSelf: 'center', color: '#9CA3AF', fontSize: 12, marginVertical: 4 },
  quickRepliesWrap: { position: 'absolute', left: 0, right: 0, bottom: 70, paddingVertical: 6 },
  quickChip: { marginHorizontal: 6, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: GOLD, elevation: 2 },
  quickChipText: { color: TEXT, fontWeight: '700' },
  inputBar: { padding: 10 },
  input: { height: 46, backgroundColor: '#F3F4F6', borderRadius: 23, paddingHorizontal: 14, paddingRight: 56 },
  sendFab: { width: 36, height: 36, borderRadius: 18, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', position: 'absolute', right: 18, bottom: 18 },
});
