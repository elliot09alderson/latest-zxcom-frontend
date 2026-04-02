import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ links = [], title = 'Menu' }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-64';

  return (
    <motion.aside
      layout
      className={`hidden lg:flex flex-col fixed left-0 top-16 bottom-0 z-40 ${sidebarWidth} bg-black/30 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/5">
        {!collapsed && (
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm font-semibold text-white/50 uppercase tracking-wider truncate"
          >
            {title}
          </motion.h2>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={`p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#e94560]/15 text-[#e94560] shadow-lg shadow-[#e94560]/5'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? link.label : undefined}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex-shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-[#e94560]' : 'text-white/40 group-hover:text-white/70'
                  }`}
                >
                  {link.icon}
                </span>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="truncate"
                  >
                    {link.label}
                  </motion.span>
                )}
                {isActive && !collapsed && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[#e94560]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      {user && (
        <div className="border-t border-white/5 p-3">
          <div
            className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e94560] to-[#c23616] flex items-center justify-center text-white text-xs font-bold uppercase flex-shrink-0">
              {user.name?.charAt(0) || '?'}
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-w-0"
              >
                <p className="text-sm font-medium text-white/90 truncate">
                  {user.name}
                </p>
                <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#e94560]/15 text-[#e94560]">
                  {user.role}
                </span>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </motion.aside>
  );
}
