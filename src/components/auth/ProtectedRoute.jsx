import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
      <motion.div
        className="w-10 h-10 border-3 border-white/10 border-t-[#e94560] rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, isAuthenticated, token } = useAuth();

  // If there is a token stored but user object has not resolved yet, show spinner.
  // Because the current AuthContext initializes synchronously from localStorage this
  // branch is unlikely to be hit, but it guards against future async hydration.
  if (token && !user) {
    return <LoadingSpinner />;
  }

  // Not authenticated at all -- redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but role is not in the allowed list
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
