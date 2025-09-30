import { api } from '../utils/api';

export type ApiListResponse<T> = { success: boolean; data: T[] };

export type PropertyType = { propertyTypeId: number; name: string; description?: string; createdAt?: string };
export type PropertyForm = { propertyFormId: number; name: string; description?: string; createdAt?: string };
export type PostType = { postTypeId: number; name: string; description?: string; createdAt?: string };
export type Amenity = { amenityId: number; name: string; icon?: string };
export type PostAmenityItem = { postId: number; amenityId: number; notes?: string | null };
export type ApiResponse<T> = { success: boolean; data: T };

export const fetchPropertyTypes = async (): Promise<PropertyType[]> => {
  const res = await api.get<ApiListResponse<PropertyType>>('PropertyType');
  return res?.success && Array.isArray(res.data) ? res.data : [];
};

export const fetchPropertyForms = async (): Promise<PropertyForm[]> => {
  const res = await api.get<ApiListResponse<PropertyForm>>('PropertyForm');
  return res?.success && Array.isArray(res.data) ? res.data : [];
};

export const fetchPostTypes = async (): Promise<PostType[]> => {
  const res = await api.get<ApiListResponse<PostType>>('PostType');
  return res?.success && Array.isArray(res.data) ? res.data : [];
};

export const fetchAmenities = async (): Promise<Amenity[]> => {
  // If there is a master amenity endpoint, use it; otherwise fallback to PostAmenity for mapping later
  try {
    const res = await api.get<ApiListResponse<Amenity>>('Amenity');
    return res?.success && Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
};

export const attachPostAmenities = async (postId: number, amenityIds: number[]): Promise<void> => {
  if (!postId || !amenityIds?.length) return;
  const payloads: PostAmenityItem[] = amenityIds.map((id) => ({ postId, amenityId: id }));
  // If backend supports bulk endpoint, prefer it; here we fire sequentially
  for (const item of payloads) {
    await api.post('PostAmenity', item, true);
  }
};


