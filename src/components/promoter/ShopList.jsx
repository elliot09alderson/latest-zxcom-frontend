import { Store } from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import DataTable from '../ui/DataTable';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

const columns = [
  { key: 'name', label: 'Shop Name' },
  { key: 'owner', label: 'Owner' },
  { key: 'area', label: 'Area' },
  {
    key: 'status',
    label: 'Status',
    render: (val) => (
      <Badge
        text={val === 'active' ? 'Active' : 'Inactive'}
        variant={val === 'active' ? 'success' : 'danger'}
      />
    ),
  },
  { key: 'submissions', label: 'Submissions' },
  {
    key: 'joined_date',
    label: 'Joined Date',
    render: (val) =>
      val ? new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
  },
];

export default function ShopList() {
  const { data, loading } = useFetch('/promoters/network/shops');
  const shops = data?.shops || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <EmptyState
        icon={Store}
        title="No shops onboarded yet"
        description="Start onboarding merchants using your QR codes to see them here."
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={shops}
      emptyMessage="No shops onboarded yet"
    />
  );
}
