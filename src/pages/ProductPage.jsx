import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, Check, ChevronRight, Minus, Plus, User, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import PublicLayout from '../components/layout/PublicLayout';
import ProductCard from '../components/ecom/ProductCard';
import { fetchProductById, fetchSimilarProducts } from '../data/products';
import Spinner from '../components/ui/Spinner';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Seo, { SITE_URL, BRAND } from '../components/seo/Seo';

/**
 * Build a schema.org Product JSON-LD block for a single product.
 * Produces rich-result eligibility in Google (price, availability, rating).
 */
function buildProductJsonLd(product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [product.image],
    description: `${product.name} from ${BRAND}. ${product.tag ? product.tag + '. ' : ''}Premium quality at an unbeatable price with free delivery above ₹499.`,
    sku: `ZXCOM-${product.id}`,
    brand: { '@type': 'Brand', name: BRAND },
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: 'INR',
      price: product.price,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: BRAND },
    },
    aggregateRating: product.rating && product.reviews ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };
}

const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

const mockReviews = [
  { id: 1, name: 'Rahul S.', rating: 5, date: '2 weeks ago', comment: 'Amazing quality! The fabric is so soft and the print is perfect. Will buy again.', size: 'L' },
  { id: 2, name: 'Priya M.', rating: 4, date: '1 month ago', comment: 'Good fit and comfortable for daily wear. Delivery was fast too.', size: 'M' },
  { id: 3, name: 'Amit K.', rating: 5, date: '3 weeks ago', comment: 'Excellent product for the price. The ZXCOM branding looks premium.', size: 'XL' },
  { id: 4, name: 'Sneha R.', rating: 4, date: '1 month ago', comment: 'Nice material, true to size. Washed twice and no fading at all.', size: 'S' },
  { id: 5, name: 'Vikram D.', rating: 5, date: '2 months ago', comment: 'Best t-shirt I have purchased online. Color is exactly as shown.', size: 'L' },
];

// ── Product Image Carousel (auto-slide every 3s, pause on hover) ──
function ImageCarousel({ images, image, name }) {
  const slides = (images && images.length > 0) ? images : (image ? [image] : []);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  const next = useCallback(() => setIdx(i => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIdx(i => (i - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    timer.current = setInterval(next, 3000);
    return () => clearInterval(timer.current);
  }, [next, paused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 aspect-[3/4] group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={slides[idx]}
          alt={`${name} ${idx + 1}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.35 }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>

      {slides.length > 1 && (
        <>
          {/* Prev / Next arrows */}
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  i === idx ? 'bg-white scale-125' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Star Rating Display ──
function StarRating({ rating, size = 'sm' }) {
  const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${s} ${star <= rating ? 'text-yellow-400' : 'text-white/10'}`}
          fill={star <= rating ? '#facc15' : 'none'}
        />
      ))}
    </div>
  );
}

// ── Review Card ──
function ReviewCard({ review }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e94560]/30 to-[#c23616]/20 flex items-center justify-center">
            <User className="w-4 h-4 text-white/50" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{review.name}</p>
            <p className="text-white/30 text-[10px]">{review.date} • Size: {review.size}</p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>
      <p className="text-white/60 text-sm leading-relaxed">{review.comment}</p>
    </div>
  );
}

