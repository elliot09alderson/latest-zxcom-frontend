import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, BanknoteArrowUp, History, Clock, CheckCircle2, Landmark, AlertTriangle, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';

/**
 * Merchant wallet card — shows current commission balance from ecom orders,
 * lifetime stats, and lets the merchant request a payout. Appears on the
 * MerchantDashboard above the existing stats grid.
 */
export default function WalletCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [beneficiaryOpen, setBeneficiaryOpen] = useState(false);
  const [benForm, setBenForm] = useState({
    account_holder: '', account_number: '', ifsc: '', upi_vpa: '', pan: '',
  });
  const [savingBen, setSavingBen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadReceipt = async (requestId) => {
    setDownloadingId(requestId);
    try {
      const res = await api.get(`/merchants/payout-receipt/${requestId}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zxcom-payout-receipt.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/merchants/wallet');
      setData(res?.data || res);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openBeneficiary = () => {
    const b = data?.beneficiary || {};
    setBenForm({
      account_holder: b.account_holder || '',
      account_number: b.account_number || '',
      ifsc: b.ifsc || '',
      upi_vpa: b.upi_vpa || '',
      pan: b.pan || '',
    });
    setBeneficiaryOpen(true);
  };

  const updateBenField = (e) => {
    const { name, value } = e.target;
    setBenForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveBeneficiary = async () => {
    setSavingBen(true);
    try {
      await api.put('/merchants/beneficiary', benForm);
      toast.success('Beneficiary saved');
      setBeneficiaryOpen(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save beneficiary');
    } finally {
      setSavingBen(false);
    }
  };

  const handleRequest = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > (data?.available_for_payout || 0)) {
      toast.error('Amount exceeds available balance'); return;
    }
    setSubmitting(true);
    try {
      await api.post('/merchants/wallet/payout-request', { amount: amt });
      toast.success('Payout requested — admin will review shortly');
      setPayoutOpen(false);
      setAmount('');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request payout');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center justify-center min-h-[140px]">
        <Spinner size="md" />
      </div>
    );
  }

  const d = data || {};
  const balance = d.wallet_balance || 0;
  const available = d.available_for_payout || 0;
  const pending = d.pending_payouts || 0;
  const hasBeneficiary = !!d.has_beneficiary;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-[#e94560]/20 bg-gradient-to-br from-[#e94560]/10 via-white/5 to-[#c23616]/5 p-5"
      >
        {/* Decorative glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#e94560]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#e94560]/15">
              <Wallet className="w-5 h-5 text-[#e94560]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Commission Wallet</h3>
              <p className="text-[11px] text-white/40">Earnings from customer purchases on zxcom.in</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="secondary" icon={Landmark} onClick={openBeneficiary}>
              {hasBeneficiary ? 'Bank Details' : 'Add Bank'}
            </Button>
            <Button size="sm" variant="secondary" icon={History} onClick={() => setHistoryOpen(true)}>
              History
            </Button>
            <Button
              size="sm"
              icon={BanknoteArrowUp}
              onClick={() => {
                if (!hasBeneficiary) {
                  toast.error('Save your bank/UPI details first');
                  openBeneficiary();
                  return;
                }
                setPayoutOpen(true);
              }}
              disabled={available <= 0}
            >
              Request Payout
            </Button>
          </div>
        </div>

        {!hasBeneficiary && balance > 0 && (
          <div className="relative mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/90">
              Add your bank account or UPI details to request a payout.
            </p>
          </div>
        )}

        <div className="relative mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Available</p>
            <p className="text-2xl font-bold text-white">₹{available.toFixed(2)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Pending Payout</p>
            </div>
            <p className="text-lg font-semibold text-white">₹{pending.toFixed(2)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Lifetime Earned</p>
            </div>
            <p className="text-lg font-semibold text-emerald-300">₹{(d.lifetime_earned || 0).toFixed(2)}</p>
          </div>
        </div>

        {balance <= 0 && (d.lifetime_earned || 0) === 0 && (
          <p className="relative mt-4 text-[11px] text-white/40">
            No earnings yet. You&apos;ll earn a commission every time a customer who first scanned your QR buys something on zxcom.in.
          </p>
        )}
      </motion.div>

      {/* ── History Modal ── */}
      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title="Commission History" size="lg">
        {(d.commission_history || []).length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">No commission entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/5">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Order</th>
                  <th className="py-2 font-medium">Order Total</th>
                  <th className="py-2 font-medium">Rate</th>
                  <th className="py-2 font-medium">Commission</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(d.commission_history || []).map((h) => (
                  <tr key={h._id} className="border-b border-white/5 last:border-0">
                    <td className="py-2 text-white/80">{fmt(h.credited_at)}</td>
                    <td className="py-2 text-white/80 font-mono">{h.order_number || '—'}</td>
                    <td className="py-2 text-white/60">₹{h.order_total}</td>
                    <td className="py-2 text-white/60">{h.percent}%</td>
                    <td className="py-2 text-white font-semibold">₹{h.amount}</td>
                    <td className="py-2">
                      <Badge
                        text={h.status === 'paid_out' ? 'Paid' : 'Credited'}
                        variant={h.status === 'paid_out' ? 'success' : 'default'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(d.payout_requests || []).length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/5">
            <h4 className="text-xs font-semibold text-white/60 mb-3">Payout Requests</h4>
            <div className="space-y-2">
              {(d.payout_requests || []).map((r) => {
                const okStatus = r.status === 'paid';
                const failStatus = r.status === 'rejected' || r.status === 'failed' || r.status === 'reversed';
                const hasDeductions = (r.tds_amount > 0) || (r.gateway_fee_amount > 0);
                return (
                  <div key={r._id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {okStatus ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-400" />
                        )}
                        <div>
                          <p className="text-sm text-white font-medium">₹{r.amount}</p>
                          <p className="text-[10px] text-white/40">
                            {fmt(r.requested_at)}
                            {r.payout_method ? ` · via ${r.payout_method}` : ''}
                          </p>
                        </div>
                      </div>
                      <Badge
                        text={r.status}
                        variant={okStatus ? 'success' : failStatus ? 'danger' : 'warning'}
                      />
                    </div>
                    {hasDeductions && (
                      <div className="mt-2 pt-2 border-t border-white/5 text-[10px] text-white/50 grid grid-cols-3 gap-2">
                        {r.tds_amount > 0 && (
                          <div>
                            <p className="text-white/30 uppercase tracking-wider">TDS {r.tds_rate_applied ? `@${r.tds_rate_applied}%` : ''}</p>
                            <p className="text-red-300 font-mono">−₹{Number(r.tds_amount).toFixed(2)}</p>
                          </div>
                        )}
                        {r.gateway_fee_amount > 0 && (
                          <div>
                            <p className="text-white/30 uppercase tracking-wider">Fee</p>
                            <p className="text-red-300 font-mono">−₹{Number(r.gateway_fee_amount).toFixed(2)}</p>
                          </div>
                        )}
                        {r.net_amount > 0 && (
                          <div className="text-right">
                            <p className="text-white/30 uppercase tracking-wider">Received</p>
                            <p className="text-emerald-300 font-mono font-semibold">₹{Number(r.net_amount).toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {r.failure_reason && (
                      <p className="text-[10px] text-red-300/80 mt-1">{r.failure_reason}</p>
                    )}
                    {okStatus && (
                      <div className="mt-2 pt-2 border-t border-white/5 flex justify-end">
                        <button
                          onClick={() => handleDownloadReceipt(r._id)}
                          disabled={downloadingId === r._id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                          title="Download payment receipt with TDS breakdown"
                        >
                          <Download className="w-3 h-3" />
                          {downloadingId === r._id ? 'Generating…' : 'Receipt'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Payout Request Modal ── */}
      <Modal isOpen={payoutOpen} onClose={() => setPayoutOpen(false)} title="Request Payout" size="sm">
        <div className="space-y-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-xs text-white/60">
            Available balance: <span className="text-white font-semibold">₹{available.toFixed(2)}</span>
          </div>
          {d.beneficiary && (
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-[11px] text-white/60">
              <p className="text-white/40 uppercase tracking-wider text-[10px] mb-1">Will be paid to</p>
              <p className="text-white font-medium">{d.beneficiary.account_holder}</p>
              {d.beneficiary.account_number && (
                <p className="text-white/60 font-mono">
                  {d.beneficiary.account_number} · {d.beneficiary.ifsc}
                </p>
              )}
              {d.beneficiary.upi_vpa && (
                <p className="text-white/60 font-mono">{d.beneficiary.upi_vpa}</p>
              )}
            </div>
          )}
          <Input
            label="Amount (₹)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Up to ${available.toFixed(2)}`}
            required
          />

          {/* Live deduction preview — shows what the merchant actually receives */}
          {Number(amount) > 0 && d.deductions && (() => {
            const gross = Number(amount) || 0;
            const tdsRate = d.deductions.tds_rate_percent || 0;
            const threshold = d.deductions.tds_threshold_per_fy || 0;
            const lifetimePaid = d.lifetime_paid_out || 0;
            // Quick threshold check (approximation — backend recomputes precisely at approval)
            const tdsApplies = tdsRate > 0 && (threshold === 0 || (lifetimePaid + gross) > threshold);
            const tds = tdsApplies ? Math.round((gross * tdsRate) / 100 * 100) / 100 : 0;
            const fee = d.deductions.gateway_fee_preview || 0;
            const net = Math.max(0, gross - tds - fee);
            return (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-[11px] space-y-1.5">
                <p className="text-amber-200/80 uppercase tracking-wider text-[10px] font-semibold">Deductions</p>
                <div className="flex justify-between text-white/70">
                  <span>Gross requested</span>
                  <span className="font-mono">₹{gross.toFixed(2)}</span>
                </div>
                {tds > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>TDS @ {tdsRate}% {!d.deductions.has_pan ? '(no PAN)' : `(${d.deductions.tds_section || '194H'})`}</span>
                    <span className="font-mono text-red-300">−₹{tds.toFixed(2)}</span>
                  </div>
                )}
                {fee > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>Gateway fee</span>
                    <span className="font-mono text-red-300">−₹{fee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-amber-500/15">
                  <span className="text-white font-semibold">You receive</span>
                  <span className="font-mono font-bold text-emerald-300">₹{net.toFixed(2)}</span>
                </div>
                {tds > 0 && (
                  <p className="text-[10px] text-white/40 pt-1">
                    TDS deducted under Section {d.deductions.tds_section || '194H'} — claim refund/credit when you file your taxes.
                  </p>
                )}
              </div>
            );
          })()}

          <p className="text-[11px] text-white/40">
            Payouts are reviewed by admin and disbursed via RazorpayX or bank transfer, typically
            within 2–3 business days.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPayoutOpen(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleRequest}>Submit Request</Button>
          </div>
        </div>
      </Modal>

      {/* ── Beneficiary Modal ── */}
      <Modal isOpen={beneficiaryOpen} onClose={() => setBeneficiaryOpen(false)} title="Bank / UPI Details" size="md">
        <div className="space-y-4">
          <p className="text-[11px] text-white/50 bg-white/5 border border-white/10 rounded-lg p-3">
            Provide a bank account <span className="text-white">or</span> a UPI VPA — whichever you prefer.
            PAN is required by Indian tax rules for any party receiving payouts.
          </p>
          <Input
            label="Account Holder Name (as on bank/Aadhaar)"
            name="account_holder"
            value={benForm.account_holder}
            onChange={updateBenField}
            placeholder="e.g. Anita Sharma"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Bank Account Number"
              name="account_number"
              value={benForm.account_number}
              onChange={updateBenField}
              placeholder="9–18 digits"
            />
            <Input
              label="IFSC Code"
              name="ifsc"
              value={benForm.ifsc}
              onChange={(e) => setBenForm((p) => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
              placeholder="e.g. HDFC0001234"
            />
          </div>
          <div className="text-center text-[11px] text-white/30 -my-1">— or —</div>
          <Input
            label="UPI VPA"
            name="upi_vpa"
            value={benForm.upi_vpa}
            onChange={updateBenField}
            placeholder="e.g. yourname@upi"
          />
          <Input
            label="PAN"
            name="pan"
            value={benForm.pan}
            onChange={(e) => setBenForm((p) => ({ ...p, pan: e.target.value.toUpperCase() }))}
            placeholder="ABCDE1234F"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setBeneficiaryOpen(false)}>Cancel</Button>
            <Button loading={savingBen} onClick={handleSaveBeneficiary}>Save</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
