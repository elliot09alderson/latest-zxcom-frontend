import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin, CheckCircle } from 'lucide-react';
import api from '../../config/api';
import CustomerForm from './CustomerForm';

export default function ScanLanding({ merchantInfo, qrData, onFormSubmit, formLoading }) {
  const [offerBanner, setOfferBanner] = useState(null);

  useEffect(() => {
    api.get('/public/customer-form-banner').then((res) => {
      setOfferBanner(res.data?.data?.banner || null);
    }).catch(() => {});
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Offer Banner — shown when admin uploads a customer_form banner */}
      {offerBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden border border-[#e94560]/30"
        >
          <img
            src={offerBanner.image_url}
            alt={offerBanner.title || 'Offer'}
            className="w-full object-cover max-h-52"
          />
          {(offerBanner.title || offerBanner.caption) && (
            <div className="bg-[#e94560]/10 px-4 py-3">
              {offerBanner.title && (
                <p className="text-sm font-semibold text-white">{offerBanner.title}</p>
              )}
              {offerBanner.caption && (
                <p className="text-xs text-white/50 mt-0.5">{offerBanner.caption}</p>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Compact merchant banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
      >
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-white truncate">
            {merchantInfo?.shop_name}
          </h1>
          <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
            {merchantInfo?.owner_name && <span>{merchantInfo.owner_name}</span>}
            {merchantInfo?.area && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {merchantInfo.area}{merchantInfo.city ? `, ${merchantInfo.city}` : ''}
              </span>
            )}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-[#e94560]/10 flex-shrink-0">
          <Store className="w-4 h-4 text-[#e94560]" />
        </div>
      </motion.div>

      {/* Customer Form */}
      <CustomerForm onSubmit={onFormSubmit} loading={formLoading} />
    </div>
  );
}
