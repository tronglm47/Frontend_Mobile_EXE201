import { api } from '../lib/api';

export type ReviewCreate = {
  bookingId: number;
  rating: number; // 1-5
  description?: string;
};

export type ReviewResponse = {
  message?: string;
  reviewId?: number;
};

export async function createReview(payload: ReviewCreate): Promise<ReviewResponse> {
  if (!payload || !payload.bookingId || !payload.rating) {
    throw new Error('bookingId and rating are required');
  }
  if (payload.rating < 1 || payload.rating > 5) {
    throw new Error('rating must be between 1 and 5');
  }
  return await api.post<ReviewResponse>('review', payload, true);
}
