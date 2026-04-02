import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, CheckCircle, XCircle, Eye, CreditCard, Hash,
  Store, Shield, Copy, Link2, RefreshCw, Zap, Plus, UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import useFetch from '../../hooks/useFetch';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const fullUrl = (url) => url ? (url.startsWith('http') ? url : `${API_BASE}${url}`) : '';
import DataTable from '../ui/DataTable';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';

export default function PromoterManager() {
  const { data, loading, error, refetch } = useFetch('/admin/promoters');
  const [search, setSearch] = useState('');
  const [selectedPromoter, setSelectedPromoter] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  // Recharge state
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeType, setRechargeType] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [recharging, setRecharging] = useState(false);

  // Flatten populated user_id fields
  const promoters = (data?.promoters || []).map((p) => ({
    ...p,
    name: p.user_id?.name || p.name || '',
    phone: p.user_id?.phone || p.phone || '',
    avatar_url: p.user_id?.avatar_url || '',
    shops_count: p.total_shops_count ?? 0,
    promoters_count: p.total_promoters_count ?? 0,
  }));

  const filtered = promoters.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.employee_id || '').toLowerCase().includes(q) ||
      (p.referral_code || '').toLowerCase().includes(q)
    );
  });

  const handleActivate = async (promoter) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/promoters/${promoter._id || promoter.id}/activate`);
      toast.success(`${promoter.name || 'Promoter'} activated`);
      setSelectedPromoter(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (promoter) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/promoters/${promoter._id || promoter.id}/deactivate`);
      toast.success(`${promoter.name || 'Promoter'} deactivated`);
      setSelectedPromoter(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReferralCode = async (promoter) => {
    setGeneratingCode(true);
    try {
      const { data: res } = await api.post(`/admin/promoters/${promoter._id || promoter.id}/referral-code`);
      const newCode = res?.data?.referral_code || res?.referral_code || '';
      toast.success(`Referral code generated: ${newCode}`);
      setSelectedPromoter((prev) => prev ? { ...prev, referral_code: newCode } : prev);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate code');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeType || !rechargeAmount || Number(rechargeAmount) <= 0) {
      toast.error('Select type and enter a valid amount');
      return;
    }
    setRecharging(true);
    try {
      await api.post(`/admin/promoters/${selectedPromoter._id || selectedPromoter.id}/recharge`, {
        type: rechargeType,
        amount: Number(rechargeAmount),
      });
      const label = rechargeType === 'merchant' ? 'Merchant' : 'Promoter';
      toast.success(`+${rechargeAmount} ${label} credits added!`);

      // Update local state
      setSelectedPromoter((prev) => {
        if (!prev) return prev;
        if (rechargeType === 'merchant') {
          return { ...prev, max_shops_allowed: (prev.max_shops_allowed || 0) + Number(rechargeAmount) };
        }
        return { ...prev, max_promoters_allowed: (prev.max_promoters_allowed || 0) + Number(rechargeAmount) };
      });

      setRechargeAmount('');
      setRechargeType('');
      setShowRecharge(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Recharge failed');
    } finally {
      setRecharging(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const getStatusVariant = (s) => ({ active: 'success', inactive: 'danger', pending: 'warning' }[s?.toLowerCase()] || 'default');
  const getRankVariant = (r) => ({ promoter: 'info', area_manager: 'success' }[r?.toLowerCase()] || 'default');

  const columns = [
    { key: 'employee_id', label: 'Employee ID' },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'referral_code',
      label: 'Referral Code',
      render: (val) => val ? (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-[#e94560]">{val}</span>
          <button
            onClick={(e) => { e.stopPropagation(); copyToClipboard(val); }}
            className="p-1 rounded text-white/30 hover:text-white/70 transition-colors cursor-pointer"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      ) : <span className="text-white/20 text-xs">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge text={val || 'N/A'} variant={getStatusVariant(val)} />,
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (val) => <Badge text={val || 'N/A'} variant={val === 'paid' ? 'success' : 'warning'} />,
    },
    {
      key: 'shops_count',
      label: 'Shops',
      render: (val) => val ?? 0,
    },
    {
      key: 'promoters_count',
      label: 'Promoters',
      render: (val) => val ?? 0,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setSelectedPromoter(row); setShowRecharge(false); }}
            className="p-1.5 rounded-lg text-white/50 hover:text-blue-400 hover:bg-blue-400/10 transition-all cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status !== 'active' ? (
            <button
              onClick={() => handleActivate(row)}
              className="p-1.5 rounded-lg text-white/50 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all cursor-pointer"
              title="Activate"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleDeactivate(row)}
              className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
              title="Deactivate"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#6366f1]/10">
            <Users className="w-5 h-5 text-[#6366f1]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Promoters</h2>
            <p className="text-xs text-white/40">{promoters.length} total promoters</p>
          </div>
        </div>
      </div>

      <div className="mb-5 max-w-sm">
        <Input
          placeholder="Search by name, phone, ID, or referral code..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? (
        <div className="text-center py-8 text-red-400 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No results found' : 'No promoters yet'}
          description={search ? 'Try adjusting your search query.' : 'Promoters will appear here once they register.'}
        />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedPromoter}
        onClose={() => { setSelectedPromoter(null); setShowRecharge(false); }}
        title="Promoter Details"
        size="md"
      >
        {selectedPromoter && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/10 flex items-center justify-center overflow-hidden">
                {selectedPromoter.avatar_url ? (
                  <img src={fullUrl(selectedPromoter.avatar_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-white/40">
                    {(selectedPromoter.name || 'P').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedPromoter.name || 'Unknown'}</h3>
                <p className="text-sm text-white/40">{selectedPromoter.phone || 'No phone'}</p>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-3.5 h-3.5 text-white/30" />
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Employee ID</p>
                </div>
                <p className="text-sm font-semibold text-white">{selectedPromoter.employee_id || '-'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-white/30" />
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Status</p>
                </div>
                <Badge text={selectedPromoter.status || 'N/A'} variant={getStatusVariant(selectedPromoter.status)} />
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-white/30" />
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Payment</p>
                </div>
                <Badge text={selectedPromoter.payment_status || 'N/A'} variant={selectedPromoter.payment_status === 'paid' ? 'success' : 'warning'} />
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-white/30" />
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Rank</p>
                </div>
                <Badge text={selectedPromoter.rank === 'area_manager' ? 'Area Manager' : (selectedPromoter.rank || 'promoter')} variant={getRankVariant(selectedPromoter.rank)} />
              </div>
            </div>

            {/* Onboarded counts + remaining credits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 rounded-xl p-4 border border-emerald-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs text-emerald-300/70 font-medium">Merchants Onboarded</p>
                </div>
                <p className="text-2xl font-bold text-white">{selectedPromoter.shops_count ?? 0}</p>
                <p className="text-xs text-white/30 mt-1">
                  {Math.max(0, (selectedPromoter.max_shops_allowed || 0) - (selectedPromoter.shops_count ?? 0))} credits remaining
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-xl p-4 border border-blue-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-blue-300/70 font-medium">Promoters Onboarded</p>
                </div>
                <p className="text-2xl font-bold text-white">{selectedPromoter.promoters_count ?? 0}</p>
                <p className="text-xs text-white/30 mt-1">
                  {Math.max(0, (selectedPromoter.max_promoters_allowed || 0) - (selectedPromoter.promoters_count ?? 0))} credits remaining
                </p>
              </div>
            </div>

            {/* Recharge Section */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <p className="text-sm font-semibold text-white">Recharge Credits</p>
                </div>
                {!showRecharge && (
                  <Button size="sm" icon={Plus} onClick={() => setShowRecharge(true)}>
                    Recharge
                  </Button>
                )}
              </div>

              <AnimatePresence>
                {showRecharge && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3 overflow-hidden"
                  >
                    {/* Type selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRechargeType('merchant')}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          rechargeType === 'merchant'
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-white/10 bg-white/5 hover:border-emerald-500/40'
                        }`}
                      >
                        <Store className={`w-5 h-5 ${rechargeType === 'merchant' ? 'text-emerald-400' : 'text-white/40'}`} />
                        <div className="text-left">
                          <p className={`text-sm font-medium ${rechargeType === 'merchant' ? 'text-emerald-300' : 'text-white/70'}`}>
                            Merchant
                          </p>
                          <p className="text-[10px] text-white/30">Shop onboarding</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRechargeType('promoter')}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          rechargeType === 'promoter'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 bg-white/5 hover:border-blue-500/40'
                        }`}
                      >
                        <UserPlus className={`w-5 h-5 ${rechargeType === 'promoter' ? 'text-blue-400' : 'text-white/40'}`} />
                        <div className="text-left">
                          <p className={`text-sm font-medium ${rechargeType === 'promoter' ? 'text-blue-300' : 'text-white/70'}`}>
                            Promoter
                          </p>
                          <p className="text-[10px] text-white/30">Promoter onboarding</p>
                        </div>
                      </button>
                    </div>

                    {/* Amount input */}
                    {rechargeType && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3"
                      >
                        <input
                          type="number"
                          min="1"
                          placeholder="Enter credits to add"
                          value={rechargeAmount}
                          onChange={(e) => setRechargeAmount(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#e94560]/60 transition-colors"
                        />
                        <Button
                          icon={Zap}
                          loading={recharging}
                          onClick={handleRecharge}
                          disabled={!rechargeAmount || Number(rechargeAmount) <= 0}
                        >
                          Add
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setShowRecharge(false); setRechargeType(''); setRechargeAmount(''); }}
                        >
                          Cancel
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {!showRecharge && (
                <div className="flex gap-4 text-xs text-white/30">
                  <span>Merchant: <span className="text-white/60 font-medium">{selectedPromoter.max_shops_allowed || 0} total</span></span>
                  <span>Promoter: <span className="text-white/60 font-medium">{selectedPromoter.max_promoters_allowed || 0} total</span></span>
                </div>
              )}
            </div>

            {/* Referral Code */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-[#e94560]" />
                <p className="text-sm font-semibold text-white">Referral Code</p>
              </div>

              {selectedPromoter.referral_code ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5">
                    <p className="text-lg font-bold font-mono text-[#e94560] tracking-widest">
                      {selectedPromoter.referral_code}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedPromoter.referral_code)}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleGenerateReferralCode(selectedPromoter)}
                    disabled={generatingCode}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${generatingCode ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="flex-1 text-sm text-white/30">No referral code generated yet</p>
                  <Button size="sm" icon={Link2} loading={generatingCode} onClick={() => handleGenerateReferralCode(selectedPromoter)}>
                    Generate
                  </Button>
                </div>
              )}
              <p className="text-xs text-white/30 mt-2">
                New promoters can use this code during registration to join under this promoter.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              {selectedPromoter.status !== 'active' ? (
                <Button fullWidth icon={CheckCircle} loading={actionLoading} onClick={() => handleActivate(selectedPromoter)}>
                  Activate & Mark Paid
                </Button>
              ) : (
                <Button fullWidth variant="danger" icon={XCircle} loading={actionLoading} onClick={() => handleDeactivate(selectedPromoter)}>
                  Deactivate Promoter
                </Button>
              )}
              <Button variant="ghost" onClick={() => { setSelectedPromoter(null); setShowRecharge(false); }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
