import { api } from '../utils/api';

export type SubscriptionPlan = {
  id: string | number;
  name: string;
  price?: string;
  pricePer?: string;
  description?: string;
  highlights?: string[];
  badge?: string;
  color?: string;
};

// Backend: GET /api/Subscription/plans
// Accept both wrapped and plain arrays
export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const res = await api.get<any>('Subscription/plans');
    const data = Array.isArray(res) ? res : (res?.data ?? res?.items ?? []);
    if (!Array.isArray(data)) return [];
    const vnd = (n?: number) => typeof n === 'number' ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n)}đ` : undefined;
    return data.map((p: any) => ({
      id: p.planId ?? p.id ?? p.code ?? String(Math.random()),
      name: (p.name ?? p.title ?? 'Gói').replace(/\(.*?\)/g, '').trim(),
      price: (() => {
        const pid = p.planId ?? p.id;
        if (pid === 1) return 'Từ 5.000đ/lần';
        if (pid === 2) return `${vnd(p.monthlyPrice || 99000)}`; // 99k
        if (pid === 3) return 'Từ 70.000đ/lần';
        return vnd(p.monthlyPrice);
      })(),
      pricePer: (() => {
        const pid = p.planId ?? p.id;
        if (pid === 2) return '/tháng';
        return undefined;
      })(),
      description: p.description ?? undefined,
      highlights: Array.isArray(p.highlights) ? p.highlights : (p.bullets ?? []),
      badge: (p.planId === 2) ? 'Phổ biến nhất' : (p.badge ?? (p.isPopular ? 'Phổ biến' : undefined)),
      color: p.color ?? undefined,
    }));
  } catch {
    return [];
  }
}


