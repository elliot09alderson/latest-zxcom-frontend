import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Gem, Check, ArrowRight, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import api from '../../config/api';

const ICONS = [Crown, Gem];
const COLORS = ['#3b82f6', '#e94560'];

export default function PlanSelector({ onSelect, loading }) {
  const [selected, setSelected] = useState(null);
  const [packs, setPacks] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.get('/public/packs')
      .then(({ data }) => {
        const all = data?.data?.packs || data?.packs || [];
        setPacks(all.filter((p) => p.target_type === 'shopkeeper' && p.status === 'active'));
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="text-center py-12 text-white/40 text-sm">
        No plans available right now. Please contact support.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
        <p className="text-white/50 text-sm">Select a plan that fits your business needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packs.map((pack, idx) => {
          const isSelected = selected === pack._id;
          const Icon = ICONS[idx % ICONS.length];
          const color = COLORS[idx % COLORS.length];
          const isRecommended = idx === packs.length - 1 && packs.length > 1;

          return (
            <motion.div
              key={pack._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(pack._id)}
              className={`
                relative cursor-pointer rounded-2xl p-6
                bg-white/5 backdrop-blur-xl border-2 transition-all duration-300
                shadow-[0_8px_32px_rgba(0,0,0,0.4)]
              `}
              style={isSelected ? {
                borderColor: color,
                boxShadow: `0 0 30px ${color}30, 0 8px 32px rgba(0,0,0,0.4)`,
              } : { borderColor: 'rgba(255,255,255,0.1)' }}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#e94560] to-[#c23616] text-white shadow-lg shadow-[#e94560]/30">
                    <Sparkles className="w-3 h-3" />
                    RECOMMENDED
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-5 mt-1">
                <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{pack.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-white">₹{pack.price?.toLocaleString()}</span>
                    <span className="text-sm text-white/40">
                      / {pack.duration_days >= 360 ? 'year' : pack.duration_days >= 175 ? 'half-year' : pack.duration_days >= 85 ? 'quarter' : 'month'}
                    </span>
                  </div>
                </div>
              </div>

              {pack.description && (
                <p className="text-xs text-white/50 mb-4">{pack.description}</p>
              )}

              <div className="space-y-2 mb-6">
                {pack.customer_form_limit >= 999999 ? (
                  <div className="flex items-center gap-2.5">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                      <Check className="w-3 h-3" style={{ color }} />
                    </div>
                    <span className="text-sm text-white/70">Unlimited customer submissions/month</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                      <Check className="w-3 h-3" style={{ color }} />
                    </div>
                    <span className="text-sm text-white/70">{pack.customer_form_limit} customer submissions/month</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <Check className="w-3 h-3" style={{ color }} />
                  </div>
                  <span className="text-sm text-white/70">QR code for your shop</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <Check className="w-3 h-3" style={{ color }} />
                  </div>
                  <span className="text-sm text-white/70">Customer tracking dashboard</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <Check className="w-3 h-3" style={{ color }} />
                  </div>
                  <span className="text-sm text-white/70">Valid for {pack.duration_days} days</span>
                </div>
              </div>

              <div
                className={`w-full py-2.5 rounded-xl text-center text-sm font-medium transition-all duration-300 ${isSelected ? 'text-white' : 'bg-white/5 text-white/40 border border-white/10'}`}
                style={isSelected ? { background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 15px ${color}30` } : undefined}
              >
                {isSelected ? 'Selected' : 'Select Plan'}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: selected ? 1 : 0.4 }}
        className="flex justify-center"
      >
        <Button
          size="lg"
          icon={ArrowRight}
          loading={loading}
          disabled={!selected}
          onClick={() => {
            const pack = packs.find((p) => p._id === selected);
            onSelect(pack);
          }}
        >
          Proceed to Payment
        </Button>
      </motion.div>
    </div>
  );
}
