import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Camera, Receipt } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Input from '../ui/Input';
import FileUpload from '../ui/FileUpload';
import Button from '../ui/Button';

export default function CustomerForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    profile_photo: null,
    bill_image: null,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files !== undefined) {
      setForm((prev) => ({ ...prev, [name]: files[0] || null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!form.bill_image) newErrors.bill_image = 'Bill image is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  return (
    <GlassCard className="p-6 sm:p-8 w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Your Details</h2>
          <span className="text-xs font-medium text-white/40 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            Step 1 of 2
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            name="name"
            placeholder="Enter your name"
            value={form.name}
            onChange={handleChange}
            icon={User}
            required
            error={errors.name}
          />

          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={handleChange}
            icon={Phone}
            required
            error={errors.phone}
          />

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Camera className="w-4 h-4 text-white/40" />
              <span className="text-sm font-medium text-white/80">Profile Photo</span>
              <span className="text-xs text-white/30">(optional)</span>
            </div>
            <FileUpload
              name="profile_photo"
              accept="image/*"
              preview
              onChange={handleChange}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Receipt className="w-4 h-4 text-white/40" />
              <span className="text-sm font-medium text-white/80">
                Bill / Receipt Image
                <span className="text-[#e94560] ml-1">*</span>
              </span>
            </div>
            <FileUpload
              name="bill_image"
              accept="image/*"
              preview
              onChange={handleChange}
              error={errors.bill_image}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={loading}
            className="mt-4"
          >
            Next: Choose Offer
          </Button>
        </form>
      </motion.div>
    </GlassCard>
  );
}
