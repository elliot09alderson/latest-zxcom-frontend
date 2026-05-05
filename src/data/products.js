// Products storefront data — now backed by the live DB via /public/products.
// The admin panel at /admin/products is the single source of truth.
//
// A tiny in-memory cache keeps successive navigations snappy without a
// dedicated query-cache library; it expires every 60 s.

import api from '../config/api';

let cache = null;
let cacheAt = 0;
const TTL_MS = 60_000;

// Normalise the DB product shape to the flatter shape the storefront
// components were built against (camelCase, single `image`, computed
// `isOutOfStock` / `availableStock`).
function normalise(p) {
  if (!p) return null;
  const sizes = Array.isArray(p.sizes) ? p.sizes : [];
  const isClothing = sizes.length > 0 || Boolean(p.is_clothing);
  const totalSizeStock = sizes.reduce((s, x) => s + (Number(x.stock) || 0), 0);
  const totalStock = isClothing ? totalSizeStock : Number(p.stock || 0);
  return {
    id: p._id || p.id,
    _id: p._id,
    name: p.name,
    description: p.description || '',
    image: p.image || (Array.isArray(p.images) ? p.images[0] : '') || '',
    images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
    price: Number(p.price || 0),
    originalPrice: Number(p.original_price || 0) || null,
    discount: Number(p.discount || 0) || null,
    rating: Number(p.rating || 0) || null,
    reviews: Number(p.reviews || 0) || null,
    tag: p.tag || '',
    category: (p.category || '').toLowerCase(),
    freeDelivery: Boolean(p.free_delivery),
    isClothing,
    sizes: sizes.map((s) => ({ size: s.size, stock: Number(s.stock || 0) })),
    stock: Number(p.stock || 0),
    availableStock: totalStock,
    isOutOfStock: totalStock <= 0,
    status: p.status || 'active',
  };
}

export async function fetchProducts(force = false) {
  if (!force && cache && Date.now() - cacheAt < TTL_MS) return cache;
  try {
    const { data } = await api.get('/public/products');
    const list = (data?.data?.products || data?.products || []).map(normalise);
    cache = list;
    cacheAt = Date.now();
    return list;
  } catch {
    return cache || [];
  }
}

export async function fetchProductById(id) {
  if (!id) return null;
  // Try the cache first for the common navigation case (click product in list).
  const c = cache?.find((p) => String(p.id) === String(id));
  if (c) return c;
  try {
    const { data } = await api.get(`/public/products/${id}`);
    return normalise(data?.data?.product || data?.product);
  } catch {
    return null;
  }
}

export async function fetchSimilarProducts(product, limit = 8) {
  const list = await fetchProducts();
  return list
    .filter((p) => String(p.id) !== String(product.id) && p.category === product.category)
    .slice(0, limit);
}

// Legacy sync exports — kept for any remaining importers but now just
// return an empty list. Components should migrate to the fetch* variants.
const allProducts = [];
export const trendingProducts = [];
export function getProductById() { return null; }
export function getSimilarProducts() { return []; }
export default allProducts;
