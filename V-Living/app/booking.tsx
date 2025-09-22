import React, { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#E0B100';
const BORDER = '#E5E7EB';
const TEXT = '#111827';
const MUTED = '#6B7280';

type Booking = {
  id: string;
  title: string;
  place: string;
  range: string;
  image: any;
  status: 'pendingPay' | 'processing' | 'done' | 'canceled';
};

const thumbs = [
  require('../assets/images/screenKhoa/detail.png'),
  require('../assets/images/screenKhoa/detail.png'),
  require('../assets/images/screenKhoa/detail.png'),
  require('../assets/images/screenKhoa/detail.png'),
];

export default function BookingScreen() {
  const [tab, setTab] = useState<'upcoming' | 'completed' | 'canceled'>('upcoming');

  // demo data
  const upcoming: Booking[] = [
    { id: '1', title: 'Origami S10.02', place: 'Origami', range: '12/08 - 12/08', image: thumbs[0], status: 'pendingPay' },
    { id: '2', title: 'Beverly B2', place: 'Beverly', range: '08/08 - 12/08', image: thumbs[1], status: 'processing' },
  ];
  const completed: Booking[] = [
    { id: '3', title: 'Beverly Solari BS10', place: 'Beverly Solari', range: '08/08 - 12/08', image: thumbs[2], status: 'done' },
  ];
  const canceled: Booking[] = [
    { id: '4', title: 'Rainbow S1.02', place: 'Rainbow', range: '08 Aug - 12 Aug', image: thumbs[3], status: 'canceled' },
  ];

  const list = tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : canceled;

  const renderStatus = (s: Booking['status']) => {
    switch (s) {
      case 'pendingPay':
        return <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.badgeText, { color: '#DC2626' }]}>Chờ thanh toán</Text></View>;
      case 'processing':
        return <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.badgeText, { color: '#059669' }]}>Đang xử lí</Text></View>;
      case 'done':
        return <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.badgeText, { color: '#059669' }]}>Hoàn thành</Text></View>;
      case 'canceled':
        return <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.badgeText, { color: '#DC2626' }]}>Đã hủy</Text></View>;
    }
  };

  const renderItem = (b: Booking) => (
    <TouchableOpacity key={b.id} style={styles.item} onPress={() => router.push('/detail')}>
      <Image source={b.image} style={styles.thumb} />
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{b.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          <Ionicons name="location-outline" size={14} color={MUTED} />
          <Text style={styles.placeText}> {b.place}</Text>
        </View>
        <Text style={styles.rangeText}>{b.range}</Text>
      </View>
      {renderStatus(b.status)}
    </TouchableOpacity>
  );

  const renderActions = () => {
    if (tab === 'completed') {
      return (
        <View style={styles.actionList}>
          <ActionRow icon="star-outline" color="#F59E0B" label="Đánh giá" onPress={() => {}} />
          <ActionRow icon="call-outline" color={GOLD} label="Liên lạc" onPress={() => {}} />
        </View>
      );
    }
    if (tab === 'canceled') {
      return (
        <View style={styles.actionList}>
          <ActionRow icon="call-outline" color={GOLD} label="Liên lạc" onPress={() => {}} />
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch đặt</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Segmented control */}
      <View style={styles.segment}>
        <SegmentBtn label="Sắp tới" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <SegmentBtn label="Hoàn thành" active={tab === 'completed'} onPress={() => setTab('completed')} />
        <SegmentBtn label="Đã hủy" active={tab === 'canceled'} onPress={() => setTab('canceled')} />
      </View>

      {/* Content */}
      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {list.map(renderItem)}
          {renderActions()}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SegmentBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.segBtn, active ? styles.segActive : styles.segInactive]}>
      <Text style={[styles.segText, active ? styles.segTextActive : styles.segTextInactive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionRow({ icon, color, label, onPress }: { icon: any; color: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.actionLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={MUTED} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <Image source={require('../assets/images/notFound/error.png')} style={styles.emptyImg} />
      {/* <Text style={styles.emptyTitle}>Opps!!</Text> */}
      <Text style={styles.emptySub}>Bạn chưa có lịch hẹn</Text>
      <Text style={styles.emptySub2}>Bạn đang tìm lịch hẹn <Text style={{ color: GOLD, fontWeight: '700' }}>hoàn thành</Text> hoặc <Text style={{ color: GOLD, fontWeight: '700' }}>đã hủy</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontWeight: '800', color: TEXT,fontSize: 18 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    margin: 16,
    padding: 4,
    borderRadius: 12,
  },
  segBtn: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segActive: { backgroundColor: GOLD },
  segInactive: {},
  segText: { fontWeight: '700' },
  segTextActive: { color: '#fff' },
  segTextInactive: { color: MUTED },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  thumb: { width: 64, height: 64, borderRadius: 10, marginRight: 10 },
  itemTitle: { fontWeight: '700', color: TEXT },
  placeText: { color: MUTED },
  rangeText: { color: MUTED, marginTop: 2 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, marginLeft: 8 },
  badgeText: { fontWeight: '700', fontSize: 12 },

  actionList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  actionLabel: { marginLeft: 10, color: TEXT, fontWeight: '600' },

  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 30 },
  emptyImg: { width: 300, height: 220, resizeMode: 'contain' },
  emptyTitle: { marginTop: 8, fontSize: 24, fontWeight: '800', color: TEXT },
  emptySub: { marginTop: 4, color: '#474747ff',fontSize:16,padding: 8 },
  emptySub2: { marginTop: 2, color: MUTED, textAlign: 'center', paddingHorizontal: 0 },
});
