import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Users } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import ShopList from './ShopList';
import PromoterList from './PromoterList';

const tabs = [
  { key: 'shops', label: 'My Shops', icon: Store },
  { key: 'promoters', label: 'My Promoters', icon: Users },
];

export default function NetworkTabs() {
  const [active, setActive] = useState('shops');

  const { data: shopsData } = useFetch('/promoters/network/shops');
  const { data: promotersData } = useFetch('/promoters/network/promoters');

  const shopCount = shopsData?.total || 0;
  const promoterCount = promotersData?.total || 0;
  const counts = { shops: shopCount, promoters: promoterCount };

  return (
    <div className="space-y-6">
      {/* Tab headers */}
      <div className="relative flex border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`
                relative flex items-center gap-2 px-5 py-3 text-sm font-medium
                transition-colors duration-200 cursor-pointer
                ${isActive ? 'text-[#e94560]' : 'text-white/50 hover:text-white/70'}
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}

              {/* Count badge */}
              {counts[tab.key] > 0 && (
                <span
                  className={`
                    ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                    ${isActive
                      ? 'bg-[#e94560]/15 text-[#e94560]'
                      : 'bg-white/10 text-white/40'}
                  `}
                >
                  {counts[tab.key]}
                </span>
              )}

              {/* Animated underline */}
              {isActive && (
                <motion.div
                  layoutId="network-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e94560] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {active === 'shops' ? <ShopList /> : <PromoterList />}
      </motion.div>
    </div>
  );
}
