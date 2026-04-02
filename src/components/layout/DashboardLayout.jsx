import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout({ children, sidebarLinks = [], title = 'Dashboard' }) {
  const { user } = useAuth();
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <Navbar />

      {/* Desktop sidebar */}
      <Sidebar links={sidebarLinks} title={title} />

      {/* Mobile top bar for sidebar links */}
      <div className="lg:hidden sticky top-16 z-30 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-12">
          <span className="text-sm font-semibold text-white/50 uppercase tracking-wider">
            {title}
          </span>
          <button
            onClick={() => setMobileNav((v) => !v)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {mobileNav ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileNav && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-white/5"
            >
              <nav className="px-3 py-2 space-y-1">
                {sidebarLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end
                    onClick={() => setMobileNav(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-[#e94560]/15 text-[#e94560]'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <span className="flex-shrink-0">{link.icon}</span>
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main content */}
      <main className="lg:ml-64 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
