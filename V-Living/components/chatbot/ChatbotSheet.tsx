import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getChatHelp, getChatUsage, sendChatMessage, type ChatHelpResponse, type ChatUsageResponse } from '../../apis/chat';
import ChatbotIcon from './ChatbotIcon';

const GOLD = '#E0B100';
const TEXT = '#111827';
const MUTED = '#6B7280';

type BotMsg = { id: string; fromBot?: boolean; text: string; time?: string; source?: string };

export function ChatbotSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<BotMsg[]>([{
    id: 'welcome',
    fromBot: true,
    text: 'Xin chào! Tôi là VLiving AI. Hãy hỏi tôi về bài đăng, tòa nhà, giá, tiện ích hoặc đánh giá.',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }]);
  const [input, setInput] = useState('');
  const [help, setHelp] = useState<ChatHelpResponse | null>(null);
  const [usage, setUsage] = useState<ChatUsageResponse | null>(null);
  const [sending, setSending] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [inputHeight, setInputHeight] = useState(46);
  const [showScrollToEnd, setShowScrollToEnd] = useState(false);
  const [typingDots, setTypingDots] = useState(1);

  const fetchMeta = async () => {
    try {
      const [h, u] = await Promise.all([getChatHelp().catch(() => null), getChatUsage().catch(() => null)]);
      if (h) setHelp(h);
      if (u) setUsage(u);
    } catch {}
  };

  useEffect(() => {
    if (visible) {
      fetchMeta();
    }
  }, [visible]);

  const hourlyRemaining = usage?.usage?.hourly?.remaining ?? undefined;
  const rateLimited = !!usage?.rateLimitingEnabled && (hourlyRemaining !== undefined) && hourlyRemaining <= 0;
  const isOnline = !rateLimited;

  const formatTime = (val?: string) => {
    if (!val) return '';
    // Support formats like '2025-10-15 08:29:06 UTC' and ISO strings
    let date: Date | null = null;
    const m = val.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) UTC$/);
    if (m) {
      const [, y, mo, d, h, mi, s] = m;
      const ts = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
      date = new Date(ts);
    } else {
      const maybe = new Date(val);
      if (!isNaN(maybe.getTime())) date = maybe;
    }
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const hourlyResetStr = formatTime(usage?.usage?.hourly?.resetTime);

  const pushMessage = (msg: BotMsg) => setMessages((arr) => [...arr, msg]);
  const sendText = async (text: string) => {
    if (!text?.trim()) return;
    await send(text);
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    if (rateLimited) {
      const msg = `Bạn đã hết lượt chat trong giờ. Vui lòng thử lại sau ${hourlyResetStr || 'một lúc'}.`;
      setError(msg);
      return;
    }
    setError(null);
    const userMsg: BotMsg = { id: String(Date.now()), text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    pushMessage(userMsg);
    setInput('');
    setBotTyping(true);
    setSending(true);
    try {
      const res = await sendChatMessage(text);
      const isOk = res?.success !== false;
      const replyText = (res?.response || '').trim() || 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.';
      const finalText = isOk ? replyText : `⚠️ ${replyText}`;
      const reply: BotMsg = { id: String(Date.now() + 1), fromBot: true, text: finalText, source: res?.source, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      pushMessage(reply);
    } catch (e: any) {
      const msg = e?.message || 'Không thể gửi tin nhắn. Vui lòng thử lại.';
      setError(msg);
      pushMessage({ id: String(Date.now() + 2), fromBot: true, text: '⚠️ ' + msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    } finally {
      setBotTyping(false);
      setSending(false);
      // Refresh usage after a request
      getChatUsage().then(setUsage).catch(() => {});
      // Scroll to end
      (listRef.current as any)?.scrollToEnd?.({ animated: true });
    }
  };

  // Animate typing dots when bot is typing
  useEffect(() => {
    if (!botTyping) return;
    const t = setInterval(() => {
      setTypingDots((d) => (d % 3) + 1);
    }, 450);
    return () => clearInterval(t);
  }, [botTyping]);

  // Ensure typing indicator is visible by auto-scrolling when bot starts typing
  useEffect(() => {
    if (botTyping) {
      (listRef.current as any)?.scrollToEnd?.({ animated: true });
    }
  }, [botTyping]);

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      {rateLimited ? (
                <View style={styles.limitBanner}>
                  <Ionicons name="alert-circle" size={14} color="#92400E" />
                  <Text style={styles.limitText} numberOfLines={3}>
                    Bạn đã hết lượt chat trong giờ. Vui lòng thử lại sau {hourlyResetStr || 'một lúc'}.
                  </Text>
                </View>
              ) : null}
      <View style={styles.backdrop}>
        
        <View style={[styles.sheet, { maxHeight: '100%', height: '100%', borderTopLeftRadius: 0, borderTopRightRadius: 0 }] }>
          <View style={styles.sheetHeader}>
            
            <View style={styles.headerLeft}>
              <ChatbotIcon width={26} height={26} />
              <View>
                <Text style={styles.botTitle}>V-Living Bot</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#F59E0B' }]} />
                  <Text style={styles.statusText}>{isOnline ? 'Online' : `Tạm dừng${hourlyResetStr ? ` · Reset ${hourlyResetStr}` : ''}`}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity accessibilityLabel="Đóng chatbot" onPress={onClose} style={styles.headerCloseBtn}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(it) => it.id}
            contentContainerStyle={{ padding: 12, paddingBottom: 160 }}
            renderItem={({ item, index }) => (
              <View>
                {!!item.time && (
                  <Text style={styles.timestamp}>{item.time}</Text>
                )}
                <View style={[styles.botBubble, item.fromBot ? styles.fromBot : styles.fromUser]}>
                  <Text style={[styles.bubbleText, { color: item.fromBot ? '#050505ff' : TEXT }]}>{item.text}</Text>
                  {/* {item.fromBot && !!item.source && (
                    <Text style={[styles.sourceText, { color: item.fromBot ? '#F3F4F6' : MUTED }]}>Nguồn: {item.source}</Text>
                  )} */}
                </View>
              </View>
            )}
            ListFooterComponent={botTyping ? (
              <View style={[styles.botBubble, styles.fromBot, { alignSelf: 'flex-start' }]}>
                <Text style={[styles.bubbleText, { color: "gray" }]}>Chờ xíu{'.'.repeat(typingDots)}</Text>
              </View>
            ) : null}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
              setShowScrollToEnd(distanceFromBottom > 120);
            }}
            scrollEventThrottle={16}
          />
          {/* Topics & Quick replies */}
          <View style={styles.quickRepliesWrap}>
            <TouchableOpacity style={styles.suggestHeaderRow} onPress={() => setShowSuggestions((v) => !v)}>
              <Text style={styles.suggestTitle}>Gợi ý</Text>
              <Ionicons name={showSuggestions ? 'chevron-down' : 'chevron-forward'} size={16} color={MUTED} />
            </TouchableOpacity>
            {showSuggestions && (
              <>
                {/* Example questions (danh sách dọc để tap) */}
                {!!(help?.exampleQuestions?.length) && (
                  <View style={styles.exampleList}>
                    <Text style={styles.exampleHeader}>Gợi ý câu hỏi</Text>
                    {help!.exampleQuestions.map((label, idx) => (
                      <TouchableOpacity key={'ex' + idx} style={styles.exampleItem} onPress={() => { setShowSuggestions(false); sendText(label); }}>
                        <Text style={styles.exampleItemText} numberOfLines={2}>{label}</Text>
                        <Ionicons name="arrow-forward" size={14} color={MUTED} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.inputBar}>
                {!!error && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="warning" size={14} color="#B45309" />
                    <Text style={styles.errorText} numberOfLines={2}>{error}</Text>
                  </View>
                )}
              {usage?.rateLimitingEnabled ? (
                <View style={styles.usageRow}>
                  <Text style={styles.usageText}>
                    Lượt trong giờ: {usage.usage.hourly.used}/{usage.limits.maxPerHour} · Còn lại {usage.usage.hourly.remaining}
                  </Text>
                </View>
              ) : null}
              
              <TextInput
                style={[styles.input, { height: Math.min(Math.max(46, inputHeight), 120) }]}
                placeholder="Nhập tin nhắn..."
                value={input}
                onChangeText={setInput}
                returnKeyType="send"
                onSubmitEditing={(e) => send(e?.nativeEvent?.text)}
                multiline
                onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
                blurOnSubmit={false}
              />
              <TouchableOpacity accessibilityLabel="Gửi tin nhắn" style={[styles.sendFab, (sending || rateLimited || !input.trim()) && styles.sendFabDisabled]} onPress={() => send()} disabled={sending || rateLimited || !input.trim()}>
                <Ionicons name={sending ? 'time' : 'send'} size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

          {showScrollToEnd && (
            <TouchableOpacity
              accessibilityLabel="Cuộn xuống cuối cùng"
              onPress={() => (listRef.current as any)?.scrollToEnd?.({ animated: true })}
              style={styles.scrollToEndBtn}
            >
              <Ionicons name="chevron-down" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', maxHeight: '95%', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  sheetHeader: { height: 64, backgroundColor: GOLD, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botAvatar: { width: 26, height: 26, resizeMode: 'contain' },
  botTitle: { color: '#fff', fontWeight: '800', fontSize: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#F3F4F6', fontSize: 12 },
  headerCloseBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  botBubble: { maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  fromBot: { backgroundColor: "inherit", alignSelf: 'flex-start', borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#E5C74A' },
  fromUser: { backgroundColor: '#EEF2F7', alignSelf: 'flex-end', borderTopRightRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  sourceText: { fontSize: 11, marginTop: 6 },
  timestamp: { alignSelf: 'center', color: '#9CA3AF', fontSize: 12, marginVertical: 6 },
  quickRepliesWrap: { position: 'absolute', left: 0, right: 0, bottom: 70, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.98)', borderTopWidth: 1, borderColor: '#E5E7EB' },
  suggestHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8 },
  suggestTitle: { color: MUTED, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  quickChip: { marginHorizontal: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: GOLD, elevation: 2 },
  quickChipText: { color: TEXT, fontWeight: '700' },

  // Danh sách example questions
  exampleList: { paddingHorizontal: 12, marginTop: 6, gap: 6 },
  exampleHeader: { color: '#6B7280', fontSize: 12, fontWeight: '700', marginLeft: 4, marginBottom: 2 },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exampleItemText: { color: '#111827', fontWeight: '600', flex: 1, paddingRight: 8 },
  inputBar: { padding: 10 },
  input: { minHeight: 46, backgroundColor: '#F3F4F6', borderRadius: 23, paddingHorizontal: 14, paddingRight: 56, textAlignVertical: 'center' },
  usageRow: { marginBottom: 6, paddingHorizontal: 6 },
  usageText: { color: '#6B7280', fontSize: 12 },
  limitBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, marginBottom: 6 },
  limitText: { color: '#92400E', fontSize: 12, flex: 1 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, marginBottom: 6 },
  errorText: { color: '#92400E', fontSize: 12, flex: 1 },
  sendFab: { width: 36, height: 36, borderRadius: 18, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', position: 'absolute', right: 18, bottom: 18 },
  sendFabDisabled: { backgroundColor: '#C5B36A' },
  scrollToEndBtn: { position: 'absolute', right: 16, bottom: 130, width: 32, height: 32, borderRadius: 16, backgroundColor: '#4B5563', alignItems: 'center', justifyContent: 'center', opacity: 0.9 },
});
