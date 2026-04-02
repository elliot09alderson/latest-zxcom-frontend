import { motion } from 'framer-motion';
import { Trophy, Calendar, Award } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import GlassCard from '../ui/GlassCard';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

export default function MerchantWinners() {
  const { data, loading, error } = useFetch('/merchants/winners');

  if (loading) {
    return (
      <GlassCard className="p-6 flex items-center justify-center min-h-[200px]">
        <Spinner size="lg" />
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-red-400 text-center">{error}</p>
      </GlassCard>
    );
  }

  const winners = data?.winners || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">Winners</h3>
        {winners.length > 0 && (
          <span className="text-xs text-white/40 ml-auto">{winners.length} winner{winners.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {winners.length === 0 ? (
        <GlassCard className="p-6">
          <EmptyState
            icon={Trophy}
            title="No Winners Yet"
            description="Winners from your contests will be displayed here with their details."
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {winners.map((winner, idx) => (
            <motion.div
              key={winner._id || winner.id || idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="
                bg-white/5 backdrop-blur-xl border border-amber-500/15 rounded-2xl p-5
                shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                hover:border-amber-500/30 hover:shadow-[0_8px_32px_rgba(245,158,11,0.1)]
                transition-all duration-300
              "
            >
              {/* Top accent line */}
              <div className="w-full h-0.5 rounded-full bg-gradient-to-r from-amber-500/60 via-amber-400/40 to-transparent mb-4" />

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 flex-shrink-0">
                  <Award className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {winner.customer_name || winner.name || 'Winner'}
                  </p>
                  <p className="text-xs text-amber-400/80 mt-1 truncate">
                    {winner.contest_name || winner.contest || 'Contest'}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/5">
                <Calendar className="w-3 h-3 text-white/30" />
                <span className="text-xs text-white/40">
                  {winner.date
                    ? new Date(winner.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '--'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
