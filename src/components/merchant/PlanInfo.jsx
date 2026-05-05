import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Gem, QrCode, Printer, Download, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import useFetch from '../../hooks/useFetch';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const fullUrl = (url) => url ? (url.startsWith('http') ? url : `${API_BASE}${url}`) : '';

const planDetails = {
  basic: { icon: Crown, color: '#3b82f6', price: '₹1,000/month' },
  premium: { icon: Gem, color: '#e94560', price: '₹2,500/month' },
};

export default function PlanInfo() {
  const { data, loading, error } = useFetch('/merchants/profile');
  const [downloading, setDownloading] = useState(false);

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
  const isActive = profile.status === 'active';

  // QR code from populated assigned_qr_code_id
  const qrData = profile.assigned_qr_code_id || {};
  const qrImageUrl = fullUrl(qrData.qr_image_url || '');
  const qrCode = qrData.code || '';

  const handleDownloadCard = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/merchants/qr-card', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const slug = (profile.shop_name || 'merchant').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      link.download = `zxcom-card-${slug}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download card');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintQR = () => {
    if (!qrImageUrl) { toast.error('QR not available'); return; }
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>QR - ${profile.shop_name || ''}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
        .card { width: 380px; background: #fff; border-radius: 16px; border: 1px solid #e0e0e0; overflow: hidden; }
        .card-top { background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460); padding: 28px 24px 36px; text-align: center; position: relative; }
        .card-top::after { content: ''; position: absolute; bottom: -24px; left: 0; right: 0; height: 48px; background: #fff; border-radius: 50% 50% 0 0; }
        .company { font-size: 22px; font-weight: 800; letter-spacing: 4px; color: #e94560; }
        .subtitle { font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,0.5); margin-top: 4px; }
        .body { padding: 10px 28px 20px; text-align: center; position: relative; z-index: 2; }
        .shop { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; letter-spacing: 0.3px; }
        .qr { display: inline-block; padding: 12px; border: 1px solid #f0f0f0; border-radius: 12px; }
        .qr img { width: 220px; height: 220px; display: block; }
        .code { font-family: 'Menlo', monospace; font-size: 12px; color: #e94560; letter-spacing: 2px; margin-top: 12px; font-weight: 600; }
        .footer { text-align: center; padding: 10px; background: linear-gradient(135deg, #e94560, #c23616); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; }
        @media print { body { background: #fff; } .card { border: none; box-shadow: none; } }
      </style></head><body>
      <div class="card">
        <div class="card-top"><div class="company">ZXCOM</div><div class="subtitle">MERCHANT QR CARD</div></div>
        <div class="body">
          <p class="shop">${profile.shop_name || ''}</p>
          <div class="qr"><img src="${qrImageUrl}" /></div>
          ${qrCode ? `<p class="code">${qrCode}</p>` : ''}
        </div>
        <div class="footer">zxcom.in</div>
      </div></body></html>
    `);
    win.document.close();
    win.onload = () => { win.print(); };
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
          <p className="text-sm font-semibold text-white">₹{profile.plan_price || '--'}</p>
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

        <div className="space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wider">Submissions</p>
          <p className="text-sm font-semibold text-white">{profile.current_month_submissions ?? 0} / {profile.monthly_submission_cap ?? 0}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-white/40 uppercase tracking-wider">Payment</p>
          <Badge text={profile.payment_status || 'pending'} variant={profile.payment_status === 'paid' ? 'success' : 'warning'} />
        </div>
      </div>

      {/* QR Code — styled like an ID card with ZXCOM header + zxcom.in footer */}
      {qrImageUrl ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-t border-white/10 pt-6 space-y-5"
        >
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#e94560]" />
            <p className="text-sm font-medium text-white/70">Shop QR Card</p>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-xl mx-auto max-w-[380px]">
            {/* Top band */}
            <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] pt-7 pb-9 text-center relative">
              <h4 className="text-xl font-extrabold tracking-[4px] text-[#e94560]">ZXCOM</h4>
              <p className="text-[10px] tracking-[3px] text-white/40 mt-1 uppercase">Merchant QR Card</p>
              <div className="absolute -bottom-6 left-0 right-0 h-12 bg-white rounded-t-[50%]" />
            </div>

            {/* QR body */}
            <div className="relative z-10 px-7 pt-2 pb-5 text-center">
              <p className="text-[15px] font-bold text-gray-800 mb-3 truncate" title={profile.shop_name}>
                {profile.shop_name || ''}
              </p>
              <div className="inline-block p-3 border border-gray-100 rounded-xl">
                <img
                  src={qrImageUrl}
                  alt="Merchant QR Code"
                  className="w-48 h-48 object-contain block"
                />
              </div>
              {qrCode && (
                <p className="text-[11px] font-mono tracking-[2px] text-[#e94560] font-semibold mt-3">
                  {qrCode}
                </p>
              )}
            </div>

            {/* Footer band */}
            <div className="py-2.5 bg-gradient-to-r from-[#e94560] to-[#c23616] text-center">
              <p className="text-[11px] font-bold tracking-[3px] text-white uppercase">zxcom.in</p>
            </div>
          </div>

          <div className="flex justify-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              loading={downloading}
              onClick={handleDownloadCard}
            >
              Download
            </Button>
            <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrintQR}>
              Print
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="border-t border-white/10 pt-6 text-center">
          <QrCode className="w-8 h-8 text-white/10 mx-auto mb-2" />
          <p className="text-xs text-white/30">No QR code assigned yet</p>
        </div>
      )}
    </GlassCard>
  );
}
