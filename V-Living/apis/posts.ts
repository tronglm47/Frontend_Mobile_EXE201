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

export async function createUserPost(body: UserPostBody): Promise<PostResponse> {
  return await api.post<PostResponse>('Post/user', body, true);
}