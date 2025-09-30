import { api } from '../utils/api';

export type PostItem = {
  postId: number;
  userId: number;
  postTypeId: number;
  propertyTypeId: number;
  propertyFormId: number;
  locationId: number;
  title: string;
  content?: string | null;
  images?: string[] | string | null;
  price?: number | null;
  status?: string;
  createdAt?: string;
  views?: number;
};

export type PostsResponse = {
  success: boolean;
  data: PostItem[];
};

export async function fetchPosts(): Promise<PostItem[]> {
  const res = await api.get<PostsResponse>('Post');
  if (!res?.success) return [];
  return Array.isArray(res.data) ? res.data : [];
}

export async function createPost(body: Omit<PostItem, 'postId' | 'createdAt' | 'views' | 'status'> & { amenityId?: number[] }): Promise<number> {
  const res: any = await api.post('Post', body, true);
  const id = res?.data?.postId || res?.postId || res?.data?.id || res?.id;
  return typeof id === 'number' ? id : 0;
}


