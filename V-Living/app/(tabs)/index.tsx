import { Colors, Fonts } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import React from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl, ActivityIndicator } from 'react-native';
// Alert imported above
import { FloatingChatbot } from '@/components/chatbot/FloatingChatbot';
import { LoadingScreen } from '@/components/loading-screen';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchLocations, LocationItem } from '../../apis/locations';
import { fetchAllLandlordPosts, LandlordPostItem, fetchBuildings, Building, fetchAllBuildings, fetchLandlordPostsPage } from '../../apis/posts';
import { setPostsInCache, prefetchImages } from '../../lib/post-cache';
import { useFavorites } from '../favorites-context';
import { useRecentViewed } from '../recent-viewed-context';
import { LISTINGS } from '../listings';
import { useLocation } from '../location-context';
import NotificationsScreen from '../notifications';

const IMG = (seed: string, w = 600, h = 400) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`; // legacy; avoid using for Trending

export default function HomeTab() {
  const { isFav, toggle } = useFavorites();
  const { addToRecentViewed } = useRecentViewed();
  const { selectedLocation } = useLocation();
  const [locations, setLocations] = React.useState<Record<number, LocationItem>>({});
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const goDetail = React.useCallback((post?: LandlordPostItem | string) => {
    if (typeof post === 'object' && post) {
      // If it's a LandlordPostItem, add to recent viewed and navigate
      addToRecentViewed(post);
      router.push({ pathname: '/detail', params: { id: String(post.postId) } } as any);
    } else if (typeof post === 'string') {
      // If it's just an ID string, navigate directly (for backward compatibility)
      router.push({ pathname: '/detail', params: { id: post } } as any);
    } else {
      // If no params, navigate without ID
      router.push({ pathname: '/detail' } as any);
    }
  }, [addToRecentViewed]);

  const openFilter = React.useCallback(() => {
    Alert.alert('Bộ lọc', 'Tính năng bộ lọc sẽ được bổ sung sau.');
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const locs = await fetchLocations();
        if (isMounted) {
          const map: Record<number, LocationItem> = {};
          locs.forEach((l) => { map[l.locationId] = l; });
          setLocations(map);
        }
      } catch (e) {
        console.warn('Failed to load locations:', e);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const locs = await fetchLocations();
      const map: Record<number, LocationItem> = {};
      locs.forEach((l) => { map[l.locationId] = l; });
      setLocations(map);
      setRefreshKey((k) => k + 1); // trigger TrendingSection to refetch latest landlord posts & buildings
    } catch (e) {
      console.warn('refresh home failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const [homeReady, setHomeReady] = React.useState(false);
  const [preTrending, setPreTrending] = React.useState<LandlordPostItem[] | null>(null);
  const [prePopular, setPrePopular] = React.useState<LandlordPostItem[] | null>(null);
  const [preBuildingsMap, setPreBuildingsMap] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Warm up: load first page of popular and trending posts and prefetch images
        const [allTrending, popularPage, buildings] = await Promise.all([
          fetchAllLandlordPosts(),
          fetchLandlordPostsPage(1, 5),
          fetchAllBuildings(),
        ]);
        const popular = popularPage.items || [];
        // Cache posts
        setPostsInCache(allTrending);
        setPostsInCache(popular);
        setPreTrending(allTrending);
        setPrePopular(popular);
        const idToBadge: Record<number, string> = {};
        buildings.forEach((b: Building) => { if (b.buildingId) idToBadge[b.buildingId] = [b.subdivisionName, b.name, (b as any).buildingName].filter(Boolean)[0]; });
        setPreBuildingsMap(idToBadge);
        // Prefetch images for quick render
        const imageUrls: string[] = [];
        [...allTrending, ...popular].forEach((p: any) => {
          if (p?.images?.length) imageUrls.push(...p.images.map((im: any) => im.imageUrl));
          if (p?.primaryImageUrl) imageUrls.push(p.primaryImageUrl);
          if (p?.imageUrl) imageUrls.push(p.imageUrl);
        });
        await prefetchImages(imageUrls);
      } catch {}
      finally {
        if (mounted) setHomeReady(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
  <Header location={selectedLocation} onOpenNotifications={() => setShowNotifications(true)} />

      <SearchBar onFilterPress={openFilter} />

      <PromoBanner />

      <TrendingSection goDetail={goDetail} isFav={isFav} toggleFav={toggle} refreshKey={refreshKey} initialPosts={preTrending || undefined} buildingsMap={preBuildingsMap} />

      <RecentSection goDetail={goDetail} isFav={isFav} toggleFav={toggle} locations={locations} />

      <Section title="Căn Hộ Hạng Đầu">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowGap8}>
          {['Rainbow', 'Origami', 'Beverly', 'Vinhomes', 'Manhattan'].map((t, idx) => (
            <Chip key={t} label={t} colorIndex={idx} />
          ))}
        </ScrollView>
      </Section>

      <PopularSection goDetail={goDetail} isFav={isFav} toggleFav={toggle} locations={locations} initialPosts={prePopular || undefined} />
    </ScrollView>
    {!homeReady && (
      <View style={{ position: 'absolute', left:0, right:0, top:0, bottom:0 }}>
        <LoadingScreen />
      </View>
    )}
    <FloatingChatbot />
    {/* Notifications Modal */}
    <Modal
      visible={showNotifications}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      onRequestClose={() => setShowNotifications(false)}
    >
      <NotificationsScreen ignoreTopSafeArea onClose={() => setShowNotifications(false)} />
    </Modal>
    </SafeAreaView>
  );
}

function Header({ location, onOpenNotifications }: { location: any; onOpenNotifications: () => void }) {
  const displayAddress = location?.address || 'Chọn địa chỉ';
  
  return (
    <View style={styles.headerWrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.addressLabel}>Địa chỉ</Text>
        <TouchableOpacity
          style={styles.addressRow}
          activeOpacity={0.8}
          onPress={() => router.push('/location-selection')}
        >
          <MaterialIcons name="location-on" size={18} color="#E0B100" />
          <Text style={styles.addressText} numberOfLines={1}>
            {displayAddress}
          </Text>
          <MaterialIcons name="expand-more" size={18} color="#9BA1A6" />
        </TouchableOpacity>
      </View>
      <View style={styles.actionsRow}>
        <IconButton name="notifications-none" onPress={onOpenNotifications} />
        <IconButton name="chat-bubble-outline" />
      </View>
    </View>
  );
}

function IconButton({ name, onPress }: { name: React.ComponentProps<typeof MaterialIcons>['name']; onPress?: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.iconButton} onPress={onPress}>
      <MaterialIcons name={name} size={20} color={Colors.light.text} />
    </TouchableOpacity>
  );
}

function SearchBar({ onFilterPress }: { onFilterPress: () => void }) {
  return (
    <View style={styles.searchWrap}>
      <MaterialIcons name="search" size={20} color={Colors.light.icon} />
      <TextInput placeholder="Tìm kiếm căn hộ" placeholderTextColor="#9BA1A6" style={styles.searchInput} />
      <TouchableOpacity onPress={onFilterPress}>
        <MaterialIcons name="tune" size={20} color={Colors.light.text} />
      </TouchableOpacity>
    </View>
  );
}

function PromoBanner() {
  return (
    <View style={styles.banner}>
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerTitle}>Nhận ngay hoàn tiền 20%</Text>
        <Text style={styles.bannerSub}>Hết hạn 25/08/2025</Text>
      </View>
      <Image source={{ uri: IMG('banner', 200, 140) }} style={styles.bannerImg} contentFit="cover" />
    </View>
  );
}

function Section({ title, children, onViewAll }: { title: string; children: React.ReactNode; onViewAll?: () => void }) {
  return (
    <View style={{ marginTop: 16 }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onViewAll ? (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>Xem tất cả</Text>
          </TouchableOpacity>
        ) : <View />}
      </View>
      {children}
    </View>
  );
}

function TrendCard({ images, title, price, badge, onPress, isFav, onToggleFav }: { images: string[]; title: string; price: string; badge?: string; onPress: () => void; isFav: boolean; onToggleFav: () => void }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (!images || images.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 3000);
    return () => clearInterval(t);
  }, [images]);
  
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.trendCard} onPress={onPress}>
      {images?.[idx] ? (
        <Image source={{ uri: images[idx] }} style={styles.trendImg} contentFit="cover" />
      ) : (
        <View style={[styles.trendImg, { backgroundColor: '#F2F3F5' }]} />
      )}
      <View style={styles.trendOverlay}>
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>{price}</Text>
        </View>
        <TouchableOpacity style={styles.playBtn} onPress={(e) => { e.stopPropagation?.(); onToggleFav(); }} activeOpacity={0.8}>
          <MaterialIcons name={isFav ? 'favorite' : 'favorite-border'} size={18} color={'#fff'} />
        </TouchableOpacity>
        <View style={{ position: 'absolute', bottom: 8, left: 8 }}>
          <Text style={styles.trendTitle}>{title}</Text>
          <View style={styles.badgeRow}>
            <MaterialIcons name="apartment" size={14} color="#fff" />
            <Text style={styles.badgeText}>{badge || '—'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TrendingSection({ goDetail, isFav, toggleFav, refreshKey, initialPosts, buildingsMap }: { goDetail: (post: LandlordPostItem | string) => void; isFav: (id: string) => boolean; toggleFav: (id: string) => void; refreshKey: number; initialPosts?: LandlordPostItem[]; buildingsMap: Record<number, string> }) {
  const [latest, setLatest] = React.useState<LandlordPostItem[] | null>(initialPosts ? initialPosts.slice(0, 3) : null);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [posts, buildings] = await Promise.all([fetchAllLandlordPosts(), fetchAllBuildings()]);
        if (!mounted) return;
        setPostsInCache(posts);
        // map buildingId -> subdivisionName/name
        const idToBadge: Record<number, string> = { ...buildingsMap };
        buildings.forEach((b: Building) => { if (b.buildingId) idToBadge[b.buildingId] = idToBadge[b.buildingId] || [b.subdivisionName, b.name, (b as any).buildingName].filter(Boolean)[0]; });
        // keep only 3 newest
        setLatest(posts.slice(0, 3).map(p => {
          const bid = p.apartment?.buildingId || (p as any).buildingId || 0;
          const badge = idToBadge[bid] || '';
          return { ...p, subdivisionName: badge } as any;
        }));
      } catch (e) {
        console.warn('Load landlord trending failed:', e);
        if (mounted) setLatest([]);
      }
    })();
    return () => { mounted = false; };
  }, [refreshKey]);

  const fmt = (v?: number) => v && v > 0
    ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(v)} VND`
    : 'Liên hệ';

  if (!latest || latest.length === 0) {
    // Do not render placeholders; loading screen covers initial load
    return null;
  }

  return (
    <Section title="Xu Hướng">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowGap16}>
          {latest.map((p: any) => {
          const imgs = (p.images && p.images.length ? p.images.map((im: any) => im.imageUrl) : []).filter(Boolean);
          if (!imgs.length && p.primaryImageUrl) imgs.push(p.primaryImageUrl);
          if (!imgs.length && p.imageUrl) imgs.push(p.imageUrl);
          const id = String(p.postId);
          return (
          <TrendCard
            key={p.postId}
            onPress={() => goDetail(p)}
            images={imgs}
            title={p.title}
            price={fmt(p.price)}
            badge={p.subdivisionName}
            isFav={isFav(id)}
            onToggleFav={() => toggleFav(id)}
          />
        );})}
      </ScrollView>
    </Section>
  );
}