// ── Main Page ──
export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, isInCart, items, updateQty } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [selectedSize, setSelectedSize] = useState('');

  // Fetch + scroll-to-top on product change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const p = await fetchProductById(id);
      if (cancelled) return;
      setProduct(p);
      if (p) {
        const sim = await fetchSimilarProducts(p);
        if (!cancelled) setSimilar(sim);
        // Auto-pick the first in-stock size for clothing.
        if (p.isClothing && p.sizes?.length) {
          const firstInStock = p.sizes.find((s) => s.stock > 0);
          setSelectedSize(firstInStock?.size || p.sizes[0].size);
        }
      }
      setLoading(false);
    })();
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center py-32"><Spinner size="lg" /></div>
      </PublicLayout>
    );
  }

  if (!product) {
    return (
      <PublicLayout>
        <Seo
          title="Product Not Found"
          description="The product you're looking for doesn't exist or has been removed."
          path={`/product/${id || ''}`}
          noindex
        />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <h1 className="text-white text-2xl font-bold mb-3">Product Not Found</h1>
          <p className="text-white/40 text-sm mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Link to="/" className="px-6 py-2.5 rounded-xl bg-[#e94560] text-white text-sm font-semibold hover:bg-[#d63d56] transition-colors">
            Back to Home
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const liked = isWishlisted(product.id);
  const inCart = isInCart(product.id);
  const cartItem = items.find((i) => i.id === product.id);
  const avgRating = product.rating || 4.3;
  const reviewCount = product.reviews || mockReviews.length;

  // Stock for the currently selected size (clothing) or global (non-clothing).
  const sizeStockMap = product.isClothing
    ? Object.fromEntries((product.sizes || []).map((s) => [s.size, s.stock]))
    : {};
  const availableHere = product.isClothing
    ? (sizeStockMap[selectedSize] || 0)
    : product.availableStock;
  const outOfStock = availableHere <= 0;

  const handleAddToCart = () => {
    if (outOfStock) {
      toast.error('Out of stock');
      return;
    }
    if (product.isClothing && !selectedSize) {
      toast.error('Please choose a size');
      return;
    }
    addToCart({ ...product, size: selectedSize || undefined, maxStock: availableHere });
    toast.success('Added to cart');
  };

  const handleWishlist = () => {
    toggleWishlist(product);
    toast.success(liked ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const productDescription =
    `Buy ${product.name} online at ZXCOM for ₹${product.price} ` +
    `(MRP ₹${product.originalPrice}, ${product.discount}% off). ` +
    `Rated ${avgRating}★ by ${reviewCount}+ customers. ` +
    `${product.freeDelivery ? 'Free delivery' : 'Fast delivery'} and easy 7-day returns.`;

  return (
    <PublicLayout>
      <Seo
        title={product.name}
        description={productDescription}
        image={product.image}
        path={`/product/${product.id}`}
        type="product"
        jsonLd={buildProductJsonLd(product)}
      />

      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 md:px-16 pt-6">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="capitalize">{product.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60 truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* Product Section */}
      <section className="px-4 sm:px-6 md:px-16 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Image Carousel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-[45%] flex-shrink-0"
          >
            <ImageCarousel images={product.images} image={product.image} name={product.name} />

            {/* Wishlist button below image on mobile */}
            <button
              onClick={handleWishlist}
              className={`mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold transition-all cursor-pointer lg:hidden ${
                liked ? 'bg-[#e94560]/10 border-[#e94560]/30 text-[#e94560]' : 'bg-white/5 border-white/10 text-white/70'
              }`}
            >
              <Heart className="w-5 h-5" fill={liked ? '#e94560' : 'none'} />
              {liked ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 space-y-5"
          >
            {/* Title */}
            <div>
              <h1 className="text-white text-2xl sm:text-3xl font-bold leading-tight">{product.name}</h1>
              <p className="text-white/40 text-sm mt-1 capitalize">{product.category} • ZXCOM Official</p>
            </div>

            {/* Rating Summary */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/20">
                <Star className="w-4 h-4 text-green-400" fill="#4ade80" />
                <span className="text-green-400 font-bold">{avgRating}</span>
              </div>
              <StarRating rating={Math.round(avgRating)} size="md" />
              <span className="text-white/40 text-sm">{reviewCount.toLocaleString()} ratings</span>
            </div>

            {/* Price */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-baseline gap-3">
                <span className="text-white text-3xl font-bold">₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-white/30 text-lg line-through">₹{product.originalPrice}</span>
                )}
                {product.discount && (
                  <span className="px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 text-sm font-bold">
                    {product.discount}% OFF
                  </span>
                )}
              </div>
              {product.originalPrice && (
                <p className="text-green-400/60 text-sm mt-1">You save ₹{product.originalPrice - product.price}</p>
              )}
              <p className="text-white/20 text-xs mt-1">Inclusive of all taxes</p>
            </div>

            {/* Size Selector (only for clothing) */}
            {product.isClothing && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">Select Size</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
                    outOfStock ? 'bg-red-500/15 text-red-300 border-red-500/30'
                    : availableHere <= 5 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {outOfStock ? 'Out of stock' : `${availableHere} left${selectedSize ? ` in ${selectedSize}` : ''}`}
                  </span>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {(product.sizes && product.sizes.length ? product.sizes : sizes.map((s) => ({ size: s, stock: 0 }))).map((entry) => {
                    const s = entry.size;
                    const stock = Number(entry.stock || 0);
                    const sizeOut = stock <= 0;
                    const isSelected = selectedSize === s;
                    return (
                      <button
                        key={s}
                        onClick={() => !sizeOut && setSelectedSize(s)}
                        disabled={sizeOut}
                        className={`relative w-14 h-14 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-0 ${
                          sizeOut
                            ? 'bg-white/[0.02] border-white/5 text-white/25 cursor-not-allowed'
                            : isSelected
                              ? 'bg-[#e94560] border-[#e94560] text-white shadow-lg shadow-[#e94560]/20 cursor-pointer'
                              : 'bg-white/5 border-white/10 text-white/80 hover:border-white/30 hover:text-white cursor-pointer'
                        }`}
                        title={sizeOut ? 'Out of stock' : `${stock} in stock`}
                      >
                        <span className={sizeOut ? 'line-through' : ''}>{s}</span>
                        <span className={`text-[9px] font-bold leading-none mt-0.5 ${
                          sizeOut
                            ? 'text-red-400/70'
                            : isSelected
                              ? 'text-white/90'
                              : stock <= 5
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                        }`}>
                          {sizeOut ? 'SOLD OUT' : stock <= 5 ? `${stock} left` : `${stock} in`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Non-clothing stock indicator */}
            {!product.isClothing && (
              <div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  outOfStock ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                  : availableHere <= 5 ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {outOfStock ? 'Out of stock' : availableHere <= 5 ? `Only ${availableHere} left` : `${availableHere} in stock`}
                </span>
              </div>
            )}

            {/* Add to Cart / Quantity */}
            <div className="flex flex-col sm:flex-row gap-3">
              {inCart ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-xl border border-white/10 overflow-hidden">
                    <button onClick={() => updateQty(product.id, (cartItem?.qty || 1) - 1)} className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-6 py-3 text-white font-semibold bg-white/[0.03] min-w-[52px] text-center">{cartItem?.qty || 1}</span>
                    <button
                      onClick={() => {
                        const next = (cartItem?.qty || 1) + 1;
                        if (next > availableHere) {
                          toast.error(`Only ${availableHere} available`);
                          return;
                        }
                        updateQty(product.id, next);
                      }}
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-green-400 text-sm font-medium flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Added{product.isClothing && selectedSize ? ` — Size ${selectedSize}` : ''}
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className={`flex-1 flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-colors text-base ${
                    outOfStock
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-[#e94560] hover:bg-[#d63d56] text-white shadow-lg shadow-[#e94560]/20 cursor-pointer'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {outOfStock ? 'Out of Stock' : `Add to Cart — \u20B9${product.price}`}
                </button>
              )}

              <button
                onClick={handleWishlist}
                className={`hidden lg:flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                  liked ? 'bg-[#e94560]/10 border-[#e94560]/30 text-[#e94560]' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <Heart className="w-5 h-5" fill={liked ? '#e94560' : 'none'} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Free Delivery', desc: 'On orders ₹499+', show: product.freeDelivery },
                { icon: RotateCcw, label: 'Easy Returns', desc: '7-day policy', show: true },
                { icon: Shield, label: 'Genuine Product', desc: '100% authentic', show: true },
              ].filter((b) => b.show).map((badge) => (
                <div key={badge.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <badge.icon className="w-5 h-5 text-[#e94560] mx-auto mb-1.5" />
                  <p className="text-white text-xs font-semibold">{badge.label}</p>
                  <p className="text-white/30 text-[10px]">{badge.desc}</p>
                </div>
              ))}
            </div>

            {/* Product Details */}
            <div className="pt-2">
              <h3 className="text-white font-semibold text-sm mb-3">Product Details</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Brand', value: 'ZXCOM' },
                  { label: 'Material', value: '100% Cotton' },
                  { label: 'Fit', value: 'Regular Fit' },
                  { label: 'Neck', value: 'Round Neck' },
                  { label: 'Sleeve', value: 'Half Sleeve' },
                  { label: 'Pattern', value: 'Printed Logo' },
                  { label: 'Wash Care', value: 'Machine Wash' },
                  { label: 'Country', value: 'India' },
                ].map((d) => (
                  <div key={d.label} className="flex gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-white/30 text-xs">{d.label}:</span>
                    <span className="text-white/70 text-xs font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-white font-semibold text-sm mb-2">Description</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Elevate your everyday style with this premium ZXCOM branded t-shirt. Made from 100% breathable cotton,
                it offers a perfect blend of comfort and durability. The signature ZXCOM logo adds a touch of modern
                streetwear aesthetic. Whether you&apos;re heading out for a casual day or lounging at home, this versatile
                tee is your go-to choice. Available in multiple sizes for the perfect fit.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="px-4 sm:px-6 md:px-16 py-8 border-t border-white/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Ratings & Reviews</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/20">
              <Star className="w-4 h-4 text-green-400" fill="#4ade80" />
              <span className="text-green-400 font-bold">{avgRating}</span>
            </div>
            <span className="text-white/30 text-sm">{reviewCount.toLocaleString()} ratings</span>
          </div>
        </div>

        {/* Rating Bars */}
        <div className="flex flex-col sm:flex-row gap-8 mb-8">
          <div className="space-y-2 sm:w-64">
            {[5, 4, 3, 2, 1].map((star) => {
              const pct = star === 5 ? 62 : star === 4 ? 25 : star === 3 ? 8 : star === 2 ? 3 : 2;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-white/50 text-xs w-3">{star}</span>
                  <Star className="w-3 h-3 text-yellow-400" fill="#facc15" />
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-white/30 text-[10px] w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-5xl font-bold text-white">{avgRating}</p>
            <StarRating rating={Math.round(avgRating)} size="md" />
            <p className="text-white/30 text-sm mt-1">{reviewCount.toLocaleString()} verified ratings</p>
          </div>
        </div>

        {/* Review Cards */}
        <div className="space-y-3">
          {mockReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </section>

      {/* Similar Products */}
      {similar.length > 0 && (
        <section className="px-4 sm:px-6 md:px-16 py-8 border-t border-white/5">
          <h2 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-6">
            Similar Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
