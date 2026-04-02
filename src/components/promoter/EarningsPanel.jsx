import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, TrendingUp, Info } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import GlassCard from '../ui/GlassCard';
import Spinner from '../ui/Spinner';

function AnimatedCounter({ value, duration = 1.5 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!value || value <= 0) {
      setDisplay(0);
      return;
    }

    let start = 0;
    const increment = value / (duration * 60);
    let raf;

    const step = () => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        return;
      }
      setDisplay(Math.floor(start));
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span>
      {display.toLocaleString('en-IN')}
    </span>
  );
}

export default function EarningsPanel() {
  const { data, loading } = useFetch('/promoters/earnings');

  const totalEarnings = data?.total_earned || 0;
  const commissionRate = data?.commission_rate || null;
  const pendingEarnings = data?.pending || 0;
  const paidEarnings = data?.paid || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main earnings card */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[#e94560]/15 border border-[#e94560]/20">
            <IndianRupee className="w-6 h-6 text-[#e94560]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Total Earnings</h3>
            <p className="text-xs text-white/40">Lifetime commission earnings</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-baseline gap-1 mb-6"
        >
          <span className="text-lg text-white/50">&#8377;</span>
          <span className="text-5xl font-extrabold text-white tracking-tight">
            <AnimatedCounter value={totalEarnings} />
          </span>
        </motion.div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-white/40">Paid</span>
            </div>
            <p className="text-lg font-bold text-emerald-400">
              &#8377;{paidEarnings.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-white/40">Pending</span>
            </div>
            <p className="text-lg font-bold text-amber-400">
              &#8377;{pendingEarnings.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Commission rate */}
        {commissionRate && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-white/30">
              Commission rate: <span className="text-white/60 font-medium">{commissionRate}%</span> per qualifying transaction
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
