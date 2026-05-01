import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Receipt, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';

/**
 * Lists every subscription payment the merchant has made (initial onboarding
 * + every renewal) with a Download button per row. Each download streams a
 * branded PDF tax invoice from /api/merchants/subscription-bill/:entryId.
 */
export default function SubscriptionBillsCard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const cycleLabel = (days) => {
    const d = Number(days) || 30;
    if (d >= 360) return 'Yearly';
    if (d >= 175 && d <= 200) return 'Half-year';
    if (d >= 85 && d <= 95) return 'Quarterly';
    if (d === 30) return 'Monthly';
    return `${d} days`;
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/merchants/profile');
      const merchant = res?.data?.merchant || res?.merchant;
      const list = merchant?.renewal_history || [];
      // Most-recent-first.
      setHistory([...list].reverse());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDownload = async (entry) => {
    setDownloadingId(entry._id);
    try {
      const res = await api.get(`/merchants/subscription-bill/${entry._id}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = entry.paid_at ? new Date(entry.paid_at).toISOString().slice(0, 10) : 'bill';
      link.download = `zxcom-bill-${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Bill downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download bill');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center justify-center min-h-[140px]">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-500/15">
            <Receipt className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Subscription Bills</h3>
            <p className="text-[11px] text-white/40">
              Tax invoices for every plan payment — onboarding + renewals
            </p>
          </div>
        </div>
        <Badge text={`${history.length} bill${history.length === 1 ? '' : 's'}`} variant="default" />
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-10 h-10 text-white/10 mx-auto mb-2" />
          <p className="text-xs text-white/40">No subscription bills yet.</p>
          <p className="text-[10px] text-white/30 mt-1">
            Bills appear here after each successful payment.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/5">
                <th className="py-2 px-2 font-medium">Date</th>
                <th className="py-2 px-2 font-medium">Plan</th>
                <th className="py-2 px-2 font-medium">Period</th>
                <th className="py-2 px-2 font-medium">Mode</th>
                <th className="py-2 px-2 font-medium text-right">Amount</th>
                <th className="py-2 px-2 font-medium text-right">Bill</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry._id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 px-2 text-white/80">{fmt(entry.paid_at)}</td>
                  <td className="py-3 px-2">
                    <p className="text-white font-medium truncate max-w-[160px]" title={entry.pack_name}>
                      {entry.pack_name || '—'}
                    </p>
                    {entry.duration_days && (
                      <p className="text-[10px] text-white/40">{cycleLabel(entry.duration_days)}</p>
                    )}
                  </td>
                  <td className="py-3 px-2 text-white/60">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-white/30" />
                      <span className="text-[10px]">
                        {fmt(entry.period_start)}
                        {entry.period_end ? ` → ${fmt(entry.period_end)}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Badge
                      text={entry.payment_mode === 'offline' ? 'Offline' : 'Online'}
                      variant={entry.payment_mode === 'offline' ? 'warning' : 'success'}
                    />
                  </td>
                  <td className="py-3 px-2 text-right text-white font-semibold">
                    ₹{Number(entry.amount || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Download}
                      loading={downloadingId === entry._id}
                      onClick={() => handleDownload(entry)}
                    >
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
