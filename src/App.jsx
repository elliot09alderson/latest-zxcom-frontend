import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ScanPage from './pages/ScanPage';
import NotFound from './pages/NotFound';

// Merchant pages
import MerchantDashboard from './pages/merchant/MerchantDashboard';
import MerchantProfile from './pages/merchant/MerchantProfile';

// Promoter pages
import PromoterDashboard from './pages/promoter/PromoterDashboard';
import PromoterProfile from './pages/promoter/PromoterProfile';
import PromoterIdCard from './pages/promoter/PromoterIdCard';
import PromoterQRCodes from './pages/promoter/PromoterQRCodes';
import PromoterNetwork from './pages/promoter/PromoterNetwork';
import PromoterEarnings from './pages/promoter/PromoterEarnings';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOffers from './pages/admin/AdminOffers';
import AdminConfig from './pages/admin/AdminConfig';
import AdminPromoters from './pages/admin/AdminPromoters';
import AdminMerchants from './pages/admin/AdminMerchants';
import AdminContests from './pages/admin/AdminContests';
import AdminWinners from './pages/admin/AdminWinners';
import AdminLeaderboard from './pages/admin/AdminLeaderboard';

function App() {
  const { user } = useAuth();

  const getDashboardRedirect = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'merchant': return '/merchant';
      case 'promoter':
      case 'area_manager': return '/promoter';
      default: return '/';
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={user ? <Navigate to={getDashboardRedirect()} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={getDashboardRedirect()} /> : <RegisterPage />} />
      <Route path="/scan/:qrCodeId" element={<ScanPage />} />

      {/* Merchant routes */}
      <Route path="/merchant" element={<ProtectedRoute roles={['merchant']}><MerchantDashboard /></ProtectedRoute>} />
      <Route path="/merchant/profile" element={<ProtectedRoute roles={['merchant']}><MerchantProfile /></ProtectedRoute>} />

      {/* Promoter routes */}
      <Route path="/promoter" element={<ProtectedRoute roles={['promoter', 'area_manager']}><PromoterDashboard /></ProtectedRoute>} />
      <Route path="/promoter/profile" element={<ProtectedRoute roles={['promoter', 'area_manager']}><PromoterProfile /></ProtectedRoute>} />
      <Route path="/promoter/id-card" element={<ProtectedRoute roles={['promoter', 'area_manager']}><PromoterIdCard /></ProtectedRoute>} />
      <Route path="/promoter/qr-codes" element={<ProtectedRoute roles={['promoter', 'area_manager']}><PromoterQRCodes /></ProtectedRoute>} />
      <Route path="/promoter/network" element={<ProtectedRoute roles={['promoter', 'area_manager']}><PromoterNetwork /></ProtectedRoute>} />
      <Route path="/promoter/earnings" element={<ProtectedRoute roles={['promoter', 'area_manager']}><PromoterEarnings /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/offers" element={<ProtectedRoute roles={['admin']}><AdminOffers /></ProtectedRoute>} />
      <Route path="/admin/config" element={<ProtectedRoute roles={['admin']}><AdminConfig /></ProtectedRoute>} />
      <Route path="/admin/promoters" element={<ProtectedRoute roles={['admin']}><AdminPromoters /></ProtectedRoute>} />
      <Route path="/admin/merchants" element={<ProtectedRoute roles={['admin']}><AdminMerchants /></ProtectedRoute>} />
      <Route path="/admin/contests" element={<ProtectedRoute roles={['admin']}><AdminContests /></ProtectedRoute>} />
      <Route path="/admin/winners" element={<ProtectedRoute roles={['admin']}><AdminWinners /></ProtectedRoute>} />
      <Route path="/admin/leaderboard" element={<ProtectedRoute roles={['admin']}><AdminLeaderboard /></ProtectedRoute>} />

      {/* Dashboard redirect */}
      <Route path="/dashboard" element={<Navigate to={getDashboardRedirect()} />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
