import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getUserInfo } from '../apis/auth';
import { BookingItem, fetchAllBookings, fetchLandlordPostById, LandlordPostItem, updateBookingStatus } from '../apis/posts';
import EmptyBooking from '../components/illustrations/EmptyBooking';
import { LoadingScreen } from '@/components/loading-screen';
import LiveLocationTracker from '../components/LiveLocationTracker';
 
import { getPostFromCache, setPostInCache } from '../lib/post-cache';
import { handleUnauthorizedError, isUnauthorizedError } from '../utils/auth-utils';

const GOLD = '#E0B100';
const BORDER = '#E5E7EB';
const TEXT = '#111827';
const MUTED = '#6B7280';

export default function BookingScreen() {
  const [tab, setTab] = useState<'upcoming' | 'completed' | 'canceled'>('upcoming');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [postImageMap, setPostImageMap] = useState<Record<number, string>>({});
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [trackingBookingId, setTrackingBookingId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    loadBookings();
    // Load user info for userId needed by LiveLocationTracker
    (async () => {
      try {
        const me = await getUserInfo();
        if (me?.userID != null) setCurrentUserId(me.userID);
      } catch (e: any) {
        if (isUnauthorizedError(e)) {
          await handleUnauthorizedError();
        }
        // Failed to load user info for tracking
      }
    })();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // Loading bookings...
      
      // Check if user is authenticated
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Lỗi', 'Bạn cần đăng nhập để xem lịch đặt');
        return;
      }
      
      const data = await fetchAllBookings();
      // Bookings loaded
      setBookings(data);
    } catch (error: any) {
      // Failed to load bookings
      
      if (isUnauthorizedError(error)) {
        await handleUnauthorizedError();
      } else {
        Alert.alert('Lỗi', `Không thể tải danh sách lịch đặt: ${error?.message || String(error)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings by status (case insensitive)
  const upcoming = bookings.filter(b => b.status?.toLowerCase() === 'pending');
  const completed = bookings.filter(b => b.status?.toLowerCase() === 'completed');
  const canceled = bookings.filter(b => b.status?.toLowerCase() === 'cancelled');

  const list = tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : canceled;

  const renderStatus = (booking: BookingItem) => {
    const status = booking.status?.toLowerCase();
    switch (status) {
      case 'pending':
        return <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}><Text style={[styles.badgeText, { color: '#D97706' }]}>Chờ xác nhận</Text></View>;
      case 'confirmed':
        return <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.badgeText, { color: '#059669' }]}>Đã xác nhận</Text></View>;
      case 'completed':
        return <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.badgeText, { color: '#059669' }]}>Hoàn thành</Text></View>;
      case 'cancelled':
        return <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.badgeText, { color: '#DC2626' }]}>Đã hủy</Text></View>;
      default:
        return <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}><Text style={[styles.badgeText, { color: MUTED }]}>{booking.status}</Text></View>;
    }
  };

  const extractPrimaryImage = (post?: Partial<LandlordPostItem> | null): string | undefined => {
    if (!post) return undefined;
    if (post.primaryImageUrl) return post.primaryImageUrl;
    if ((post as any).imageUrl) return (post as any).imageUrl as string;
    const imgs = post.images || [];
    const primary = imgs.find(i => i.isPrimary) || imgs[0];
    return primary?.imageUrl;
  };

  const getPostImageUrl = (postId?: number): string | undefined => {
    if (!postId && postId !== 0) return undefined;
    const cached = postImageMap[postId];
    if (cached) return cached;
    const cachedPost = getPostFromCache(postId);
    const cachedUrl = extractPrimaryImage(cachedPost);
    if (cachedUrl) return cachedUrl;
    // Trigger async fetch, store to state when arrives
    (async () => {
      try {
        const post = await fetchLandlordPostById(postId);
        if (post) {
          setPostInCache(post);
          const url = extractPrimaryImage(post);
          if (url) {
            setPostImageMap(prev => ({ ...prev, [postId]: url }));
          }
        }
      } catch {}
    })();
    return undefined;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const goContact = (phoneNumber?: string) => {
    const phone = phoneNumber || '0900000000';
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Không thể mở cuộc gọi'));
  };

  const goZalo = (phoneNumber?: string) => {
    const phone = phoneNumber || '0900000000';
    Linking.openURL(`https://zalo.me/${phone}`).catch(() => Alert.alert('Không thể mở Zalo'));
  };

  // Selected booking for tracking overlay
  const selectedBooking = trackingBookingId != null ? bookings.find(b => b.bookingId === trackingBookingId) : undefined;

  const renderItem = (booking: BookingItem) => (
    <View key={booking.bookingId} style={styles.item}>
      <TouchableOpacity 
        style={styles.itemContent}
        onPress={() => router.push(`/detail?id=${booking.postId}`)}
      >
        <Image 
          source={(() => {
            const url = getPostImageUrl(booking.postId);
            return url ? { uri: url } : require('../assets/images/screenKhoa/detail.png');
          })()}
          style={styles.thumb} 
        />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} ellipsizeMode="tail" style={styles.itemTitle}>{booking.postTitle || 'N/A'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Ionicons name="location-outline" size={14} color={MUTED} />
            <Text style={styles.placeText}> {booking.placeMeet}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Ionicons name="time-outline" size={14} color={MUTED} />
            <Text style={styles.rangeText}> {formatDateTime(booking.meetingTime)}</Text>
          </View>
          <Text style={styles.priceText}>{formatPrice(booking.postPrice || 0)}/tháng</Text>
        </View>
        {renderStatus(booking)}
      </TouchableOpacity>
      
      {/* Action buttons grid (2 rows x 3 columns) */}
      <View style={styles.actionGrid}>
        <TouchableOpacity 
          style={styles.gridButton}
          onPress={() => goContact(booking.landlordPhone || booking.renterPhone)}
        >
          <Ionicons name="call-outline" size={18} color={GOLD} />
          <Text style={styles.gridButtonText}>Gọi</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.gridButton}
          onPress={() => goZalo(booking.landlordPhone || booking.renterPhone)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#0068FF" />
          <Text style={[styles.gridButtonText, { color: '#0068FF' }]}>Zalo</Text>
        </TouchableOpacity>

        {/* Track live location (for pending/confirmed bookings) */}
        {(booking.status?.toLowerCase() === 'pending' || booking.status?.toLowerCase() === 'confirmed') && (
          <TouchableOpacity 
            style={styles.gridButton}
            onPress={() => setTrackingBookingId(booking.bookingId)}
          >
            <Ionicons name="navigate-outline" size={18} color="#1971c2" />
            <Text style={[styles.gridButtonText, { color: '#1971c2' }]}>Theo dõi</Text>
          </TouchableOpacity>
        )}

        {/* Meeting point actions */}
        {booking.status?.toLowerCase() !== 'completed' && (
          !booking.meetingLatitude || !booking.meetingLongitude ? (
            // No meeting set yet → show single "Đặt điểm hẹn"
            <TouchableOpacity 
              style={styles.gridButton}
              onPress={() => router.push({ pathname: '/location-map', params: { bookingId: String(booking.bookingId) } })}
            >
              <Ionicons name="pin-outline" size={18} color="#c026d3" />
              <Text style={[styles.gridButtonText, { color: '#c026d3' }]}>Đặt điểm hẹn</Text>
            </TouchableOpacity>
          ) : (
            // Meeting exists → single "Đổi điểm hẹn" button
            <TouchableOpacity 
              style={styles.gridButton}
              onPress={() => router.push({ pathname: '/location-map', params: { bookingId: String(booking.bookingId) } })}
            >
              <Ionicons name="create-outline" size={18} color="#7c3aed" />
              <Text style={[styles.gridButtonText, { color: '#7c3aed' }]}>Đổi nơi hẹn</Text>
            </TouchableOpacity>
          )
        )}
        
        {/* Landlord quick complete (optional, may overflow grid; keep as part of 6 if space) */}
        {booking.status?.toLowerCase() !== 'completed' && booking.landlordId && (
          <TouchableOpacity 
            style={styles.gridButton}
            disabled={updatingId === booking.bookingId}
            onPress={async () => {
              try {
                const note = await new Promise<string | undefined>((resolve) => {
                  Alert.prompt?.('Hoàn thành lịch hẹn', 'Nhập ghi chú (tuỳ chọn)', [
                    { text: 'Huỷ', style: 'cancel', onPress: () => resolve(undefined) },
                    { text: 'Xác nhận', onPress: (value?: string) => resolve(value) },
                  ], 'plain-text');
                  if (!Alert.prompt) resolve(undefined);
                });
                setUpdatingId(booking.bookingId);
                await updateBookingStatus(booking.bookingId, { status: 'completed', note });
                await loadBookings();
              } catch (error: any) {
                if (isUnauthorizedError(error)) {
                  await handleUnauthorizedError();
                } else {
                  Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
                }
              } finally {
                setUpdatingId(null);
              }
            }}
          >
            <Ionicons name="checkmark-done-outline" size={18} color="#059669" />
            <Text style={[styles.gridButtonText, { color: '#059669' }]}>
              {updatingId === booking.bookingId ? 'Đang lưu...' : 'Hoàn thành'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Cancel placeholder (API to be added later) */}
        {(booking.status?.toLowerCase() === 'pending' || booking.status?.toLowerCase() === 'confirmed') && (
          <TouchableOpacity 
            style={styles.gridButton}
            onPress={() => Alert.alert('Hủy lịch hẹn', 'API hủy sẽ được tích hợp khi bạn cung cấp.')}
          >
            <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
            <Text style={[styles.gridButtonText, { color: '#DC2626' }]}>Hủy</Text>
          </TouchableOpacity>
        )}

        {booking.status?.toLowerCase() === 'completed' && (
          <TouchableOpacity 
            style={styles.gridButton}
            onPress={() => {
              // TODO: Implement rating functionality
              Alert.alert('Đánh giá', 'Chức năng đánh giá sẽ được triển khai');
            }}
          >
            <Ionicons name="star-outline" size={18} color="#F59E0B" />
            <Text style={[styles.gridButtonText, { color: '#F59E0B' }]}>Đánh giá</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch đặt</Text>
        <TouchableOpacity onPress={loadBookings} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={TEXT} />
        </TouchableOpacity>
      </View>

      {/* Segmented control */}
      <View style={styles.segment}>
        <SegmentBtn label={`Sắp tới (${upcoming.length})`} active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <SegmentBtn label={`Hoàn thành (${completed.length})`} active={tab === 'completed'} onPress={() => setTab('completed')} />
        <SegmentBtn label={`Đã hủy (${canceled.length})`} active={tab === 'canceled'} onPress={() => setTab('canceled')} />
      </View>

      {/* Content */}
      {loading ? (
        <LoadingScreen />
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {list.map(renderItem)}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
      {trackingBookingId != null && (
        <SafeAreaView style={styles.overlay}>
          <View style={styles.overlayHeader}>
            <TouchableOpacity onPress={() => setTrackingBookingId(null)} style={styles.backBtn}>
              <Ionicons name="close" size={22} color={TEXT} />
            </TouchableOpacity>
            <Text style={styles.overlayTitle}>Theo dõi vị trí</Text>
            <View style={styles.refreshBtn} />
          </View>
          <View style={{ flex: 1 }}>
            {(() => {
              const meetLat = selectedBooking?.meetingLatitude ?? 0;
              const meetLng = selectedBooking?.meetingLongitude ?? 0;
              const meetLabel = selectedBooking?.meetingAddress || selectedBooking?.placeMeet || 'Điểm hẹn';
              return (
            <LiveLocationTracker
              bookingId={trackingBookingId}
              userId={currentUserId ?? undefined}
              otherUserLabel="Landlord"
              meetingLatitude={meetLat}
              meetingLongitude={meetLng}
              meetingLabel={meetLabel}
              enableSignalR={false}
            />
              );
            })()}
          </View>
          {/* Removed manual distance tab */}
        </SafeAreaView>
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


function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <EmptyBooking width={300} height={220} />
      {/* <Text style={styles.emptyTitle}>Opps!!</Text> */}
      <Text style={styles.emptySub}>Bạn chưa có lịch hẹn</Text>
      <Text style={styles.emptySub2}>Bạn đang tìm lịch hẹn <Text style={{ color: GOLD, fontWeight: '700' }}>hoàn thành</Text> hoặc <Text style={{ color: GOLD, fontWeight: '700' }}>đã hủy</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff' },
  overlayHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    backgroundColor: '#fff',
  },
  overlayTitle: { fontWeight: '800', color: TEXT, fontSize: 18 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    backgroundColor: '#fff',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
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
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
  },
  thumb: { width: 90, height: 90, borderRadius: 10, marginRight: 10 },
  itemTitle: { fontWeight: '700', color: TEXT },
  placeText: { color: MUTED, fontSize: 12 },
  rangeText: { color: MUTED, marginTop: 2, fontSize: 12 },
  priceText: { color: GOLD, fontWeight: '600', marginTop: 2, fontSize: 12 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, marginLeft: 8 },
  badgeText: { fontWeight: '700', fontSize: 12 },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    backgroundColor: '#FAFAFA',
  },
  gridButton: {
    width: '33.3333%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  gridButtonText: {
    marginLeft: 6,
    color: GOLD,
    fontWeight: '600',
    fontSize: 12,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: MUTED,
    fontSize: 16,
  },

  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 30 },
  emptyImg: { width: 300, height: 220, resizeMode: 'contain' },
  emptyTitle: { marginTop: 8, fontSize: 24, fontWeight: '800', color: TEXT },
  emptySub: { marginTop: 4, color: '#474747ff',fontSize:16,padding: 8 },
  emptySub2: { marginTop: 2, color: MUTED, textAlign: 'center', paddingHorizontal: 0 },
});
