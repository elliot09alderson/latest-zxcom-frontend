import {
  LayoutDashboard,
  Users,
  QrCode,
  IndianRupee,
  CreditCard,
  User,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EarningsPanel from '../../components/promoter/EarningsPanel';

const sidebarLinks = [
  { path: '/promoter', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: '/promoter/network', label: 'Network', icon: <Users size={18} /> },
  { path: '/promoter/qr-codes', label: 'QR Codes', icon: <QrCode size={18} /> },
  { path: '/promoter/earnings', label: 'Earnings', icon: <IndianRupee size={18} /> },
  { path: '/promoter/id-card', label: 'ID Card', icon: <CreditCard size={18} /> },
  { path: '/promoter/profile', label: 'Profile', icon: <User size={18} /> },
];

export default function PromoterEarnings() {
  return (
    <DashboardLayout sidebarLinks={sidebarLinks} title="Promoter Portal">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Earnings</h1>
        <EarningsPanel />
      </div>
    </DashboardLayout>
  );
}
