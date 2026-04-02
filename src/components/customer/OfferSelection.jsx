import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Calendar, ChevronLeft } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function OfferSelection({ offers, onSelect, onBack, loading }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleSubmit = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      <GlassCard className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-white/60" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-white">Choose an Offer</h2>
          </div>
          <span className="text-xs font-medium text-white/40 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            Step 2 of 2
          </span>
        </div>

        <p className="text-sm text-white/50 mb-5">
          Select one offer to enter the lucky draw
        </p>

        {/* Offer cards grid */}
        <div className="space-y-3">
          {offers.map((offer, index) => {
            const isSelected = selectedId === offer._id;
            return (
              <motion.div
                key={offer._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                onClick={() => setSelectedId(offer._id)}
                className={`
                  relative p-4 rounded-xl border-2 cursor-pointer
                  transition-all duration-200
                  ${isSelected
                    ? 'border-[#e94560] bg-[#e94560]/10 shadow-lg shadow-[#e94560]/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                  }
                `}
              >
                {/* Selection indicator */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      transition-all duration-200
                      ${isSelected
                        ? 'border-[#e94560] bg-[#e94560]'
                        : 'border-white/20 bg-transparent'
                      }
                    `}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-white"
                      />
                    )}
                  </div>
                </div>

                {/* Offer content */}
                <div className="pr-8">
                  <h3 className="text-base font-semibold text-white mb-1">
                    {offer.title}
                  </h3>

                  {offer.description && (
                    <p className="text-sm text-white/50 mb-3 line-clamp-2">
                      {offer.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Prize value */}
                    {offer.prize_value && (
                      <div className="flex items-center gap-1.5 text-[#e94560]">
                        <Gift className="w-4 h-4" />
                        <span className="text-sm font-bold">
                          {typeof offer.prize_value === 'number'
                            ? `₹${offer.prize_value.toLocaleString('en-IN')}`
                            : offer.prize_value}
                        </span>
                      </div>
                    )}

                    {/* Date range */}
                    {(offer.start_date || offer.end_date) && (
                      <div className="flex items-center gap-1.5 text-white/40">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">
                          {formatDate(offer.start_date)}
                          {offer.end_date && ` - ${formatDate(offer.end_date)}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Submit button */}
        <Button
          size="lg"
          fullWidth
          loading={loading}
          disabled={!selectedId}
          onClick={handleSubmit}
          icon={Gift}
          className="mt-6"
        >
          Claim Your Entry
        </Button>
      </GlassCard>
    </div>
  );
}
