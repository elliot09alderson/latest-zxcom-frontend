import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Users, User, Phone, Lock, Mail, MapPin,
  Building2, Tag, ArrowLeft, ArrowRight, UserPlus,
  CreditCard, Banknote, CheckCircle, Copy, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import useRazorpay from '../../hooks/useRazorpay';
import GlassCard from '../ui/GlassCard';
import Input from '../ui/Input';
import Select from '../ui/Select';
import FileUpload from '../ui/FileUpload';
import Button from '../ui/Button';

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const shopCategories = [
  { value: 'grocery', label: 'Grocery' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'general', label: 'General Store' },
  { value: 'other', label: 'Other' },
];

export default function RegisterForm() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState('');
  const [registrationDone, setRegistrationDone] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const { register } = useAuth();
  const { initiatePayment } = useRazorpay();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    email: '',
    address: '',
    avatar: null,
    // Merchant fields
    shop_name: '',
    area: '',
    city: '',
    shop_category: '',
    // Promoter fields
    referral_code: '',
  });

  const totalSteps = role === 'promoter' ? 3 : 2;

  const updateField = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm((prev) => ({ ...prev, [name]: files[0] || value }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const goToStep = (target) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
  };

  const goToStep2 = (selectedRole) => {
    setRole(selectedRole);
    setDirection(1);
    setStep(2);
  };

  // Create user account (auth register) and then promoter record
  const createAccountAndPromoter = async (token) => {
    // Register as promoter
    const { data: promoterRes } = await api.post('/promoters/register', {
      referral_code: form.referral_code || undefined,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const empId = promoterRes?.data?.promoter?.employee_id || promoterRes?.promoter?.employee_id || promoterRes?.employee_id || '';
    return empId;
  };

  // Handle step 2 form submission
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (role === 'merchant' && (!form.shop_name || !form.area || !form.city)) {
      toast.error('Please fill in all shop details');
      return;
    }

    if (role === 'promoter') {
      // For promoter: go to payment step
      goToStep(3);
      return;
    }

    // For merchant: register directly
    setLoading(true);
    try {
      const payload = {
        role,
        name: form.name,
        phone: form.phone,
        password: form.password,
        email: form.email || undefined,
        address: form.address || undefined,
      };

      await register(payload);
      toast.success('Account created successfully!');
      navigate('/merchant');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle offline registration for promoter
  const handleOfflineRegister = async () => {
    setLoading(true);
    try {
      const payload = {
        role: 'promoter',
        name: form.name,
        phone: form.phone,
        password: form.password,
        email: form.email || undefined,
        address: form.address || undefined,
        referral_code: form.referral_code || undefined,
      };

      const res = await register(payload);
      const token = res?.data?.token || localStorage.getItem('xflex_token');

      // Create promoter record
      const empId = await createAccountAndPromoter(token);
      setEmployeeId(empId);
      setRegistrationDone(true);
      toast.success('Registration successful! Pay the fee offline to activate.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle online (Razorpay) registration for promoter
  const handleOnlineRegister = async () => {
    setLoading(true);
    try {
      // Step 1: Create user account
      const payload = {
        role: 'promoter',
        name: form.name,
        phone: form.phone,
        password: form.password,
        email: form.email || undefined,
        address: form.address || undefined,
        referral_code: form.referral_code || undefined,
      };

      const res = await register(payload);
      const token = res?.data?.token || localStorage.getItem('xflex_token');

      // Step 2: Create payment order
      const { data: orderRes } = await api.post('/payments/create-order', {
        amount: 500,
        purpose: 'promoter_registration',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const orderData = orderRes?.data || orderRes;

      // Step 3: Open Razorpay
      await initiatePayment({
        amount: orderData.amount,
        order_id: orderData.order_id,
        prefill: {
          name: form.name,
          email: form.email || '',
          contact: form.phone,
        },
        handler: async (response) => {
          try {
            // Step 4: Verify payment
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Step 5: Register as promoter
            const empId = await createAccountAndPromoter(token);

            // Step 6: Activate promoter
            await api.post('/promoters/activate', {}, {
              headers: { Authorization: `Bearer ${token}` },
            });

            setEmployeeId(empId);
            setRegistrationDone(true);
            toast.success('Payment successful! Account activated.');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed after payment');
          } finally {
            setLoading(false);
          }
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const copyEmployeeId = () => {
    navigator.clipboard.writeText(employeeId);
    toast.success('Employee ID copied!');
  };

  // Success screen after promoter registration
  if (registrationDone) {
    return (
      <GlassCard className="w-full max-w-lg p-5 sm:p-8 mx-auto overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
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

          <h2 className="text-2xl font-bold text-white mb-2">Welcome to the team!</h2>
          <p className="text-white/50 text-sm mb-8">
            {paymentMode === 'offline'
              ? 'Your account is created. Pay the registration fee offline to activate.'
              : 'You are now an official X-Flex promoter'}
          </p>

          {employeeId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6"
            >
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                Your Employee ID
              </p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-extrabold text-[#e94560] tracking-widest">
                  {employeeId}
                </p>
                <button
                  onClick={copyEmployeeId}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          <p className="text-xs text-white/30 mb-6">
            Save this ID for future reference. It will also be on your ID card.
          </p>

          <Button fullWidth onClick={() => navigate('/promoter')}>
            Go to Dashboard
          </Button>
        </motion.div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full max-w-lg p-5 sm:p-8 mx-auto overflow-hidden">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-center mb-6"
      >
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="text-white">X</span>
          <span className="text-[#e94560]">-</span>
          <span className="bg-gradient-to-r from-[#e94560] to-[#c23616] bg-clip-text text-transparent">
            FLEX
          </span>
        </h1>
        <p className="text-white/40 text-sm mt-1">Create your account</p>
      </motion.div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
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
            {s < totalSteps && (
              <div
                className={`w-12 h-0.5 rounded transition-all duration-300 ${
                  step > s ? 'bg-[#e94560]' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        {/* Step 1: Choose Role */}
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
            <p className="text-center text-white/60 text-sm mb-6">
              Choose your account type
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => goToStep2('merchant')}
                className={`
                  flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                  ${role === 'merchant'
                    ? 'border-[#e94560] bg-[#e94560]/10 shadow-lg shadow-[#e94560]/20'
                    : 'border-white/10 bg-white/5 hover:border-[#e94560]/40 hover:bg-white/10'
                  }
                `}
              >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#e94560]/20 to-[#c23616]/10">
                  <Store className="w-8 h-8 text-[#e94560]" />
                </div>
                <span className="text-white font-semibold">Merchant</span>
                <span className="text-white/40 text-xs text-center">
                  List your shop & run campaigns
                </span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => goToStep2('promoter')}
                className={`
                  flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                  ${role === 'promoter'
                    ? 'border-[#e94560] bg-[#e94560]/10 shadow-lg shadow-[#e94560]/20'
                    : 'border-white/10 bg-white/5 hover:border-[#e94560]/40 hover:bg-white/10'
                  }
                `}
              >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#e94560]/20 to-[#c23616]/10">
                  <Users className="w-8 h-8 text-[#e94560]" />
                </div>
                <span className="text-white font-semibold">Promoter</span>
                <span className="text-white/40 text-xs text-center">
                  Promote offers & earn rewards
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Fill Details */}
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
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="name"
                  placeholder="Your name"
                  icon={User}
                  value={form.name}
                  onChange={updateField}
                  required
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  placeholder="Phone number"
                  icon={Phone}
                  value={form.phone}
                  onChange={updateField}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Create password"
                  icon={Lock}
                  value={form.password}
                  onChange={updateField}
                  required
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="Email (optional)"
                  icon={Mail}
                  value={form.email}
                  onChange={updateField}
                />
              </div>

              <Input
                label="Address"
                name="address"
                placeholder="Your address"
                icon={MapPin}
                value={form.address}
                onChange={updateField}
              />

              {/* Merchant-specific fields */}
              {role === 'merchant' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-[#e94560] font-semibold uppercase tracking-wider mb-3">
                      Shop Details
                    </p>
                  </div>
                  <Input
                    label="Shop Name"
                    name="shop_name"
                    placeholder="Your shop name"
                    icon={Store}
                    value={form.shop_name}
                    onChange={updateField}
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Area"
                      name="area"
                      placeholder="Shop area"
                      icon={MapPin}
                      value={form.area}
                      onChange={updateField}
                      required
                    />
                    <Input
                      label="City"
                      name="city"
                      placeholder="City"
                      icon={Building2}
                      value={form.city}
                      onChange={updateField}
                      required
                    />
                  </div>
                  <Select
                    label="Shop Category"
                    name="shop_category"
                    placeholder="Select category"
                    options={shopCategories}
                    value={form.shop_category}
                    onChange={updateField}
                  />
                </motion.div>
              )}

              {/* Promoter-specific fields */}
              {role === 'promoter' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-xs text-[#e94560] font-semibold uppercase tracking-wider mb-3">
                      Promoter Details
                    </p>
                  </div>
                  <Input
                    label="Referral Code"
                    name="referral_code"
                    placeholder="Enter referral code (optional)"
                    icon={Tag}
                    value={form.referral_code}
                    onChange={updateField}
                  />
                </motion.div>
              )}

              <FileUpload
                label="Profile Photo"
                name="avatar"
                accept="image/*"
                preview
                onChange={updateField}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  icon={ArrowLeft}
                  onClick={() => goToStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  icon={role === 'promoter' ? ArrowRight : (role === 'merchant' ? Store : UserPlus)}
                  loading={loading}
                >
                  {role === 'promoter' ? 'Next: Payment' : `Create ${role === 'merchant' ? 'Merchant' : ''} Account`}
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 3: Payment Mode (Promoter only) */}
        {step === 3 && role === 'promoter' && (
          <motion.div
            key="step3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="space-y-5">
              <div className="text-center mb-2">
                <h3 className="text-lg font-bold text-white">Choose Payment Method</h3>
                <p className="text-sm text-white/40 mt-1">
                  A one-time registration fee of <span className="text-[#e94560] font-semibold">&#8377;500</span> is required
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Offline Payment */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPaymentMode('offline')}
                  className={`
                    flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                    ${paymentMode === 'offline'
                      ? 'border-[#e94560] bg-[#e94560]/10 shadow-lg shadow-[#e94560]/20'
                      : 'border-white/10 bg-white/5 hover:border-[#e94560]/40 hover:bg-white/10'
                    }
                  `}
                >
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                    <Banknote className="w-7 h-7 text-amber-400" />
                  </div>
                  <span className="text-white font-semibold text-sm">Offline</span>
                  <span className="text-white/40 text-xs text-center">
                    Pay cash to admin & get activated
                  </span>
                </motion.button>

                {/* Online Payment */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPaymentMode('online')}
                  className={`
                    flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                    ${paymentMode === 'online'
                      ? 'border-[#e94560] bg-[#e94560]/10 shadow-lg shadow-[#e94560]/20'
                      : 'border-white/10 bg-white/5 hover:border-[#e94560]/40 hover:bg-white/10'
                    }
                  `}
                >
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
                    <Wallet className="w-7 h-7 text-emerald-400" />
                  </div>
                  <span className="text-white font-semibold text-sm">Online</span>
                  <span className="text-white/40 text-xs text-center">
                    Pay via UPI, Cards, Net Banking
                  </span>
                </motion.button>
              </div>

              {/* Payment mode details */}
              <AnimatePresence mode="wait">
                {paymentMode === 'offline' && (
                  <motion.div
                    key="offline-info"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4"
                  >
                    <p className="text-sm text-amber-200/80">
                      Your account will be created with <span className="font-semibold">pending</span> status. Contact an admin to complete the payment and activate your account.
                    </p>
                  </motion.div>
                )}
                {paymentMode === 'online' && (
                  <motion.div
                    key="online-info"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <p className="text-sm font-medium text-emerald-200/80">Secure Payment via Razorpay</p>
                    </div>
                    <p className="text-xs text-white/40">
                      Supports UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, and Net Banking. Your account will be activated instantly after payment.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  icon={ArrowLeft}
                  onClick={() => goToStep(2)}
                >
                  Back
                </Button>
                {paymentMode === 'offline' && (
                  <Button
                    fullWidth
                    size="lg"
                    icon={UserPlus}
                    loading={loading}
                    onClick={handleOfflineRegister}
                  >
                    Register (Pay Later)
                  </Button>
                )}
                {paymentMode === 'online' && (
                  <Button
                    fullWidth
                    size="lg"
                    icon={CreditCard}
                    loading={loading}
                    onClick={handleOnlineRegister}
                  >
                    Pay &#8377;500 & Register
                  </Button>
                )}
                {!paymentMode && (
                  <Button
                    fullWidth
                    size="lg"
                    disabled
                  >
                    Select a payment method
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!registrationDone && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-white/50 mt-6"
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#e94560] hover:text-[#e94560]/80 font-medium transition-colors"
          >
            Sign In
          </Link>
        </motion.p>
      )}
    </GlassCard>
  );
}
