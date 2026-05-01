import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, User, Users, UserPlus, Store, Phone, Lock, Mail, MapPin,
  CheckCircle, ArrowLeft, ArrowRight, Package, CreditCard,
  IndianRupee, QrCode, Copy,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import useRazorpay from '../../hooks/useRazorpay';
import usePhoneCheck from '../../hooks/usePhoneCheck';
import {
  validateName, validatePhone, validatePassword, validateEmail, pruneErrors,
} from '../../utils/validators';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import FileUpload from '../../components/ui/FileUpload';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import TermsAndConditions from '../../components/ui/TermsAndConditions';
import PromoterPerks from '../../components/ui/PromoterPerks';

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

const slideVariants = {
  enter: (d) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
};

export default function OnboardPromoter() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [packs, setPacks] = useState([]);
  const [packsLoading, setPacksLoading] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { initiatePayment } = useRazorpay();

  const [form, setForm] = useState({
    name: '', phone: '', password: '', email: '', address: '', avatar: null,
  });
  const [errors, setErrors] = useState({});
  const phoneCheck = usePhoneCheck(form.phone, 'promoter');

  useEffect(() => {
    if (step === 2 && packs.length === 0) {
      setPacksLoading(true);
      api.get('/promoters/packs?type=promoter')
        .then((res) => setPacks(res.data?.data?.packs || res.data?.packs || []))
        .catch(() => toast.error('Failed to load packs'))
        .finally(() => setPacksLoading(false));
    }
  }, [step, packs.length]);

  const updateField = (e) => {
    const { name, value, files } = e.target;
    if (files) setForm((p) => ({ ...p, [name]: files[0] || value }));
    else setForm((p) => ({ ...p, [name]: value }));
    // Clear this field's error as the user types a new value.
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const goToStep = (t) => { setDirection(t > step ? 1 : -1); setStep(t); };

  const handleStep1Next = (e) => {
    e.preventDefault();
    const next = pruneErrors({
      name: validateName(form.name),
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      email: validateEmail(form.email),
    });
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    if (phoneCheck.taken) {
      toast.error(phoneCheck.reason || 'Phone unavailable for promoter onboarding');
      return;
    }
    if (phoneCheck.checking) {
      toast.error('Verifying phone, please wait…');
      return;
    }
    goToStep(2);
  };

  const handlePackSelect = (pack) => {
    if (!termsAccepted) {
      toast.error('Please accept the Promoter Terms & Conditions first');
      return;
    }
    setSelectedPack(pack);
    launchRazorpay(pack);
  };

  const submitPromoter = async (pack, paymentData) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('phone', form.phone);
      fd.append('password', form.password);
      if (form.email) fd.append('email', form.email);
      if (form.address) fd.append('address', form.address);
      fd.append('pack_id', pack._id);
      fd.append('razorpay_order_id', paymentData.razorpay_order_id);
      fd.append('razorpay_payment_id', paymentData.razorpay_payment_id);
      fd.append('razorpay_signature', paymentData.razorpay_signature);
      if (form.avatar) fd.append('avatar', form.avatar);

      const res = await api.post('/promoters/onboard-promoter', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data?.data || res.data || {};
      setEmployeeId(data.employee_id || '');
      setDone(true);
      toast.success('Promoter onboarded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to onboard promoter');
    } finally { setLoading(false); }
  };

  const launchRazorpay = async (pack) => {
    // Free packs — skip Razorpay and onboard directly.
    if (Number(pack.price || 0) === 0) {
      await submitPromoter(pack, {
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
        purpose: 'promoter_registration',
      });
      const orderData = orderRes?.data || orderRes;

      await initiatePayment({
        // /payments/create-order returns amount in rupees; Razorpay needs paise.
        amount: Math.round(Number(pack.price) * 100),
        order_id: orderData.order_id,
        name: 'ZXCOM',
        description: `Promoter onboarding · ${pack.name}`,
        prefill: { name: form.name, email: form.email || '', contact: form.phone },
        handler: async (response) => {
          await submitPromoter(pack, {
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
    setForm({ name: '', phone: '', password: '', email: '', address: '', avatar: null });
    setSelectedPack(null);
    setEmployeeId('');
    setTermsAccepted(false);
    setStep(1);
    setDone(false);
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} title="Promoter Portal">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Onboard Promoter</h1>
          <p className="text-sm text-white/40 mt-1">Register a new promoter to your network</p>
        </motion.div>

        {/* Steps */}
        {!done && (
          <div className="flex items-center justify-center gap-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-gradient-to-r from-[#e94560] to-[#c23616] text-white' : 'bg-white/10 text-white/40'}`}>{s}</div>
                {s < 2 && <div className={`w-12 h-0.5 rounded ${step > s ? 'bg-[#e94560]' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        )}

        {done ? (
          <GlassCard className="p-8">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-2">Promoter Onboarded!</h2>
              <p className="text-white/50 text-sm mb-4">Successfully registered and linked to your network.</p>

              {employeeId && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Employee ID</p>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-2xl font-extrabold text-[#e94560] tracking-widest">{employeeId}</p>
                    <button onClick={() => { navigator.clipboard.writeText(employeeId); toast.success('Copied!'); }}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              <Button onClick={resetForm} icon={UserPlus}>Onboard Another Promoter</Button>
            </motion.div>
          </GlassCard>
        ) : (
          <GlassCard className="p-6 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {/* STEP 1: Details */}
              {step === 1 && (
                <motion.div key="s1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <form onSubmit={handleStep1Next} className="space-y-4">
                    <p className="text-xs text-[#e94560] font-semibold uppercase tracking-wider mb-2">Promoter Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Full Name" name="name" placeholder="Promoter's name" icon={User} value={form.name} onChange={updateField} error={errors.name} required />
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
                            The promoter role will be added on top of the existing account.
                            The password entered must match their existing one.
                          </p>
                        )}
                        {!phoneCheck.taken && !phoneCheck.willMerge && !phoneCheck.checking && form.phone.length === 10 && !phoneCheck.error && (
                          <p className="text-[11px] text-emerald-300/80 mt-1">Phone is available ✓</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Password" name="password" type="password" placeholder="Min 6 characters" icon={Lock} value={form.password} onChange={updateField} error={errors.password} required />
                      <Input label="Email" name="email" type="email" placeholder="Email (optional)" icon={Mail} value={form.email} onChange={updateField} error={errors.email} />
                    </div>
                    <Input label="Address" name="address" placeholder="Address (optional)" icon={MapPin} value={form.address} onChange={updateField} />
                    <FileUpload label="Profile Photo" name="avatar" accept="image/*" preview onChange={updateField} />

                    <Button type="submit" fullWidth size="lg" icon={ArrowRight}>Next: Select Pack</Button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: Pack Selection + T&C → click pack opens Razorpay */}
              {step === 2 && (
                <motion.div key="s2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <div className="space-y-5">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white">Select a Pack</h3>
                      <p className="text-sm text-white/40 mt-1">Pick a pack — payment opens via Razorpay</p>
                    </div>

                    <PromoterPerks />

                    <div className="border border-white/10 rounded-xl p-4">
                      <TermsAndConditions
                        type="promoter"
                        accepted={termsAccepted}
                        onAcceptedChange={setTermsAccepted}
                      />
                    </div>

                    {packsLoading ? (
                      <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                    ) : packs.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
                        <p className="text-white/40 text-sm">No promoter packs available. Ask admin to create one.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {packs.map((pack) => {
                          const isLaunching = loading && selectedPack?._id === pack._id;
                          return (
                            <motion.button
                              key={pack._id}
                              type="button"
                              whileHover={termsAccepted && !loading ? { scale: 1.02 } : {}}
                              whileTap={termsAccepted && !loading ? { scale: 0.98 } : {}}
                              onClick={() => {
                                if (loading) return;
                                if (phoneCheck.taken) {
                                  toast.error(`Phone already registered as a ${phoneCheck.role || 'user'} — go back and use a different number.`);
                                  return;
                                }
                                handlePackSelect(pack);
                              }}
                              disabled={!termsAccepted || loading || phoneCheck.taken}
                              className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left w-full relative
                                ${!termsAccepted || loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                                ${selectedPack?._id === pack._id
                                  ? 'border-[#e94560] bg-[#e94560]/10'
                                  : 'border-white/10 bg-white/5 hover:border-[#e94560]/40'
                                }`}
                            >
                              <div className="p-3 rounded-xl bg-gradient-to-br from-[#e94560]/20 to-[#c23616]/10 flex-shrink-0">
                                <Package className="w-6 h-6 text-[#e94560]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-white font-semibold">{pack.name}</span>
                                  <div className="flex items-center gap-0.5">
                                    <IndianRupee className="w-4 h-4 text-[#e94560]" />
                                    <span className="text-lg font-bold text-[#e94560]">{pack.price}</span>
                                  </div>
                                </div>
                                {pack.description && <p className="text-xs text-white/40 mt-0.5">{pack.description}</p>}
                                <div className="flex gap-4 mt-1.5 text-[11px] text-white/30">
                                  <span>Shopkeepers: <span className="text-white/60 font-medium">{pack.shopkeeper_limit || 0}</span></span>
                                  <span>Promoters: <span className="text-white/60 font-medium">{pack.promoter_limit || 0}</span></span>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />
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

                    <Button variant="secondary" icon={ArrowLeft} onClick={() => goToStep(1)} disabled={loading}>Back</Button>
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
