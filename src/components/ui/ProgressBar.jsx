import { motion } from 'framer-motion';

export default function ProgressBar({
  current = 0,
  total = 100,
  label,
  showPercentage = true,
  color = '#e94560',
  className = '',
}) {
  const pct = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        {label && <span className="text-white/70 font-medium">{label}</span>}
        <span className="text-white/50 ml-auto">
          {current} / {total}
          {showPercentage && (
            <span className="ml-2 text-white/40">({pct}%)</span>
          )}
        </span>
      </div>

      <div className="h-2 rounded-full bg-white/5 border border-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 12px ${color}40`,
          }}
        />
      </div>
    </div>
  );
}
