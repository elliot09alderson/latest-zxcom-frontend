import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const roleLinks = {
  merchant: [
    { path: '/merchant', label: 'Dashboard' },
    { path: '/merchant/profile', label: 'Profile' },
  ],
  promoter: [
    { path: '/promoter', label: 'Dashboard' },
    { path: '/promoter/profile', label: 'Profile' },
  ],
  area_manager: [
    { path: '/promoter', label: 'Dashboard' },
    { path: '/promoter/profile', label: 'Profile' },
  ],
  admin: [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/offers', label: 'Offers' },
    { path: '/admin/promoters', label: 'Promoters' },
    { path: '/admin/merchants', label: 'Merchants' },
    { path: '/admin/contests', label: 'Contests' },
    { path: '/admin/config', label: 'Config' },
  ],
};

const guestLinks = [
  { path: '/', label: 'Home' },
  { path: '/login', label: 'Login' },
  { path: '/register', label: 'Register' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = isAuthenticated && user?.role
    ? roleLinks[user.role] || guestLinks
    : guestLinks;

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'text-[#e94560]'
        : 'text-white/70 hover:text-white'
    }`;

  const activeDot = (
    <motion.span
      layoutId="nav-underline"
      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#e94560] rounded-full"
    />
  );

  return (
    <nav className="sticky top-0 z-50 w-full bg-black/30 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#e94560] to-[#c23616] bg-clip-text text-transparent">
              X-FLEX
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <NavLink key={link.path} to={link.path} className={linkClass} end>
                {({ isActive }) => (
                  <span className="relative">
                    {link.label}
                    {isActive && activeDot}
                  </span>
                )}
              </NavLink>
            ))}

            {isAuthenticated && user && (
              <div className="flex items-center gap-3 ml-6 pl-6 border-l border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e94560] to-[#c23616] flex items-center justify-center text-white text-xs font-bold uppercase">
                    {user.name?.charAt(0) || <User size={14} />}
                  </div>
                  <span className="text-sm text-white/80 font-medium max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-white/50 hover:text-[#e94560] hover:bg-white/5 transition-all duration-200 cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-black/40 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#e94560]/15 text-[#e94560]'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {isAuthenticated && user && (
                <div className="pt-3 mt-2 border-t border-white/10">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e94560] to-[#c23616] flex items-center justify-center text-white text-xs font-bold uppercase">
                      {user.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm text-white/80 font-medium">
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-[#e94560] hover:bg-white/5 transition-all duration-200 cursor-pointer"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
