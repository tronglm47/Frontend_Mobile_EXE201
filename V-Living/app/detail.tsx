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
    Linking.openURL('tel:0900000000').catch(() => Alert.alert('Không thể mở cuộc gọi'));
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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.roundBtn}>
            {/* <Ionicons name="chevron-back" size={27} color="#111827" /> */}
            <Ionicons name="arrow-back-outline" size={27} color="#111827" />
            
          </TouchableOpacity>
          <Text style={styles.topTitle}>Thông tin</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={onShare} style={styles.roundBtn}>
              <Ionicons name="share-social-outline" size={27} color="#111827" />
            </TouchableOpacity>
          <TouchableOpacity onPress={() => postId && toggle(postId)} style={styles.roundBtn}>
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={27} color={fav ? GOLD : '#111827'} />
            </TouchableOpacity>
          </View>
        </View>

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

        {/* Thumbnails */}
        <FlatList
          horizontal
          data={imageUrls}
          keyExtractor={(uri, i) => 'thumb-' + (uri || i)}
          contentContainerStyle={{  paddingTop: 10, height: 102 }}
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

        {/* Title & price */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.propTitle}>{post?.title || 'Bất động sản'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="location-outline" size={14} color={GRAY} />
              <Text style={styles.locationText}> {post?.apartment?.buildingId ? `Tòa ${post.apartment.buildingId}` : '—'}</Text>
            </View>
          </View>
          <Text style={styles.price}>{fmtCurrency(post?.price)}</Text>
        </View>

        {/* Property details grid removed until real fields available */}

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        {!!post?.description && (
          <Text numberOfLines={expanded ? undefined : 3} style={styles.desc}>
            {post.description}
          </Text>
        )}
        {!post?.description && (
          <Text style={styles.desc}>Không có mô tả</Text>
        )}
        <TouchableOpacity onPress={() => setExpanded((e) => !e)}>
          <Text style={styles.readMore}>{expanded ? 'Read less' : 'Read more'}</Text>
        </TouchableOpacity>

        {/* Agent section removed until integrated with backend */}

        {/* Facilities section removed until real data available */}

        {/* Map section intentionally omitted until real coordinates are available */}

        {/* Reviews section removed until real data available */}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating help */}
      {/* <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Hỗ trợ', 'Chúng tôi sẽ liên hệ bạn sớm.') }>
        <Ionicons name="help-buoy-outline" size={22} color="#fff" />
      </TouchableOpacity> */}

      {/* Sticky contact */}
      <SafeAreaView style={styles.bottomBar}>
        <TouchableOpacity style={styles.contactBtn} onPress={goContact}>
          <Text style={styles.contactText}>Liên hệ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.gridItem}>
      <Text style={styles.gridLabel}>{label}</Text>
      <Text style={styles.gridValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { paddingBottom: 0, marginTop:10, marginHorizontal:20, justifyContent: 'center', },
  topBar: {
    // paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
    marginBottom: 8,
  },
  topTitle: { fontWeight: '700', fontSize: 19, color: '#111827',textAlign:'center' },
  roundBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    width:320,
    height: 240,
    resizeMode: 'cover',
    //border-round
    borderRadius:10,
   
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
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 0, paddingTop: 10 },
  propTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  locationText: { color: GRAY },
  price: { color: GOLD, fontWeight: '800', marginLeft: 12, textAlign: 'right' },
  sectionTitle: { paddingHorizontal: 0, marginTop: 16, marginBottom: 10, fontWeight: '700', color: '#111827',fontSize:16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 0 },
  gridItem: { width: '33.333%', paddingVertical: 8 },
  gridLabel: { color: GRAY, fontSize: 12 },
  gridValue: { color: '#111827', fontWeight: '700', marginTop: 2 },
  desc: { paddingHorizontal: 0, color: '#374151', lineHeight: 20 },
  readMore: { paddingHorizontal: 0, color: GOLD, fontWeight: '600', marginTop: 6 },
  agentCard: {
    marginHorizontal: 0,
    marginTop: 8,
    backgroundColor: BG,
    // borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // shadowColor: '#000',
    // shadowOpacity: 0.08,
    // shadowRadius: 8,
    // shadowOffset: { width: 0, height: 2 },
    // elevation: 2,
  },
  agentAvatar: { width: 50, height: 50, borderRadius: 20 },
  agentName: { fontWeight: '700', color: '#111827' },
  agentRole: { color: GRAY, marginTop: 2 },
  agentAction: {
    width: 36,
    height: 36,
    // borderRadius: 18,
    // borderWidth: 1,
    // borderColor: GOLD,
    backgroundColor: '#f0f3f7ff',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
  seeAll: { color: GOLD, fontWeight: '600' },
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
