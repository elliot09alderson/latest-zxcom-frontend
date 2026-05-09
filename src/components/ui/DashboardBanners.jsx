import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Megaphone, Trophy, Calendar, Clock } from 'lucide-react';
import useFetch from '../../hooks/useFetch';

function fmt(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ContestSlide({ item }) {
  const isScheduled = item.status === 'draft';
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-5 sm:p-6 bg-gradient-to-br from-[#1a0a2e] via-[#16082a] to-[#0d0518]">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-600/20 blur-2xl" />
      <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-crimson-600/20 blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
            isScheduled
              ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
              : 'bg-green-500/20 text-green-300 border border-green-400/30'
          }`}>
            {isScheduled ? 'Upcoming' : 'Live Now'}
          </span>
        </div>
        <h3 className="text-white font-bold text-[17px] sm:text-[19px] leading-snug">{item.title}</h3>
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[12px] text-white/60">
            <Calendar className="h-3.5 w-3.5" />
            <span>{fmt(item.start_date)} → {fmt(item.end_date)}</span>
          </div>
          {item.prize_amount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-yellow-300 font-semibold">
                ₹{item.prize_amount.toLocaleString('en-IN')} prize pool
              </span>
              {item.num_winners > 1 && (
                <span className="text-[11px] text-white/40">· {item.num_winners} winners</span>
              )}
            </div>
          )}
        </div>
        {isScheduled && (
          <div className="flex items-center gap-1 text-[11px] text-blue-300/70 shrink-0">
            <Clock className="h-3 w-3" />
            <span>Starts {fmt(item.start_date)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardBanners({ endpoint }) {
  const { data, loading } = useFetch(endpoint);
  const banners = data?.banners || [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (loading || banners.length === 0) return null;

  const current = banners[index];

  const slideContent = current.type === 'contest' ? (
    <ContestSlide item={current} />
  ) : (
    <div className="relative w-full h-full">
      <img
        src={current.image_url}
        alt={current.title || 'Announcement'}
        className="w-full h-full object-cover"
        draggable={false}
      />
      {(current.title || current.caption) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-3.5 h-3.5 text-[#e94560]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#e94560]">Announcement</span>
          </div>
          {current.title && (
            <p className="text-sm sm:text-base font-bold text-white leading-snug">{current.title}</p>
          )}
          {current.caption && (
            <p className="text-[11px] sm:text-xs text-white/70 mt-0.5 line-clamp-2">{current.caption}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] mb-6 group"
    >
      <div className="relative h-40 sm:h-48 w-full bg-black/30">
        <AnimatePresence mode="wait">
          <motion.div
            key={current._id || index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            {current.type !== 'contest' && current.link_url ? (
              <a href={current.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                {slideContent}
              </a>
            ) : (
              slideContent
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === index ? 'w-5 bg-[#e94560]' : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
