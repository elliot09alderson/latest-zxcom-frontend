import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  User,
  Users,
  UserPlus,
  Store,
  Phone,
  Lock,
  Mail,
  MapPin,
  Building2,
  Hash,
  MapPinned,
  CheckCircle,
  Navigation,
  ArrowLeft,
  ArrowRight,
  Package,
  CreditCard,
  IndianRupee,
  Download,
  Printer,
  QrCode,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import useRazorpay from '../../hooks/useRazorpay';
import usePhoneCheck from '../../hooks/usePhoneCheck';
import {
  validateName, validatePhone, validatePassword, validateEmail,
  validateRequired, validatePincode, validateGstin, pruneErrors,
} from '../../utils/validators';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FileUpload from '../../components/ui/FileUpload';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import TermsAndConditions from '../../components/ui/TermsAndConditions';

const sidebarLinks = [
  { path: '/promoter', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: '/promoter/onboard-merchant', label: 'Onboard Merchant', icon: <Store size={18} /> },
  { path: '/promoter/onboard-promoter', label: 'Onboard Promoter', icon: <UserPlus size={18} /> },
  { path: '/promoter/network', label: 'Network', icon: <Users size={18} /> },
  { path: '/promoter/qr-codes', label: 'QR Codes', icon: <QrCode size={18} /> },
  { path: '/promoter/earnings', label: 'Earnings', icon: <IndianRupee size={18} /> },
  { path: '/promoter/orders', label: 'My Orders', icon: <ShoppingBag size={18} /> },
  { path: '/promoter/id-card', label: 'ID Card', icon: <CreditCard size={18} /> },
  { path: '/promoter/profile', label: 'Profile', icon: <User size={18} /> },
];

const shopCategories = [
  { value: 'grocery', label: 'Grocery' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'general', label: 'General Store' },
  { value: 'other', label: 'Other' },
];

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

