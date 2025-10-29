import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { WebView } from 'react-native-webview';

export default function PaymentWebviewScreen() {
  const params = useLocalSearchParams<{ url?: string; amount?: string; orderCode?: string }>();
  const url = params.url as string | undefined;
  const amount = params.amount ? Number(params.amount) : undefined;
  const orderCode = params.orderCode as string | undefined;
  const [completed, setCompleted] = React.useState(false);

  if (!url) {
    return (
      <SafeAreaView style={styles.safe}> 
        <View style={styles.center}><Text>Thiếu payment URL</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>Đóng</Text></TouchableOpacity>
        <Text style={styles.title}>Thanh toán</Text>
        <View style={{ width: 60 }} />
      </View>
      <WebView
        source={{ uri: url }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.center}><ActivityIndicator color="#E0B100" /></View>
        )}
        onNavigationStateChange={(s) => {
          const t = (s.title || '').toLowerCase();
          const raw = s.url || '';
          const u = raw.toLowerCase();
          const isCallback = /\/api\/payment\/callback/.test(u);
          let codeParam = '';
          try { const obj = new URL(raw); codeParam = obj.searchParams.get('code') || ''; } catch {}
          const isSuccess = t.includes('payment successful') || t.includes('thanh công') || u.includes('status=completed') || u.includes('success=true') || (isCallback && !!codeParam);
          const isFail = t.includes('failed') || u.includes('status=failed') || u.includes('cancel');
          if (!completed && (isCallback || isSuccess)) {
            setCompleted(true);
            try { console.log('[Payment] detected success, navigating home'); } catch {}
            router.replace('/(tabs)');
          } else if (!completed && isFail) {
            setCompleted(true);
            try { console.log('[Payment] detected failure/cancel'); } catch {}
            router.back();
          }
        }}
        onShouldStartLoadWithRequest={(req) => {
          const u = (req.url || '').toLowerCase();
          if (/\/api\/payment\/callback/.test(u)) {
            // Intercept server callback and close webview
            if (!completed) {
              setCompleted(true);
              try { console.log('[Payment] intercept callback -> close'); } catch {}
              router.replace('/(tabs)');
            }
            return false;
          }
          return true;
        }}
      />
      <View style={styles.summary}>
        {typeof amount === 'number' ? (
          <View style={styles.row}><Text style={styles.summaryLabel}>Số tiền</Text><Text style={styles.summaryValue}>{new Intl.NumberFormat('vi-VN').format(amount)}đ</Text></View>
        ) : null}
        {orderCode ? (
          <View style={styles.row}><Text style={styles.summaryLabel}>Mã đơn</Text><Text style={styles.summaryValue}>{orderCode}</Text></View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  back: { paddingVertical: 8, paddingHorizontal: 12 },
  backText: { color: '#1F2937', fontWeight: '700' as const },
  title: { fontWeight: '800' as const },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summary: { position: 'absolute', left: 12, right: 12, bottom: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.92)', padding: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  summaryLabel: { color: '#6B7280', fontSize: 12 },
  summaryValue: { fontWeight: '800' as const },
});


