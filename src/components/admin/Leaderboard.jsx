import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Medal, Store, Users } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import GlassCard from '../ui/GlassCard';
import Spinner from '../ui/Spinner';

const TABS = [
  { key: 'shops', label: 'Top Shops', icon: Store },
  { key: 'promoters', label: 'Top Promoters', icon: Users },
];

const medalColors = {
  0: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  1: { bg: 'bg-gray-400/15', text: 'text-gray-300', border: 'border-gray-400/30' },
  2: { bg: 'bg-orange-700/15', text: 'text-orange-500', border: 'border-orange-700/30' },
};

function RankBadge({ index }) {
  const colors = medalColors[index];

  if (!colors) {
    return (
      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 text-sm font-bold">
        {index + 1}
      </span>
    );
  }

  return (
    <span className={`w-8 h-8 flex items-center justify-center rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
      <Medal className="w-4 h-4" />
    </span>
  );
}

function ShopTable({ shops }) {
  if (!shops?.length) {
    return <p className="text-center py-8 text-white/40 text-sm">No data available</p>;
  }

  return (
    <div className="space-y-2">
      {shops.map((shop, i) => (
        <motion.div
          key={shop._id || shop.id || i}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className={`
            flex items-center gap-4 p-4 rounded-xl
            ${i < 3 ? 'bg-white/[0.06] border border-white/10' : 'bg-white/[0.02]'}
            transition-colors hover:bg-white/[0.08]
          `}
        >
          <RankBadge index={i} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {shop.shop_name || shop.name}
            </p>
            <p className="text-xs text-white/40">{shop.area || '-'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-white">{shop.submissions ?? shop.submission_count ?? 0}</p>
            <p className="text-xs text-white/40">submissions</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function PromoterTable({ promoters }) {
  if (!promoters?.length) {
    return <p className="text-center py-8 text-white/40 text-sm">No data available</p>;
  }

  return (
    <div className="space-y-2">
      {promoters.map((p, i) => (
        <motion.div
          key={p._id || p.id || i}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className={`
            flex items-center gap-4 p-4 rounded-xl
            ${i < 3 ? 'bg-white/[0.06] border border-white/10' : 'bg-white/[0.02]'}
            transition-colors hover:bg-white/[0.08]
          `}
        >
          <RankBadge index={i} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{p.name}</p>
            {p.rank && <p className="text-xs text-white/40 capitalize">{p.rank}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-white">{p.total_shops ?? p.shops_count ?? 0}</p>
            <p className="text-xs text-white/40">shops</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('shops');
  const { data: shopsData, loading: shopsLoading } = useFetch('/admin/leaderboard/shops');
  const { data: promotersData, loading: promotersLoading } = useFetch('/admin/leaderboard/promoters');

  const shops = shopsData?.leaderboard || [];
  const promoters = promotersData?.leaderboard || [];

  const isLoading = activeTab === 'shops' ? shopsLoading : promotersLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-[#e94560]/10">
          <BarChart3 className="w-5 h-5 text-[#e94560]" />
        </div>
        <h2 className="text-xl font-bold text-white">Leaderboard</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200 cursor-pointer
              ${activeTab === tab.key ? 'text-white' : 'text-white/50 hover:text-white/70'}
            `}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="leaderboard-tab"
                className="absolute inset-0 bg-[#e94560]/20 border border-[#e94560]/30 rounded-lg"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              />
            )}
            <tab.icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <GlassCard className="p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'shops' ? (
                <ShopTable shops={shops} />
              ) : (
                <PromoterTable promoters={promoters} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </GlassCard>
    </motion.div>
  );
}
