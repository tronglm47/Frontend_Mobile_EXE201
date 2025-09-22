import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const PADDING = 24;
const BRAND = '#D9B200';

type Slide = {
  id: string;
  title: React.ReactNode;
  description: string;
  // using local placeholder assets; replace with real images later
  leftImage: any;
  rightImage: any;
  variant?: 'leftTop' | 'rightTop';
  leftOffset?: { x?: number; y?: number };
  rightOffset?: { x?: number; y?: number };
  leftOverlay?: any;
  rightOverlay?: any;
  leftOverlayOpacity?: number;
  rightOverlayOpacity?: number;
  leftOverlayOffset?: { x?: number; y?: number };
  rightOverlayOffset?: { x?: number; y?: number };
};



export default function OnboardingScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems?.[0]?.index != null) setIndex(viewableItems[0].index);
    }
  );

  const viewabilityConfig = useMemo(
    () => ({ viewAreaCoveragePercentThreshold: 60 }),
    []
  );
  const finish = useCallback(async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch {}
    router.replace('/login' as any);
  }, [router]);

  const goNext = useCallback(() => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  }, [index, finish]);

  const skip = useCallback(() => finish(), [finish]);

  return (
  <SafeAreaView style={styles.safe}> 
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}> 
            <Pressable style={styles.skip} onPress={skip} hitSlop={10}>
              <Text style={styles.skipText}>Bỏ qua</Text>
            </Pressable>

            <View style={styles.ovalGroup}>
              {/* subtle purple glow */}
              <View style={styles.glow} />
              <View
                style={[
                  styles.oval,
                  styles.shadow,
                  item.variant === 'leftTop' ? styles.onTop : styles.onBottom,
                  {
                    transform: [
                      { translateX: item.leftOffset?.x ?? 0 },
                      { translateY: item.leftOffset?.y ?? 0 },
                    ],
                  },
                ]}
              > 
                <Image
                  source={item.leftImage}
                  style={styles.media}
                  contentFit="contain"
                  transition={200}
                />
                  {item.leftOverlay ? (
                    <Image
                      source={item.leftOverlay}
                      style={[
                        StyleSheet.absoluteFillObject,
                        { width: 220, height: 220 },
                        styles.overlayMedia,
                        {
                          opacity: item.leftOverlayOpacity ?? 0.55,
                          transform: [
                            { translateX: item.leftOverlayOffset?.x ?? 0 },
                            { translateY: item.leftOverlayOffset?.y ?? 13 },
                          ],
                        },
                      ]}
                      contentFit="contain"
                    />
                  ) : null}
              </View>
              <View
                style={[
                  styles.circle,
                  styles.shadow,
                  item.variant === 'rightTop' ? styles.onTop : styles.onBottom,
                  {
                    transform: [
                      { translateX: item.rightOffset?.x ?? 0 },
                      { translateY: item.rightOffset?.y ?? 0 },
                    ],
                  },
                ]}
              > 
                <Image
                  source={item.rightImage}
                  style={styles.media}
                  contentFit="contain"
                  transition={200}
                />
                {item.rightOverlay ? (
                  <Image
                    source={item.rightOverlay}
                    style={[
                      StyleSheet.absoluteFillObject,
                      styles.overlayMedia,
                      {
                        opacity: item.rightOverlayOpacity ?? 0.55,
                        transform: [
                          { translateX: item.rightOverlayOffset?.x ?? 0 },
                          { translateY: item.rightOverlayOffset?.y ?? 0 },
                        ],
                      },
                    ]}
                    contentFit="contain"
                  />
                ) : null}
              </View>
            </View>

            <View style={styles.content}> 
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>

              <View style={styles.dots}>
                {slides.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === index ? styles.dotActive : null]}
                  />
                ))}
              </View>

              <Pressable onPress={goNext} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>
                  {index === slides.length - 1 ? 'Bắt đầu' : 'Tiếp theo'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    flex: 1,
    paddingHorizontal: PADDING,
    paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) + 8,
  },
  skip: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 14,
  },
  ovalGroup: {
    marginTop: 18,
    alignSelf: 'center',
    width: 220,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    left: 30,
    top: 40,
    // backgroundColor: '#7C3AED',
    opacity: 0.08,
    filter: 'blur(20px)',
  } as any,
  oval: {
    width: 230,
    height: 300,
    // no radius/overflow — images already pre-cut to oval
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    right: -4,
    top: 30,
    width: 148,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  borderRadius: 105,
  overflow: 'hidden',
  },
  onTop: { zIndex: 2 },
  onBottom: { zIndex: 1 },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  media: { width: '100%', height: '100%' },
    overlayMedia: {
      // ensure overlay sits above base image but below outer shadows
      zIndex: 3,
    },
  content: {
    flex: 1,
    marginTop: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },
  bold: { fontWeight: '800' },
  description: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    marginBottom: 8,
    
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    
    
  },
  dotActive: {
    backgroundColor: BRAND,
    width: 18,
    borderRadius: 9,
  },
  primaryBtn: {
    marginTop: 'auto',
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    
  },
});
const slides: Slide[] = [
  {
    id: '1',
    title: (
      <Text>
        Tìm nơi <Text style={styles.bold}>lý tưởng</Text> cho ngôi nhà tương lai của bạn
      </Text>
    ),
    description:
      'Chọn nơi tuyệt vời nhất để cùng gia đình và người thân dựng xây tổ ấm trong mơ',
    leftImage: require('../assets/images/screenKhoa/1.png'),
  rightImage: require('../assets/images/screenKhoa/2.png'),
  rightOverlay: require('../assets/images/screenKhoa/bg.png'),
  variant: 'leftTop',
  leftOffset: { x: -20, y: 0 },
  rightOffset: { x: 4, y: 30 },
  },
  {
    id: '2',
    title: (
      <Text>
        Bán căn hộ <Text style={styles.bold}>nhanh chóng</Text> chỉ với một cú click
      </Text>
    ),
    description:
      'Đơn giản hoá quy trình bán bất động sản chỉ với chiếc điện thoại của bạn',
    leftImage: require('../assets/images/screenKhoa/3.png'),
  rightImage: require('../assets/images/screenKhoa/4.png'),
  leftOverlay: require('../assets/images/screenKhoa/bg.png'),
  variant: 'rightTop',
  leftOffset: { x: -10, y: 60 },
  rightOffset: { x: 10, y: -10 },
  },
  {
    id: '3',
    title: (
      <Text>
        Cùng chúng tôi tìm <Text style={styles.bold}>ngôi nhà mơ ước</Text> của bạn
      </Text>
    ),
    description:
      'Chỉ vài thao tác chạm – khám phá và định vị bất động sản lý tưởng dành riêng cho bạn',
    leftImage: require('../assets/images/screenKhoa/5.png'),
  rightImage: require('../assets/images/screenKhoa/6.png'),
  rightOverlay: require('../assets/images/screenKhoa/bg.png'),
  variant: 'leftTop',
  leftOffset: { x: -20, y: 0 },
  rightOffset: { x: 4, y: 30 },
  },
];
