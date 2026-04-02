import { motion } from 'framer-motion';
import { Crown, Gem, QrCode, Download, CheckCircle, XCircle } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

const planDetails = {
  basic: { icon: Crown, color: '#3b82f6', price: '₹1,000/month' },
  premium: { icon: Gem, color: '#e94560', price: '₹2,500/month' },
};

export default function PlanInfo() {
  const { data, loading, error } = useFetch('/merchants/profile');

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

  const profile = data?.merchant || {};
  const planType = profile.plan_type || 'basic';
  const plan = planDetails[planType] || planDetails.basic;
  const PlanIcon = plan.icon;
  const isActive = profile.status === 'active' || profile.is_active;
  const qrCode = profile.qr_code || profile.qr_code_url;

  const handleDownloadQR = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `xflex-qr-${profile.shop_name || 'merchant'}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <GlassCard className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <PlanIcon className="w-5 h-5" style={{ color: plan.color }} />
        <h3 className="text-lg font-semibold text-white">Plan Information</h3>
      </div>

      {/* Plan details grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wider">Plan Type</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white capitalize">{planType}</span>
            <Badge
              text={planType === 'premium' ? 'Premium' : 'Basic'}
              variant={planType === 'premium' ? 'warning' : 'info'}
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wider">Price</p>
          <p className="text-sm font-semibold text-white">{plan.price}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wider">Status</p>
          <div className="flex items-center gap-1.5">
            {isActive ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Active</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-400">Inactive</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wider">Shop</p>
          <p className="text-sm font-semibold text-white">{profile.shop_name || '--'}</p>
        </div>
      </div>

      {/* QR Code */}
      {qrCode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-t border-white/10 pt-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="w-4 h-4 text-[#e94560]" />
            <p className="text-sm font-medium text-white/70">Your QR Code</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-2xl shadow-lg">
              <img
                src={qrCode}
                alt="Merchant QR Code"
                className="w-48 h-48 object-contain"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handleDownloadQR}
            >
              Download QR Code
            </Button>
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
}
