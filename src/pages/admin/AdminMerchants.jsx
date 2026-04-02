import {
  LayoutDashboard,
  Gift,
  Trophy,
  Award,
  Users,
  Store,
  Settings,
  BarChart3,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MerchantManager from '../../components/admin/MerchantManager';

const sidebarLinks = [
  { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: '/admin/offers', label: 'Offers', icon: <Gift size={18} /> },
  { path: '/admin/contests', label: 'Contests', icon: <Trophy size={18} /> },
  { path: '/admin/winners', label: 'Winners', icon: <Award size={18} /> },
  { path: '/admin/promoters', label: 'Promoters', icon: <Users size={18} /> },
  { path: '/admin/merchants', label: 'Merchants', icon: <Store size={18} /> },
  { path: '/admin/config', label: 'Config', icon: <Settings size={18} /> },
  { path: '/admin/leaderboard', label: 'Leaderboard', icon: <BarChart3 size={18} /> },
];

export default function AdminMerchants() {
  return (
    <DashboardLayout sidebarLinks={sidebarLinks} title="Admin Panel">
      <MerchantManager />
    </DashboardLayout>
  );
}
