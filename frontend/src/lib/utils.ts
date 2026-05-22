import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getOptimizedVideoUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.includes('cloudinary.com') && url.includes('/video/upload/')) {
    return url.replace('/video/upload/', '/video/upload/f_auto,q_auto/');
  }
  return url;
}

export function getOptimizedImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
    return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
  }
  return url;
}
