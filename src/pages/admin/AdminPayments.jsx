import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Gift, Trophy, Award, Users, Store, Settings,
  BarChart3, Package, UserCheck, Wallet, ShoppingBag, Truck, Repeat,
  CheckCircle2, Clock, XCircle, CreditCard, IndianRupee, Receipt,
  Copy, ExternalLink,
  Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';
import Spinner from '../../components/ui/Spinner';
import TableToolbar from '../../components/ui/TableToolbar';
import { exportToCSV, exportToPDF } from '../../utils/tableExport';

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

const DAYS_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
];

const formatInr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const statusStyles = {
  paid: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: CheckCircle2 },
  created: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Clock },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: XCircle },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: Clock },
  shipped: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: Truck },
  out_for_delivery: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', icon: Truck },
  delivered: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: XCircle },
  refunded: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', icon: XCircle },
};

function StatusPill({ status }) {
  const s = statusStyles[status] || statusStyles.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.text} ${s.border}`}>
      <Icon className="w-3 h-3" />
      {String(status || '').replace(/_/g, ' ')}
    </span>
  );
}

function CopyBtn({ text }) {
  if (!text) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(
          () => toast.success('Copied'),
          () => toast.error('Copy failed'),
        );
      }}
      className="p-1 rounded text-white/30 hover:text-white/80 transition-colors cursor-pointer"
      title="Copy"
    >
      <Copy className="w-3 h-3" />
    </button>
  );
}

export default function AdminPayments() {
  const [tab, setTab] = useState('subscriptions');
  const [days, setDays] = useState(90);
  const [data, setData] = useState({ subscriptions: [], orders: [], totals: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/admin/payment-history', { params: { days } })
      .then((res) => {
        if (cancelled) return;
        setData(res.data?.data || { subscriptions: [], orders: [], totals: null });
      })
      .catch(() => toast.error('Failed to load payment history'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  const filteredSubs = useMemo(() => {
    if (!search) return data.subscriptions;
    const q = search.toLowerCase();
    return data.subscriptions.filter((p) =>
      p.payer_name?.toLowerCase().includes(q)
      || p.payer_phone?.includes(search)
      || p.shop_name?.toLowerCase().includes(q)
      || p.pack_name?.toLowerCase().includes(q)
      || p.razorpay_order_id?.toLowerCase().includes(q)
      || p.razorpay_payment_id?.toLowerCase().includes(q)
    );
  }, [data.subscriptions, search]);

  const filteredOrders = useMemo(() => {
    if (!search) return data.orders;
    const q = search.toLowerCase();
    return data.orders.filter((o) =>
      o.customer_name?.toLowerCase().includes(q)
      || o.customer_phone?.includes(search)
      || o.order_number?.toLowerCase().includes(q)
      || o.razorpay_order_id?.toLowerCase().includes(q)
      || o.razorpay_payment_id?.toLowerCase().includes(q)
      || o.attributed_shop?.toLowerCase().includes(q)
    );
  }, [data.orders, search]);

  const SUB_COLUMNS = [
    { key: 'created_at', label: 'Date', export: (v) => (v ? new Date(v).toLocaleString('en-IN') : '') },
    { key: 'payer_name', label: 'Payer' },
    { key: 'payer_phone', label: 'Phone' },
    { key: 'shop_name', label: 'Shop' },
    { key: 'pack_name', label: 'Pack' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'amount', label: 'Amount', export: (v) => (v ? `₹${v}` : '') },
    { key: 'status', label: 'Status' },
    { key: 'razorpay_order_id', label: 'RZP Order' },
    { key: 'razorpay_payment_id', label: 'RZP Payment' },
  ];

  const ORDER_COLUMNS = [
    { key: 'created_at', label: 'Date', export: (v) => (v ? new Date(v).toLocaleString('en-IN') : '') },
    { key: 'order_number', label: 'Order #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'customer_phone', label: 'Phone' },
    { key: 'attributed_shop', label: 'Attributed Shop' },
    { key: 'item_count', label: 'Items' },
    { key: 'total', label: 'Total', export: (v) => (v ? `₹${v}` : '') },
    { key: 'status', label: 'Status' },
    { key: 'nimbuspost_awb', label: 'AWB' },
    { key: 'razorpay_payment_id', label: 'RZP Payment' },
  ];

  const totals = data.totals || { subscription_revenue: 0, ecom_revenue: 0, subscription_count: 0, ecom_count: 0 };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} title="Admin Panel">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Payment History</h1>
          <p className="text-sm text-white/40 mt-1">
            All Razorpay transactions across subscriptions and ecom orders.
          </p>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">Subscription Revenue</p>
                <p className="text-lg font-bold text-white">{formatInr(totals.subscription_revenue)}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#e94560]/20 to-[#c23616]/10">
                <ShoppingBag className="w-5 h-5 text-[#e94560]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">Ecom Revenue</p>
                <p className="text-lg font-bold text-white">{formatInr(totals.ecom_revenue)}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                <Repeat className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">Subscription Txns</p>
                <p className="text-lg font-bold text-white">{totals.subscription_count}</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10">
                <Receipt className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40">Ecom Orders</p>
                <p className="text-lg font-bold text-white">{totals.ecom_count}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Tabs + window selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab('subscriptions')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border flex items-center gap-2 ${
                tab === 'subscriptions'
                  ? 'border-[#e94560] bg-[#e94560]/10 text-[#e94560]'
                  : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
              }`}
            >
              <Repeat className="w-4 h-4" />
              Subscriptions
              <span className="ml-1 text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded">{data.subscriptions.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border flex items-center gap-2 ${
                tab === 'orders'
                  ? 'border-[#e94560] bg-[#e94560]/10 text-[#e94560]'
                  : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Ecom Orders
              <span className="ml-1 text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded">{data.orders.length}</span>
            </button>
          </div>

          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDays(d.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  days === d.value ? 'bg-[#e94560] text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'subscriptions' ? (
          <>
            <TableToolbar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by payer, shop, pack, or Razorpay id..."
              totalCount={filteredSubs.length}
              onExportCSV={() => exportToCSV(SUB_COLUMNS, filteredSubs, 'subscription-payments')}
              onExportPDF={() => exportToPDF(SUB_COLUMNS, filteredSubs, 'subscription-payments', 'Subscription Payments')}
            />
            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : filteredSubs.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <CreditCard className="w-12 h-12 text-white/15 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No subscription payments in this window</p>
              </GlassCard>
            ) : (
              <GlassCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        <th className="text-left font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Date</th>
                        <th className="text-left font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Payer</th>
                        <th className="text-left font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Shop / Pack</th>
                        <th className="text-left font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Purpose</th>
                        <th className="text-right font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Amount</th>
                        <th className="text-left font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Status</th>
                        <th className="text-left font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Razorpay Ids</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubs.map((p, idx) => (
                        <motion.tr
                          key={p._id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.015 }}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3 text-white/70 text-xs whitespace-nowrap">{formatDate(p.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="text-white font-medium">{p.payer_name || '—'}</div>
                            <div className="text-[11px] text-white/40">{p.payer_phone}</div>
                            {p.payer_role && <div className="text-[10px] uppercase tracking-wider text-white/30">{p.payer_role}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-white/80 text-xs">{p.shop_name || '—'}</div>
                            <div className="text-[11px] text-white/40">{p.pack_name || '—'}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-white/60 whitespace-nowrap">{(p.purpose || '').replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3 text-right font-semibold text-white whitespace-nowrap">
                            <span className="inline-flex items-center">
                              <IndianRupee className="w-3 h-3 text-white/50" />
                              {Number(p.amount || 0).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-[11px] text-white/50 font-mono">
                              {p.razorpay_order_id ? (
                                <>
                                  <span title={p.razorpay_order_id}>{p.razorpay_order_id.slice(0, 14)}…</span>
                                  <CopyBtn text={p.razorpay_order_id} />
                                </>
                              ) : '—'}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-white/50 font-mono">
                              {p.razorpay_payment_id ? (
                                <>
                                  <span title={p.razorpay_payment_id}>{p.razorpay_payment_id.slice(0, 14)}…</span>
                                  <CopyBtn text={p.razorpay_payment_id} />
                                </>
                              ) : '—'}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}
          </>
        ) : (
          <>
            <TableToolbar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by customer, order #, shop, or Razorpay id..."
              totalCount={filteredOrders.length}
              onExportCSV={() => exportToCSV(ORDER_COLUMNS, filteredOrders, 'ecom-orders')}
              onExportPDF={() => exportToPDF(ORDER_COLUMNS, filteredOrders, 'ecom-orders', 'Ecom Orders')}
            />
            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : filteredOrders.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <ShoppingBag className="w-12 h-12 text-white/15 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No ecom orders in this window</p>
              </GlassCard>
            ) : (
              <GlassCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02]">
                        <th className="text-left font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Date</th>
                        <th className="text-left font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Order</th>
                        <th className="text-left font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Customer</th>
                        <th className="text-left font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Shop</th>
                        <th className="text-right font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Items</th>
                        <th className="text-right font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Total</th>
                        <th className="text-left font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">Status</th>
                        <th className="text-left font-semibold text-white/60 text-xs uppercase tracking-wider px-4 py-3">AWB / RZP</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o, idx) => (
                        <motion.tr
                          key={o._id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.015 }}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3 text-white/70 text-xs whitespace-nowrap">{formatDate(o.created_at)}</td>
                          <td className="px-4 py-3 text-white font-mono text-xs">{o.order_number}</td>
                          <td className="px-4 py-3">
                            <div className="text-white">{o.customer_name || '—'}</div>
                            <div className="text-[11px] text-white/40">{o.customer_phone}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-white/60">{o.attributed_shop || '—'}</td>
                          <td className="px-4 py-3 text-right text-white/70 text-xs">{o.item_count}</td>
                          <td className="px-4 py-3 text-right font-semibold text-white whitespace-nowrap">
                            <span className="inline-flex items-center">
                              <IndianRupee className="w-3 h-3 text-white/50" />
                              {Number(o.total || 0).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-4 py-3"><StatusPill status={o.status} /></td>
                          <td className="px-4 py-3">
                            {o.nimbuspost_awb && (
                              <div className="flex items-center gap-1 text-[11px] text-blue-300 font-mono">
                                <span title={o.nimbuspost_awb}>AWB {o.nimbuspost_awb}</span>
                                <CopyBtn text={o.nimbuspost_awb} />
                              </div>
                            )}
                            {o.razorpay_payment_id && (
                              <div className="flex items-center gap-1 text-[11px] text-white/50 font-mono">
                                <span title={o.razorpay_payment_id}>{o.razorpay_payment_id.slice(0, 14)}…</span>
                                <CopyBtn text={o.razorpay_payment_id} />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/admin/orders/${o._id}`}
                              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors inline-flex"
                              title="View order"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
