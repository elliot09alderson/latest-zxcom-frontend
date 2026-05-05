import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock, LogIn, Briefcase, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import GlassCard from '../ui/GlassCard';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Logo from '../ui/Logo';

/**
 * Panel-scoped login form.
 *
 * Props:
 *   panel = 'customer' (default) | 'member'
 *
 * 'customer' is the public shopper login. 'member' is the merchant/promoter
 * portal login (and also where admin logs in for now). Same component,
 * different copy + register link.
 */
export default function LoginForm({ panel = 'customer' }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isMember = panel === 'member';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await login(phone, password, panel);
      toast.success('Welcome back!');

      const role = res.data?.user?.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'merchant') navigate('/merchant');
      else if (role === 'promoter' || role === 'area_manager') navigate('/promoter');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="w-full max-w-md p-8 mx-auto">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-center mb-8"
      >
        <Logo size="lg" className="mx-auto" />
        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-[#e94560]/10 border border-[#e94560]/20">
          {isMember ? (
            <Briefcase className="w-3.5 h-3.5 text-[#e94560]" />
          ) : (
            <ShoppingBag className="w-3.5 h-3.5 text-[#e94560]" />
          )}
          <span className="text-[11px] font-semibold text-[#e94560] uppercase tracking-wider">
            {isMember ? 'Member Login' : 'Customer Login'}
          </span>
        </div>
        <p className="text-white/40 text-sm mt-2">
          {isMember
            ? 'For merchants, promoters, and area managers'
            : 'Sign in to shop on ZXCOM'}
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          placeholder="Enter your phone number"
          icon={Phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          icon={LogIn}
          loading={loading}
        >
          Sign In
        </Button>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-sm text-white/50 mt-6 space-y-1"
      >
        <p>
          Don&apos;t have an account?{' '}
          <Link
            to={isMember ? '/member/register' : '/register'}
            className="text-[#e94560] hover:text-[#e94560]/80 font-medium transition-colors"
          >
            Register
          </Link>
        </p>
        <p className="text-[11px] text-white/30">
          {isMember ? 'Looking to shop instead?' : 'Are you a merchant or promoter?'}{' '}
          <Link
            to={isMember ? '/login' : '/member/login'}
            className="text-white/60 hover:text-white underline-offset-2 hover:underline"
          >
            {isMember ? 'Customer login →' : 'Member login →'}
          </Link>
        </p>
      </motion.div>
    </GlassCard>
  );
}
