import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award } from 'lucide-react';
import api from '../../config/api';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function WinnerGallery() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const { data } = await api.get('/public/winners');
        setWinners(data.data?.winners || data.winners || []);
      } catch {
        setWinners([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWinners();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (winners.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="No Winners Yet"
        description="Stay tuned! Winners will be announced here after campaigns end."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {winners.map((winner, i) => (
        <motion.div
          key={winner._id || winner.id || i}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center group hover:border-[#e94560]/30 transition-all duration-300"
        >
          {/* Winner Photo */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#e94560]/50 shadow-lg shadow-[#e94560]/10">
              {winner.photo_url || winner.avatar_url ? (
                <img
                  src={winner.photo_url || winner.avatar_url}
                  alt={winner.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#e94560]/30 to-[#c23616]/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white/60">
                    {winner.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-gradient-to-r from-[#e94560] to-[#c23616]">
              <Trophy className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Winner Info */}
          <h4 className="text-white font-semibold text-sm mb-1 truncate max-w-full">
            {winner.name || 'Winner'}
          </h4>

          {(winner.contest_name || winner.offer_title) && (
            <p className="text-white/40 text-xs mb-2 line-clamp-1">
              {winner.contest_name || winner.offer_title}
            </p>
          )}

          {(winner.prize || winner.prize_description) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e94560]/10 border border-[#e94560]/20">
              <Award className="w-3 h-3 text-[#e94560]" />
              <span className="text-[#e94560] text-xs font-medium">
                {winner.prize || winner.prize_description}
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
