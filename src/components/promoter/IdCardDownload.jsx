import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function IdCardDownload() {
  const { user } = useAuth();
  const { data, loading } = useFetch('/promoters/id-card');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef(null);

  const rawUrl = data?.id_card_url || '';
  const cardUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${API_BASE}${rawUrl}`) : '';
  const isHtml = rawUrl.endsWith('.html');

  const cardData = data?.card || {};
  const employeeId = cardData.employee_id || user?.employee_id || '';
  const name = cardData.name || user?.name || '';
  const phone = cardData.phone || user?.phone || '';
  const address = cardData.address || user?.address || '';
  const avatarUrl = cardData.avatar_url
    ? (cardData.avatar_url.startsWith('http') ? cardData.avatar_url : `${API_BASE}${cardData.avatar_url}`)
    : '';
  const rank = cardData.rank || 'promoter';

  const handleDownload = () => {
    if (!cardUrl) {
      toast.error('ID card not available for download');
      return;
    }
    window.open(cardUrl, '_blank');
    toast.success('Opening ID card...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <GlassCard className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-[#e94560]/15 border border-[#e94560]/20">
          <Briefcase className="w-6 h-6 text-[#e94560]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Promoter ID Card</h3>
          <p className="text-xs text-white/40">Your official X-Flex identification</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        {/* Rendered card preview using HTML iframe */}
        {cardUrl && isHtml ? (
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            {!iframeLoaded && (
              <div className="flex items-center justify-center py-20">
                <Spinner size="md" />
              </div>
            )}
            <div className="relative w-full" style={{ paddingBottom: '140%' }}>
              <iframe
                ref={iframeRef}
                src={cardUrl}
                title="Promoter ID Card"
                onLoad={() => setIframeLoaded(true)}
                className={`absolute inset-0 w-full h-full border-0 rounded-2xl ${iframeLoaded ? 'block' : 'hidden'}`}
                style={{ pointerEvents: 'none' }}
              />
            </div>
          </div>
        ) : cardUrl ? (
          /* Image-based card */
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5">
            <img
              src={cardUrl}
              alt="Promoter ID Card"
              className="w-full object-contain"
            />
          </div>
        ) : (
          /* Fallback visual card built from data */
          <div className="bg-gradient-to-br from-[#0f0f2e] to-[#1a1a3e] rounded-2xl border border-white/10 p-4 sm:p-6 space-y-4">
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h4 className="text-lg font-bold text-[#e94560]">X-Flex Pvt Ltd</h4>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Promoter ID Card</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-white/50">
                    {(name || 'P').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Card body */}
            <div className="space-y-3">
              {employeeId && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Employee ID</p>
                  <p className="text-base font-bold text-white tracking-wider">{employeeId}</p>
                </div>
              )}
              {name && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Name</p>
                  <p className="text-sm font-medium text-white/80">{name}</p>
                </div>
              )}
              {phone && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Contact</p>
                  <p className="text-sm font-medium text-white/80">{phone}</p>
                </div>
              )}
              {address && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Address</p>
                  <p className="text-sm font-medium text-white/80">{address}</p>
                </div>
              )}
            </div>

            {/* Badge */}
            <div className="text-center pt-2">
              <span className="inline-block bg-gradient-to-r from-[#e94560] to-[#c23616] px-5 py-1.5 rounded-full text-[11px] font-bold text-white tracking-wider uppercase">
                {rank === 'area_manager' ? 'Area Manager' : 'Promoter'}
              </span>
            </div>
          </div>
        )}

        {cardUrl && (
          <Button fullWidth icon={Download} onClick={handleDownload}>
            Download ID Card
          </Button>
        )}
      </motion.div>
    </GlassCard>
  );
}
