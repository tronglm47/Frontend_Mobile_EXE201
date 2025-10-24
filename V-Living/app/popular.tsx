import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { GOLD } from '@/constants/theme';
import { useFavorites } from './favorites-context';
import { fetchLandlordPostsPage, LandlordPostItem } from '../apis/posts';

const IMG = (seed: string, w = 600, h = 400) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export default function PopularScreen() {
  const { isFav, toggle } = useFavorites();
  const [posts, setPosts] = React.useState<LandlordPostItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchLandlordPostsPage(1, 20);
        if (mounted) setPosts(res.items || []);
      } catch {
        if (mounted) setPosts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><MaterialIcons name="arrow-back" size={24} color="#111827" /></TouchableOpacity>
        <Text style={styles.title}>Phổ Biến</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(i) => String(i.postId)}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        renderItem={({ item, index }) => {
          const image = item.primaryImageUrl || item.imageUrl || (item.images && item.images[0]?.imageUrl) || IMG(String(item.postId), 240, 180);
          const price = item.price && item.price > 0 ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(item.price)} VND/tháng` : 'Liên hệ';
          return (
          <TouchableOpacity style={styles.item} activeOpacity={0.9} onPress={() => router.push({ pathname: '/detail', params: { id: String(item.postId) } } as any)}>
            <Image source={{ uri: image }} style={styles.img} contentFit="cover" />
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="location-on" size={14} color="#9BA1A6" />
                <Text style={styles.sub} numberOfLines={1}> </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.price}>{price}</Text>
                <View style={styles.ratingBadge}><MaterialIcons name="star" size={14} color={'#fff'} /><Text style={styles.ratingBadgeText}> 4.5</Text></View>
              </View>
            </View>
            <TouchableOpacity style={styles.heart} onPress={() => toggle(String(item.postId))}>
              <MaterialIcons name={isFav(String(item.postId)) ? 'favorite' : 'favorite-border'} size={20} color={isFav(String(item.postId)) ? '#E91E63' : '#D1D5DB'} />
            </TouchableOpacity>
          </TouchableOpacity>
        );}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: '700', fontSize: 18, color: '#111827' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  img: { width: 84, height: 84, borderRadius: 10 },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  sub: { color: '#9BA1A6', fontSize: 12 },
  price: { fontSize: 12, fontWeight: '700' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: GOLD, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  heart: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F2F3F5', alignItems: 'center', justifyContent: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});


