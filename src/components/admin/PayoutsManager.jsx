import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BanknoteArrowUp, CheckCircle2, XCircle, Clock, Store, User, RotateCcw,
  Wallet, AlertTriangle, Zap, Send, Landmark, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import useFetch from '../../hooks/useFetch';
import DataTable from '../ui/DataTable';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Spinner from '../ui/Spinner';

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';
const fmtDay = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

export default function PayoutsManager() {
  const { data, loading, error, refetch } = useFetch('/admin/payouts');
  const [view, setView] = useState('credits'); // 'credits' | 'requests'
  const [partyFilter, setPartyFilter] = useState('all'); // 'all' | 'merchant' | 'promoter'
  const [requestTab, setRequestTab] = useState('pending');

  // Resolve payout modal state. resolveAction:
  //   'approve_razorpayx' | 'approve_manual' | 'mark_paid' | 'reject'
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolveAction, setResolveAction] = useState('mark_paid');
  const [paymentRef, setPaymentRef] = useState('');
  const [note, setNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const razorpayxConfigured = !!data?.razorpayx_configured;
  const [receiptDownloadingId, setReceiptDownloadingId] = useState(null);

  const handleDownloadReceipt = async (row) => {
    setReceiptDownloadingId(row._id);
    try {
      const res = await api.get(
        `/admin/payouts/${row.party_type}/${row.party_id}/${row._id}/receipt`,
        { responseType: 'blob' }
      );
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
      setReceiptDownloadingId(null);
    }
  };

  // Reset credit modal state
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPaymentRef, setResetPaymentRef] = useState('');
  const [resetNote, setResetNote] = useState('');
  const [resetting, setResetting] = useState(false);

  const credits = (data?.credits || []).filter((c) => partyFilter === 'all' || c.party_type === partyFilter);
  const allPayouts = data?.payouts || [];

  const pending = allPayouts.filter((p) => p.status === 'pending' || p.status === 'approved' || p.status === 'processing');
  const paid = allPayouts.filter((p) => p.status === 'paid');
  const rejected = allPayouts.filter((p) => p.status === 'rejected' || p.status === 'failed' || p.status === 'reversed');
  const filteredPayouts = { pending, paid, rejected }[requestTab] || [];

  // Totals for the header
  const totalOutstanding = credits.reduce((s, c) => s + c.balance, 0);
  const totalPending = credits.reduce((s, c) => s + c.pending_amount, 0);
  const totalMerchants = credits.filter((c) => c.party_type === 'merchant').length;
  const totalPromoters = credits.filter((c) => c.party_type === 'promoter').length;

  const openResolve = (row, action) => {
    setResolveTarget(row);
    setResolveAction(action);
    setPaymentRef('');
    setNote('');
  };

  const handleResolve = async () => {
    if (!resolveTarget) return;
    if (resolveAction === 'mark_paid' && !paymentRef.trim()) {
      toast.error('Payment reference is required when marking as paid');
      return;
    }
    if (resolveAction === 'approve_razorpayx' && !resolveTarget.beneficiary?.has_beneficiary) {
      toast.error('This party has not added their bank/UPI yet');
      return;
    }

    let body;
    if (resolveAction === 'approve_razorpayx') body = { action: 'approve', method: 'razorpayx', note };
    else if (resolveAction === 'approve_manual') body = { action: 'approve', method: 'manual', note };
    else if (resolveAction === 'mark_paid') body = { action: 'mark_paid', payment_ref: paymentRef, note };
    else if (resolveAction === 'reject') body = { action: 'reject', note };
    else { toast.error('Unknown action'); return; }

    setResolving(true);
    try {
      await api.put(
        `/admin/payouts/${resolveTarget.party_type}/${resolveTarget.party_id}/${resolveTarget._id}`,
        body
      );
      const successMsg = {
        approve_razorpayx: 'Sent to RazorpayX',
        approve_manual: 'Approved — transfer manually then click Mark Paid',
        mark_paid: 'Payout marked paid',
        reject: 'Payout rejected',
      }[resolveAction];
      toast.success(successMsg);
      setResolveTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve payout');
    } finally {
      setResolving(false);
    }
  };

  const openReset = (row) => {
    setResetTarget(row);
    setResetPaymentRef('');
    setResetNote('');
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    if (!resetPaymentRef.trim()) {
      toast.error('Payment reference is required for the bulk payout');
      return;
    }
    setResetting(true);
    try {
      await api.post(
        `/admin/credits/${resetTarget.party_type}/${resetTarget.party_id}/reset`,
        { payment_ref: resetPaymentRef, note: resetNote }
      );
      toast.success(`Wallet reset — ₹${resetTarget.balance.toFixed(2)} marked as paid`);
      setResetTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset credit');
    } finally {
      setResetting(false);
    }
  };

  // ── Credits columns ──
  const creditsColumns = [
    {
      key: 'party_type', label: 'Type',
      render: (val) => (
        <div className="inline-flex items-center gap-1.5">
          {val === 'merchant' ? (
            <Store className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <User className="w-3.5 h-3.5 text-purple-400" />
          )}
          <span className="text-[11px] text-white/60 capitalize">{val}</span>
        </div>
      ),
    },
    { key: 'party_label', label: 'Name' },
    { key: 'owner_name', label: 'Owner' },
    { key: 'owner_phone', label: 'Phone' },
    {
      key: 'balance', label: 'Current Balance',
      render: (val) => (
        <span className={`font-semibold ${val > 0 ? 'text-emerald-300' : 'text-white/30'}`}>
          ₹{val.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'pending_amount', label: 'Reserved',
      render: (val) => val > 0
        ? <span className="text-amber-300">₹{val.toFixed(2)}</span>
        : <span className="text-white/20">—</span>,
    },
    {
      key: 'lifetime_earned', label: 'Lifetime Earned',
      render: (val) => <span className="text-white/60">₹{(val || 0).toFixed(2)}</span>,
    },
    {
      key: 'last_earned_at', label: 'Last Activity',
      render: (val) => <span className="text-xs text-white/50">{fmtDay(val)}</span>,
    },
    {
      key: 'actions', label: 'Actions', exportable: false,
      render: (_, row) => (
        <Button
          size="sm"
          variant="secondary"
          icon={RotateCcw}
          onClick={() => openReset(row)}
          disabled={row.balance <= 0}
        >
          Mark Paid &amp; Reset
        </Button>
      ),
    },
  ];

  // ── Request columns ──
  const requestColumns = [
    {
      key: 'party_type', label: 'Type',
      render: (val) => (
        <div className="inline-flex items-center gap-1.5">
          {val === 'merchant' ? (
            <Store className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <User className="w-3.5 h-3.5 text-purple-400" />
          )}
          <span className="text-[11px] text-white/60 capitalize">{val}</span>
        </div>
      ),
    },
    { key: 'party_label', label: 'Name' },
    { key: 'owner_name', label: 'Owner' },
    { key: 'owner_phone', label: 'Phone' },
    {
      key: 'amount', label: 'Gross',
      render: (val, row) => (
        <div>
          <p className="font-semibold text-white">₹{Number(val).toFixed(2)}</p>
          {(row.tds_amount > 0 || row.gateway_fee_amount > 0) && (
            <p className="text-[9px] text-white/40">
              {row.tds_amount > 0 ? `TDS −₹${Number(row.tds_amount).toFixed(2)}` : ''}
              {row.tds_amount > 0 && row.gateway_fee_amount > 0 ? ' · ' : ''}
              {row.gateway_fee_amount > 0 ? `Fee −₹${Number(row.gateway_fee_amount).toFixed(2)}` : ''}
            </p>
          )}
          {row.net_amount > 0 && (
            <p className="text-[10px] text-emerald-300 font-mono">net ₹{Number(row.net_amount).toFixed(2)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'beneficiary', label: 'Beneficiary',
      render: (val) => {
        if (!val?.has_beneficiary) {
          return <span className="text-[10px] text-amber-300">No bank/UPI</span>;
        }
        return (
          <div className="text-[10px] leading-tight">
            <p className="text-white/80 truncate max-w-[140px]">{val.account_holder}</p>
            {val.account_number_masked && (
              <p className="text-white/40 font-mono">{val.account_number_masked}</p>
            )}
            {val.upi_vpa && (
              <p className="text-white/40 font-mono truncate max-w-[140px]">{val.upi_vpa}</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'requested_at', label: 'Requested',
      render: (val) => <span className="text-xs text-white/60">{fmtDate(val)}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (val, row) => {
        const variant =
          val === 'paid' ? 'success'
          : (val === 'rejected' || val === 'failed' || val === 'reversed') ? 'danger'
          : 'warning';
        return (
          <div className="flex flex-col gap-0.5">
            <Badge text={val} variant={variant} />
            {row.payout_method && (val === 'processing' || val === 'paid' || val === 'failed' || val === 'reversed') && (
              <span className="text-[9px] text-white/40 uppercase tracking-wider">via {row.payout_method}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions', label: 'Actions', exportable: false,
      render: (_, row) => {
        if (row.status === 'pending') {
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => openResolve(row, 'approve_razorpayx')}
                className="p-1.5 rounded-lg text-white/50 hover:text-blue-400 hover:bg-blue-400/10 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title={razorpayxConfigured ? 'Approve & disburse via RazorpayX' : 'RazorpayX not configured'}
                disabled={!razorpayxConfigured}
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                onClick={() => openResolve(row, 'approve_manual')}
                className="p-1.5 rounded-lg text-white/50 hover:text-amber-400 hover:bg-amber-400/10 transition-all cursor-pointer"
                title="Approve — I'll transfer manually"
              >
                <Landmark className="w-4 h-4" />
              </button>
              <button
                onClick={() => openResolve(row, 'reject')}
                className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          );
        }
        if (row.status === 'approved') {
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => openResolve(row, 'mark_paid')}
                className="p-1.5 rounded-lg text-white/50 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all cursor-pointer"
                title="Mark as Paid (after manual transfer)"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => openResolve(row, 'reject')}
                className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          );
        }
        if (row.status === 'processing') {
          return <span className="text-[10px] text-blue-300">awaiting webhook</span>;
        }
        if (row.status === 'paid') {
          return (
            <button
              onClick={() => handleDownloadReceipt(row)}
              disabled={receiptDownloadingId === row._id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
              title="Download payment receipt"
            >
              <Download className="w-3 h-3" />
              {receiptDownloadingId === row._id ? '…' : 'Receipt'}
            </button>
          );
        }
        if (row.payment_ref) {
          return <span className="text-[10px] text-white/40 font-mono truncate">{row.payment_ref}</span>;
        }
        return <span className="text-white/20">—</span>;
      },
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#e94560]/10">
            <BanknoteArrowUp className="w-5 h-5 text-[#e94560]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Credits &amp; Payouts</h2>
            <p className="text-xs text-white/40">
              <span className="text-emerald-300">₹{totalOutstanding.toFixed(2)}</span> total outstanding ·{' '}
              <span className="text-amber-300">₹{totalPending.toFixed(2)}</span> pending payout requests
            </p>
          </div>
        </div>
      </div>

      {!razorpayxConfigured && (
        <div className="mb-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-200/90 leading-relaxed">
            <p><strong>RazorpayX is not configured</strong> — the auto-disburse button is disabled.</p>
            <p className="text-amber-200/70 mt-0.5">You can still approve manually and click Mark Paid after transferring via your own netbanking. To enable RazorpayX, set <code className="text-amber-300">RAZORPAYX_KEY_ID</code>, <code className="text-amber-300">RAZORPAYX_KEY_SECRET</code>, <code className="text-amber-300">RAZORPAYX_ACCOUNT_NUMBER</code> in <code className="text-amber-300">backend/.env</code>.</p>
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-xl font-bold text-emerald-300">₹{totalOutstanding.toFixed(2)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Pending Requests</p>
          <p className="text-xl font-bold text-amber-300">{pending.length}</p>
        </div>

        {/* TDS — only show if any has been deducted, otherwise the strip
             reads as empty noise on a fresh install. */}
        {data?.tds && (data.tds.total_deducted_all_time > 0 || data.tds.total_pending > 0) && (
          <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-3" title={`Section 194H · ${data.tds.fy_label}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <BanknoteArrowUp className="w-3 h-3 text-red-300 rotate-180" />
              <p className="text-[10px] text-red-200/80 uppercase tracking-wider">Total TDS Deducted</p>
            </div>
            <p className="text-xl font-bold text-red-200">₹{Number(data.tds.total_deducted_all_time).toFixed(2)}</p>
            <div className="text-[10px] text-white/40 mt-1 leading-tight">
              <p>{data.tds.fy_label}: <span className="text-red-200/90 font-mono">₹{Number(data.tds.total_deducted_fy).toFixed(2)}</span></p>
              {data.tds.total_pending > 0 && (
                <p>Pending: <span className="text-amber-200/90 font-mono">₹{Number(data.tds.total_pending).toFixed(2)}</span></p>
              )}
              <p className="text-white/30">{data.tds.paid_count} paid · {data.tds.paid_count_fy} this FY</p>
            </div>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Store className="w-3 h-3 text-blue-400" />
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Merchants w/ Balance</p>
          </div>
          <p className="text-xl font-bold text-white">{totalMerchants}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <User className="w-3 h-3 text-purple-400" />
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Promoters w/ Balance</p>
          </div>
          <p className="text-xl font-bold text-white">{totalPromoters}</p>
        </div>
      </div>

      {/* Top-level view switch */}
      <div className="flex items-center gap-2 mb-4 border-b border-white/5">
        {[
          { key: 'credits',  label: 'All Credits', icon: Wallet,          count: credits.length },
          { key: 'requests', label: 'Payout Requests', icon: BanknoteArrowUp, count: allPayouts.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              view === t.key
                ? 'border-[#e94560] text-white'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* ── CREDITS VIEW ── */}
      {view === 'credits' && (
        <>
          {/* Party filter */}
          <div className="flex items-center gap-2 mb-3">
            {[
              { key: 'all', label: 'All' },
              { key: 'merchant', label: 'Merchants' },
              { key: 'promoter', label: 'Promoters' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setPartyFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  partyFilter === f.key
                    ? 'bg-[#e94560]/15 border border-[#e94560]/40 text-white'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="text-center py-8 text-red-400 text-sm">{error}</div>
          ) : (
            <DataTable
              columns={creditsColumns}
              data={credits}
              title="Credits"
              exportFilename="credits"
              searchable
              searchFields={['party_label', 'owner_name', 'owner_phone']}
              searchPlaceholder="Search by name, owner, phone..."
              exportable
              emptyMessage="No parties with a credit balance yet."
            />
          )}
        </>
      )}

      {/* ── REQUESTS VIEW ── */}
      {view === 'requests' && (
        <>
          <div className="flex items-center gap-2 mb-4">
            {[
              { key: 'pending', label: 'Pending', icon: Clock, count: pending.length },
              { key: 'paid', label: 'Paid', icon: CheckCircle2, count: paid.length },
              { key: 'rejected', label: 'Rejected', icon: XCircle, count: rejected.length },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setRequestTab(t.key)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  requestTab === t.key
                    ? 'bg-[#e94560]/15 border border-[#e94560]/40 text-white'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <t.icon className="w-3 h-3" />
                {t.label} ({t.count})
              </button>
            ))}
          </div>
          {error ? (
            <div className="text-center py-8 text-red-400 text-sm">{error}</div>
          ) : (
            <DataTable
              columns={requestColumns}
              data={filteredPayouts}
              title="Payout Requests"
              exportFilename="payout-requests"
              searchable
              searchFields={['party_label', 'owner_name', 'owner_phone']}
              searchPlaceholder="Search by name, owner, phone..."
              exportable
              emptyMessage={`No ${requestTab} payout requests.`}
            />
          )}
        </>
      )}

      {/* ── Resolve Payout Modal ── */}
      <Modal
        isOpen={!!resolveTarget}
        onClose={() => setResolveTarget(null)}
        title={
          resolveAction === 'approve_razorpayx' ? 'Approve via RazorpayX' :
          resolveAction === 'approve_manual'    ? 'Approve (Manual Transfer)' :
          resolveAction === 'mark_paid'         ? 'Mark Payout as Paid' :
                                                  'Reject Payout'
        }
        size="md"
      >
        {resolveTarget && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-3">
                {resolveTarget.party_type === 'merchant' ? (
                  <Store className="w-4 h-4 text-blue-400 mt-0.5" />
                ) : (
                  <User className="w-4 h-4 text-purple-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{resolveTarget.party_label}</p>
                  <p className="text-xs text-white/40">
                    {resolveTarget.owner_name} · {resolveTarget.owner_phone}
                  </p>
                  <p className="text-base font-bold text-white mt-2">
                    Payout: ₹{resolveTarget.amount}
                  </p>
                  <p className="text-[11px] text-white/40">
                    Wallet balance: ₹{resolveTarget.wallet_balance?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Beneficiary block — visible for all actions except plain reject */}
            {resolveAction !== 'reject' && resolveTarget.beneficiary && (
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Send to</p>
                {resolveTarget.beneficiary.has_beneficiary ? (
                  <div className="text-xs space-y-0.5">
                    <p className="text-white font-medium">{resolveTarget.beneficiary.account_holder}</p>
                    {resolveTarget.beneficiary.account_number_masked && (
                      <p className="text-white/60 font-mono">
                        {resolveTarget.beneficiary.account_number_masked} · {resolveTarget.beneficiary.ifsc}
                      </p>
                    )}
                    {resolveTarget.beneficiary.upi_vpa && (
                      <p className="text-white/60 font-mono">{resolveTarget.beneficiary.upi_vpa}</p>
                    )}
                    {resolveTarget.beneficiary.pan_masked && (
                      <p className="text-white/40 text-[10px]">PAN: {resolveTarget.beneficiary.pan_masked}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-amber-300">No bank / UPI on file — party must add beneficiary first.</p>
                )}
              </div>
            )}

            {(resolveAction === 'approve_razorpayx' || resolveAction === 'approve_manual') && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-[11px] space-y-1.5">
                <p className="text-amber-200/80 uppercase tracking-wider text-[10px] font-semibold">Deductions on approval</p>
                <p className="text-white/50 text-[10px] -mt-1">Computed precisely at approval time. Wallet will be debited the gross amount; TDS retained for govt deposit.</p>
                <div className="flex justify-between text-white/70">
                  <span>Gross requested</span>
                  <span className="font-mono">₹{Number(resolveTarget.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>TDS @ 2% (or 20% if no PAN) · Section 194H</span>
                  <span className="font-mono text-red-300">computed on approve</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Gateway fee ({resolveAction === 'approve_razorpayx' ? 'RazorpayX' : 'Manual'})</span>
                  <span className="font-mono text-red-300">per config</span>
                </div>
                <p className="text-[10px] text-white/40 pt-1">
                  The exact net amount will be stamped on the payout record once you confirm.
                </p>
              </div>
            )}
            {resolveAction === 'approve_razorpayx' && (
              <p className="text-[11px] text-blue-300/80 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5">
                ⚡ RazorpayX will disburse the <strong>net</strong> amount to the beneficiary above.
                Status moves to <strong>processing</strong>; the webhook will flip it to
                <strong>paid</strong> or <strong>failed</strong> when the bank confirms.
              </p>
            )}
            {resolveAction === 'approve_manual' && (
              <p className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                After approval, transfer the <strong>net</strong> amount via your own netbanking/UPI
                to the beneficiary above, then click <strong>Mark Paid</strong> with the bank reference.
                Wallet is debited (full gross) only on Mark Paid.
              </p>
            )}
            {resolveAction === 'mark_paid' && (
              <>
                {(resolveTarget.tds_amount > 0 || resolveTarget.gateway_fee_amount > 0 || resolveTarget.net_amount > 0) && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-[11px] space-y-1.5">
                    <p className="text-emerald-200/80 uppercase tracking-wider text-[10px] font-semibold">Transfer this amount</p>
                    <div className="flex justify-between text-white/70">
                      <span>Gross (debits from wallet)</span>
                      <span className="font-mono">₹{Number(resolveTarget.amount).toFixed(2)}</span>
                    </div>
                    {resolveTarget.tds_amount > 0 && (
                      <div className="flex justify-between text-white/70">
                        <span>TDS @ {resolveTarget.tds_rate_applied}% (retained for {resolveTarget.tds_section || '194H'})</span>
                        <span className="font-mono text-red-300">−₹{Number(resolveTarget.tds_amount).toFixed(2)}</span>
                      </div>
                    )}
                    {resolveTarget.gateway_fee_amount > 0 && (
                      <div className="flex justify-between text-white/70">
                        <span>Gateway fee (retained)</span>
                        <span className="font-mono text-red-300">−₹{Number(resolveTarget.gateway_fee_amount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1.5 border-t border-emerald-500/15">
                      <span className="text-white font-semibold">Send to beneficiary</span>
                      <span className="font-mono font-bold text-emerald-300">₹{Number(resolveTarget.net_amount).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <Input
                  label="Payment Reference (UPI txn / IMPS / cheque no.)"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. IMPS/123456789"
                  required
                />
                <p className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                  ⚠ Marking as paid will debit ₹{Number(resolveTarget.amount).toFixed(2)} (gross)
                  from the wallet balance. Make sure you've already sent ₹{Number(resolveTarget.net_amount || resolveTarget.amount).toFixed(2)} to the beneficiary.
                </p>
              </>
            )}
            <Input
              label="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={resolveAction === 'reject' ? 'Reason for rejection' : 'Optional internal note'}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setResolveTarget(null)}>Cancel</Button>
              <Button
                loading={resolving}
                onClick={handleResolve}
                variant={resolveAction === 'reject' ? 'secondary' : 'primary'}
              >
                {resolveAction === 'approve_razorpayx' ? 'Send via RazorpayX' :
                 resolveAction === 'approve_manual'    ? 'Approve' :
                 resolveAction === 'mark_paid'         ? 'Confirm Paid' :
                                                         'Confirm Reject'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Reset Credit Modal ── */}
      <Modal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Mark Paid & Reset Credit"
        size="md"
      >
        {resetTarget && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-3">
                {resetTarget.party_type === 'merchant' ? (
                  <Store className="w-4 h-4 text-blue-400 mt-0.5" />
                ) : (
                  <User className="w-4 h-4 text-purple-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{resetTarget.party_label}</p>
                  <p className="text-xs text-white/40">
                    {resetTarget.owner_name} · {resetTarget.owner_phone}
                  </p>
                  <p className="text-2xl font-bold text-emerald-300 mt-2">
                    ₹{resetTarget.balance.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-white/40">
                    This is the full outstanding balance. After reset, the wallet will be ₹0.00.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-200/90 space-y-1">
                <p><strong>This action is irreversible.</strong> It will:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-200/70">
                  <li>Zero the wallet balance</li>
                  <li>Mark all credited commission history entries as &quot;Paid Out&quot;</li>
                  <li>Auto-resolve any pending payout requests as &quot;Paid&quot;</li>
                  <li>Add ₹{resetTarget.balance.toFixed(2)} to the lifetime paid-out total</li>
                </ul>
                <p className="pt-1">Use this on the 1st of each month after completing the bulk bank transfer.</p>
              </div>
            </div>

            <Input
              label="Payment Reference"
              value={resetPaymentRef}
              onChange={(e) => setResetPaymentRef(e.target.value)}
              placeholder="e.g. IMPS/123456789 or Batch#2026-04"
              required
            />
            <Input
              label="Note (optional)"
              value={resetNote}
              onChange={(e) => setResetNote(e.target.value)}
              placeholder="e.g. Monthly payout for April 2026"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setResetTarget(null)}>Cancel</Button>
              <Button icon={RotateCcw} loading={resetting} onClick={handleReset}>
                Confirm &amp; Reset
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
