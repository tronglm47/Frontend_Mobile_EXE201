import { LoadingScreen } from '@/components/loading-screen';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserInfo } from '../apis/auth';
import { BookingItem, fetchAllBookings, fetchLandlordPostById, LandlordPostItem, updateBookingStatus } from '../apis/posts';
import { createReview } from '../apis/review';
import EmptyBooking from '../components/illustrations/EmptyBooking';
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
  // Prevent duplicate background sync PUTs for the same booking in a single session
  const syncedRef = useRef<Set<number>>(new Set());
  // Mark bookings that this client has completed (optimistic UI until API list reflects timestamps)
  const clientCompletedRef = useRef<Set<number>>(new Set());
  // Review modal state
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewDescription, setReviewDescription] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const reviewedRef = useRef<Set<number>>(new Set());

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

  // Reload bookings whenever this screen regains focus (e.g., after setting meeting point)
  useFocusEffect(
    React.useCallback(() => {
      // Avoid duplicate to initial mount is acceptable; ensures fresh data
      loadBookings();
    }, [])
  );

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
      // Opportunistic server sync: if both parties completed but backend status isn't Completed, update it
      try {
        setTimeout(() => {
          data.forEach((b) => {
            const rc = (b as any).renterCompletedAt as string | null | undefined;
            const lc = (b as any).landlordCompletedAt as string | null | undefined;
            const normalized = (b.status || '').toLowerCase();
            if (rc && lc && normalized !== 'completed' && normalized !== 'complete') {
              if (!syncedRef.current.has(b.bookingId)) {
                syncedRef.current.add(b.bookingId);
                console.log('[Booking][AutoSync] Force status to Completed due to both completed timestamps', {
                  bookingId: b.bookingId,
                  renterCompletedAt: rc,
                  landlordCompletedAt: lc,
                  currentStatus: b.status,
                });
                updateBookingStatus(b.bookingId, { status: 'Completed' })
                  .then((res) => {
                    console.log('[Booking][AutoSync] Completed sync success', { bookingId: b.bookingId, res });
                  })
                  .catch((err) => {
                    console.error('[Booking][AutoSync] Completed sync failed', { bookingId: b.bookingId, err });
                  // if failed, allow retry on next load
                    try { syncedRef.current.delete(b.bookingId); } catch {}
                  });
              }
            }
          });
        }, 0);
      } catch {}
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

  // Normalize and derive booking status from fields
  const normalizeStatus = (s?: string): string => {
    const v = (s || '').toLowerCase();
    if (v === 'complete' || v === 'completed') return 'completed';
    if (v === 'cancelled' || v === 'canceled') return 'cancelled';
    if (v === 'confirm' || v === 'confirmed') return 'confirmed';
    if (v === 'pending') return 'pending';
    return v || 'pending';
  };

  const getDerivedStatus = (b: BookingItem): string => {
    const rc = (b as any).renterCompletedAt as string | null | undefined;
    const lc = (b as any).landlordCompletedAt as string | null | undefined;
    const bothDone = !!rc && !!lc;
    if (bothDone) return 'completed';

    // Identify current user role to compute who completed
    const meIsRenter = currentUserId != null && b.renterId === currentUserId;
    const meIsLandlord = currentUserId != null && b.landlordId === currentUserId;
    const meDone = (meIsRenter && !!rc) || (meIsLandlord && !!lc) || clientCompletedRef.current.has(b.bookingId);
    const peerDone = (meIsRenter && !!lc) || (meIsLandlord && !!rc);

    if (meDone && !peerDone) return 'waiting'; // I'm done, waiting for counterpart

    return normalizeStatus(b.status);
  };

  // Filter bookings by derived status
  const upcoming = bookings.filter(b => {
    const st = getDerivedStatus(b);
    return st === 'pending' || st === 'confirmed' || st === 'waiting';
  });
  const completed = bookings.filter(b => getDerivedStatus(b) === 'completed');
  const canceled = bookings.filter(b => getDerivedStatus(b) === 'cancelled');

  const list = tab === 'upcoming' ? upcoming : tab === 'completed' ? completed : canceled;

  const renderStatus = (booking: BookingItem) => {
    const status = getDerivedStatus(booking);
    switch (status) {
      case 'pending':
        return <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}><Text style={[styles.badgeText, { color: '#D97706' }]}>Chờ xác nhận</Text></View>;
      case 'confirmed':
        return <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.badgeText, { color: '#059669' }]}>Đã xác nhận</Text></View>;
      case 'waiting':
        return <View style={[styles.badge, { backgroundColor: '#E0EAFF' }]}><Text style={[styles.badgeText, { color: '#1D4ED8' }]}>Chờ đối phương</Text></View>;
      case 'completed':
        return <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.badgeText, { color: '#059669' }]}>Hoàn thành</Text></View>;
      case 'cancelled':
        return <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.badgeText, { color: '#DC2626' }]}>Đã hủy</Text></View>;
      default:
        return <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}><Text style={[styles.badgeText, { color: MUTED }]}>{booking.status}</Text></View>;
    }
  };

  const openReview = (bookingId: number) => {
    setReviewBookingId(bookingId);
    setReviewRating(5);
    setReviewDescription('');
    setReviewVisible(true);
  };

  const submitReview = async () => {
    if (!reviewBookingId) return;
    if (reviewRating < 1 || reviewRating > 5) {
      Alert.alert('Lỗi', 'Vui lòng chọn điểm đánh giá từ 1 đến 5');
      return;
    }
    try {
      setSubmittingReview(true);
      await createReview({ bookingId: reviewBookingId, rating: reviewRating, description: reviewDescription?.trim() || undefined });
      try { reviewedRef.current.add(reviewBookingId); } catch {}
      setReviewVisible(false);
      Alert.alert('Cảm ơn', 'Đánh giá của bạn đã được ghi nhận');
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
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
        {/* Gọi & Zalo - Always show */}
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

    {/* === ACTIONS when user has NOT completed yet (hide when waiting/completed/cancelled) === */}
  {(() => { const st = getDerivedStatus(booking); return st === 'pending' || st === 'confirmed'; })() && (
          <>
            {/* Track live location */}
            <TouchableOpacity 
              style={styles.gridButton}
              onPress={() => setTrackingBookingId(booking.bookingId)}
            >
              <Ionicons name="navigate-outline" size={18} color="#1971c2" />
              <Text style={[styles.gridButtonText, { color: '#1971c2' }]}>Theo dõi</Text>
            </TouchableOpacity>

            {/* Meeting point actions */}
            {!booking.meetingLatitude || !booking.meetingLongitude ? (
              // No meeting set yet → show "Đặt điểm hẹn"
              <TouchableOpacity 
                style={styles.gridButton}
                onPress={() => router.push({ pathname: '/location-map', params: { bookingId: String(booking.bookingId) } })}
              >
                <Ionicons name="pin-outline" size={18} color="#c026d3" />
                <Text style={[styles.gridButtonText, { color: '#c026d3' }]}>Đặt điểm hẹn</Text>
              </TouchableOpacity>
            ) : (
              // Meeting exists → show "Đổi điểm hẹn"
              <TouchableOpacity 
                style={styles.gridButton}
                onPress={() => router.push({ pathname: '/location-map', params: { bookingId: String(booking.bookingId) } })}
              >
                <Ionicons name="create-outline" size={18} color="#7c3aed" />
                <Text style={[styles.gridButtonText, { color: '#7c3aed' }]}>Đổi nơi hẹn</Text>
              </TouchableOpacity>
            )}
            
            {/* Complete button */}
            <TouchableOpacity 
              style={styles.gridButton}
              disabled={updatingId === booking.bookingId}
              onPress={async () => {
                try {
                  console.log('[UI] Complete button pressed', { bookingId: booking.bookingId });
                  
                  // Show confirmation dialog first (works on all platforms)
                  const confirmed = await new Promise<boolean>((resolve) => {
                    Alert.alert(
                      'Xác nhận hoàn thành',
                      'Bạn có chắc muốn đánh dấu lịch hẹn này là hoàn thành?',
                      [
                        { text: 'Huỷ', style: 'cancel', onPress: () => {
                          console.log('[UI] User cancelled completion');
                          resolve(false);
                        }},
                        { text: 'Xác nhận', onPress: () => {
                          console.log('[UI] User confirmed completion');
                          resolve(true);
                        }},
                      ]
                    );
                  });
                  
                  if (!confirmed) {
                    console.log('[UI] Aborting update - user cancelled');
                    return;
                  }
                  
                  console.log('[UI] Setting updatingId and preparing to call API');
                  setUpdatingId(booking.bookingId);
                  console.log(`[Booking] Updating booking ${booking.bookingId} to status: Completed`);
                  const finalNote = `Completed at: ${new Date().toISOString()}`;
                  console.log('[Booking] Calling updateBookingStatus with', { bookingId: booking.bookingId, status: 'Completed', note: finalNote });
                  await updateBookingStatus(booking.bookingId, { status: 'Completed', note: finalNote });
                  console.log(`[Booking] Successfully updated booking ${booking.bookingId}`);
                  // Optimistically mark this booking as completed by me to show 'waiting' immediately
                  try { clientCompletedRef.current.add(booking.bookingId); } catch {}
                  await loadBookings();
                  Alert.alert('Thành công', 'Lịch hẹn đã được hoàn thành');
                } catch (error: any) {
                  console.error('[Booking] Error updating status:', error);
                  if (isUnauthorizedError(error)) {
                    await handleUnauthorizedError();
                  } else {
                    Alert.alert('Lỗi', `Không thể cập nhật trạng thái: ${error?.message || String(error)}`);
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

            {/* Cancel button */}
            <TouchableOpacity 
              style={styles.gridButton}
              disabled={updatingId === booking.bookingId}
              onPress={async () => {
                console.log('[UI] Cancel button pressed', { bookingId: booking.bookingId });
                Alert.alert(
                  'Xác nhận hủy',
                  'Bạn có chắc muốn hủy lịch hẹn này?',
                  [
                    { text: 'Không', style: 'cancel' },
                    { 
                      text: 'Hủy lịch hẹn', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          setUpdatingId(booking.bookingId);
                          console.log(`[Booking] Cancelling booking ${booking.bookingId}`);
                          await updateBookingStatus(booking.bookingId, { status: 'Cancelled' });
                          console.log(`[Booking] Successfully cancelled booking ${booking.bookingId}`);
                          await loadBookings();
                          Alert.alert('Đã hủy', 'Lịch hẹn đã được hủy');
                        } catch (error: any) {
                          console.error('[Booking] Error cancelling:', error);
                          if (isUnauthorizedError(error)) {
                            await handleUnauthorizedError();
                          } else {
                            Alert.alert('Lỗi', `Không thể hủy lịch hẹn: ${error?.message || String(error)}`);
                          }
                        } finally {
                          setUpdatingId(null);
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
              <Text style={[styles.gridButtonText, { color: '#DC2626' }]}>
                {updatingId === booking.bookingId ? 'Đang hủy...' : 'Hủy'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* === COMPLETE status actions (only renter can review) === */}
  {(() => {
          const st = getDerivedStatus(booking);
          const meIsRenter = currentUserId != null && booking.renterId === currentUserId;
          if (st !== 'completed' || !meIsRenter) return false;
          return true;
        })() && (
          reviewedRef.current.has(booking.bookingId) ? (
            <View style={styles.gridButton}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#059669" />
              <Text style={[styles.gridButtonText, { color: '#059669' }]}>Đã đánh giá</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.gridButton}
              onPress={() => openReview(booking.bookingId)}
            >
              <Ionicons name="star-outline" size={18} color="#F59E0B" />
              <Text style={[styles.gridButtonText, { color: '#F59E0B' }]}>Đánh giá</Text>
            </TouchableOpacity>
          )
        )}

        {/* === CANCELLED status - No additional actions, just contact buttons above === */}
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
              // Default to Vinhomes Grand Park (Thu Duc, HCMC)
              const DEFAULT_MEET = { lat: 10.8426, lng: 106.8297, label: 'Vinhomes Grand Park' };

              const rawLat = selectedBooking?.meetingLatitude;
              const rawLng = selectedBooking?.meetingLongitude;
              const hasMeeting =
                typeof rawLat === 'number' && typeof rawLng === 'number' &&
                !Number.isNaN(rawLat) && !Number.isNaN(rawLng) &&
                Math.abs(rawLat) + Math.abs(rawLng) > 0.0002; // avoid (0,0)

              const meetLat = hasMeeting ? (rawLat as number) : DEFAULT_MEET.lat;
              const meetLng = hasMeeting ? (rawLng as number) : DEFAULT_MEET.lng;
              const meetLabel = hasMeeting
                ? (selectedBooking?.meetingAddress || selectedBooking?.placeMeet || 'Điểm hẹn')
                : DEFAULT_MEET.label;
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
      {/* Review Modal */}
      <Modal visible={reviewVisible} transparent animationType="slide" onRequestClose={() => setReviewVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Đánh giá lịch hẹn</Text>
            <Text style={styles.modalSubtitle}>Chọn số sao</Text>
            <View style={{ flexDirection: 'row', marginVertical: 8 }}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setReviewRating(n)} style={{ padding: 4 }}>
                  <Ionicons name={n <= reviewRating ? 'star' : 'star-outline'} size={28} color="#F59E0B" />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalSubtitle}>Nhận xét (tuỳ chọn)</Text>
            <TextInput
              style={styles.textArea}
              value={reviewDescription}
              onChangeText={setReviewDescription}
              placeholder="Chia sẻ trải nghiệm của bạn (tối đa 500 ký tự)"
              maxLength={500}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity disabled={submittingReview} onPress={() => setReviewVisible(false)} style={[styles.modalBtn, { backgroundColor: '#E5E7EB' }]}>
                <Text style={[styles.modalBtnText, { color: '#374151' }]}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={submittingReview} onPress={submitReview} style={[styles.modalBtn, { backgroundColor: '#F59E0B', marginLeft: 8 }]}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>{submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Review modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: TEXT },
  modalSubtitle: { marginTop: 10, fontWeight: '700', color: TEXT },
  textArea: {
    marginTop: 8,
    minHeight: 90,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalBtnText: {
    fontWeight: '700',
  },
});
