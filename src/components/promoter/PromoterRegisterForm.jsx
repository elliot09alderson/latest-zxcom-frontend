import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Phone, CheckCircle, ArrowRight, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import useRazorpay from '../../hooks/useRazorpay';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function PromoterRegisterForm() {
  const { user } = useAuth();
  const { initiatePayment } = useRazorpay();

  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [employeeId, setEmployeeId] = useState('');

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Step 1: Create payment order for registration fee
      const { data: order } = await api.post('/payments/create-order', {
        type: 'promoter_registration',
      });

      // Step 2: Open Razorpay checkout
      await initiatePayment({
        amount: order.amount,
        order_id: order.order_id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        handler: async (response) => {
          try {
            // Step 3: Verify payment
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Step 4: Register as promoter
            const { data: promoter } = await api.post('/promoters/register', {
              referral_code: referralCode || undefined,
            });

            setEmployeeId(promoter.employee_id || promoter.data?.employee_id);
            setSuccess(true);
            toast.success('Registration successful!');
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

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-6 w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-white mb-2"
              >
                Welcome to the team!
              </motion.h2>

              <p className="text-white/50 text-sm mb-8">
                You are now an official X-Flex promoter
              </p>

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

              <p className="text-xs text-white/30">
                Save this ID for future reference. It will also be on your ID card.
              </p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-8">
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-xl bg-[#e94560]/15 border border-[#e94560]/20">
                  <Briefcase className="w-6 h-6 text-[#e94560]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Become a Promoter</h2>
                  <p className="text-sm text-white/40">Join the X-Flex network</p>
                </div>
              </div>

              <div className="h-px bg-white/10 my-6" />

              <div className="space-y-5">
                <Input
                  label="Referral Code"
                  name="referral_code"
                  placeholder="Have a referral? Enter the promoter's phone number"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  icon={Phone}
                />

                <p className="text-xs text-white/30">
                  A one-time registration fee is required to activate your promoter account.
                  Payment is processed securely via Razorpay.
                </p>

                <Button
                  fullWidth
                  size="lg"
                  icon={ArrowRight}
                  loading={loading}
                  onClick={handleRegister}
                >
                  Pay & Register
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
