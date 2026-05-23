import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use Vercel production URL or fallback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vibely-social.vercel.app';
  
  // Public static routes to index in search results
  const routes = ['', '/explore', '/reels', '/search', '/login', '/register'].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return [...routes];
}
