import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, MapPin, Building2, Tag, ArrowRight, ArrowLeft,
  CheckCircle2, PartyPopper, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import useRazorpay from '../../hooks/useRazorpay';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Spinner from '../ui/Spinner';
import PlanSelector from './PlanSelector';

const SHOP_CATEGORIES = [
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Grocery', label: 'Grocery' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Restaurant', label: 'Restaurant' },
  { value: 'Medical', label: 'Medical' },
  { value: 'Other', label: 'Other' },
];

const stepLabels = ['Shop Details', 'Select Plan', 'Payment'];

export default function MerchantRegisterForm() {
  const { user } = useAuth();
  const { initiatePayment } = useRazorpay();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [shopDetails, setShopDetails] = useState({
    shop_name: '',
    area: '',
    city: '',
    shop_category: '',
  });

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [errors, setErrors] = useState({});

  const handleShopChange = (e) => {
    const { name, value } = e.target;
    setShopDetails((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!shopDetails.shop_name.trim()) newErrors.shop_name = 'Shop name is required';
    if (!shopDetails.area.trim()) newErrors.area = 'Area is required';
    if (!shopDetails.city.trim()) newErrors.city = 'City is required';
    if (!shopDetails.shop_category) newErrors.shop_category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep2 = () => {
    if (validateStep1()) setStep(2);
  };

  const handlePlanSelect = (planType) => {
    setSelectedPlan(planType);
    setStep(3);
    processPayment(planType);
  };

  const processPayment = async (planType) => {
    setLoading(true);
    try {
      // 1. Create order
      const { data: orderData } = await api.post('/payments/create-order', {
        plan_type: planType,
      });

      // 2. Open Razorpay checkout
      await initiatePayment({
        amount: orderData.amount,
        order_id: orderData.order_id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        handler: async (response) => {
          try {
            // 3. Verify payment
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // 4. Register merchant
            await api.post('/merchants/register', {
              ...shopDetails,
              plan_type: planType,
              payment_id: response.razorpay_payment_id,
            });

            // 5. Activate merchant
            await api.post('/merchants/activate', {
              payment_id: response.razorpay_payment_id,
            });

            setSuccess(true);
            toast.success('Merchant registration successful!');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed after payment');
            setStep(2);
          } finally {
            setLoading(false);
          }
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
      setStep(2);
    }
  };

  if (success) {
    return (
      <GlassCard className="p-8 max-w-lg mx-auto text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-6"
        >
          <div className="inline-flex p-4 rounded-full bg-emerald-500/15 mb-4">
            <PartyPopper className="w-12 h-12 text-emerald-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            <Sparkles className="inline w-6 h-6 text-amber-400 mr-2" />
            Welcome Aboard!
            <Sparkles className="inline w-6 h-6 text-amber-400 ml-2" />
          </h2>
          <p className="text-white/60 mb-6">
            Your merchant account has been activated successfully.
            You can now start accepting customer submissions.
          </p>
          <Button
            onClick={() => window.location.href = '/merchant'}
            icon={ArrowRight}
          >
            Go to Dashboard
          </Button>
        </motion.div>

        {/* Confetti-like particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: '50%',
                y: '50%',
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: Math.random() * 0.5,
                ease: 'easeOut',
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#e94560', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'][i % 5],
              }}
            />
          ))}
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2">
        {stepLabels.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;

          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isDone
                      ? '#10b981'
                      : isActive
                        ? '#e94560'
                        : 'rgba(255,255,255,0.1)',
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                </motion.div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    isActive ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {label}
                </span>
              </div>
              {idx < stepLabels.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-0.5 rounded-full transition-colors duration-300 ${
                    step > stepNum ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6 space-y-6">
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-white">Shop Details</h2>
                <p className="text-sm text-white/50">Tell us about your business</p>
              </div>

              <Input
                label="Shop Name"
                name="shop_name"
                placeholder="Enter your shop name"
                icon={Store}
                value={shopDetails.shop_name}
                onChange={handleShopChange}
                error={errors.shop_name}
                required
              />

              <Input
                label="Area / Locality"
                name="area"
                placeholder="e.g. Koramangala, HSR Layout"
                icon={MapPin}
                value={shopDetails.area}
                onChange={handleShopChange}
                error={errors.area}
                required
              />

              <Input
                label="City"
                name="city"
                placeholder="e.g. Bangalore, Mumbai"
                icon={Building2}
                value={shopDetails.city}
                onChange={handleShopChange}
                error={errors.city}
                required
              />

              <Select
                label="Shop Category"
                name="shop_category"
                placeholder="Select category"
                options={SHOP_CATEGORIES}
                value={shopDetails.shop_category}
                onChange={handleShopChange}
                error={errors.shop_category}
              />

              <div className="flex justify-end pt-2">
                <Button icon={ArrowRight} onClick={goToStep2}>
                  Next: Choose Plan
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <PlanSelector onSelect={handlePlanSelect} loading={loading} />

            <div className="flex justify-start mt-4">
              <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-8 text-center">
              <Spinner size="lg" />
              <p className="text-white/60 mt-4 text-sm">
                Processing your payment...
              </p>
              <p className="text-white/30 mt-1 text-xs">
                Please complete the payment in the Razorpay window
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
