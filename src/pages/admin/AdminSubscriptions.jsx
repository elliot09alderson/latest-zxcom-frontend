import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Gift, Trophy, Award, Users, Store, Settings, BarChart3,
  Package, UserCheck, Wallet, ShoppingBag, Truck, RefreshCw, Repeat,
  Receipt, IndianRupee, TrendingUp, TrendingDown, Crown, Banknote,
} from 'lucide-react';
import api from '../../config/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';
import StatsCard from '../../components/ui/StatsCard';
import MiniChart from '../../components/ui/MiniChart';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

const sidebarLinks = [
  { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: '/admin/offers', label: 'Offers', icon: <Gift size={18} /> },
  { path: '/admin/contests', label: 'Contests', icon: <Trophy size={18} /> },
  { path: '/admin/winners', label: 'Winners', icon: <Award size={18} /> },
  { path: '/admin/promoters', label: 'Promoters', icon: <Users size={18} /> },
  { path: '/admin/area-managers', label: 'Area Managers', icon: <Crown size={18} /> },
  { path: '/admin/merchants', label: 'Merchants', icon: <Store size={18} /> },
  { path: '/admin/customers', label: 'Customers', icon: <UserCheck size={18} /> },
  { path: '/admin/payments', label: 'Payments', icon: <Wallet size={18} /> },
  { path: '/admin/payouts', label: 'Payouts', icon: <Wallet size={18} /> },
  { path: '/admin/packs', label: 'Packs', icon: <Package size={18} /> },
  { path: '/admin/products', label: 'Products', icon: <ShoppingBag size={18} /> },
  { path: '/admin/orders', label: 'Orders', icon: <Truck size={18} /> },
  { path: '/admin/subscriptions', label: 'Subscriptions', icon: <Repeat size={18} /> },
  { path: '/admin/config', label: 'Config', icon: <Settings size={18} /> },
  { path: '/admin/leaderboard', label: 'Leaderboard', icon: <BarChart3 size={18} /> },
];

const rupees = (n) => `\u20B9${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdminSubscriptions() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchStats = async (d = days) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/subscriptions/stats?days=${d}`);
      setStats(data?.data || data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(days); /* eslint-disable-next-line */ }, [days]);

  const totals = stats?.totals || {};
  const breakdown = stats?.commission_breakdown || {};
  const series = stats?.series || [];

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} title="Admin Panel">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 mb-6 flex-wrap"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Subscriptions</h1>
          <p className="text-sm text-white/50 mt-1">
            Merchant pack revenue, GST, and net earnings after promoter + area-manager commissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button icon={RefreshCw} onClick={() => fetchStats(days)}>Refresh</Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
      ) : !stats ? (
        <div className="text-center py-16 text-red-400 text-sm">Failed to load subscription stats.</div>
      ) : (
        <div className="space-y-6">
          {/* Primary totals — what admin cares about */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Gross Subscription Revenue"
              value={rupees(totals.gross)}
              icon={Banknote}
              color="#e94560"
            />
            <StatsCard
              title="GST Portion"
              value={rupees(totals.gst)}
              icon={Receipt}
              color="#f59e0b"
              trend={totals.gst_percent ? `${totals.gst_percent}% inclusive` : undefined}
            />
            <StatsCard
              title="Promoter Commissions Paid"
              value={rupees(totals.promoter_commissions)}
              icon={TrendingDown}
              color="#8b5cf6"
            />
            <StatsCard
              title="Area Manager Overrides"
              value={rupees(totals.area_manager_commissions)}
              icon={Crown}
              color="#6366f1"
            />
            <StatsCard
              title="Net Earnings (after payouts)"
              value={rupees(totals.net_earnings)}
              icon={TrendingUp}
              color="#10b981"
            />
            <StatsCard
              title="Total Payments"
              value={totals.payment_count || 0}
              icon={IndianRupee}
              color="#3b82f6"
            />
            <StatsCard
              title="Online Payments"
              value={totals.online_count || 0}
              icon={IndianRupee}
              color="#06b6d4"
            />
            <StatsCard
              title="Offline Payments"
              value={totals.offline_count || 0}
              icon={IndianRupee}
              color="#eab308"
            />
          </div>

          {/* Commission breakdown */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4 text-[#e94560]" />
              <h3 className="text-white font-semibold">Commission Payouts Breakdown</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <BreakdownRow label="Merchant Onboarding" amount={breakdown.merchant_onboarding} note="Level-1 direct" />
              <BreakdownRow label="Merchant Renewal" amount={breakdown.merchant_renewal} note="Level-1 recurring" />
              <BreakdownRow label="Area Manager Override" amount={breakdown.area_manager_override} note="Level-2 on downline" />
              <BreakdownRow label="Sub-Promoter Onboarding" amount={breakdown.sub_promoter_onboarding} note="Not from merchants" />
            </div>
          </GlassCard>

          {/* Daily chart */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#e94560]" />
                <h3 className="text-white font-semibold">Subscription Revenue per Day</h3>
              </div>
              <span className="text-xs text-white/40">Last {stats.window_days || days} days</span>
            </div>
            {series.length > 0 ? (
              <MiniChart data={series.map((s) => ({ label: s.date, value: s.amount }))} color="#e94560" height={160} />
            ) : (
              <div className="text-center py-12 text-white/40 text-sm">No subscription payments in this window.</div>
            )}
          </GlassCard>

          {/* Net-flow breakdown */}
          <GlassCard className="p-5">
            <h3 className="text-white font-semibold mb-4">How Your Earnings Flow</h3>
            <div className="space-y-3 text-sm">
              <Row label="Gross subscription revenue" value={totals.gross} tone="positive" big />
              <Row label="&minus; Promoter level-1 commission" value={-(totals.promoter_commissions || 0)} tone="negative" />
              <Row label="&minus; Area-manager level-2 override" value={-(totals.area_manager_commissions || 0)} tone="negative" />
              <div className="h-px bg-white/10 my-2" />
              <Row label="Net earnings to ZXCOM" value={totals.net_earnings} tone="positive" big />
              <p className="text-[11px] text-white/40 mt-2">
                GST of {rupees(totals.gst)} ({totals.gst_percent}%) sits inside the gross revenue — pay via GSTR-3B.
              </p>
            </div>
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  );
}

function BreakdownRow({ label, amount, note }) {
  const n = Number(amount || 0);
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="text-lg font-bold text-white mt-1">{rupees(n)}</p>
      {note && <p className="text-[10px] text-white/40 mt-0.5">{note}</p>}
    </div>
  );
}

function Row({ label, value, tone, big }) {
  const color = tone === 'negative' ? 'text-red-300' : tone === 'positive' ? 'text-emerald-300' : 'text-white';
  return (
    <div className="flex items-center justify-between">
      <span
        className={big ? 'text-sm font-semibold text-white' : 'text-sm text-white/70'}
        dangerouslySetInnerHTML={{ __html: label }}
      />
      <span className={`${big ? 'text-xl font-extrabold' : 'text-sm font-semibold'} ${color}`}>
        {value < 0 ? '−' : ''}{rupees(Math.abs(Number(value || 0)))}
      </span>
    </div>
  );
}
