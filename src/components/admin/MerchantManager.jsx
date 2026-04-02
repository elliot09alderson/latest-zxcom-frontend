import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Store, Pencil, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import useFetch from '../../hooks/useFetch';
import DataTable from '../ui/DataTable';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

const initialForm = {
  shop_name: '',
  owner_name: '',
  phone: '',
  area: '',
  plan: '',
  status: '',
};

export default function MerchantManager() {
  const { data, loading, error, refetch } = useFetch('/admin/merchants');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const merchants = data?.merchants || [];

  const filtered = merchants.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (m.shop_name || '').toLowerCase().includes(q) ||
      (m.owner_name || m.owner || '').toLowerCase().includes(q) ||
      (m.area || '').toLowerCase().includes(q) ||
      (m.phone || '').includes(q)
    );
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const openEdit = (merchant) => {
    setEditId(merchant._id || merchant.id);
    setForm({
      shop_name: merchant.shop_name || '',
      owner_name: merchant.owner_name || merchant.owner || '',
      phone: merchant.phone || '',
      area: merchant.area || '',
      plan: merchant.plan || '',
      status: merchant.status || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/merchants/${editId}`, form);
      toast.success('Merchant updated successfully');
      setModalOpen(false);
      setEditId(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update merchant');
    } finally {
      setSaving(false);
    }
  }, [form, editId, refetch]);

  const getPlanVariant = (plan) => {
    const map = { basic: 'default', premium: 'warning', enterprise: 'success' };
    return map[plan?.toLowerCase()] || 'default';
  };

  const getStatusVariant = (status) => {
    const map = { active: 'success', inactive: 'danger', pending: 'warning', suspended: 'danger' };
    return map[status?.toLowerCase()] || 'default';
  };

  const columns = [
    { key: 'shop_name', label: 'Shop Name' },
    {
      key: 'owner_name',
      label: 'Owner',
      render: (val, row) => val || row.owner || '-',
    },
    { key: 'area', label: 'Area' },
    {
      key: 'plan',
      label: 'Plan',
      render: (val) => val ? <Badge text={val} variant={getPlanVariant(val)} /> : '-',
    },
    {
      key: 'submissions_count',
      label: 'Submissions',
      render: (val) => val ?? 0,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge text={val || 'N/A'} variant={getStatusVariant(val)} />,
    },
    {
      key: 'onboarded_by',
      label: 'Onboarded By',
      render: (val, row) => val || row.promoter_name || '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => openEdit(row)}
          className="p-1.5 rounded-lg text-white/50 hover:text-blue-400 hover:bg-blue-400/10 transition-all cursor-pointer"
        >
          <Pencil className="w-4 h-4" />
        </button>
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
          <div className="p-2 rounded-xl bg-[#e94560]/10">
            <Store className="w-5 h-5 text-[#e94560]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Merchants</h2>
            <p className="text-xs text-white/40">{merchants.length} total merchants</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5 max-w-sm">
        <Input
          placeholder="Search by shop, owner, area, or phone..."
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? (
        <div className="text-center py-8 text-red-400 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Store}
          title={search ? 'No results found' : 'No merchants yet'}
          description={search ? 'Try adjusting your search query.' : 'Merchants will appear here once they are onboarded.'}
        />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditId(null); }}
        title="Edit Merchant"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Shop Name"
            name="shop_name"
            value={form.shop_name}
            onChange={handleChange}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Owner Name"
              name="owner_name"
              value={form.owner_name}
              onChange={handleChange}
            />
            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <Input
            label="Area"
            name="area"
            value={form.area}
            onChange={handleChange}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Plan"
              name="plan"
              value={form.plan}
              onChange={handleChange}
              options={[
                { value: 'basic', label: 'Basic' },
                { value: 'premium', label: 'Premium' },
                { value: 'enterprise', label: 'Enterprise' },
              ]}
            />
            <Select
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' },
                { value: 'suspended', label: 'Suspended' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Update Merchant
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
