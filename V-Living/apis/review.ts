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
  // Note: align casing with backend routes used in curl samples ("/api/Review")
  return await api.post<ReviewResponse>('Review', payload, true);
}

// ===== Additional Review APIs =====

export type ReviewUser = {
  userId: number;
  username?: string;
  fullName?: string;
  profilePictureUrl?: string | null;
};

export type ReviewPost = {
  postId: number;
  title?: string;
  description?: string;
  price?: number;
  averageRating?: number | null;
  totalReviews?: number;
  apartment?: any;
};

export type ReviewBooking = {
  bookingId: number;
  meetingTime?: string;
  placeMeet?: string;
  status?: string;
  createdAt?: string;
};

export type ReviewItem = {
  reviewId: number;
  bookingId: number;
  userId: number;
  postId: number;
  rating: number;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: ReviewUser | null;
  post?: ReviewPost | null;
  booking?: ReviewBooking | null;
};

export type PagedReviews = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: ReviewItem[];
};

// GET /Review/my - list reviews of current authenticated user
export async function fetchMyReviews(page = 1, pageSize = 10): Promise<PagedReviews> {
  const qs = page || pageSize ? `?page=${page}&pageSize=${pageSize}` : '';
  const res = await api.get<PagedReviews>(`Review/my${qs}`, true);
  return res;
}

// GET /Review/{id}
export async function fetchReviewById(reviewId: number | string): Promise<ReviewItem> {
  const res = await api.get<ReviewItem>(`Review/${reviewId}`, true);
  return res;
}

// PUT /Review/{id} - update rating/description
export async function updateReview(
  reviewId: number | string,
  payload: Partial<{ rating: number; description: string }>
): Promise<ReviewResponse | ReviewItem | { message?: string }> {
  if (!payload || (payload.rating == null && payload.description == null)) {
    throw new Error('At least one of rating or description is required');
  }
  if (payload.rating != null && (payload.rating < 1 || payload.rating > 5)) {
    throw new Error('rating must be between 1 and 5');
  }
  if (payload.description != null && payload.description.length > 500) {
    throw new Error('description must be at most 500 characters');
  }
  try {
    console.log('[API] updateReview ->', { reviewId, payload });
    const res = await api.put<ReviewResponse | ReviewItem | { message?: string }>(`Review/${reviewId}`, payload, true);
    console.log('[API] updateReview <-', res);
    return res;
  } catch (e) {
    console.error('[API] updateReview error:', e);
    throw e;
  }
}

// GET reviews by post id (best-effort across possible routes)
export async function fetchReviewsByPost(postId: number | string, page = 1, pageSize = 5): Promise<PagedReviews> {
  const qs = `?page=${page}&pageSize=${pageSize}`;
  try {
    return await api.get<PagedReviews>(`Review/post/${postId}${qs}`, true);
  } catch (e1) {
    // fallback to another common pattern
    try {
      return await api.get<PagedReviews>(`Post/${postId}/reviews${qs}`, true);
    } catch {
      throw e1; // surface the first error
    }
  }
}
