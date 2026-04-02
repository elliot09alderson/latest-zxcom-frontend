import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Gem, Check, ArrowRight, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const plans = [
  {
    type: 'basic',
    name: 'Basic Plan',
    price: '₹1,000',
    period: '/month',
    icon: Crown,
    color: '#3b82f6',
    features: [
      '100 submissions per month',
      'Customer tracking dashboard',
      'Basic analytics & reports',
      'QR code for your shop',
      'Email support',
    ],
  },
  {
    type: 'premium',
    name: 'Premium Plan',
    price: '₹2,500',
    period: '/month',
    icon: Gem,
    color: '#e94560',
    recommended: true,
    features: [
      'Unlimited submissions',
      'Priority customer tracking',
      'Advanced analytics & insights',
      'Custom QR code branding',
      'Winner highlights on dashboard',
      'Priority support 24/7',
    ],
  },
];

export default function PlanSelector({ onSelect, loading }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
        <p className="text-white/50 text-sm">Select a plan that fits your business needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan, idx) => {
          const isSelected = selected === plan.type;
          const Icon = plan.icon;

          return (
            <motion.div
              key={plan.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(plan.type)}
              className={`
                relative cursor-pointer rounded-2xl p-6
                bg-white/5 backdrop-blur-xl border-2 transition-all duration-300
                shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                ${isSelected
                  ? `border-[${plan.color}] shadow-[0_0_30px_${plan.color}30]`
                  : 'border-white/10 hover:border-white/20'
                }
              `}
              style={isSelected ? {
                borderColor: plan.color,
                boxShadow: `0 0 30px ${plan.color}30, 0 8px 32px rgba(0,0,0,0.4)`,
              } : undefined}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#e94560] to-[#c23616] text-white shadow-lg shadow-[#e94560]/30">
                    <Sparkles className="w-3 h-3" />
                    RECOMMENDED
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-5 mt-1">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${plan.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: plan.color }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-sm text-white/40">{plan.period}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5">
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${plan.color}20` }}
                    >
                      <Check className="w-3 h-3" style={{ color: plan.color }} />
                    </div>
                    <span className="text-sm text-white/70">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Selection indicator */}
              <div
                className={`
                  w-full py-2.5 rounded-xl text-center text-sm font-medium transition-all duration-300
                  ${isSelected
                    ? 'text-white'
                    : 'bg-white/5 text-white/40 border border-white/10'
                  }
                `}
                style={isSelected ? {
                  background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                  boxShadow: `0 4px 15px ${plan.color}30`,
                } : undefined}
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
          onClick={() => onSelect(selected)}
        >
          Proceed to Payment
        </Button>
      </motion.div>
    </div>
  );
}
