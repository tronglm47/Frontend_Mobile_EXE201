import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { createPayment } from '../apis/payment';
import { getUserInfo } from '../apis/auth';

type PriceOption = { label: string; amount: number; id: string };

export default function SubscribeScreen() {
  const params = useLocalSearchParams<{ planId?: string; planName?: string }>();
  const subscriptionPlanId = Number(params.planId || 0);
  const planName = params.planName || 'Gói';

  // Cố định giá theo yêu cầu, map theo subscriptionPlanId từ API:
  // 2 = Gói Đăng Tin Nâng Cao; 1 = Gói Theo Lượt; 3 = Gói Dịch vụ liên kết
  const pricePresets: Record<number, PriceOption[]> = {
    2: [
      { id: 'p1', label: '99.000đ / tháng', amount: 99000 },
      { id: 'p3', label: '249.000đ / 3 tháng', amount: 249000 },
    ],
    1: [
      { id: 'u1', label: '5.000đ / 1 lần', amount: 5000 },
      { id: 'u10', label: '45.000đ / 10 lần', amount: 45000 },
    ],
    3: [
      { id: 'sv1', label: 'Vệ sinh – 70.000đ/giờ', amount: 70000 },
      { id: 'sv2', label: 'Vận chuyển – 500.000đ', amount: 500000 },
      { id: 'sv3', label: 'Sửa chữa – 150.000đ / lượt', amount: 150000 },
    ],
  };

  const options = pricePresets[subscriptionPlanId] || [];
  const [selectedOption, setSelectedOption] = React.useState<PriceOption | null>(options[0] || null);
  const [userId, setUserId] = React.useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const me = await getUserInfo();
        if (me?.userID != null) setUserId(Number(me.userID));
      } catch {}
    })();
  }, []);

  const onPay = async () => {
    if (!selectedOption) return;
    setSubmitting(true);
    try {
      const res = await createPayment({
        userId: userId,
        amount: selectedOption.amount,
        paymentType: 'payos',
        subscriptionPlanId,
        description: `${planName} - ${selectedOption.label}`,
      });
      const paymentUrl = (res as any)?.paymentUrl || res?.checkoutUrl || (res as any)?.url;
      const orderCode = (res as any)?.orderCode || (res as any)?.orderId;
      if (paymentUrl) {
        router.push({ pathname: '/payment-webview', params: { url: paymentUrl, amount: String(selectedOption.amount), orderCode: String(orderCode || '') } } as any);
      } else if ((res as any)?.qrCodeUrl) {
        Alert.alert('Quét QR để thanh toán', 'Vui lòng quét mã QR được cung cấp.');
      } else {
        Alert.alert('Đã tạo thanh toán', 'Vui lòng tiếp tục theo hướng dẫn.');
      }
    } catch (e: any) {
      Alert.alert('Thanh toán thất bại', e?.message || 'Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderDetails = (opt: PriceOption) => {
    const li = (t: string, i: number) => (
      <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <Text style={{ color: '#E0B100', marginTop: 2 }}>•</Text>
        <Text style={{ flex: 1, color: '#374151', fontSize: 13 }}>{t}</Text>
      </View>
    );
    let items: string[] = [];
    if (subscriptionPlanId === 1) {
      if (opt.id === 'u1' || opt.id === 'u10') {
        items = [
          'Đăng tin căn hộ cần cho thuê (ưu tiên hiển thị) — 5.000đ/lần',
          'Đẩy tin ưu tiên, tiếp cận nhanh hơn người thuê',
          'Hỗ trợ gợi ý bạn đọc phù hợp theo khu vực & ngân sách',
        ];
      }
    }
    if (subscriptionPlanId === 2) {
      // Gói Đăng Tin Nâng Cao (áp dụng cho mọi lựa chọn 1/3 tháng)
      items = [
        'Làm nổi bật bài đăng',
        'Tự động làm mới bài đăng',
        'Đăng tin căn hộ cần cho thuê',
        'Được xác minh (huy hiệu tin cậy)',
        'Thống kê lượt xem chi tiết',
        'Tin được gợi ý đến sinh viên phù hợp (đúng khu vực, ngân sách, nhu cầu)',
      ];
    }
    if (subscriptionPlanId === 3) {
      if (opt.id === 'sv1') items = ['Dịch vụ vệ sinh chuyên nghiệp, tính theo giờ', 'Thiết bị và hóa chất an toàn, thân thiện'];
      if (opt.id === 'sv2') items = ['Vận chuyển đồ đạc, hỗ trợ bốc xếp', 'Báo giá theo quãng đường và khối lượng'];
      if (opt.id === 'sv3') items = ['Sửa chữa điện nước cơ bản tại nhà', 'Kết nối thợ uy tín, có bảo hành'];
    }
    return (
      <View style={{ marginTop: 8 }}>{items.map(li)}</View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBack}><Text style={styles.topBackText}>‹</Text></TouchableOpacity>
        <Text style={styles.topTitle}>Tiện ích</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{planName.replace(/\(.*?\)/g, '').trim()}</Text>
        <Text style={styles.sub}>Chọn gói tiền/ dịch vụ</Text>

        <View style={{ gap: 10 }}>
          {options.map((opt) => (
            <TouchableOpacity key={opt.id} onPress={() => setSelectedOption(opt)} activeOpacity={0.9} style={[styles.option, selectedOption?.id === opt.id && styles.optionActive]}>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              {selectedOption?.id === opt.id ? <Text style={styles.check}>✓</Text> : null}
            </TouchableOpacity>
          ))}
        </View>

        {selectedOption ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Bao gồm</Text>
            {renderDetails(selectedOption)}
          </View>
        ) : null}

        <TouchableOpacity style={[styles.payBtn, submitting && { opacity: 0.6 }]} disabled={submitting || !selectedOption} onPress={onPay}>
          <Text style={styles.payText}>{submitting ? 'Đang tạo thanh toán...' : 'Thanh toán'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '800' as const, marginTop: 6 },
  sub: { color: '#6B7280', fontSize: 12 },
  option: { padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionActive: { borderColor: '#E0B100', backgroundColor: '#FFF8DF' },
  optionLabel: { fontSize: 14, fontWeight: '600' as const },
  check: { color: '#E0B100', fontWeight: '800' as const },
  payBtn: { marginTop: 20, backgroundColor: '#E0B100', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  payText: { color: '#fff', fontWeight: '800' as const },
  detailCard: { marginTop: 6, borderRadius: 12, borderWidth: 1, borderColor: '#F3E2A6', backgroundColor: '#FFFBEB', padding: 12 },
  detailTitle: { fontWeight: '800' as const, marginBottom: 8, color: '#1F2937' },
  topBar: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  topBack: { width: 36, alignItems: 'flex-start', paddingVertical: 6 },
  topBackText: { fontSize: 28, lineHeight: 28, color: '#1F2937' },
  topTitle: { fontWeight: '800' as const, fontSize: 16 },
});


