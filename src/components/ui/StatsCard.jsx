import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color = '#e94560',
}) {
  const trendUp = trend && trend > 0;
  const trendDown = trend && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="
        bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5
        shadow-[0_8px_32px_rgba(0,0,0,0.3)]
      "
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-white/50">{title}</p>
        {Icon && (
          <div
            className="p-2 rounded-xl"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        )}
      </div>

      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>

      {trend !== undefined && trend !== null && (
        <div className="flex items-center gap-1.5 mt-3">
          {trendUp && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
          {trendDown && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
          <span
            className={`text-xs font-medium ${
              trendUp ? 'text-emerald-400' : trendDown ? 'text-red-400' : 'text-white/40'
            }`}
          >
            {trendUp && '+'}
            {trend}%
          </span>
          <span className="text-xs text-white/30">vs last period</span>
        </div>
      )}
    </motion.div>
  );
}
