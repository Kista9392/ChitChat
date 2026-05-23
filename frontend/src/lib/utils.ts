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
  
  let resolvedUrl = url;
  
  // Resolve relative URLs and prepends API base if not absolute
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860';
    resolvedUrl = url.startsWith('/') ? `${apiBase}${url}` : `${apiBase}/uploads/${url}`;
  } else {
    // If the database has localhost loopback addresses from a local database run, dynamically rewrite them
    const targetBase = process.env.NEXT_PUBLIC_API_URL;
    if (targetBase) {
      if (url.includes('localhost:8080') && !targetBase.includes('localhost:8080')) {
        resolvedUrl = url.replace(/https?:\/\/localhost:8080/, targetBase);
      } else if (url.includes('localhost:7860') && !targetBase.includes('localhost:7860')) {
        resolvedUrl = url.replace(/https?:\/\/localhost:7860/, targetBase);
      }
    }
  }
  
  if (resolvedUrl.includes('cloudinary.com') && resolvedUrl.includes('/image/upload/')) {
    return resolvedUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
  }
  
  return resolvedUrl;
}
