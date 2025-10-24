import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, GOLD } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        tabBarStyle: { height: 64 },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen name="explore" options={{ title: 'Đăng bài', tabBarIcon: ({ color, focused }) => <MaterialIcons name={focused ? 'explore' : 'explore'} size={26} color={color} /> }} />
      <Tabs.Screen name="favorite" options={{ title: 'Yêu thích', tabBarIcon: ({ color, focused }) => <MaterialIcons name={focused ? 'favorite' : 'favorite-border'} size={26} color={color} /> }} />
      <Tabs.Screen name="schedule" options={{ title: 'Lịch hẹn', tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={26} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarIcon: ({ color }) => <MaterialIcons name="person" size={26} color={color} /> }} />
    </Tabs>
  );
}
