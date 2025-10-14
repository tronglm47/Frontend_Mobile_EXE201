import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites } from './favorites-context';
import { fetchLandlordPostById, LandlordPostItem } from '../apis/posts';
import { getPostFromCache, setPostInCache } from '../lib/post-cache';
import BookingModal from '../components/BookingModal';

const GOLD = '#E0B100';
const GRAY = '#6B7280';
const BG = '#F7F7F8';
const { width } = Dimensions.get('window');

const fmtCurrency = (v?: number) => {
  if (!v || v <= 0) return 'Liên hệ';
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${v} VND`;
  }
};



export default function DetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const postId = useMemo(() => (params.id ? String(params.id) : undefined), [params.id]);
  const { isFav, toggle } = useFavorites();
  const [post, setPost] = useState<LandlordPostItem | undefined>();
  const fav = isFav(postId || '');
  const [expanded, setExpanded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef<FlatList>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!postId) {
        setError('Thiếu mã bài viết');
        return;
      }
      // Try cache first for instant render
      const cached = getPostFromCache(postId);
      if (cached) setPost(cached);
      setLoading(!cached);
      setError(undefined);
      try {
        const data = await fetchLandlordPostById(postId);
        if (mounted && data) {
          setPost(data);
          setPostInCache(data);
        }
      } catch (e: any) {
        if (mounted && !cached) setError(e?.message || 'Không thể tải dữ liệu');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [postId]);

  const goContact = () => {
    const phoneNumber = post?.phoneNumber || '0900000000';
    Linking.openURL(`tel:${phoneNumber}`).catch(() => Alert.alert('Không thể mở cuộc gọi'));
  };

  const onShare = async () => {
    try {
      await Share.share({
        title: 'ORIGAMI Apartment',
        message: 'Xem căn hộ ORIGAMI – 3.000.000 VND/tháng',
      });
    } catch {}
  };

  const imageUrls = useMemo(() => {
    const urls: string[] = [];
    if (post?.images?.length) urls.push(...post.images.map(i => i.imageUrl).filter(Boolean));
    if (!urls.length && post?.primaryImageUrl) urls.push(post.primaryImageUrl);
    if (!urls.length && (post as any)?.imageUrl) urls.push((post as any).imageUrl);
    return urls;
  }, [post]);

  const renderImage = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.mainImage} />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.topTitle}>Thông tin</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={onShare} style={styles.roundBtn}>
            <Ionicons name="share-social-outline" size={22} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => postId && toggle(postId)} style={styles.roundBtn}>
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={22} color={fav ? GOLD : '#111827'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {loading && !post && (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text>Đang tải...</Text>
          </View>
        )}

        {!!error && (
          <View style={{ paddingVertical: 12 }}>
            <Text style={{ color: '#DC2626' }}>{error}</Text>
          </View>
        )}

        {/* Image carousel */}
        <View style={styles.imageCarouselContainer}>
          <Animated.FlatList
            ref={sliderRef}
            data={imageUrls}
            keyExtractor={(uri, i) => uri || String(i)}
            renderItem={renderImage}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveIdx(idx);
            }}
          />
        </View>

        {/* Thumbnails */}
        <View style={styles.thumbnailsContainer}>
          <FlatList
            horizontal
            data={imageUrls}
            keyExtractor={(uri, i) => 'thumb-' + (uri || i)}
            contentContainerStyle={{ paddingTop: 10, height: 102, paddingHorizontal: 20 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => sliderRef.current?.scrollToIndex({ index, animated: true })}
                style={[styles.thumbWrap, activeIdx === index && styles.thumbActive]}
              >
                <Image source={{ uri: item }} style={styles.thumbImg} />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ width: 8, backgroundColor: 'transparent' }} />}
          />
        </View>

        {/* Title & location */}
        <View style={styles.contentContainer}>
          <Text style={styles.propTitle}>{post?.title || 'Bất động sản'}</Text>
          <View style={styles.locationPriceRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="location-outline" size={14} color={GRAY} />
              <Text style={styles.locationText}> {post?.apartment?.buildingId ? `Tòa ${post.apartment.buildingId}` : '—'}</Text>
            </View>
            <Text style={styles.price}>{fmtCurrency(post?.price)}</Text>
          </View>

        {/* Property Details Section */}
        <Text style={styles.sectionTitle}>Chi tiết</Text>
        <View style={styles.grid}>
          {post?.apartment?.area && (
            <DetailItem 
              label="Diện tích" 
              value={`${post.apartment.area} m²`} 
              icon="square-outline"
            />
          )}
          {post?.apartment?.numberBathroom && (
            <DetailItem 
              label="Phòng tắm" 
              value={post.apartment.numberBathroom.toString()} 
              icon="water-outline"
            />
          )}
          {post?.apartment?.apartmentType && (
            <DetailItem 
              label="Loại" 
              value={post.apartment.apartmentType} 
              icon="home-outline"
            />
          )}
          {post?.apartment?.floor && (
            <DetailItem 
              label="Tầng" 
              value={`Tầng ${post.apartment.floor}`} 
              icon="layers-outline"
            />
          )}
          {post?.apartment?.buildingId && (
            <DetailItem 
              label="Tòa nhà" 
              value={`Tòa ${post.apartment.buildingId}`} 
              icon="business-outline"
            />
          )}
          {post?.status && (
            <DetailItem 
              label="Trạng thái" 
              value={post.status === 'available' ? 'Còn trống' : 'Đã thuê'} 
              icon="checkmark-circle-outline"
            />
          )}
        </View>


        {/* Description */}
        <Text style={styles.sectionTitle}>Mô tả</Text>
        {!!post?.description && (
          <>
            <Text numberOfLines={expanded ? undefined : 3} style={styles.desc}>
              {post.description}
            </Text>
            {post.description.length > 150 && (
              <TouchableOpacity onPress={() => setExpanded((e) => !e)}>
                <Text style={styles.readMore}>{expanded ? 'Thu gọn' : 'Xem thêm'}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {!post?.description && (
          <Text style={styles.desc}>Không có mô tả</Text>
        )}

        {/* Agent Section */}
        <Text style={styles.sectionTitle}>Chủ nhà</Text>
        <View style={styles.agentCard}>
          <View style={styles.agentInfo}>
            <View style={styles.agentAvatar}>
              <Ionicons name="person" size={24} color={GRAY} />
            </View>
            <View style={styles.agentDetails}>
              <Text style={styles.agentName}>{post?.userName || 'Chủ bài đăng'}</Text>
              <Text style={styles.agentRole}>Chủ bất động sản</Text>
            </View>
          </View>
          <View style={styles.agentActions}>
            <TouchableOpacity style={styles.agentAction} onPress={goContact}>
              <Ionicons name="call-outline" size={18} color={GOLD} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.agentAction}>
              <Ionicons name="chatbubble-outline" size={18} color={GOLD} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map Section */}
        <Text style={styles.sectionTitle}>Vị trí & Tiện ích công cộng</Text>
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color={GRAY} />
            <Text style={styles.mapPlaceholderText}>Bản đồ sẽ được tích hợp sau</Text>
            <Text style={styles.mapPlaceholderSubtext}>Tính năng định vị khoảng cách</Text>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Đánh giá</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.reviewsPlaceholder}>
          <Ionicons name="star-outline" size={24} color={GRAY} />
          <Text style={styles.reviewsPlaceholderText}>Tính năng đánh giá sẽ được phát triển</Text>
        </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Floating help */}
      {/* <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Hỗ trợ', 'Chúng tôi sẽ liên hệ bạn sớm.') }>
        <Ionicons name="help-buoy-outline" size={22} color="#fff" />
      </TouchableOpacity> */}

      {/* Sticky contact */}
      <SafeAreaView style={styles.bottomBar}>
        <TouchableOpacity style={styles.contactBtn} onPress={() => setShowBookingModal(true)}>
          <Text style={styles.contactText}>Đặt lịch</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Booking Modal */}
      {post && (
        <BookingModal
          visible={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          post={post}
          onSuccess={() => {
            // Optional: Show success message or navigate
            console.log('Booking successful!');
          }}
        />
      )}
    </SafeAreaView>
  );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <View style={styles.gridItem}>
      <View style={styles.gridItemContent}>
        {icon && <Ionicons name={icon as any} size={16} color={GRAY} style={styles.gridIcon} />}
        <View style={styles.gridTextContainer}>
          <Text style={styles.gridLabel}>{label}</Text>
          <Text style={styles.gridValue}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { paddingBottom: 0 },
  contentContainer: { marginHorizontal: 20 },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  titleContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: -1,
  },
  topTitle: { fontWeight: '800', color: '#111827', fontSize: 18 },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCarouselContainer: {
    marginHorizontal: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnailsContainer: {
    marginHorizontal: 0,
  },
  mainImage: {
    width: width - 40, // Full width minus margins
    height: 240,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  thumbWrap: {
    width: 74,
    height: 76,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
    
  },
  thumbActive: { borderColor: GOLD },
  thumbImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  propTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 20 },
  locationPriceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0, paddingTop: 8, marginBottom: 8 },
  locationText: { color: GRAY },
  price: { color: GOLD, fontWeight: '800', marginLeft: 12 },
  sectionTitle: { 
    paddingHorizontal: 0, 
    marginTop: 24, 
    marginBottom: 12, 
    fontWeight: '700', 
    color: '#111827',
    fontSize: 16,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 0 },
  gridItem: { width: '50%', paddingVertical: 8 },
  gridItemContent: { flexDirection: 'row', alignItems: 'center' },
  gridIcon: { marginRight: 8 },
  gridTextContainer: { flex: 1 },
  gridLabel: { color: GRAY, fontSize: 12 },
  gridValue: { color: '#111827', fontWeight: '700', marginTop: 2 },
  utilitiesContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 0 },
  utilityChip: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  utilityText: { color: '#111827', fontSize: 14, fontWeight: '500' },
  desc: { paddingHorizontal: 0, color: '#374151', lineHeight: 20 },
  readMore: { paddingHorizontal: 0, color: GOLD, fontWeight: '600', marginTop: 6 },
  agentCard: {
    marginHorizontal: 0,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  agentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  agentAvatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  agentDetails: { flex: 1 },
  agentName: { fontWeight: '700', color: '#111827', fontSize: 16 },
  agentRole: { color: GRAY, marginTop: 2, fontSize: 14 },
  agentActions: { flexDirection: 'row', gap: 8 },
  agentAction: {
    width: 36,
    height: 36,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    marginHorizontal: 0,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  mapPlaceholder: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  mapPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: GRAY,
    fontWeight: '500',
  },
  mapPlaceholderSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: GRAY,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginTop: 24,
    marginBottom: 12,
  },
  seeAll: { color: GOLD, fontWeight: '600', fontSize: 14, textTransform: 'none' },
  reviewsPlaceholder: {
    marginHorizontal: 0,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reviewsPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: GRAY,
    textAlign: 'center',
  },
  chip: {
    backgroundColor: '#f8ecf5ff',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#6d6d6dff',
    marginRight: 8,
  },
  chipText: { color: '#111827', fontWeight: '600' },
  map: { height: 160, borderRadius: 12, marginHorizontal: 0, marginTop: 12, resizeMode: 'cover' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 0 },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 0,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
  reviewName: { fontWeight: '700', color: '#111827' },
  reviewText: { color: '#374151', marginTop: 6 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 96,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'transparent',
  },
  contactBtn: {
    backgroundColor: GOLD,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    shadowColor: GOLD,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  contactText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
