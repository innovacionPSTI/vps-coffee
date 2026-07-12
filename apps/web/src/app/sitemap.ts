import type { MetadataRoute } from 'next'
import { getProducts, getBlogPosts } from '@vps/database'

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE_URL}/tienda`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/blog`,          lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/maquila`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/asesorias`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/nosotros`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/terminos`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE_URL}/privacidad`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  // Products
  const products = await getProducts().catch(() => [])
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => p.slug && p.active)
    .map((p) => ({
      url: `${BASE_URL}/tienda/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  // Blog posts (published only)
  const posts = await getBlogPosts().catch(() => [])
  const blogRoutes: MetadataRoute.Sitemap = posts
    .filter((p) => p.published && p.slug)
    .map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  return [...staticRoutes, ...productRoutes, ...blogRoutes]
}
