import { motion } from 'framer-motion';
import { Send, Infinity } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';
import Spinner from '../ui/Spinner';

function getUsageColor(percentage) {
  if (percentage < 50) return '#10b981';
  if (percentage <= 80) return '#f59e0b';
  return '#ef4444';
}

function getPlanBadge(planType) {
  if (planType === 'premium') return { text: 'Premium', variant: 'warning' };
  return { text: 'Basic', variant: 'info' };
}

export default function SubmissionCounter() {
  const { data, loading, error } = useFetch('/merchants/submission-status');

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

  const status = data || {};
  const used = status.used || 0;
  const limit = status.limit || 100;
  const remaining = status.remaining ?? (limit - used);
  const planType = status.plan_type || 'basic';
  const isUnlimited = planType === 'premium' || limit === -1;
  const percentage = isUnlimited ? 0 : (limit > 0 ? (used / limit) * 100 : 0);
  const usageColor = isUnlimited ? '#10b981' : getUsageColor(percentage);
  const badge = getPlanBadge(planType);

  // Circular progress dimensions
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isUnlimited ? 0 : circumference - (percentage / 100) * circumference;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-[#e94560]" />
          <h3 className="text-sm font-semibold text-white">Submissions</h3>
        </div>
        <Badge text={badge.text} variant={badge.variant} />
      </div>

      {isUnlimited ? (
        <div className="text-center py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex p-4 rounded-full bg-emerald-500/10 mb-4"
          >
            <Infinity className="w-10 h-10 text-emerald-400" />
          </motion.div>
          <p className="text-2xl font-bold text-white">{used}</p>
          <p className="text-sm text-white/50 mt-1">submissions this month</p>
          <p className="text-xs text-emerald-400 mt-2">Unlimited plan -- no limits!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Circular progress */}
          <div className="flex justify-center">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
                {/* Background circle */}
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="none"
                  stroke={usageColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  style={{ filter: `drop-shadow(0 0 6px ${usageColor}60)` }}
                />
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-bold text-white"
                >
                  {used}
                </motion.span>
                <span className="text-xs text-white/40">of {limit}</span>
              </div>
            </div>
          </div>

          {/* Bar fallback */}
          <ProgressBar
            current={used}
            total={limit}
            label="Usage"
            color={usageColor}
          />

          {/* Remaining */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-white/40">Remaining</span>
            <span
              className="text-sm font-semibold"
              style={{ color: usageColor }}
            >
              {remaining} left
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
