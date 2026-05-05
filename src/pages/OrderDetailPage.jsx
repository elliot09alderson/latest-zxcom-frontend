import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, MapPin, Truck, CheckCircle2, XCircle, Clock, ArrowLeft,
  ExternalLink, CircleDot, CreditCard, Hash, FileDown, Phone, LifeBuoy,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../config/api';
import PublicLayout from '../components/layout/PublicLayout';
import GlassCard from '../components/ui/GlassCard';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const STATUS_META = {
  pending:          { label: 'Pending',         icon: Clock,        variant: 'warning', color: 'text-amber-300' },
  paid:             { label: 'Paid',            icon: CheckCircle2, variant: 'success', color: 'text-emerald-300' },
  shipped:          { label: 'Shipped',         icon: Truck,        variant: 'info',    color: 'text-blue-300' },
  out_for_delivery: { label: 'Out for delivery', icon: Truck,        variant: 'info',    color: 'text-blue-300' },
  delivered:        { label: 'Delivered',       icon: CheckCircle2, variant: 'success', color: 'text-emerald-300' },
  cancelled:        { label: 'Cancelled',       icon: XCircle,      variant: 'danger',  color: 'text-red-300' },
  refunded:         { label: 'Refunded',        icon: XCircle,      variant: 'default', color: 'text-white/50' },
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  : '';
const fmtDay = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '';
const fmtMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Ordered progression used by the progress tracker strip. cancelled/refunded
// render as a terminal "Cancelled" pill instead of following this flow.
const FLOW_STEPS = [
  { key: 'pending',          label: 'Placed',        icon: Package },
  { key: 'paid',             label: 'Paid',          icon: CheckCircle2 },
  { key: 'shipped',          label: 'Shipped',       icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered',        label: 'Delivered',     icon: CheckCircle2 },
];

// Map status → the index it reaches on the flow strip.
function flowIndex(status) {
  const i = FLOW_STEPS.findIndex((s) => s.key === status);
  return i >= 0 ? i : 0;
}

// When is the package expected? Rough heuristic so the customer sees a
// friendly ETA ("Arriving today", "Arriving tomorrow", or a date). Prefers
// the courier's EDD if present, else computes from shipped/paid dates.
function computeETA(order) {
  const ship = order.nimbuspost?.awb_code ? order.nimbuspost
            : order.shiprocket?.shipment_id ? order.shiprocket
            : null;
  const edd = ship?.expected_delivery_date || ship?.edd;
  const base = edd
    ? new Date(edd)
    : order.status === 'shipped' || order.status === 'out_for_delivery'
      ? new Date((ship?.created_at ? new Date(ship.created_at).getTime() : Date.now()) + 3 * 24 * 60 * 60 * 1000)
      : order.paid_at
        ? new Date(new Date(order.paid_at).getTime() + 5 * 24 * 60 * 60 * 1000)
        : null;
  if (!base) return null;
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const today = startOfDay(new Date());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const eddDay = startOfDay(base);
  if (eddDay.getTime() === today.getTime()) return 'Arriving today';
  if (eddDay.getTime() === tomorrow.getTime()) return 'Arriving tomorrow';
  if (eddDay < today) return 'Arrival overdue — please contact support';
  return `Arriving by ${fmtDay(base)}`;
}

// Business contact details — used in the help block and receipts.
const SUPPORT = {
  phone: '+91 62648 24626',
  phoneDigits: '+916264824626',
  email: 'support@zxcom.in',
  hours: 'Mon–Sat, 10:00 AM – 7:00 PM IST',
};

/**
 * Layout-agnostic order detail content.
 *   backPath — URL of the orders list the caller wants to link back to.
 */
export function OrderDetailContent({ backPath = '/orders' }) {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const downloadReceipt = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/orders/${id}/receipt`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const orderNum = order?.order_number || `ZX-${String(id).slice(-6).toUpperCase()}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `zxcom-receipt-${orderNum}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not download receipt');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data.data?.order || data.order || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>;
  }
  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-red-400 text-sm mb-4">{error || 'Order not found'}</p>
        <Link to={backPath} className="text-[#e94560] text-sm hover:underline">← Back to orders</Link>
      </div>
    );
  }

  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const addr = order.shipping_address || {};
  const ship = order.nimbuspost?.awb_code ? order.nimbuspost
            : order.shiprocket?.shipment_id ? order.shiprocket
            : null;
  const shipProvider = order.nimbuspost?.awb_code ? 'NimbusPost'
                     : order.shiprocket?.shipment_id ? 'Shiprocket'
                     : null;
  const history = Array.isArray(order.status_history) ? [...order.status_history].sort((a, b) => new Date(a.at) - new Date(b.at)) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back + header */}
      <Link to={backPath} className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to orders
      </Link>

        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Order {order.order_number || `#${(order._id || '').slice(-6).toUpperCase()}`}</h1>
              <Badge text={meta.label} variant={meta.variant} />
            </div>
            <p className="text-xs text-white/40">Placed on {fmtDate(order.createdAt)}</p>
          </div>
          <Button icon={FileDown} onClick={downloadReceipt} loading={downloading}>
            Download Receipt
          </Button>
        </motion.div>

        {/* Delivery progress tracker — always rendered for active orders.
            Cancelled/refunded orders get a terminal banner instead. */}
        {(order.status === 'cancelled' || order.status === 'refunded') ? (
          <GlassCard className="p-5 border-red-500/30 bg-red-500/5">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-200">
                  {order.status === 'cancelled' ? 'Order cancelled' : 'Order refunded'}
                </p>
                <p className="text-[11px] text-white/50 mt-0.5">
                  Need help? Contact <a href={`tel:${SUPPORT.phoneDigits}`} className="text-[#e94560] hover:underline">{SUPPORT.phone}</a>.
                </p>
              </div>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#e94560]">Delivery Progress</p>
              {(() => {
                const eta = computeETA(order);
                if (!eta) return null;
                const isToday = eta === 'Arriving today';
                const overdue = eta.startsWith('Arrival overdue');
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    overdue
                      ? 'bg-red-500/15 text-red-300 border-red-500/30'
                      : isToday
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  }`}>
                    <Truck className="w-3.5 h-3.5" />
                    {eta}
                  </span>
                );
              })()}
            </div>
            <div className="relative flex items-start justify-between">
              {FLOW_STEPS.map((step, i) => {
                const currentIdx = flowIndex(order.status);
                const completed = i < currentIdx;
                const active = i === currentIdx;
                const StepIcon = step.icon;
                const colour = completed
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : active
                    ? 'bg-[#e94560] text-white border-[#e94560] shadow-lg shadow-[#e94560]/30'
                    : 'bg-white/5 text-white/40 border-white/10';
                const lineCompleted = i < currentIdx;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center relative min-w-0">
                    {i < FLOW_STEPS.length - 1 && (
                      <div
                        aria-hidden
                        className={`absolute top-5 left-1/2 right-0 h-0.5 -z-0 ${lineCompleted ? 'bg-emerald-500' : 'bg-white/10'}`}
                        style={{ width: '100%' }}
                      />
                    )}
                    <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center ${colour}`}>
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <p className={`mt-2 text-[11px] font-semibold text-center ${active ? 'text-white' : completed ? 'text-emerald-300' : 'text-white/40'}`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
            {order.status === 'shipped' || order.status === 'out_for_delivery' ? (
              <p className="mt-4 text-[11px] text-white/50 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[#e94560]" />
                Our delivery partner will call you on{' '}
                <span className="text-white font-mono">{order.shipping_address?.phone || SUPPORT.phone}</span>{' '}
                before arriving.
              </p>
            ) : null}
          </GlassCard>
        )}

        {/* Tracking strip */}
        {ship && (
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Truck className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider">Shipment</p>
                <p className="text-sm font-semibold text-white">
                  {shipProvider}{ship.courier_name ? ` via ${ship.courier_name}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              {ship.awb_code && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1"><Hash className="w-3 h-3" />AWB Number</p>
                  <p className="text-xs font-mono text-white break-all">{ship.awb_code}</p>
                </div>
              )}
              {ship.status && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1"><CircleDot className="w-3 h-3" />Courier Status</p>
                  <p className="text-xs font-semibold text-white capitalize">{ship.status}</p>
                </div>
              )}
              {ship.last_synced_at && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Last Synced</p>
                  <p className="text-xs text-white/80">{fmtDate(ship.last_synced_at)}</p>
                </div>
              )}
            </div>

            {ship.tracking_url && (
              <a href={ship.tracking_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
                <Button size="sm" icon={ExternalLink}>Track on {shipProvider}</Button>
              </a>
            )}
          </GlassCard>
        )}

        {/* Status timeline */}
        {history.length > 0 && (
          <GlassCard className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#e94560] mb-4">Order Timeline</p>
            <ol className="relative border-l border-white/10 ml-2 space-y-5">
              {history.map((h, i) => {
                const m = STATUS_META[h.status] || STATUS_META.pending;
                const Icon = m.icon;
                const isLatest = i === history.length - 1;
                return (
                  <li key={i} className="ml-5">
                    <span className={`absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-[#0a0a1a] ${isLatest ? 'bg-[#e94560]' : 'bg-white/20'}`}>
                      <Icon className="w-2.5 h-2.5 text-white" />
                    </span>
                    <p className={`text-sm font-semibold ${m.color}`}>{m.label}</p>
                    <p className="text-[11px] text-white/40">{fmtDate(h.at)} · via {h.source || 'system'}</p>
                    {h.note && <p className="text-[11px] text-white/50 mt-0.5 italic">{h.note}</p>}
                  </li>
                );
              })}
            </ol>
          </GlassCard>
        )}

        {/* Items */}
        <GlassCard className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#e94560] mb-4 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> Items ({order.items?.length || 0})
          </p>
          <div className="space-y-3">
            {(order.items || []).map((it, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                {it.image ? (
                  <img src={it.image} alt={it.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-white/5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{it.name}</p>
                  <p className="text-[11px] text-white/40">
                    {it.qty} × {fmtMoney(it.price)}
                    {it.size ? ` · Size ${it.size}` : ''}
                  </p>
                </div>
                <p className="text-sm font-bold text-white flex-shrink-0">{fmtMoney((it.price || 0) * (it.qty || 1))}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5 text-sm">
            <div className="flex justify-between text-white/60"><span>Subtotal</span><span>{fmtMoney(order.subtotal)}</span></div>
            {order.delivery_fee > 0 && <div className="flex justify-between text-white/60"><span>Delivery</span><span>{fmtMoney(order.delivery_fee)}</span></div>}
            {order.tax_amount > 0 && <div className="flex justify-between text-white/60"><span>Tax</span><span>{fmtMoney(order.tax_amount)}</span></div>}
            <div className="flex justify-between text-base font-bold text-white pt-1">
              <span>Total</span><span className="text-[#e94560]">{fmtMoney(order.total)}</span>
            </div>
          </div>
        </GlassCard>

        {/* Shipping & payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#e94560] mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Delivery Address
            </p>
            <p className="text-sm font-semibold text-white">{addr.full_name}</p>
            <p className="text-xs text-white/60 mt-1">
              {addr.address_line1}
              {addr.address_line2 ? `, ${addr.address_line2}` : ''}
            </p>
            <p className="text-xs text-white/60">{addr.city}, {addr.state} – {addr.pincode}</p>
            <p className="text-xs text-white/50 mt-1">Phone: {addr.phone}</p>
          </GlassCard>

          <GlassCard className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-[#e94560] mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Payment
            </p>
            <p className="text-sm font-semibold text-white capitalize">
              {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Razorpay (Online)'}
            </p>
            {order.paid_at && (
              <p className="text-xs text-white/60 mt-1">Paid on {fmtDate(order.paid_at)}</p>
            )}
            {order.razorpay_payment_id && (
              <p className="text-[11px] text-white/40 font-mono mt-1 break-all">
                Ref: {order.razorpay_payment_id}
              </p>
            )}
          </GlassCard>
        </div>

        {/* Need help block — always visible so the customer has somewhere
            to go if the automated tracker is ambiguous. */}
        <GlassCard className="p-5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-[#e94560]/10 border border-[#e94560]/20">
              <LifeBuoy className="w-4 h-4 text-[#e94560]" />
            </div>
            <h3 className="text-white font-semibold text-sm">Need help with this order?</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <a
              href={`tel:${SUPPORT.phoneDigits}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Phone className="w-4 h-4 text-[#e94560]" />
              <div>
                <p className="text-xs text-white/50">Call us</p>
                <p className="text-sm font-semibold text-white">{SUPPORT.phone}</p>
              </div>
            </a>
            <a
              href={`mailto:${SUPPORT.email}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-[#e94560]" />
              <div>
                <p className="text-xs text-white/50">Email support</p>
                <p className="text-sm font-semibold text-white">{SUPPORT.email}</p>
              </div>
            </a>
          </div>
          <p className="text-[11px] text-white/40 mt-3">
            We usually respond within a business day. Support hours: {SUPPORT.hours}.
          </p>
        </GlassCard>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <PublicLayout>
      <OrderDetailContent backPath="/orders" />
    </PublicLayout>
  );
}
