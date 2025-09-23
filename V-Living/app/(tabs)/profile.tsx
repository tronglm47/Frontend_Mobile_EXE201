import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileTab() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ padding: 16 }}>
        <Text style={styles.title}>Hồ sơ</Text>
        <Text>Đang phát triển…</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
});


