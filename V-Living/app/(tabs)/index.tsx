import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';

export default function HomeTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trang chủ</Text>
      <Text>Welcome to V‑Living</Text>
    {/* add booking button and route  */}
    <Button title="Book Now" onPress={() => router.push('./booking')} />
<Button title="messages" onPress={() => router.push('./messages')} />
  <Button title="details" onPress={() => router.push('./detail')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
});
