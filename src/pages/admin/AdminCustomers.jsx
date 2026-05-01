import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Gift, Trophy, Award, Users, Store, Settings, BarChart3, Package,
  UserCheck, Eye, Wallet, ShoppingBag, Truck,
  Repeat, Trash2, Phone as PhoneIcon, Mail, ShoppingCart,
  Crown,
} from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import api from '../../config/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

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

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const fullUrl = (url) => url ? (url.startsWith('http') ? url : `${API_BASE}${url}`) : '';

export default function AdminCustomers() {
  const { data, loading, error, refetch } = useFetch('/admin/customers');
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('customers');     // 'customers' | 'users'
  const [freePhoneInput, setFreePhoneInput] = useState('');
  const [freePhoneBusy, setFreePhoneBusy] = useState(false);

  const handleFreePhone = async () => {
    const phone = String(freePhoneInput || '').trim();
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Enter a 10-digit phone number');
      return;
    }
    if (!window.confirm(
      `Permanently delete the customer record for phone ${phone}?\n\n` +
      `This will:\n` +
      `  • Remove the User account (if any — direct ZXCOM signup)\n` +
      `  • Remove all Customer / QR-scan records for this phone\n` +
      `  • Remove saved delivery addresses\n` +
      `  • Past orders are kept (for tax/audit) but the user_id link is dropped\n\n` +
      `After this, the phone is FREE to be re-registered as a merchant or promoter.\n` +
      `This is irreversible.`
    )) return;
    setFreePhoneBusy(true);
    try {
      const res = await api.delete(`/admin/users/by-phone/${phone}`);
      const d = res.data?.data || res.data || {};
      toast.success(`Phone ${phone} freed up · ${d.customer_rows_deleted || 0} customer rows removed`);
      setFreePhoneInput('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to free up phone');
    } finally {
      setFreePhoneBusy(false);
    }
  };

  // ── Tab 1: Customers (QR-scan submissions) ──
  const customers = (data?.customers || []).map((c) => ({
    ...c,
    merchant_name: c.merchant_id?.name || '-',
    merchant_phone: c.merchant_id?.phone || '',
    promoter_name: c.promoter_id?.name || '-',
    promoter_phone: c.promoter_id?.phone || '',
  }));

  const customerColumns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'age', label: 'Age', render: (v) => v || '-', export: (v) => v || '' },
    {
      key: 'bill_value',
      label: 'Purchase',
      render: (v) => (v ? <Badge text={`₹${v}`} variant="warning" /> : '-'),
      export: (v) => (v ? `₹${v}` : ''),
    },
    { key: 'merchant_name', label: 'Shop' },
    { key: 'promoter_name', label: 'Promoter' },
    {
      key: 'createdAt', label: 'Date',
      render: (v) => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
      export: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '',
    },
    {
      key: 'actions', label: '', exportable: false,
      render: (_, row) => (
        <button onClick={() => setSelected(row)} className="p-1.5 rounded-lg text-white/50 hover:text-blue-400 hover:bg-blue-400/10 transition-all cursor-pointer">
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  // ── Tab 2: Users (direct ZXCOM ecom signups) ──
  const users = (data?.users || []).map((u) => ({
    ...u,
    email_display: u.email || '-',
    address_display: u.address || '-',
  }));

  const userColumns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email_display', label: 'Email', export: (v) => v },
    { key: 'address_display', label: 'Address', export: (v) => v },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge text={v || 'active'} variant={v === 'active' ? 'success' : 'default'} />,
      export: (v) => v || 'active',
    },
    {
      key: 'createdAt', label: 'Joined',
      render: (v) => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
      export: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '',
    },
  ];

  // ── Delete handlers ──
  const handleDeleteCustomer = async (row) => {
    try {
      await api.delete(`/admin/customers/${row._id}`);
      toast.success('Customer deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleBulkDeleteCustomers = async (rows) => {
    try {
      await api.post('/admin/customers/bulk-delete', { ids: rows.map((r) => r._id) });
      toast.success(`Deleted ${rows.length} customers`);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk delete failed');
    }
  };

  const handleDeleteAllCustomers = async () => {
    try {
      await api.delete('/admin/customers');
      toast.success('All customers deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete all failed');
    }
  };

  // For Users tab — delete via the cascade by-phone endpoint (User + Customer + DeliveryAddress).
  const handleDeleteUser = async (row) => {
    if (!row.phone) { toast.error('User has no phone'); return; }
    try {
      await api.delete(`/admin/users/by-phone/${row.phone}`);
      toast.success(`Deleted ${row.name || row.phone}; phone is free`);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <DashboardLayout sidebarLinks={sidebarLinks} title="Admin Panel"><div className="flex items-center justify-center py-16"><Spinner size="lg" /></div></DashboardLayout>;

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} title="Admin Panel">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10"><UserCheck className="w-5 h-5 text-emerald-400" /></div>
            <div>
              <h2 className="text-xl font-bold text-white">Customers</h2>
              <p className="text-xs text-white/40">
                {customers.length} from QR scans · {users.length} direct ZXCOM signups
              </p>
            </div>
          </div>
        </div>

        {/* Free up phone — works regardless of tab */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3 mb-3">
            <Trash2 className="w-4 h-4 text-amber-300 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Free up a customer phone</p>
              <p className="text-[11px] text-white/50">
                Cascade-delete by phone — works for both <span className="text-white/80">QR-scan customers</span> and <span className="text-white/80">direct ZXCOM signups</span>.
                Removes the User account (if any), all Customer/QR-scan rows, and saved addresses, so the phone is free for
                re-registration. <span className="text-amber-200/80">Refuses if the phone belongs to a merchant / promoter / admin.</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <PhoneIcon className="w-4 h-4 text-white/30" />
              <input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit phone (e.g. 8225982292)"
                value={freePhoneInput}
                maxLength={10}
                onChange={(e) => setFreePhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              />
            </div>
            <button
              onClick={handleFreePhone}
              disabled={freePhoneBusy || freePhoneInput.length !== 10}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-sm font-semibold text-red-200 hover:bg-red-500/25 hover:text-red-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {freePhoneBusy ? 'Freeing…' : 'Delete & Free Phone'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-white/5">
          {[
            { key: 'customers', label: 'Customers', icon: UserCheck, count: customers.length, hint: 'From QR scans' },
            { key: 'users', label: 'Users', icon: ShoppingCart, count: users.length, hint: 'Direct ZXCOM signups' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                tab === t.key
                  ? 'border-[#e94560] text-white'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label} ({t.count})
              <span className="text-[10px] text-white/30 hidden sm:inline">· {t.hint}</span>
            </button>
          ))}
        </div>

        {error ? (
          <div className="text-center py-8 text-red-400 text-sm">{error}</div>
        ) : tab === 'customers' ? (
          <DataTable
            columns={customerColumns}
            data={customers}
            title="Customers"
            exportFilename="customers"
            searchable
            searchPlaceholder="Search by name, phone, shop, address..."
            exportable
            onDelete={handleDeleteCustomer}
            onBulkDelete={handleBulkDeleteCustomers}
            onDeleteAll={handleDeleteAllCustomers}
            emptyMessage="No customers yet. They'll appear here once they submit forms via QR."
          />
        ) : (
          <DataTable
            columns={userColumns}
            data={users}
            title="Users"
            exportFilename="zxcom-users"
            searchable
            searchPlaceholder="Search by name, phone, email..."
            exportable
            onDelete={handleDeleteUser}
            emptyMessage="No direct-signup users. People who registered on ZXCOM (without scanning a QR) will appear here."
          />
        )}

        {/* Detail Modal — Customer (QR-scan) */}
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Customer Details" size="md">
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/10 flex items-center justify-center overflow-hidden">
                  {selected.profile_photo_url ? (
                    <img src={fullUrl(selected.profile_photo_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-white/40">{(selected.name || 'C').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selected.name}</h3>
                  <p className="text-sm text-white/40">{selected.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Age', value: selected.age || '-' },
                  { label: 'Purchase', value: selected.bill_value ? `₹${selected.bill_value}` : '-' },
                  { label: 'Pincode', value: selected.pincode || '-' },
                  { label: 'Address', value: selected.address || '-' },
                  { label: 'Shop', value: selected.merchant_name },
                  { label: 'Shop Phone', value: selected.merchant_phone || '-' },
                  { label: 'Promoter', value: selected.promoter_name },
                  { label: 'Date', value: selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-white truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              {selected.bill_image_url && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Bill Image</p>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img src={fullUrl(selected.bill_image_url)} alt="Bill" className="w-full max-h-60 object-contain bg-white/5" />
                  </div>
                </div>
              )}

              {selected.profile_photo_url && (
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Profile Photo</p>
                  <div className="rounded-xl overflow-hidden border border-white/10 w-32">
                    <img src={fullUrl(selected.profile_photo_url)} alt="Profile" className="w-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
