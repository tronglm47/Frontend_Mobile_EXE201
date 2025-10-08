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
};

export type Apartment = {
  buildingId: number;
  apartmentCode: string;
  floor: number;
  area: number;
  apartmentType: string;
  status: string;
  numberOfBedrooms: number;
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
  form.append('apartment.numberOfBedrooms', String(params.apartment.numberOfBedrooms || 0));

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