function SmallCard({ seed, title, price, rating, onPress }: { seed: string; title: string; price: string; rating: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.smallCard} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: IMG(seed, 300, 220) }} style={styles.smallImg} contentFit="cover" />
      <View style={{ padding: 8, gap: 4 }}>
        <Text style={styles.smallTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.smallSub}>Q.9</Text>
          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={14} color="#E0B100" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.smallPrice}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
}

function NearCard({ seed, title, price, rating, onPress }: { seed: string; title: string; price: string; rating: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.nearCard} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: IMG(seed, 240, 180) }} style={styles.nearCardImg} contentFit="cover" />
      <View style={styles.nearCardContent}>
        <Text style={styles.nearCardTitle} numberOfLines={1}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialIcons name="location-on" size={12} color="#9BA1A6" />
          <Text style={styles.nearCardSub}>Q.9</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.nearCardPrice}>{price}</Text>
          <View style={styles.ratingRow}>
            <MaterialIcons name="star" size={12} color="#E0B100" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Chip({ label, colorIndex }: { label: string; colorIndex: number }) {
  const colors = ['#C5E0FF', '#FFE7B0', '#E7E1FF', '#C7F5D9', '#FFD9E2'];
  const textColors = ['#1A68D9', '#9A6A00', '#5A45C6', '#1E7A4B', '#B22A4E'];
  return (
    <View style={[styles.chip, { backgroundColor: colors[colorIndex % colors.length] }]}>
      <Text style={[styles.chipText, { color: textColors[colorIndex % textColors.length] }]}>{label}</Text>
    </View>
  );
}

