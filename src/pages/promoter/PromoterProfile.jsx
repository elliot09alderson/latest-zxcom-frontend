import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  QrCode,
  IndianRupee,
  CreditCard,
  User,
  Mail,
  MapPin,
  Phone,
  Camera,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import IdCardDownload from '../../components/promoter/IdCardDownload';
import EarningsPanel from '../../components/promoter/EarningsPanel';

const sidebarLinks = [
  { path: '/promoter', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: '/promoter/network', label: 'Network', icon: <Users size={18} /> },
  { path: '/promoter/qr-codes', label: 'QR Codes', icon: <QrCode size={18} /> },
  { path: '/promoter/earnings', label: 'Earnings', icon: <IndianRupee size={18} /> },
  { path: '/promoter/id-card', label: 'ID Card', icon: <CreditCard size={18} /> },
  { path: '/promoter/profile', label: 'Profile', icon: <User size={18} /> },
];

export default function PromoterProfile() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: user?.address || '',
    avatar: null,
  });
  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  const existingAvatar = user?.avatar_url ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE}${user.avatar_url}`) : '';
  const [avatarPreview, setAvatarPreview] = useState(existingAvatar);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setForm((prev) => ({ ...prev, avatar: file }));
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('address', form.address);
      if (form.avatar) {
        formData.append('avatar', form.avatar);
      }

      const res = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update local user state with new data
      const updatedUser = res.data?.data?.user || res.data?.user;
      if (updatedUser) {
        const stored = JSON.parse(localStorage.getItem('xflex_user') || '{}');
        const merged = { ...stored, ...updatedUser };
        localStorage.setItem('xflex_user', JSON.stringify(merged));
      }

      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} title="Promoter Portal">
      <div className="space-y-8">
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-sm text-white/40 mt-1">
            Manage your promoter profile and view your ID card.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Profile card */}
            <GlassCard className="p-4 sm:p-6">
              <div className="flex items-center gap-4 mb-6">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/10 overflow-hidden flex items-center justify-center">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white/40">
                        {(user?.name || 'P').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{user?.name || 'Promoter'}</h3>
                  <p className="text-sm text-white/40">{user?.phone}</p>
                  {user?.employee_id && (
                    <div className="mt-1">
                      <Badge text={`ID: ${user.employee_id}`} variant="info" />
                    </div>
                  )}
                </div>
              </div>

              {/* Rank badge */}
              {user?.rank && (
                <div className="mb-6 pb-6 border-b border-white/5">
                  <Badge
                    text={user.rank === 'area_manager' ? 'Area Manager' : user.rank.charAt(0).toUpperCase() + user.rank.slice(1)}
                    variant={user.rank === 'area_manager' ? 'success' : 'info'}
                  />
                </div>
              )}

              {/* Edit form */}
              <form onSubmit={handleSave} className="space-y-4">
                <Input
                  label="Full Name"
                  name="name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  icon={User}
                  required
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  icon={Mail}
                />

                <Input
                  label="Address"
                  name="address"
                  placeholder="Your address"
                  value={form.address}
                  onChange={handleChange}
                  icon={MapPin}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    fullWidth
                    icon={Save}
                    loading={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </GlassCard>

            {/* Earnings */}
            <EarningsPanel />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* ID Card */}
            <IdCardDownload />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
