import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../config/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function HeroBanner() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await api.get('/public/banners');
        setBanners(data.data?.banners || data.banners || []);
      } catch {
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-rotate
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [banners.length, next]);

  // No banners configured yet — render nothing rather than a giant placeholder.
  if (loading || banners.length === 0) return null;

  const banner = banners[current];

  return (
    <section className="relative w-full h-[70vh] min-h-[400px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {banner.image_url || banner.banner_image_url ? (
            <img
              src={(() => { const url = banner.image_url || banner.banner_image_url; return url?.startsWith('http') ? url : `${API_BASE}${url}`; })()}
              alt={banner.title || 'Banner'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#e94560]/30 via-[#0a0a1a] to-[#1a1a2e]" />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/60 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex items-end pb-20 px-6 md:px-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="max-w-2xl"
            >
              {banner.title && (
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
                  {banner.title}
                </h2>
              )}
              {banner.description && (
                <p className="text-white/60 text-base md:text-lg max-w-lg">
                  {banner.description}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer
                ${idx === current
                  ? 'bg-[#e94560] w-8'
                  : 'bg-white/30 hover:bg-white/50'
                }
              `}
            />
          ))}
        </div>
      )}
    </section>
  );
}