function ListItem({ id, seed, title, subTitle, price, rating, isFav, onToggleFav, onPress }: { id: string; seed: string; title: string; subTitle: string; price: string; rating: number; isFav: boolean; onToggleFav: () => void; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.listItem} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: IMG(seed, 240, 180) }} style={styles.listImg} contentFit="cover" />
      <View style={{ flex: 1, paddingVertical: 4, gap: 6 }}>
        <Text style={styles.listTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.listSub} numberOfLines={1}>{subTitle}</Text>
          <View style={styles.ratingBadge}><MaterialIcons name="star" size={14} color={'#fff'} /><Text style={styles.ratingBadgeText}> {rating.toFixed(1)}</Text></View>
        </View>
        <Text style={styles.listPrice}>{price}</Text>
      </View>
      <TouchableOpacity style={styles.heartBtn} onPress={(e) => { e.stopPropagation?.(); onToggleFav(); }}>
        <MaterialIcons name={isFav ? 'favorite' : 'favorite-border'} size={18} color={isFav ? '#E91E63' : Colors.light.text} />
      </TouchableOpacity>
      
    </TouchableOpacity>
    
   
  );
  
}

function PopularListItem({ post, isFav, onToggleFav, onPress, locations }: { 
  post: LandlordPostItem; 
  isFav: (id: string) => boolean; 
  onToggleFav: (id: string) => void; 
  onPress: () => void;
  locations: Record<number, LocationItem>;
}) {
  const id = String(post.postId);
  const title = post.title || 'Bất động sản';
  const locName = post.apartment?.buildingId ? locations[post.apartment.buildingId]?.name : undefined;
  const subTitle = locName || 'Bất động sản';
  const priceVal: number | undefined = typeof post.price === 'number' ? post.price : undefined;
  const price = priceVal ?
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(priceVal)
    : 'Liên hệ';
  
  // Get the first/latest image from the post
  const getImageUrl = () => {
    if (post.primaryImageUrl) return post.primaryImageUrl;
    if (post.imageUrl) return post.imageUrl;
    if (post.images && post.images.length > 0) {
      return post.images[0].imageUrl;
    }
    return IMG(String(post.postId), 240, 180);
  };

  return (
    <TouchableOpacity style={styles.listItem} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: getImageUrl() }} style={styles.listImg} contentFit="cover" />
      <View style={{ flex: 1, paddingVertical: 4, gap: 6 }}>
        <Text style={styles.listTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.listSub} numberOfLines={1}>{subTitle}</Text>
          <View style={styles.ratingBadge}><MaterialIcons name="star" size={14} color={'#fff'} /><Text style={styles.ratingBadgeText}> 4.5</Text></View>
        </View>
        <Text style={styles.listPrice}>{price}</Text>
      </View>
      <TouchableOpacity style={styles.heartBtn} onPress={(e) => { e.stopPropagation?.(); onToggleFav(id); }}>
        <MaterialIcons name={isFav(id) ? 'favorite' : 'favorite-border'} size={18} color={isFav(id) ? '#E91E63' : Colors.light.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function RecentSection({ goDetail, isFav, toggleFav, locations }: { 
  goDetail: (post: LandlordPostItem | string) => void; 
  isFav: (id: string) => boolean; 
  toggleFav: (id: string) => void;
  locations: Record<number, LocationItem>;
}) {
  const { recentViewed } = useRecentViewed();

  if (recentViewed.length === 0) {
    return (
      <Section title="Gần Nhất">
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: '#9BA1A6', fontSize: 14 }}>Chưa có bài viết nào được xem gần đây</Text>
        </View>
      </Section>
    );
  }

  return (
    <Section title="Gần Nhất">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearScrollContent}>
        <View style={styles.nearGrid}>
          {recentViewed.slice(0, 4).map((post) => (
            <RecentCard 
              key={post.postId} 
              post={post}
              onPress={() => goDetail(post)} 
              locations={locations}
              isFav={isFav}
              onToggleFav={toggleFav}
            />
          ))}
        </View>
      </ScrollView>
    </Section>
  );
}

