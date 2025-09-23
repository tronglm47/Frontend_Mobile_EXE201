import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Fonts } from '@/constants/theme';
// Alert imported above
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFavorites } from '../favorites-context';
import { LISTINGS } from '../listings';

const IMG = (seed: string, w = 600, h = 400) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export default function HomeTab() {
  const { isFav, toggle } = useFavorites();

  const goDetail = React.useCallback((id?: string) => router.push({ pathname: '/detail', params: id ? { id } : undefined } as any), []);

  const openFilter = React.useCallback(() => {
    Alert.alert('Bộ lọc', 'Tính năng bộ lọc sẽ được bổ sung sau.');
  }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Header />

      <SearchBar onFilterPress={openFilter} />

      <PromoBanner />

      <Section title="Xu Hướng">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowGap16}>
          {[LISTINGS[0], LISTINGS[1], LISTINGS[2]].map((l) => (
            <TrendCard key={l.id} onPress={() => goDetail(l.id)} seed={l.seed} title={l.title} price={l.price} />
          ))}
        </ScrollView>
      </Section>

      <Section title="Gần Nhất">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearScrollContent}>
          <View style={styles.nearGrid}>
            {LISTINGS.slice(0, 4).map((l) => (
              <NearCard key={l.id} onPress={() => goDetail(l.id)} seed={l.seed} title={l.title} price={l.price} rating={l.rating} />
            ))}
          </View>
        </ScrollView>
      </Section>

      <Section title="Căn Hộ Hạng Đầu">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowGap8}>
          {['Rainbow', 'Origami', 'Beverly', 'Vinhomes', 'Manhattan'].map((t, idx) => (
            <Chip key={t} label={t} colorIndex={idx} />
          ))}
        </ScrollView>
      </Section>

      <Section title="Phổ Biến Dành Cho Bạn" onViewAll={() => router.push({ pathname: '/popular' } as any)}>
        <View style={{ gap: 12 }}>
          {LISTINGS.map((l) => (
            <ListItem
              key={l.id}
              id={l.id}
              seed={l.seed}
              title={l.title}
              subTitle={l.area}
              price={l.price}
              rating={l.rating}
              isFav={isFav(l.id)}
              onToggleFav={() => toggle(l.id)}
              onPress={() => goDetail(l.id)}
            />
          ))}
        </View>
      </Section>
    </ScrollView>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.headerWrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.addressLabel}>Địa chỉ</Text>
        <TouchableOpacity style={styles.addressRow} activeOpacity={0.8}>
          <MaterialIcons name="location-on" size={18} color="#E0B100" />
          <Text style={styles.addressText}>Vinhomes, Quận 9</Text>
          <MaterialIcons name="expand-more" size={18} color="#9BA1A6" />
        </TouchableOpacity>
      </View>
      <View style={styles.actionsRow}>
        <IconButton name="notifications-none" />
        <IconButton name="chat-bubble-outline" />
      </View>
    </View>
  );
}

function IconButton({ name }: { name: React.ComponentProps<typeof MaterialIcons>['name'] }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.iconButton}>
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

function TrendCard({ seed, title, price, onPress }: { seed: string; title: string; price: string; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.trendCard} onPress={onPress}>
      <Image source={{ uri: IMG(seed, 380, 240) }} style={styles.trendImg} contentFit="cover" />
      <View style={styles.trendOverlay}>
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>{price}</Text>
        </View>
        <View style={styles.playBtn}>
          <MaterialIcons name="play-arrow" size={18} color="#fff" />
        </View>
        <View style={{ position: 'absolute', bottom: 8, left: 8 }}>
          <Text style={styles.trendTitle}>{title}</Text>
          <View style={styles.badgeRow}>
            <MaterialIcons name="apartment" size={14} color="#fff" />
            <Text style={styles.badgeText}>Beverly</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  priceBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#E0B100', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  priceBadgeText: { color: '#000', fontWeight: '800' as const, fontSize: 12 },
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
})
