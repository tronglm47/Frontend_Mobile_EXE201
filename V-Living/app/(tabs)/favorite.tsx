import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { GOLD } from '@/constants/theme';
import { router } from 'expo-router';
import { LISTINGS } from '../listings';
import { useFavorites } from '../favorites-context';

const IMG = (seed: string, w = 600, h = 400) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export default function FavoriteTab() {
  const { favorites, toggle } = useFavorites();
  const items = LISTINGS.filter((l) => favorites.has(l.id));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.title}>Yêu Thích</Text></View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, gap: 14 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.item} activeOpacity={0.9} onPress={() => router.push({ pathname: '/detail', params: { id: item.id } } as any)}>
            <Image source={{ uri: IMG(item.seed, 240, 180) }} style={styles.img} contentFit="cover" />
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
        ListEmptyComponent={<View style={{ padding: 24 }}><Text>Chưa có mục yêu thích</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { height: 56, alignItems: 'center', justifyContent: 'center' },
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


