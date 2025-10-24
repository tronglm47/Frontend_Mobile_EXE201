import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatbotIcon from './ChatbotIcon';
import { ChatbotSheet } from './ChatbotSheet';


const GOLD = '#E0B100';
const FAB_SIZE = 52;
const MARGIN_H = 16;
const MARGIN_V = 24;

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const screen = useRef(Dimensions.get('window')).current;
  const pos = useRef(
    new Animated.ValueXY({
      x: screen.width - (FAB_SIZE + MARGIN_H),
      y: screen.height - (FAB_SIZE + MARGIN_V),
    })
  ).current;

  // Track current and start positions without relying on private Animated internals
  const currentX = useRef<number>(screen.width - (FAB_SIZE + MARGIN_H));
  const currentY = useRef<number>(screen.height - (FAB_SIZE + MARGIN_V));
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const dragged = useRef(false);
  const startTime = useRef<number>(0);

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  useEffect(() => {
    const handler = ({ window }: { window: { width: number; height: number } }) => {
      // Keep FAB inside bounds on rotation/resize
      const maxX = window.width - FAB_SIZE;
      const bottomStop = Math.max(insets.bottom + 72, MARGIN_V); 
      const maxY = window.height - FAB_SIZE - bottomStop;
      const nx = clamp(currentX.current, 0, maxX);
      const ny = clamp(currentY.current, 0, maxY);
      currentX.current = nx;
      currentY.current = ny;
      pos.setValue({ x: nx, y: ny });
    };
    const sub = Dimensions.addEventListener('change', handler);
    return () => sub?.remove?.();
  }, [pos, insets.bottom]);

  // Ensure initial position respects bottom tab area once insets are known
  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    const maxX = width - FAB_SIZE;
    const bottomStop = Math.max(insets.bottom + 72, MARGIN_V);
    const maxY = height - FAB_SIZE - bottomStop;
    const nx = clamp(currentX.current, 0, maxX);
    const ny = clamp(currentY.current, 0, maxY);
    currentX.current = nx;
    currentY.current = ny;
    pos.setValue({ x: nx, y: ny });
  }, [insets.bottom, pos]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startX.current = currentX.current;
        startY.current = currentY.current;
        dragged.current = false;
        startTime.current = Date.now();
      },
      onPanResponderMove: (_, gesture) => {
        const dx = gesture.dx ?? 0;
        const dy = gesture.dy ?? 0;
        if (Math.abs(dx) + Math.abs(dy) > 6) dragged.current = true;
        const { width, height } = Dimensions.get('window');
        const maxX = width - FAB_SIZE;
        const bottomStop = Math.max(insets.bottom + 72, MARGIN_V);
        const maxY = height - FAB_SIZE - bottomStop;
        const nx = clamp(startX.current + dx, 0, maxX);
        const ny = clamp(startY.current + dy, 0, maxY);
        currentX.current = nx;
        currentY.current = ny;
        pos.setValue({ x: nx, y: ny });
      },
      onPanResponderRelease: () => {
        const elapsed = Date.now() - startTime.current;
        if (!dragged.current && elapsed < 250) {
          setOpen(true);
          return;
        }
        // Snap to nearest horizontal edge (left=0 or right=width-FAB_SIZE)
        const { width } = Dimensions.get('window');
        const maxX = width - FAB_SIZE;
        const targetX = currentX.current < maxX / 2 ? 0 : maxX;
        currentX.current = targetX;
        Animated.spring(pos.x, {
          toValue: targetX,
          useNativeDriver: true,
          bounciness: 12,
          speed: 12,
        }).start();
      },
    })
  ).current;

  return (
    <>
      <Animated.View
        style={[
          styles.fab,
          {
            width: FAB_SIZE,
            height: FAB_SIZE,
            transform: [{ translateX: pos.x }, { translateY: pos.y }],
          },
        ]}
  {...panResponder.panHandlers}
        accessibilityLabel="Floating Chatbot"
      >
        <ChatbotIcon width={40} height={40} />
      </Animated.View>
      <ChatbotSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 16,
    zIndex: 9999,
  },
});
