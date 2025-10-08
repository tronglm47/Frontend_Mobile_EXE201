import { api } from '../utils/api';

// Types for new Post API
export type Utility = {
  utilityId: number;
  name: string;
  createdAt: string;
};

export type Building = {
  buildingId: number;
  name: string;
  address?: string;
  createdAt?: string;
  subdivisionName?: string;
  buildingName?: string;
};

export type Apartment = {
  buildingId: number;
  apartmentCode: string;
  floor: number;
  area: number;
  apartmentType: string;
  status: string;
  numberBathroom: number;
};

export type LandlordPostBody = {
  title: string;
  description: string;
  price: number;
  status: string;
  utilityIds: number[];
  apartment: Apartment;
};

export type UserPostBody = {
  title: string;
  description: string;
};

export type PostResponse = {
  message: string;
  postId: number;
  postType: string;
};

// Types for landlord posts listing
export type LandlordPostItem = {
  postId: number;
  title: string;
  price: number;
  primaryImageUrl?: string;
  imageUrl?: string; // sometimes API returns top-level imageUrl
  images?: { imageId?: number; imageUrl: string; isPrimary?: boolean }[];
  buildingId?: number; // some responses have top-level buildingId
  apartment?: {
    buildingId: number;
  };
  createdAt?: string;
};

// API Functions
export async function fetchUtilities(): Promise<Utility[]> {
  const res = await api.get<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    items: Utility[];
  }>('Utility');
  return res?.items || [];
}

export async function fetchBuildings(): Promise<Building[]> {
  const res = await api.get<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    items: Building[];
  }>('Building');
  return res?.items || [];
}

// Paged fetch to support infinite dropdown loading
export async function fetchBuildingsPage(page = 1, pageSize = 20): Promise<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: Building[];
}> {
  const res = await api.get<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    items: Building[];
  }>(`Building?page=${page}&pageSize=${pageSize}`);
  return res;
}

export async function fetchAllBuildings(): Promise<Building[]> {
  const first = await api.get<{ currentPage: number; totalPages: number; items: Building[] }>('Building');
  const items: Building[] = [...(first.items || [])];
  const totalPages = first.totalPages || 1;
  for (let p = 2; p <= totalPages; p++) {
    try {
      const res = await api.get<{ items: Building[] }>(`Building?page=${p}`);
      if (res?.items?.length) items.push(...res.items);
    } catch {}
  }
  return items;
}

export async function createLandlordPost(body: LandlordPostBody): Promise<PostResponse> {
  return await api.post<PostResponse>('Post/landlord', body, true);
}

// Multipart version to support images upload
export async function createLandlordPostWithImages(params: LandlordPostBody & {
  images?: { uri: string; name: string; type: string }[];
  primaryImageIndex?: number;
}): Promise<PostResponse> {
  const form = new FormData();
  form.append('title', params.title);
  form.append('description', params.description);
  form.append('price', String(params.price));
  form.append('status', params.status);
  params.utilityIds?.forEach((id) => form.append('utilityIds', String(id)));

  form.append('apartment.buildingId', String(params.apartment.buildingId));
  form.append('apartment.apartmentCode', params.apartment.apartmentCode);
  form.append('apartment.floor', String(params.apartment.floor || 0));
  form.append('apartment.area', String(params.apartment.area || 0));
  form.append('apartment.apartmentType', params.apartment.apartmentType);
  form.append('apartment.status', params.apartment.status);
  form.append('apartment.numberBathroom', String(params.apartment.numberBathroom || 0));

  if (params.images && params.images.length > 0) {
    params.images.forEach((file) => {
      // @ts-ignore React Native FormData file
      form.append('images', file);
    });
    if (typeof params.primaryImageIndex === 'number') {
      form.append('primaryImageIndex', String(params.primaryImageIndex));
    }
  }

  return await api.post<PostResponse>('Post/landlord', form, true);
}

export async function createUserPost(body: UserPostBody): Promise<PostResponse> {
  return await api.post<PostResponse>('Post/user', body, true);
}

// Fetch all landlord posts across pages, sorted latest first
export async function fetchAllLandlordPosts(): Promise<LandlordPostItem[]> {
  const first = await api.get<{ currentPage: number; totalPages: number; totalItems: number; items: LandlordPostItem[] }>('Post/landlord');
  const items: LandlordPostItem[] = [...(first.items || [])];
  const totalPages = first.totalPages || 1;
  for (let p = 2; p <= totalPages; p++) {
    try {
      const res = await api.get<{ items: LandlordPostItem[] }>(`Post/landlord?page=${p}`);
      if (res?.items?.length) items.push(...res.items);
    } catch {}
  }
  // Sort by createdAt desc if present, else by postId desc
  return items.sort((a, b) => {
    const da = a.createdAt ? Date.parse(a.createdAt) : 0;
    const db = b.createdAt ? Date.parse(b.createdAt) : 0;
    return db - da || (b.postId - a.postId);
  });
}