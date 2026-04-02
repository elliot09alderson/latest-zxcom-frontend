import { motion } from 'framer-motion';
import { Gift, Calendar } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export default function OfferCard({ offer }) {
  const {
    title,
    description,
    banner_image_url,
    prize_value,
    prize_description,
    start_date,
    end_date,
  } = offer;

  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: '0 16px 48px rgba(233,69,96,0.15)' }}
      transition={{ duration: 0.25 }}
      className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        {banner_image_url ? (
          <img
            src={banner_image_url.startsWith('http') ? banner_image_url : `${API_BASE}${banner_image_url}`}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#e94560]/20 to-[#1a1a2e] flex items-center justify-center">
            <Gift className="w-12 h-12 text-[#e94560]/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] to-transparent opacity-80" />

        {/* Prize Badge */}
        {prize_value && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-[#e94560]/90 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" />
            {prize_value}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="text-white font-semibold text-lg leading-snug line-clamp-2">
          {title}
        </h3>

        {description && (
          <p className="text-white/50 text-sm line-clamp-2">{description}</p>
        )}

        {prize_description && (
          <div className="flex items-start gap-2">
            <Gift className="w-4 h-4 text-[#e94560] mt-0.5 flex-shrink-0" />
            <span className="text-white/60 text-sm">{prize_description}</span>
          </div>
        )}

        {(start_date || end_date) && (
          <div className="flex items-center gap-2 text-white/40 text-xs pt-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {formatDate(start_date)}
              {start_date && end_date && ' - '}
              {formatDate(end_date)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
