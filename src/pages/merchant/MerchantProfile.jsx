import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Trophy, User,
  Mail, MapPin, Camera, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import PlanInfo from '../../components/merchant/PlanInfo';

const sidebarLinks = [
  { path: '/merchant', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { path: '/merchant/customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
  { path: '/merchant/winners', label: 'Winners', icon: <Trophy className="w-4 h-4" /> },
  { path: '/merchant/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
];

export default function MerchantProfile() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        address: user.address || '',
      });
      if (user.avatar || user.profile_photo) {
        setAvatarPreview(user.avatar || user.profile_photo);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('address', form.address);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} title="Merchant">
      <div className="space-y-8 max-w-3xl">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-sm text-white/50 mt-1">Manage your account and plan details</p>
        </div>

        {/* Profile info card */}
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-white/5">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white/20" />
                  </div>
                )}
              </div>

              {/* Upload overlay */}
              <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>

              {/* Accent ring */}
              <div className="absolute -inset-1 rounded-full border-2 border-[#e94560]/30 pointer-events-none" />
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">{user?.name || 'Merchant'}</h2>
              <p className="text-sm text-white/50">{user?.email || user?.phone || ''}</p>
              <p className="text-xs text-white/30 mt-1 capitalize">
                {user?.role || 'merchant'} account
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Plan info */}
        <PlanInfo />

        {/* Edit profile form */}
        <GlassCard className="p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white">Edit Profile</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Full Name"
              name="name"
              placeholder="Your name"
              icon={User}
              value={form.name}
              onChange={handleChange}
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Address"
            name="address"
            placeholder="Your full address"
            icon={MapPin}
            value={form.address}
            onChange={handleChange}
          />

          <div className="flex justify-end pt-2">
            <Button
              icon={Save}
              loading={saving}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
