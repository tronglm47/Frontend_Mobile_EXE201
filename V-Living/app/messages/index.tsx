import React, { useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { FloatingChatbot } from '@/components/chatbot/FloatingChatbot';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

const GOLD = '#E0B100';
const TEXT = '#111827';
const MUTED = '#8f949eff';

type Chat = {
  id: string;
  name: string;
  last: string;
  time: string;
  avatar: any;
};

const AVATARS = [
  require('../../assets/images/screenKhoa/1.png'),
  require('../../assets/images/screenKhoa/2.png'),
  require('../../assets/images/screenKhoa/3.png'),
  require('../../assets/images/screenKhoa/4.png'),
  require('../../assets/images/screenKhoa/5.png'),
  require('../../assets/images/screenKhoa/6.png'),
];

export default function MessagesList() {
  const [chats, setChats] = useState<Chat[]>([
    { id: '1', name: 'Anggela', last: 'Thank you for information', time: '1:22 AM', avatar: AVATARS[0] },
    { id: '2', name: 'Theresa Webb', last: 'Hi there, the price is negotiable', time: '8:22 PM', avatar: AVATARS[1] },
    { id: '3', name: 'Guy Hawkins', last: 'Have a plan for discuss this ?', time: '8:22 PM', avatar: AVATARS[2] },
    { id: '4', name: 'Savannah Nguyen', last: 'Have a plan for discuss this ?', time: '8:22 PM', avatar: AVATARS[3] },
    { id: '5', name: 'Arlene McCoy', last: 'Have a plan for discuss this ?', time: '8:22 PM', avatar: AVATARS[4] },
    { id: '6', name: 'Leslie Alexander', last: 'Have a plan for discuss this ?', time: '8:22 PM', avatar: AVATARS[5] },
  ]);
  const [toDelete, setToDelete] = useState<Chat | null>(null);

  const confirmDelete = () => {
    if (!toDelete) return;
    setChats((arr) => arr.filter((c) => c.id !== toDelete.id));
    setToDelete(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={28} color={TEXT}   />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Stories row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          <TouchableOpacity style={styles.storyWrap}>
            <View style={[styles.storyAvatar, { backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="add" size={30} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={{ borderLeftWidth: 2 , borderColor: "#919191ff" ,paddingHorizontal: 5,height: 50,marginVertical: 5 }} />
          {AVATARS.map((src, i) => (
            <View key={i} style={styles.storyWrap}>
              <View style={[styles.storyAvatar, { borderWidth: 2, borderColor: GOLD }]}>
                <Image source={src} style={styles.storyImg} />
              </View>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Tất cả tin nhắn</Text>

        {chats.map((c) => (
          <Swipeable
            key={c.id}
            overshootRight={false}
            renderRightActions={(progress: any) => {
              const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
              const moreTranslate = progress.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
              const deleteTranslate = progress.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });
              return (
                <View style={styles.swipeActions}>
                  <Animated.View style={{ opacity, transform: [{ translateX: moreTranslate }] }}>
                    <TouchableOpacity style={{...styles.actionBtn, ...styles.moreBtn,display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}} onPress={() => {}}>
                        <Ionicons name="ellipsis-horizontal-outline" size={18} color="#fff" />
                      <Text style={{...styles.moreText, color: "#fff"}}>More</Text>
                    
                    </TouchableOpacity>
                  </Animated.View>
                  <Animated.View style={{ opacity, transform: [{ translateX: deleteTranslate }] }}>
                    <TouchableOpacity style={{...styles.actionBtn, ...styles.deleteBtn, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}} onPress={() => setToDelete(c)}>
                      <Ionicons name="trash-outline" size={18} color="#fff" />
              

                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                    
                  </Animated.View>
                </View>
              );
            }}
          >
            <Pressable onPress={() => router.push(`/messages/${c.id}`)}>
              <View style={styles.itemRow}>
                <Image source={c.avatar} style={styles.itemAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{c.name}</Text>
                  <Text style={styles.itemLast} numberOfLines={1}>{c.last}</Text>
                </View>
                <Text style={styles.itemTime}>{c.time}</Text>
              </View>
            </Pressable>
          </Swipeable>
        ))}
      </ScrollView>

      {/* Delete confirm modal */}
      <Modal visible={!!toDelete} transparent animationType="fade" onRequestClose={() => setToDelete(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="trash-outline" size={32} color={GOLD} />
            </View>
            <Text style={styles.modalTitle}>Are you sure you want to delete this message ?</Text>
            <Text style={styles.modalSub}>the message will be deleted from this device</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: GOLD }]} onPress={() => setToDelete(null)}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#E5E7EB' }]} onPress={confirmDelete}>
                <Text style={{ color: MUTED, fontWeight: '700' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <FloatingChatbot />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
 
  },
  headerTitle: { fontWeight: '800', color: TEXT, fontSize: 22, marginLeft:125 },
  storyWrap: { marginRight: 10 },
  storyAvatar: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden' },
  storyImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  sectionLabel: { color: TEXT, fontWeight: '900', paddingHorizontal: 16, paddingVertical: 8,fontSize: 19 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 64,
    marginBottom: 3,
  },
  itemAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  itemName: { color: TEXT, fontWeight: '700' },
  itemLast: { color: MUTED, marginTop: 2 },
  itemTime: { color: MUTED },
  swipeActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: 84, height: 64 },
  moreBtn: { backgroundColor: '#d6d7daff' },
  deleteBtn: { backgroundColor: GOLD },
  moreText: { color: TEXT, fontWeight: '700' },
  deleteText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '84%', backgroundColor: '#fff', borderRadius: 16, padding: 18, alignItems: 'center' },
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { textAlign: 'center', fontWeight: '800', color: TEXT, marginTop: 12 },
  modalSub: { textAlign: 'center', color: MUTED, marginTop: 6 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
