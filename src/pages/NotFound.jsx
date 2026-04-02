import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import PublicLayout from '../components/layout/PublicLayout';
import Button from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Large 404 */}
          <motion.h1
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 12 }}
            className="text-[10rem] md:text-[14rem] font-extrabold leading-none select-none"
          >
            <span className="bg-gradient-to-b from-[#e94560] to-[#e94560]/10 bg-clip-text text-transparent">
              404
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl font-semibold text-white mb-2"
          >
            Page Not Found
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/40 mb-8 max-w-md mx-auto"
          >
            The page you are looking for doesn&apos;t exist or has been moved.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              size="lg"
              icon={Home}
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