export default function OnboardMerchant() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [done, setDone] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [packs, setPacks] = useState([]);
  const [packsLoading, setPacksLoading] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { initiatePayment } = useRazorpay();

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  const getFullUrl = (url) => url ? (url.startsWith('http') ? url : `${API_BASE}${url}`) : '';

  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    email: '',
    address: '',
    shop_name: '',
    area: '',
    city: '',
    shop_category: '',
    shop_category_other: '',
    shop_size: '',
    gstin: '',
    pincode: '',
    lat: '',
    lng: '',
    shop_image: null,
  });
  const [errors, setErrors] = useState({});
  const phoneCheck = usePhoneCheck(form.phone, 'merchant');

  // Fetch packs when entering step 2
  useEffect(() => {
    if (step === 2 && packs.length === 0) {
      setPacksLoading(true);
      api.get('/promoters/packs?type=shopkeeper')
        .then((res) => {
          const data = res.data?.data?.packs || res.data?.packs || [];
          setPacks(data);
        })
        .catch(() => toast.error('Failed to load packs'))
        .finally(() => setPacksLoading(false));
    }
  }, [step, packs.length]);

  const updateField = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm((prev) => ({ ...prev, [name]: files[0] || value }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    // Clear this field's error as the user types a new value.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const goToStep = (target) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
  };

  // Reverse geocode
  const fetchPincode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      const addr = data?.address || {};
      const pincode = addr.postcode || '';
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const area = addr.suburb || addr.neighbourhood || addr.road || '';

      setForm((prev) => ({
        ...prev,
        pincode: pincode || prev.pincode,
        city: city || prev.city,
        area: area || prev.area,
        address: data?.display_name || prev.address,
      }));

      if (pincode) {
        toast.success(`Location detected! Pincode: ${pincode}`);
      } else {
        toast.success('Location detected! Pincode not found — enter manually.');
      }
    } catch {
      toast.error('Could not fetch address from location');
    }
  }, []);

  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setForm((prev) => ({ ...prev, lat: latitude.toString(), lng: longitude.toString() }));
        await fetchPincode(latitude, longitude);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === 1
            ? 'Location permission denied. Please allow location access.'
            : 'Could not get your location. Please try again.'
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // Step 1 validation — validates every visible field and surfaces errors inline.
  const handleStep1Next = (e) => {
    e.preventDefault();
    const next = pruneErrors({
      name: validateName(form.name),
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      email: validateEmail(form.email),
      shop_name: validateRequired(form.shop_name, 'Shop name'),
      shop_category_other: form.shop_category === 'other'
        ? validateRequired(form.shop_category_other, 'Business type')
        : '',
      pincode: validatePincode(form.pincode),
      gstin: validateGstin(form.gstin),
    });
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    // Hard block: never let a duplicate-phone request reach Razorpay.
    // The backend would reject it post-payment leaving the money in limbo
    // (see Sky Fuel Energy incident).
    if (phoneCheck.taken) {
      toast.error(phoneCheck.reason || 'Phone unavailable for merchant onboarding');
      return;
    }
    if (phoneCheck.checking) {
      toast.error('Verifying phone, please wait…');
      return;
    }
    goToStep(2);
  };

  // Resolve the final shop_category string sent to the backend — custom text
  // when "other" is picked, otherwise the selected option value.
  const resolvedShopCategory = () => (
    form.shop_category === 'other'
      ? form.shop_category_other.trim()
      : form.shop_category
  );

  // Step 2: pack selected -> open Razorpay checkout immediately.
  // T&C must be accepted on this same step before selection is allowed.
  const handlePackSelect = (pack) => {
    if (!termsAccepted) {
      toast.error('Please accept the Merchant Terms & Conditions first');
      return;
    }
    setSelectedPack(pack);
    launchRazorpay(pack);
  };

  // Submit merchant to backend after Razorpay payment succeeds.
  const submitMerchant = async (pack, paymentData) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('phone', form.phone);
      formData.append('password', form.password);
      if (form.email) formData.append('email', form.email);
      if (form.address) formData.append('address', form.address);
      formData.append('shop_name', form.shop_name);
      formData.append('area', form.area);
      formData.append('city', form.city);
      formData.append('shop_category', resolvedShopCategory());
      if (form.shop_size) formData.append('shop_size', form.shop_size);
      formData.append('pack_id', pack._id);
      if (form.gstin) formData.append('gstin', form.gstin);
      if (form.pincode) formData.append('pincode', form.pincode);
      if (form.lat) formData.append('lat', form.lat);
      if (form.lng) formData.append('lng', form.lng);
      if (form.shop_image) formData.append('shop_image', form.shop_image);
      formData.append('razorpay_order_id', paymentData.razorpay_order_id);
      formData.append('razorpay_payment_id', paymentData.razorpay_payment_id);
      formData.append('razorpay_signature', paymentData.razorpay_signature);

      const res = await api.post('/promoters/onboard-merchant', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const resData = res.data?.data || res.data || {};
      if (resData.qr_code) setQrData(resData.qr_code);
      setDone(true);
      toast.success('Merchant onboarded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to onboard merchant');
    } finally {
      setLoading(false);
    }
  };

  // Launch Razorpay directly with the chosen pack. Pack is passed through so
  // we don't race with the setSelectedPack state update.
  const launchRazorpay = async (pack) => {
    // Free packs — skip Razorpay and onboard directly.
    if (Number(pack.price || 0) === 0) {
      await submitMerchant(pack, {
        razorpay_order_id: '',
        razorpay_payment_id: '',
        razorpay_signature: '',
      });
      return;
    }
    setLoading(true);
    try {
      const { data: orderRes } = await api.post('/payments/create-order', {
        amount: pack.price,
        purpose: 'merchant_onboarding',
      });
      const orderData = orderRes?.data || orderRes;

      await initiatePayment({
        // /payments/create-order returns amount in rupees; Razorpay needs paise.
        amount: Math.round(Number(pack.price) * 100),
        order_id: orderData.order_id,
        name: 'ZXCOM',
        description: `Merchant onboarding · ${pack.name}`,
        prefill: { name: form.name, email: form.email || '', contact: form.phone },
        handler: async (response) => {
          await submitMerchant(pack, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        onDismiss: () => setLoading(false),
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '', phone: '', password: '', email: '', address: '',
      shop_name: '', area: '', city: '', shop_category: '', shop_size: '',
      gstin: '', pincode: '', lat: '', lng: '', shop_image: null,
    });
    setSelectedPack(null);
    setQrData(null);
    setTermsAccepted(false);
    setStep(1);
    setDone(false);
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} title="Promoter Portal">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-white">Onboard Merchant</h1>
          <p className="text-sm text-white/40 mt-1">
            Register a new merchant to your network
          </p>
        </motion.div>

        {/* Step Indicator */}
        {!done && (
          <div className="flex items-center justify-center gap-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step >= s
                      ? 'bg-gradient-to-r from-[#e94560] to-[#c23616] text-white'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div className={`w-12 h-0.5 rounded transition-all duration-300 ${step > s ? 'bg-[#e94560]' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {done ? (
          <GlassCard className="p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-2">Merchant Onboarded!</h2>
              <p className="text-white/50 text-sm mb-2">
                The merchant has been successfully registered and linked to your network.
              </p>

              {/* QR Code Display */}
              {qrData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="my-6"
                >
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Merchant QR Code</p>
                  <div className="inline-block bg-white rounded-2xl p-4 mb-3" id="qr-print-area">
                    <img
                      src={getFullUrl(qrData.qr_image_url)}
                      alt={`QR ${qrData.code}`}
                      className="w-48 h-48 object-contain"
                    />
                    <p className="text-center text-xs text-gray-500 font-mono mt-2">{qrData.code}</p>
                    <p className="text-center text-[10px] text-gray-400 mt-0.5">{form.shop_name}</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      onClick={async () => {
                        const imgUrl = getFullUrl(qrData.qr_image_url);
                        try {
                          const resp = await fetch(imgUrl);
                          const blob = await resp.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = `qr-${form.shop_name || qrData.code}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(blobUrl);
                          toast.success('QR downloaded!');
                        } catch { toast.error('Download failed'); }
                      }}
                    >
                      Download
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Printer}
                      onClick={() => {
                        const imgUrl = getFullUrl(qrData.qr_image_url);
                        const win = window.open('', '_blank');
                        win.document.write(`
                          <html><head><title>QR - ${form.shop_name}</title>
                          <style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;font-family:sans-serif;}
                          .card{text-align:center;padding:30px;}img{width:300px;height:300px;}
                          p{margin:8px 0 0;color:#555;font-size:14px;}.name{font-size:18px;font-weight:bold;color:#333;}</style></head>
                          <body><div class="card">
                          <p class="name">${form.shop_name}</p>
                          <img src="${imgUrl}" />
                          <p>${qrData.code}</p>
                          </div></body></html>
                        `);
                        win.document.close();
                        win.onload = () => { win.print(); };
                      }}
                    >
                      Print
                    </Button>
                  </div>
                </motion.div>
              )}

              <Button onClick={resetForm} icon={UserPlus} className="mt-4">
                Onboard Another Merchant
              </Button>
            </motion.div>
          </GlassCard>
        ) : (
          <GlassCard className="p-6 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {/* STEP 1: Merchant Details + Location */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <form onSubmit={handleStep1Next} className="space-y-5">
                    {/* Owner Details */}
                    <div>
                      <p className="text-xs text-[#e94560] font-semibold uppercase tracking-wider mb-3">
                        Owner Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Full Name" name="name" placeholder="Owner's name" icon={User} value={form.name} onChange={updateField} error={errors.name} required />
                        <div>
                          <Input
                            label="Phone Number"
                            name="phone"
                            type="tel"
                            placeholder="10-digit phone number"
                            icon={Phone}
                            value={form.phone}
                            onChange={updateField}
                            maxLength={10}
                            error={errors.phone || (phoneCheck.taken
                              ? `${phoneCheck.reason || 'Phone unavailable'}${phoneCheck.name ? ` (${phoneCheck.name})` : ''}`
                              : undefined)}
                            required
                          />
                          {phoneCheck.checking && (
                            <p className="text-[11px] text-white/40 mt-1">Checking phone…</p>
                          )}
                          {phoneCheck.willMerge && !phoneCheck.checking && (
                            <p className="text-[11px] text-amber-300/90 mt-1">
                              ⚠ This phone is already registered as a <strong>{phoneCheck.role}</strong>
                              {phoneCheck.name ? ` (${phoneCheck.name})` : ''}.
                              The merchant role will be added on top of the existing account.
                              The password entered must match their existing one.
                            </p>
                          )}
                          {!phoneCheck.taken && !phoneCheck.willMerge && !phoneCheck.checking && form.phone.length === 10 && !phoneCheck.error && (
                            <p className="text-[11px] text-emerald-300/80 mt-1">Phone is available ✓</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <Input label="Password" name="password" type="password" placeholder="Min 6 characters" icon={Lock} value={form.password} onChange={updateField} error={errors.password} required />
                        <Input label="Email" name="email" type="email" placeholder="Email (optional)" icon={Mail} value={form.email} onChange={updateField} error={errors.email} />
                      </div>
                    </div>

                    {/* Shop Details */}
                    <div className="border-t border-white/10 pt-5">
                      <p className="text-xs text-[#e94560] font-semibold uppercase tracking-wider mb-3">
                        Shop Details
                      </p>
                      <div className="space-y-4">
                        <Input label="Shop Name" name="shop_name" placeholder="Shop name" icon={Store} value={form.shop_name} onChange={updateField} error={errors.shop_name} required />
                        <FileUpload label="Shop Image" name="shop_image" accept="image/*" preview onChange={updateField} />
                        <Select label="Shop Category" name="shop_category" placeholder="Select category" options={shopCategories} value={form.shop_category} onChange={updateField} />
                        {form.shop_category === 'other' && (
                          <Input
                            label="Specify Business Type"
                            name="shop_category_other"
                            placeholder="e.g. Florist, Bakery, Salon"
                            icon={Store}
                            value={form.shop_category_other}
                            onChange={updateField}
                            error={errors.shop_category_other}
                            required
                          />
                        )}

                        {/* Shop Size */}
                        <div className="space-y-1.5">
                          <label className="block text-sm font-medium text-white/80">Shop Size</label>
                          <div className="flex gap-2">
                            {['SM', 'MD', 'LG', 'XL', 'XXL'].map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, shop_size: size }))}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                                  form.shop_size === size
                                    ? 'border-[#e94560] bg-[#e94560]/10 text-[#e94560]'
                                    : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Input label="GSTIN" name="gstin" placeholder="GSTIN (optional)" icon={Hash} value={form.gstin} onChange={updateField} error={errors.gstin} maxLength={15} />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="border-t border-white/10 pt-5">
                      <p className="text-xs text-[#e94560] font-semibold uppercase tracking-wider mb-3">
                        Location
                      </p>
                      <div className="space-y-4">
                        <Button type="button" variant="secondary" icon={Navigation} loading={locating} onClick={getLiveLocation} fullWidth>
                          {locating ? 'Getting Location...' : 'Get Live Location'}
                        </Button>

                        {form.lat && form.lng && (
                          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                            <div className="flex items-center gap-2">
                              <MapPinned className="w-4 h-4 text-emerald-400" />
                              <p className="text-xs text-emerald-200/80">
                                Location captured: {parseFloat(form.lat).toFixed(6)}, {parseFloat(form.lng).toFixed(6)}
                              </p>
                            </div>
                          </motion.div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Input label="Pincode" name="pincode" placeholder="6-digit pincode" icon={MapPin} value={form.pincode} onChange={updateField} digitsOnly maxLength={6} error={errors.pincode} />
                          <Input label="Area" name="area" placeholder="Area" icon={MapPin} value={form.area} onChange={updateField} />
                          <Input label="City" name="city" placeholder="City" icon={Building2} value={form.city} onChange={updateField} />
                        </div>
                        <Input label="Address" name="address" placeholder="Full address" icon={MapPin} value={form.address} onChange={updateField} />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button type="submit" fullWidth size="lg" icon={ArrowRight}>
                        Next: Select Pack
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: Pack Selection + T&C → click pack opens Razorpay */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="space-y-5">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-bold text-white">Select a Pack</h3>
                      <p className="text-sm text-white/40 mt-1">Pick a pack — payment opens via Razorpay</p>
                    </div>

                    <div className="border border-white/10 rounded-xl p-4">
                      <TermsAndConditions
                        type="merchant"
                        accepted={termsAccepted}
                        onAcceptedChange={setTermsAccepted}
                      />
                    </div>

                    {packsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Spinner size="lg" />
                      </div>
                    ) : packs.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
                        <p className="text-white/40 text-sm">No packs available. Ask admin to create packs.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {packs.map((pack) => {
                          const isLaunching = loading && selectedPack?._id === pack._id;
                          return (
                            <motion.button
                              key={pack._id}
                              type="button"
                              whileHover={termsAccepted && !loading && !phoneCheck.taken ? { scale: 1.03, y: -4 } : {}}
                              whileTap={termsAccepted && !loading && !phoneCheck.taken ? { scale: 0.97 } : {}}
                              onClick={() => {
                                if (loading) return;
                                if (phoneCheck.taken) {
                                  toast.error(`Phone already registered as a ${phoneCheck.role || 'user'} — go back and use a different number.`);
                                  return;
                                }
                                handlePackSelect(pack);
                              }}
                              disabled={!termsAccepted || loading || phoneCheck.taken}
                              className={`
                                flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 text-left relative
                                ${!termsAccepted || loading || phoneCheck.taken ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                                ${selectedPack?._id === pack._id
                                  ? 'border-[#e94560] bg-[#e94560]/10 shadow-lg shadow-[#e94560]/20'
                                  : 'border-white/10 bg-white/5 hover:border-[#e94560]/40 hover:bg-white/10'
                                }
                              `}
                            >
                              <div className="p-3 rounded-xl bg-gradient-to-br from-[#e94560]/20 to-[#c23616]/10">
                                <Package className="w-7 h-7 text-[#e94560]" />
                              </div>
                              <span className="text-white font-semibold">{pack.name}</span>
                              <div className="flex items-center gap-1">
                                <IndianRupee className="w-4 h-4 text-[#e94560]" />
                                <span className="text-2xl font-bold text-[#e94560]">{pack.price}</span>
                              </div>
                              {pack.description && (
                                <span className="text-white/40 text-xs text-center">{pack.description}</span>
                              )}
                              <div className="text-xs text-white/30">
                                {(pack.customer_form_limit || 0) >= 999999 ? 'Unlimited' : (pack.customer_form_limit || 0)} customer forms/month
                              </div>
                              {isLaunching && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm">
                                  <Spinner size="md" />
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    <p className="text-[11px] text-white/30 text-center">
                      Secure payment via Razorpay · UPI, Cards, Net Banking, Wallets
                    </p>

                    <div className="pt-2">
                      <Button variant="secondary" icon={ArrowLeft} onClick={() => goToStep(1)} disabled={loading}>
                        Back
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  );
}
