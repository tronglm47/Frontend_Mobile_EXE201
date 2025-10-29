import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { GOLD } from '@/constants/theme';
import { router } from 'expo-router';
import { useFavorites } from '../favorites-context';
import { fetchAllLandlordPosts, fetchBuildings, Building } from '@/apis/posts';
import { setPostsInCache, prefetchImages } from '@/lib/post-cache';
import { LoadingScreen } from '@/components/loading-screen';

const IMG = (seed: string, w = 600, h = 400) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export default function FavoriteTab() {
  const { favorites, toggle } = useFavorites();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [posts, buildings] = await Promise.all([fetchAllLandlordPosts(), fetchBuildings()]);
        if (!mounted) return;
        const idToBadge: Record<number, string> = {};
        buildings.forEach((b: Building) => { if (b.buildingId) idToBadge[b.buildingId] = [b.subdivisionName, b.name, (b as any).buildingName].filter(Boolean)[0]; });
        const favIds = Array.from(favorites);
        const filtered = (posts || []).filter((p: any) => favIds.includes(String(p.postId)));
        setPostsInCache(filtered);
        const mapped = filtered.map((p: any) => {
          const imgs = (p.images && p.images.length ? p.images.map((im: any) => im.imageUrl) : []).filter(Boolean);
          const image = imgs[0] || p.primaryImageUrl || p.imageUrl || IMG(String(p.postId), 240, 180);
          const price = p.price && p.price > 0 ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(p.price)} VND/tháng` : 'Liên hệ';
          const area = idToBadge[p.apartment?.buildingId || (p as any).buildingId || 0] || '';
          return { id: String(p.postId), title: p.title, area, price, rating: 4.5, image, seed: String(p.postId) };
        });
        setItems(mapped);
        // Prefetch visible images
        await prefetchImages(mapped.map(m => m.image).filter(Boolean));
      } catch {
        setItems([]);
      } finally { setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [favorites]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={{ width: 36 }} />
        <Text style={styles.title}>Yêu Thích</Text>
        <View style={{ width: 36 }} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.item} activeOpacity={0.9} onPress={() => router.push({ pathname: '/detail', params: { id: item.id } } as any)}>
            <Image source={{ uri: item.image || IMG(item.seed, 240, 180) }} style={styles.img} contentFit="cover" />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="location-on" size={14} color="#9BA1A6" />
                <Text style={styles.sub} numberOfLines={1}> {item.area}</Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.price}>{item.price}</Text>
                <View style={styles.ratingBadge}><MaterialIcons name="star" size={14} color={'#fff'} /><Text style={styles.ratingBadgeText}> {item.rating.toFixed(1)}</Text></View>
              </View>
            </View>
            <TouchableOpacity style={styles.heart} onPress={() => toggle(item.id)}>
              <MaterialIcons name={'favorite'} size={20} color={'#E91E63'} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialIcons name="favorite-border" size={64} color={GOLD} />
            </View>
            <Text style={styles.emptyTitle}>Chưa có mục yêu thích</Text>
            <Text style={styles.emptySubtitle}>
              Hãy khám phá và thêm những căn hộ bạn quan tâm vào danh sách yêu thích
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)')}
            >
              <MaterialIcons name="explore" size={20} color="#fff" />
              <Text style={styles.exploreButtonText}>Khám phá ngay</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    marginTop: 0,
    backgroundColor: '#fff',
  },
  title: { fontWeight: '800', fontSize: 18, color: '#111827' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  img: { width: 84, height: 84, borderRadius: 10 },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  sub: { color: '#9BA1A6', fontSize: 12 },
  price: { fontSize: 12, fontWeight: '700' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: GOLD, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  heart: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F2F3F5', alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // Empty state styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GOLD,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


