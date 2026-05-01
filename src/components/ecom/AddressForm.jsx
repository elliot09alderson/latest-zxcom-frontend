import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Home, Briefcase, Building2, Tag, Navigation, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const labelOptions = [
  { id: 'Home', icon: Home, color: '#10b981' },
  { id: 'Work', icon: Briefcase, color: '#3b82f6' },
  { id: 'Office', icon: Building2, color: '#8b5cf6' },
  { id: 'Other', icon: Tag, color: '#f59e0b' },
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry',
];

const emptyForm = {
  label: 'Home',
  full_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
  is_default: false,
  lat: '',
  lng: '',
};

// Nominatim returns state names that sometimes differ from our dropdown list.
// Normalise common variants so the pre-fill matches our <select> options.
const normaliseState = (raw) => {
  if (!raw) return '';
  const s = raw.trim();
  const map = {
    'NCT': 'Delhi',
    'National Capital Territory of Delhi': 'Delhi',
    'Delhi NCT': 'Delhi',
    'Jammu and Kashmir': 'Jammu and Kashmir',
    'Orissa': 'Odisha',
    'Puducherry UT': 'Puducherry',
  };
  return map[s] || s;
};

export default function AddressForm({ open, onClose, onSubmit, editData, loading }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [locating, setLocating] = useState(false);

  const captureLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          );
          const data = await res.json();
          const addr = data?.address || {};
          const line1Parts = [addr.house_number, addr.road].filter(Boolean).join(' ');
          const line2Parts = [addr.neighbourhood || addr.suburb, addr.city_district].filter(Boolean).join(', ');
          const city = addr.city || addr.town || addr.village || addr.county || '';
          const state = normaliseState(addr.state || addr.state_district || '');
          const pincode = addr.postcode || '';

          setForm((prev) => ({
            ...prev,
            address_line1: line1Parts || prev.address_line1 || data?.display_name?.split(',')[0] || '',
            address_line2: line2Parts || prev.address_line2,
            city: city || prev.city,
            state: state || prev.state,
            pincode: pincode || prev.pincode,
            lat: latitude.toString(),
            lng: longitude.toString(),
          }));
          setErrors({});
          toast.success(pincode ? `Location captured · Pincode ${pincode}` : 'Location captured — please verify pincode');
        } catch {
          // Reverse-geocode failed but we still have coords — stash them anyway.
          setForm((prev) => ({ ...prev, lat: latitude.toString(), lng: longitude.toString() }));
          toast.error('Could not resolve address. Coordinates saved — fill the rest manually.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        toast.error(err.code === 1 ? 'Location permission denied' : 'Could not get your location');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  useEffect(() => {
    if (editData) {
      setForm({
        ...emptyForm,
        ...editData,
        lat: editData.location?.lat?.toString() || '',
        lng: editData.location?.lng?.toString() || '',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [editData, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) errs.phone = 'Valid 10-digit phone required';
    if (!form.address_line1.trim()) errs.address_line1 = 'Address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state.trim()) errs.state = 'State is required';
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim())) errs.pincode = 'Valid 6-digit pincode required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const InputField = ({ label, field, placeholder, type = 'text', maxLength }) => (
    <div>
      <label className="block text-white/50 text-xs font-medium mb-1.5">{label}</label>
      <input
        type={type}
        value={form[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full px-3.5 py-2.5 rounded-xl bg-white/5 border text-white text-sm outline-none transition-all placeholder:text-white/25 ${
          errors[field] ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#e94560] focus:shadow-[0_0_0_3px_rgba(233,69,96,0.15)]'
        }`}
      />
      {errors[field] && <p className="text-red-400 text-[11px] mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal — bottom sheet on mobile, centered on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed z-50 inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center"
          >
            <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#1a1a2e] border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 pb-4 border-b border-white/10 bg-[#1a1a2e] rounded-t-3xl sm:rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#e94560]/10">
                    <MapPin className="w-5 h-5 text-[#e94560]" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">
                    {editData ? 'Edit Address' : 'Add New Address'}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Live location capture */}
                <div className={`rounded-2xl border p-3 ${
                  form.lat && form.lng
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-[#e94560]/30 bg-[#e94560]/5'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                        {form.lat && form.lng ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Location captured
                          </>
                        ) : (
                          <>
                            <Navigation className="w-3.5 h-3.5 text-[#e94560]" />
                            Use my live location
                          </>
                        )}
                      </p>
                      <p className="text-[11px] text-white/50 mt-0.5">
                        {form.lat && form.lng
                          ? `${Number(form.lat).toFixed(5)}, ${Number(form.lng).toFixed(5)}`
                          : 'We\'ll auto-fill address, city, state and pincode for you.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={captureLiveLocation}
                      disabled={locating}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#e94560]/40 bg-[#e94560]/10 text-xs font-semibold text-[#e94560] hover:bg-[#e94560]/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-pulse' : ''}`} />
                      {locating ? 'Locating…' : form.lat ? 'Re-detect' : 'Detect'}
                    </button>
                  </div>
                </div>

                {/* Label Selector */}
                <div>
                  <label className="block text-white/50 text-xs font-medium mb-2">Address Type</label>
                  <div className="flex gap-2">
                    {labelOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isActive = form.label === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleChange('label', opt.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            isActive
                              ? 'border-white/20 bg-white/10 text-white'
                              : 'border-white/5 bg-white/[0.03] text-white/40 hover:bg-white/5'
                          }`}
                          style={isActive ? { borderColor: `${opt.color}50`, color: opt.color } : {}}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {opt.id}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Two-column on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField label="Full Name" field="full_name" placeholder="John Doe" />
                  <InputField label="Phone Number" field="phone" placeholder="9876543210" maxLength={10} />
                </div>

                <InputField label="Flat / House No / Building / Street" field="address_line1" placeholder="42, Green Valley Apartments" />
                <InputField label="Area / Colony / Landmark (optional)" field="address_line2" placeholder="Near City Mall, MG Road" />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InputField label="City" field="city" placeholder="Mumbai" />
                  <div>
                    <label className="block text-white/50 text-xs font-medium mb-1.5">State</label>
                    <select
                      value={form.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-white/5 border text-white text-sm outline-none transition-all appearance-none cursor-pointer ${
                        errors.state ? 'border-red-500/50' : 'border-white/10 focus:border-[#e94560]'
                      }`}
                    >
                      <option value="" className="bg-[#1a1a2e]">Select</option>
                      {indianStates.map((s) => (
                        <option key={s} value={s} className="bg-[#1a1a2e]">{s}</option>
                      ))}
                    </select>
                    {errors.state && <p className="text-red-400 text-[11px] mt-1">{errors.state}</p>}
                  </div>
                  <InputField label="Pincode" field="pincode" placeholder="400001" maxLength={6} />
                </div>

                {/* Default checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => handleChange('is_default', !form.is_default)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      form.is_default ? 'border-[#e94560] bg-[#e94560]' : 'border-white/20 group-hover:border-white/40'
                    }`}
                  >
                    {form.is_default && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-white/60 text-sm">Set as default delivery address</span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-[#e94560] hover:bg-[#d63d56] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors cursor-pointer shadow-lg shadow-[#e94560]/20"
                >
                  {loading ? 'Saving...' : editData ? 'Update Address' : 'Save Address'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
