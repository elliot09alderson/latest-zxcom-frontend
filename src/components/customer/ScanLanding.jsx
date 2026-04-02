import { motion } from 'framer-motion';
import { Store, MapPin, UserCheck, CheckCircle } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import CustomerForm from './CustomerForm';

export default function ScanLanding({ merchantInfo, offers, qrData, onFormSubmit, formLoading }) {
  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      {/* Merchant Info Card */}
      <GlassCard className="p-6 sm:p-8 text-center">
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"
        >
          <CheckCircle className="w-7 h-7 text-emerald-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl font-bold text-white mb-1"
        >
          You're at{' '}
          <span className="text-[#e94560]">{merchantInfo.shop_name}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-white/50 mb-5"
        >
          QR verified successfully
        </motion.p>

        {/* Shop details */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col gap-3"
        >
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="p-2 rounded-lg bg-[#e94560]/10">
              <Store className="w-4 h-4 text-[#e94560]" />
            </div>
            <div className="text-left">
              <p className="text-xs text-white/40">Shop</p>
              <p className="text-sm font-medium text-white">{merchantInfo.shop_name}</p>
            </div>
          </div>

          {merchantInfo.owner_name && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <UserCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/40">Owner</p>
                <p className="text-sm font-medium text-white">{merchantInfo.owner_name}</p>
              </div>
            </div>
          )}

          {merchantInfo.area && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MapPin className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/40">Area</p>
                <p className="text-sm font-medium text-white">{merchantInfo.area}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Active offers count */}
        {offers && offers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-4 flex justify-center"
          >
            <Badge
              text={`${offers.length} active offer${offers.length > 1 ? 's' : ''} available`}
              variant="success"
            />
          </motion.div>
        )}
      </GlassCard>

      {/* Customer Form */}
      <CustomerForm onSubmit={onFormSubmit} loading={formLoading} />
    </div>
  );
}
