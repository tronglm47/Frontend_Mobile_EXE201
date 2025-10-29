import React, { useRef, useState, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen } from '@/components/loading-screen';
import { fetchSubscriptionPlans, SubscriptionPlan } from '@/apis/subscription';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 20;
const CARD_GAP = 16;
const CARD_WIDTH = SCREEN_WIDTH - PADDING * 2 - 24; // show a bit of next card
const GOLD = '#E0B100';
const YELLOW_BG = '#E6C15A';

type Plan = {
  id: string | number;
  title: string;
  tagline?: string;
  priceLine1?: string;
  priceLine2?: string;
  bullets: string[];
  action: string;
  variant?: 'filled' | 'outline';
  badge?: string;
};

// Paid fallback options when API fails (no basic plan)
const FALLBACK_PAID_PLANS: Plan[] = [
  {
    id: 2,
    title: 'Gói Đăng Tin Nâng Cao',
    tagline: 'Nổi bật bài đăng, tiếp cận khách thuê nhanh hơn.',
    priceLine1: '99.000đ / tháng',
    priceLine2: '249.000đ / 3 tháng',
    bullets: ['Làm nổi bật bài đăng', 'Tự động làm mới', 'Thống kê lượt xem'],
    action: 'Chọn gói',
    variant: 'outline',
    badge: 'Phổ biến nhất',
  },
  {
    id: 1,
    title: 'Gói Theo Lượt',
    tagline: 'Chỉ trả khi dùng – linh hoạt cho mọi nhu cầu.',
    priceLine1: 'Từ 5.000đ / lượt',
    bullets: ['Đẩy ưu tiên liên hệ', 'Gợi ý bạn đọc', 'Đăng tin cần bán/cho thuê'],
    action: 'Chọn gói',
    variant: 'outline',
  },
];

export default function ChoosePlanScreen() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const [plans, setPlans] = useState<Plan[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchSubscriptionPlans();
        if (!mounted) return;
        const paidOnly = (data || []).filter((p) => {
          const name = (p.name || '').toLowerCase();
          return !name.includes('basic') && !name.includes('cơ bản');
        });
        const mapped: Plan[] = paidOnly.map((p: SubscriptionPlan): Plan => ({
          id: p.id,
          title: p.name,
          tagline: p.description,
          priceLine1: p.price ? `${p.price}${p.pricePer || ''}` : undefined,
          bullets: p.highlights || [],
          action: 'Chọn gói',
          variant: 'outline', // đồng bộ style như gói cơ bản
          badge: p.badge,
        }));
        setPlans(mapped.length ? mapped : FALLBACK_PAID_PLANS);
      } catch {
        setPlans(FALLBACK_PAID_PLANS);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const onContinue = async (selectedPlan?: Plan) => {
    try {
      await AsyncStorage.setItem('hasSeenPlans', 'true');
      if (selectedPlan) {
        await AsyncStorage.setItem('selectedPlanId', String(selectedPlan.id));
      }
    } catch {}
    // Mọi gói ở đây đều là gói trả phí → mở flow thanh toán
    if (selectedPlan) {
      router.replace({ pathname: '/subscribe', params: { planId: String(selectedPlan.id), planName: selectedPlan.title } } as any);
      return;
    }
    router.replace('/location-selection');
  };

  const renderItem = ({ item, index: i }: { item: Plan; index: number }) => {
    const inputRange = [
      (i - 1) * (CARD_WIDTH + CARD_GAP),
      i * (CARD_WIDTH + CARD_GAP),
      (i + 1) * (CARD_WIDTH + CARD_GAP),
    ];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.94, 1, 0.94],
      extrapolate: 'clamp',
    });
    const shadow = scrollX.interpolate({
      inputRange,
      outputRange: [2, 6, 2],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.card, { transform: [{ scale }], shadowRadius: shadow }]}> 
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.badge ? (
            <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View>
          ) : null}
        </View>
        {item.tagline ? <Text style={styles.tagline}>{item.tagline}</Text> : null}
        {item.priceLine1 ? <Text style={styles.price1}>{item.priceLine1}</Text> : null}
        {item.priceLine2 ? <Text style={styles.price2}>{item.priceLine2}</Text> : null}
        <View style={styles.bullets}>
          {item.bullets.map((b, idx) => (
            <View style={styles.bulletRow} key={idx}>
              <Ionicons name="checkmark-circle" size={16} color={GOLD} style={{ marginTop: 2 }} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, item.variant === 'filled' ? styles.actionFilled : styles.actionOutline]}
          onPress={() => onContinue(item)}
        >
          <Text style={[styles.actionText, item.variant === 'filled' ? styles.actionTextFilled : styles.actionTextOutline]}>
            {item.action}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!plans) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'} />
      <View style={styles.header}> 
        <Text style={styles.headerTitle}>Khám phá</Text>
        <Text style={styles.headerSub}>tiện ích nâng cao</Text>
      </View>

      <Animated.FlatList
        data={plans}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PADDING }}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate={0.95}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const i = Math.round(x / (CARD_WIDTH + CARD_GAP));
          setIndex(i);
        }}
        scrollEventThrottle={16}
        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
      />

      <View style={styles.dots}>
        {plans.map((_, i: number) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.skipBtn} onPress={() => onContinue()}>
        <Text style={styles.skipText}>Bỏ qua</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: YELLOW_BG,
  },
  header: {
    paddingHorizontal: PADDING,
    paddingTop: 8,
    marginBottom: 8,
    marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 8,
    
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    
  },
  headerSub: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F9F7EF',
    opacity: 0.9,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  card: {
    marginVertical: 20,
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    borderWidth: 1,
    borderColor: GOLD,
    height: 350,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    backgroundColor: GOLD,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  price1: { fontWeight: '800', fontSize: 18, marginBottom: 2 },
  price2: { fontWeight: '800', fontSize: 16, color: '#4B5563', marginBottom: 8 },
  tagline: { color: '#6B7280', fontSize: 12, marginTop: 2, marginBottom: 6 },
  bullets: { marginTop: 4, marginBottom: 14 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bulletText: { marginLeft: 8, color: '#374151', flexShrink: 1 },
  actionBtn: {
    marginTop: 'auto',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionFilled: { backgroundColor: GOLD },
  actionOutline: { borderWidth: 1.6, borderColor: GOLD },
  actionText: { fontWeight: '700' },
  actionTextFilled: { color: '#fff' },
  actionTextOutline: { color: GOLD },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 100,
    gap: 8,
    marginTop: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotActive: {
    width: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  skipBtn: {
    position: 'absolute',
    left: (SCREEN_WIDTH - 220) / 2,
    right: (SCREEN_WIDTH - 220) / 2,
    bottom: 30,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  skipText: { fontWeight: '700', color: '#111827' },
});
