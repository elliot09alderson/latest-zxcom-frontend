import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, CheckCircle2, XCircle, Lock, Phone as PhoneIcon, Mail,
  AlertTriangle, Send, Award, Clock, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import useFetch from '../../hooks/useFetch';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AreaManagerRequestsManager() {
  const { data, loading, error, refetch } = useFetch('/admin/area-manager-requests');

  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requests = data?.requests || [];

  const openAction = (promoter, type) => {
    setActionTarget(promoter);
    setActionType(type);
    setNote('');
  };

  const handleConfirm = async () => {
    if (!actionTarget) return;
    setSubmitting(true);
    try {
      if (actionType === 'approve') {
        await api.put(`/admin/promoters/${actionTarget._id}/rank`, { rank: 'area_manager' });
        toast.success(`${actionTarget.user_id?.name || 'Promoter'} promoted to Area Manager`);
      } else {
        await api.put(`/admin/promoters/${actionTarget._id}/reject-area-manager`, { note });
        toast.success('Request rejected');
      }
      setActionTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-400/10">
            <Crown className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Area Manager Requests</h2>
            <p className="text-xs text-white/40">
              Promoters who have requested to be promoted to Area Manager. Approving unlocks their pending royalty into spendable balance.
            </p>
          </div>
        </div>
        <Badge text={`${requests.length} pending`} variant={requests.length > 0 ? 'warning' : 'default'} />
      </div>

      {/* Summary strip */}
      {requests.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Pending Requests</p>
            <p className="text-xl font-bold text-amber-300">{requests.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="w-3 h-3 text-amber-400" />
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Total Royalty Locked</p>
            </div>
            <p className="text-xl font-bold text-white">
              {money(requests.reduce((s, r) => s + (Number(r.royalty_pending) || 0), 0))}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Award className="w-3 h-3 text-emerald-400" />
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Will Unlock On Approve</p>
            </div>
            <p className="text-xl font-bold text-emerald-300">
              {money(requests.reduce((s, r) => s + (Number(r.royalty_pending) || 0), 0))}
            </p>
          </div>
        </div>
      )}

      {error && <div className="text-center py-8 text-red-400 text-sm">{error}</div>}

      {requests.length === 0 ? (
        <EmptyState
          icon={Crown}
          title="No pending requests"
          description="When a promoter taps 'Request Area Manager' from their wallet, they'll show up here."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((p) => {
            const u = p.user_id || {};
            const r = p.am_request || {};
            return (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left: profile */}
                  <div className="flex items-start gap-3 min-w-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#e94560]/20 flex items-center justify-center text-[#e94560] font-bold text-base">
                        {(u.name || 'P').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-white truncate">{u.name || '—'}</h3>
                        <Badge text={p.employee_id} variant="info" />
                        <Badge text={`Rank: ${p.rank}`} variant="default" />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-white/50">
                        {u.phone && (
                          <span className="inline-flex items-center gap-1">
                            <PhoneIcon className="w-3 h-3" /> {u.phone}
                          </span>
                        )}
                        {u.email && (
                          <span className="inline-flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3" /> {u.email}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/40 mt-1.5 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Requested {fmtDate(r.requested_at)}
                      </p>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={XCircle}
                      onClick={() => openAction(p, 'reject')}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      icon={Sparkles}
                      onClick={() => openAction(p, 'approve')}
                    >
                      Promote to AM
                    </Button>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Direct Shops</p>
                    <p className="text-sm font-semibold text-white">{p.total_shops_count || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Sub-Promoters</p>
                    <p className="text-sm font-semibold text-white">{p.total_promoters_count || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Wallet Balance</p>
                    <p className="text-sm font-semibold text-emerald-300">{money(p.commission_earned)}</p>
                  </div>
                  <div className="bg-amber-400/5 rounded-lg p-2.5 border border-amber-400/30">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Lock className="w-2.5 h-2.5 text-amber-300" />
                      <p className="text-[10px] text-amber-200/80 uppercase tracking-wider">Royalty Locked</p>
                    </div>
                    <p className="text-sm font-bold text-amber-200">{money(p.royalty_pending)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Approve / Reject Modal ── */}
      <Modal
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        title={actionType === 'approve' ? 'Promote to Area Manager' : 'Reject Area Manager Request'}
        size="md"
      >
        {actionTarget && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#e94560]/20 flex items-center justify-center text-[#e94560] font-bold">
                {(actionTarget.user_id?.name || 'P').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{actionTarget.user_id?.name}</p>
                <p className="text-xs text-white/40">
                  {actionTarget.employee_id} · {actionTarget.user_id?.phone}
                </p>
              </div>
            </div>

            {actionType === 'approve' && (
              <>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-[11px] space-y-1.5">
                  <p className="text-emerald-200/80 uppercase tracking-wider text-[10px] font-semibold">What this will do</p>
                  <ul className="text-white/70 space-y-1 list-disc pl-4">
                    <li>Change rank to <strong>area_manager</strong></li>
                    <li>Update User.role to <strong>area_manager</strong></li>
                    <li>Unlock <strong className="text-emerald-300">{money(actionTarget.royalty_pending)}</strong> from royalty_pending → wallet balance (spendable)</li>
                    <li>Future merchant events in their downline will earn level-2 override commission directly</li>
                  </ul>
                </div>
                <p className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                  ⚠ This is reversible (admin can demote later) but already-credited level-2 commissions stay in the wallet.
                </p>
              </>
            )}

            {actionType === 'reject' && (
              <>
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-[11px]">
                  <p className="text-red-200/90">
                    The request will be marked as <strong>rejected</strong>. The promoter's
                    <strong> {money(actionTarget.royalty_pending)}</strong> stays locked in royalty_pending.
                    They can re-request later.
                  </p>
                </div>
                <Input
                  label="Reason (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Not enough sub-promoters yet"
                />
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setActionTarget(null)}>Cancel</Button>
              <Button
                loading={submitting}
                onClick={handleConfirm}
                variant={actionType === 'approve' ? 'primary' : 'secondary'}
              >
                {actionType === 'approve' ? 'Confirm Promotion' : 'Confirm Reject'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
