import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Eye, Image } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import GlassCard from '../ui/GlassCard';
import DataTable from '../ui/DataTable';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

export default function CustomerList() {
  const { data, loading, error } = useFetch('/merchants/customers');
  const [billModal, setBillModal] = useState({ open: false, url: '', name: '' });

  if (loading) {
    return (
      <GlassCard className="p-6 flex items-center justify-center min-h-[300px]">
        <Spinner size="lg" />
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-red-400 text-center">{error}</p>
      </GlassCard>
    );
  }

  const customers = data?.customers || [];

  if (customers.length === 0) {
    return (
      <GlassCard className="p-6">
        <EmptyState
          icon={Users}
          title="No Customers Yet"
          description="Customers who submit bills at your shop will appear here."
        />
      </GlassCard>
    );
  }

  const columns = [
    {
      key: 'index',
      label: '#',
      render: (_, __, idx) => (
        <span className="text-white/40 text-xs">{idx + 1}</span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          {row.profile_photo ? (
            <img
              src={row.profile_photo}
              alt={val}
              className="w-8 h-8 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-xs font-medium text-white/50">
                {(val || '?')[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-medium text-white">{val || 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (val) => (
        <span className="text-white/70 text-sm">{val || '--'}</span>
      ),
    },
    {
      key: 'offer',
      label: 'Offer',
      render: (val) => (
        val ? <Badge text={val} variant="success" /> : <span className="text-white/30">--</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (val) => (
        <span className="text-white/60 text-sm">
          {val ? new Date(val).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) : '--'}
        </span>
      ),
    },
    {
      key: 'bill_image',
      label: 'Bill',
      render: (val, row) => (
        val ? (
          <button
            onClick={() => setBillModal({ open: true, url: val, name: row.name })}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all duration-200 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-white/20">--</span>
        )
      ),
    },
  ];

  // Map data with index for the # column render
  const tableData = customers.map((c, idx) => ({ ...c, index: idx + 1 }));

  return (
    <>
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-4 h-4 text-[#e94560]" />
          <h3 className="text-sm font-semibold text-white">Customers</h3>
          <span className="text-xs text-white/40 ml-auto">{customers.length} total</span>
        </div>

        <DataTable
          columns={columns}
          data={tableData}
          emptyMessage="No customers found"
        />
      </GlassCard>

      {/* Bill Image Modal */}
      <Modal
        isOpen={billModal.open}
        onClose={() => setBillModal({ open: false, url: '', name: '' })}
        title={`Bill - ${billModal.name || 'Customer'}`}
        size="md"
      >
        <div className="flex items-center justify-center">
          {billModal.url ? (
            <img
              src={billModal.url}
              alt="Bill"
              className="max-w-full max-h-[60vh] rounded-xl object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-white/30">
              <Image className="w-10 h-10" />
              <p className="text-sm">No bill image available</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
