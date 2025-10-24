import type { LandlordPostItem } from '../apis/posts';

// Simple in-memory cache for landlord posts for the app lifetime
const postMap = new Map<string, LandlordPostItem>();

export function getPostFromCache(id?: string | number): LandlordPostItem | undefined {
  if (!id && id !== 0) return undefined;
  return postMap.get(String(id));
}

export function setPostInCache(post?: LandlordPostItem | null) {
  if (!post || typeof post.postId === 'undefined' || post.postId === null) return;
  postMap.set(String(post.postId), post);
}

export function setPostsInCache(posts?: LandlordPostItem[] | null) {
  if (!Array.isArray(posts)) return;
  posts.forEach((p) => setPostInCache(p));
}

export function hasPostInCache(id?: string | number): boolean {
  if (!id && id !== 0) return false;
  return postMap.has(String(id));
}

export async function prefetchImages(urls: string[]) {
  const unique = Array.from(new Set(urls.filter(Boolean)));
  await Promise.all(unique.map((u) => (
    // RN Image.prefetch returns a Promise<boolean>
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (global as any)?.Image?.prefetch ? (global as any).Image.prefetch(u) : Promise.resolve(true)
  )));
}


