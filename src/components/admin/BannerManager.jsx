import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Trash2, Upload, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import useFetch from '../../hooks/useFetch';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';
import Spinner from '../ui/Spinner';
import Modal from '../ui/Modal';

export default function BannerManager() {
  const { data, loading, refetch } = useFetch('/admin/banners');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const banners = data?.banners || [];

  const handleFileChange = (e) => {
    setFile(e.target.value || e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a banner image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('banner', file);
      await api.post('/admin/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Banner uploaded successfully');
      setFile(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/banners/${deleteId}`);
      toast.success('Banner deleted');
      setDeleteId(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete banner');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-[#8b5cf6]/10">
          <Image className="w-5 h-5 text-[#8b5cf6]" />
        </div>
        <h2 className="text-xl font-bold text-white">Banners</h2>
      </div>

      {/* Upload Section */}
      <GlassCard className="p-6 mb-6">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
          Upload New Banner
        </h3>
        <FileUpload
          label=""
          name="banner"
          accept="image/*"
          preview
          onChange={handleFileChange}
        />
        <div className="flex justify-end mt-4">
          <Button
            icon={Upload}
            loading={uploading}
            onClick={handleUpload}
            disabled={!file}
          >
            Upload Banner
          </Button>
        </div>
      </GlassCard>

      {/* Banner Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 text-white/40 text-sm">
          No banners uploaded yet
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {banners.map((banner, i) => (
              <motion.div
                key={banner._id || banner.id || i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="relative group rounded-2xl overflow-hidden border border-white/10 bg-white/5"
              >
                <img
                  src={banner.url || banner.image_url || banner.image}
                  alt={banner.title || `Banner ${i + 1}`}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setDeleteId(banner._id || banner.id)}
                    className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {banner.title && (
                  <div className="px-3 py-2">
                    <p className="text-xs text-white/60 truncate">{banner.title}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Banner"
        size="sm"
      >
        <p className="text-white/70 text-sm mb-6">
          Are you sure you want to delete this banner?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