function RecentCard({ post, onPress, locations, isFav, onToggleFav }: { 
  post: LandlordPostItem; 
  onPress: () => void;
  locations: Record<number, LocationItem>;
  isFav: (id: string) => boolean;
  onToggleFav: (id: string) => void;
}) {
  const id = String(post.postId);
  const title = post.title || 'Bất động sản';
  const locName = post.apartment?.buildingId ? locations[post.apartment.buildingId]?.name : undefined;
  const subTitle = locName || 'Bất động sản';
  const priceVal: number | undefined = typeof post.price === 'number' ? post.price : undefined;
  const price = priceVal ?
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(priceVal)
    : 'Liên hệ';
  
  // Get the first/latest image from the post
  const getImageUrl = () => {
    if (post.primaryImageUrl) return post.primaryImageUrl;
    if (post.imageUrl) return post.imageUrl;
    if (post.images && post.images.length > 0) {
      return post.images[0].imageUrl;
    }
    return IMG(String(post.postId), 240, 180);
  };

  return (
    <TouchableOpacity style={styles.nearCard} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: getImageUrl() }} style={styles.nearCardImg} contentFit="cover" />
      <View style={styles.nearCardContent}>
        <Text style={styles.nearCardTitle} numberOfLines={1}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialIcons name="location-on" size={12} color="#9BA1A6" />
          <Text style={styles.nearCardSub}>{subTitle}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.nearCardPrice}>{price}</Text>
          <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onToggleFav(id); }}>
            <MaterialIcons 
              name={isFav(id) ? 'favorite' : 'favorite-border'} 
              size={14} 
              color={isFav(id) ? '#E91E63' : '#9BA1A6'} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function PopularSection({ goDetail, isFav, toggleFav, locations, initialPosts }: { 
  goDetail: (post: LandlordPostItem | string) => void; 
  isFav: (id: string) => boolean; 
  toggleFav: (id: string) => void;
  locations: Record<number, LocationItem>;
  initialPosts?: LandlordPostItem[];
}) {
  const [posts, setPosts] = React.useState<LandlordPostItem[]>(initialPosts || []);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const loadPosts = React.useCallback(async (page = 1, append = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const response = await fetchLandlordPostsPage(page, 5);
      setPostsInCache(response.items);
      if (append) {
        setPosts(prev => [...prev, ...response.items]);
      } else {
        setPosts(response.items);
      }
      setCurrentPage(response.currentPage);
      setHasMore(response.currentPage < response.totalPages);
    } catch (e) {
      console.warn('Failed to load popular posts:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  React.useEffect(() => {
    loadPosts(1, false);
  }, [loadPosts]);

  const handleLoadMore = React.useCallback(() => {
    if (!loadingMore && hasMore) {
      loadPosts(currentPage + 1, true);
    }
  }, [loadPosts, currentPage, loadingMore, hasMore]);

  if (loading && posts.length === 0) {
    return (
      <Section title="Phổ Biến Dành Cho Bạn">
        <View style={{ padding: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#E0B100" />
        </View>
      </Section>
    );
  }

  return (
    <Section title="Phổ Biến Dành Cho Bạn" onViewAll={() => router.push({ pathname: '/popular' } as any)}>
      <View style={{ gap: 12 }}>
        {posts.map((post) => (
          <PopularListItem
            key={post.postId}
            post={post}
            isFav={isFav}
            onToggleFav={toggleFav}
            onPress={() => goDetail(post)}
            locations={locations}
          />
        ))}
        
        {hasMore && (
          <TouchableOpacity 
            style={styles.loadMoreBtn} 
            onPress={handleLoadMore}
            disabled={loadingMore}
            activeOpacity={0.8}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color="#5E49FF" />
            ) : (
              <Text style={styles.loadMoreText}>Xem thêm</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Section>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  headerWrap: { flexDirection: 'row', alignItems: 'center', paddingTop: 12 },
  addressLabel: { color: '#9BA1A6', fontSize: 12 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontSize: 16, fontWeight: '700' as const },
  actionsRow: { flexDirection: 'row', gap: 10, marginLeft: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F3F5' },

  searchWrap: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F2F3F5', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 14 },

  banner: { marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#5E49FF', borderRadius: 14, padding: 14, overflow: 'hidden' },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' as const, fontFamily: Fonts.rounded },
  bannerSub: { color: '#EDEAFF', fontSize: 12, marginTop: 6 },
  bannerImg: { width: 110, height: 80, borderRadius: 10, marginLeft: 8 },

  sectionHeader: { marginTop: 8, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const },
  viewAll: { color: '#A9AEB6', fontSize: 12 },

  rowGap16: { gap: 16, paddingRight: 16 },
  rowGap12: { gap: 12, paddingRight: 16 },
  rowGap8: { gap: 8, paddingRight: 16 },

  trendCard: { width: 280, height: 280, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  trendImg: { width: '100%', height: '100%' },
  trendOverlay: { ...StyleSheet.absoluteFillObject },
  priceBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  priceBadgeText: { color: '#E0B100', fontWeight: '800' as const, fontSize: 12 },
  playBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  trendTitle: { color: '#fff', fontSize: 16, fontWeight: '700' as const },
  badgeRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeText: { color: '#fff', fontSize: 12 },

  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  smallCard: { width: '48%', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  smallImg: { width: '100%', height: 90 },
  smallTitle: { fontSize: 14, fontWeight: '700' as const },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallSub: { color: '#9BA1A6', fontSize: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '700' as const },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0B100', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingBadgeText: { fontSize: 12, fontWeight: '700' as const, color: '#fff' },
  smallPrice: { marginTop: 2, fontSize: 12, fontWeight: '700' as const },

  nearScrollContent: { paddingRight: 16 },
  nearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: 360 },
  nearCard: { width: '48%', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  nearCardImg: { width: '100%', height: 90 },
  nearCardContent: { padding: 8, gap: 4 },
  nearCardTitle: { fontSize: 12, fontWeight: '700' as const },
  nearCardSub: { color: '#9BA1A6', fontSize: 10 },
  nearCardPrice: { fontSize: 10, fontWeight: '700' as const },

  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 6 },
  chipText: { fontSize: 12, fontWeight: '700' as const },

  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 8, borderRadius: 14, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  listImg: { width: 80, height: 80, borderRadius: 10 },
  listTitle: { fontSize: 14, fontWeight: '700' as const },
  listSub: { color: '#9BA1A6', fontSize: 12 },
  listPrice: { fontSize: 12, fontWeight: '700' as const },
  heartBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F2F3F5', alignItems: 'center', justifyContent: 'center' },
  loadMoreBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    padding: 12, 
    backgroundColor: '#F2F3F5', 
    borderRadius: 12,
    marginTop: 8
  },
  loadMoreText: { 
    color: '#5E49FF', 
    fontSize: 14, 
    fontWeight: '600' as const 
  },
})
