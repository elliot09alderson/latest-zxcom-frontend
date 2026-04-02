import { Users } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import DataTable from '../ui/DataTable';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  {
    key: 'status',
    label: 'Status',
    render: (val) => (
      <Badge
        text={val === 'active' ? 'Active' : val === 'pending' ? 'Pending' : 'Inactive'}
        variant={val === 'active' ? 'success' : val === 'pending' ? 'warning' : 'danger'}
      />
    ),
  },
  { key: 'shops_count', label: 'Shops Count' },
  {
    key: 'joined_date',
    label: 'Joined Date',
    render: (val) =>
      val ? new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
  },
];

export default function PromoterList() {
  const { data, loading } = useFetch('/promoters/network/promoters');
  const promoters = data?.promoters || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (promoters.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No promoters referred yet"
        description="Share your referral code to grow your promoter network."
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={promoters}
      emptyMessage="No promoters referred yet"
    />
  );
}
