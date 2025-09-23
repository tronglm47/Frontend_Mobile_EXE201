import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// Inline SVG component to avoid fetch issues on Android
import NotMail from '../components/illustrations/NotMail';
import { router } from 'expo-router';

const GOLD = '#E0B100';
const TEXT = '#111827';
const MUTED = '#6B7280';
const DANGER = '#EF4444';

type Noti = {
  id: string;
  title: string;
  subtitle?: string;
  time?: string;
  type: 'bell' | 'user';
  avatar?: any;
  read?: boolean; // false => unread
};

const AVATARS = [
  require('../assets/images/screenKhoa/1.png'),
  require('../assets/images/screenKhoa/5.png'),
  require('../assets/images/screenKhoa/6.png'),
];

export default function NotificationsScreen() {
  // Demo: toggle between list and empty by setting arrays
  const today: Noti[] = [
    // { id: 't1', title: 'Chúc mừng, bài viết của bạn đã được đăng.', subtitle: 'Chạm vào đây để xem chi tiết', type: 'bell', read: false },
    // { id: 't2', title: 'Chào mừng, đừng quên hoàn thành hồ sơ cá nhân tài khoản của bạn!', type: 'bell', read: true },
  ];
  const yesterday: Noti[] = [
    // { id: 'y1', title: 'Huy đã gửi tin nhắn cho bạn, kiểm tra ngay', type: 'user', avatar: AVATARS[0], read: false },
    // { id: 'y2', title: 'Chào mừng, đừng quên hoàn thành hồ sơ cá nhân tài khoản của bạn!', type: 'bell', read: true },
    // { id: 'y3', title: 'Khoa và Huy đã gửi tin nhắn cho bạn, kiểm tra ngay', type: 'user', avatar: AVATARS[2], read: true },
  ];

  const isEmpty = today.length === 0 && yesterday.length === 0;

  // No network fetch; we inline the SVG via a component

  // Bobbing animation for the illustration
  const bob = useRef(new Animated.Value(0)).current;
//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(bob, { toValue: 10, duration: 900, useNativeDriver: true }),
//         Animated.timing(bob, { toValue: 0, duration: 900, useNativeDriver: true }),
//       ])
//     ).start();
//   }, [bob]);

  const Illustration = useMemo(() => (
    <Animated.View style={{ transform: [{ translateX: bob }] }}>
      <NotMail width={260} height={240} />
    </Animated.View>
  ), [bob]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={{ width: 24 }} />
      </View>

      {isEmpty ? (
        <View style={styles.emptyWrap}>
          {Illustration}
          <Text style={styles.emptyTitle}>Bạn chưa có thông báo</Text>
          <Text style={styles.emptySub}>
            Tất cả thông báo chúng tôi gửi sẽ hiển thị tại đây để bạn dễ dàng xem bất cứ lúc nào
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <Section title="Hôm nay">
            {today.map((n) => (
              <NotiRow key={n.id} noti={n} />
            ))}
          </Section>
          <Section title="Hôm qua">
            {yesterday.map((n) => (
              <NotiRow key={n.id} noti={n} />
            ))}
          </Section>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 6 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

function NotiRow({ noti }: { noti: Noti }) {
  const isUnread = noti.read === false;
  return (
    <View style={styles.row}>
      {noti.type === 'user' && noti.avatar ? (
        <Image source={noti.avatar} style={styles.avatar} />
      ) : (
        <View style={styles.bellWrap}>
          <Ionicons name="notifications-outline" size={22} color={GOLD} style={{ opacity: isUnread ? 1 : 0.5, color: isUnread ? GOLD : MUTED, backgroundColor: isUnread ? '#FFF7E6' : '#fff', position: 'relative' }} />
{isUnread && <View style={styles.unreadDot} />}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: isUnread ? TEXT : MUTED }]}>{noti.title}</Text>
        {!!noti.subtitle && (
          <Text style={[styles.rowSub, { color: isUnread ? TEXT : MUTED }]}>{noti.subtitle}</Text>
        )}
      </View>
      
    </View>
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
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '800', color: TEXT, fontSize: 18, marginRight: 24 },
  sectionTitle: { color: MUTED, fontWeight: '800', marginVertical: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF2F5',
  },
  bellWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF7E6', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#FFE8B3' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  rowTitle: { color: TEXT, fontWeight: '700' },
  rowSub: { color: MUTED, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DANGER, marginLeft: 8, position: 'absolute', top: 4, right: 4 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { marginTop: 16, fontWeight: '800', color: TEXT, fontSize: 18 },
  emptySub: { textAlign: 'center', color: MUTED, marginTop: 8 },
});
