import { motion } from 'framer-motion';
import { Users, Store, Shield, Target, TrendingUp } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import GlassCard from '../ui/GlassCard';
import ProgressBar from '../ui/ProgressBar';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';

export default function AreaManagerProgress() {
  const { data, loading } = useFetch('/promoters/area-manager-progress');

  const progress = data || {};
  const promoters = progress.promoters || { current: 0, required: 0 };
  const shops = progress.shops || { current: 0, required: 0 };
  const rank = progress.rank || progress.current_rank || 'promoter';
  const isAreaManager = rank === 'area_manager';

  const promoterPct = promoters.required > 0
    ? Math.min(Math.round((promoters.current / promoters.required) * 100), 100)
    : 0;
  const shopPct = shops.required > 0
    ? Math.min(Math.round((shops.current / shops.required) * 100), 100)
    : 0;
  const overallPct = Math.round((promoterPct + shopPct) / 2);

  const promotersNeeded = Math.max(0, (promoters.required || 0) - (promoters.current || 0));
  const shopsNeeded = Math.max(0, (shops.required || 0) - (shops.current || 0));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#e94560]/15 border border-[#e94560]/20">
            <Target className="w-5 h-5 text-[#e94560]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Area Manager Progress</h3>
            <p className="text-xs text-white/40">Track your path to promotion</p>
          </div>
        </div>

        {isAreaManager && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/20">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">Area Manager</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Overall percentage */}
      {!isAreaManager && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-[#e94560]/20 mb-3 relative">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="rgba(233,69,96,0.1)"
                strokeWidth="8"
              />
              <motion.circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="#e94560"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - overallPct / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <span className="text-2xl font-extrabold text-white">{overallPct}%</span>
          </div>
          <p className="text-sm text-white/50">Overall Progress</p>
        </motion.div>
      )}

      {/* Progress bars */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/15">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <ProgressBar
              current={promoters.current}
              total={promoters.required}
              label="Promoters"
              color="#3b82f6"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/15">
            <Store className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <ProgressBar
              current={shops.current}
              total={shops.required}
              label="Shops"
              color="#10b981"
            />
          </div>
        </div>
      </div>

      {/* Motivational text */}
      {!isAreaManager && (promotersNeeded > 0 || shopsNeeded > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-5 pt-5 border-t border-white/5"
        >
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-[#e94560] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-white/50">
              Keep going! You need{' '}
              {promotersNeeded > 0 && (
                <span className="text-white/70 font-medium">
                  {promotersNeeded} more promoter{promotersNeeded !== 1 ? 's' : ''}
                </span>
              )}
              {promotersNeeded > 0 && shopsNeeded > 0 && ' and '}
              {shopsNeeded > 0 && (
                <span className="text-white/70 font-medium">
                  {shopsNeeded} more shop{shopsNeeded !== 1 ? 's' : ''}
                </span>
              )}
              {' '}to become an Area Manager.
            </p>
          </div>
        </motion.div>
      )}

      {isAreaManager && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 pt-5 border-t border-white/5 text-center"
        >
          <p className="text-sm text-emerald-400/80">
            Congratulations! You have achieved Area Manager rank.
          </p>
        </motion.div>
      )}
    </GlassCard>
  );
}
