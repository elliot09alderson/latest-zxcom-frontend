import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, User, Store, Users, ShoppingCart, Heart, Coins, ChevronDown, Briefcase, Share2, UserPlus, Copy, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import api from '../../config/api';
import Logo from '../ui/Logo';

const roleLinks = {
  customer: [
    { path: '/', label: 'Shop' },
    { path: '/orders', label: 'My Orders' },
    { path: '/addresses', label: 'Addresses' },
  ],
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

// Customer-facing flat links. The Member dropdown is rendered separately
// because it needs hover behaviour for its sub-options.
const guestLinks = [
  { path: '/', label: 'Home' },
  { path: '/login', label: 'Login' },
  { path: '/register', label: 'Sign Up' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems: cartCount } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [credits, setCredits] = useState(null);
  const [shopName, setShopName] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTab, setShareTab] = useState('promoter'); // 'promoter' | 'merchant'
  const shareRef = useRef(null);

  const isPromoter = user?.role === 'promoter' || user?.role === 'area_manager';
  const isMerchant = user?.role === 'merchant';

  // Fetch promoter credits + wallet
  useEffect(() => {
    if (!isAuthenticated || !isPromoter) return;
    api.get('/promoters/profile')
      .then((res) => {
        const p = res.data?.data?.promoter || res.data?.promoter || {};
        setCredits({
          shopsUsed: p.total_shops_count || 0,
          shopsMax: p.max_shops_allowed || 0,
          promotersUsed: p.total_promoters_count || 0,
          promotersMax: p.max_promoters_allowed || 0,
        });
        setWalletBalance(p.commission_earned || 0);
        setReferralCode(p.referral_code || user?.phone || '');
      })
      .catch(() => {});
  }, [isAuthenticated, isPromoter]);

  // Fetch merchant shop name + wallet
  useEffect(() => {
    if (!isAuthenticated || !isMerchant) return;
    api.get('/merchants/profile')
      .then((res) => {
        const m = res.data?.data?.merchant || res.data?.merchant || {};
        setShopName(m.shop_name || '');
        setWalletBalance(m.wallet_balance || 0);
      })
      .catch(() => {});
  }, [isAuthenticated, isMerchant]);

  // Close share dropdown when clicking outside
  useEffect(() => {
    if (!shareOpen) return;
    const handler = (e) => { if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [shareOpen]);

  const getShareLinks = () => {
    const base = window.location.origin;
    const ref = encodeURIComponent(referralCode || '');
    return {
      promoter: `${base}/register?ref=${ref}`,
      merchant: `${base}/member/register?ref=${ref}&role=merchant`,
    };
  };

  const copyLink = async (type) => {
    const url = getShareLinks()[type];
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const doShare = async (type) => {
    const url = getShareLinks()[type];
    const isPromoter = type === 'promoter';
    const title = isPromoter ? 'Join ZXCOM as a Promoter' : 'Register your shop on ZXCOM';
    const text  = isPromoter
      ? 'Join ZXCOM as a Promoter using my referral link and start earning:'
      : 'Register your shop on ZXCOM using my referral link:';
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); } catch { /* cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener');
    }
  };

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

  const CreditBadge = ({ icon: Icon, used, max, color, label }) => (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10" title={`${label}: ${used} / ${max}`}>
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <span className="text-xs font-bold text-white">{used}</span>
      <span className="text-[10px] text-white/30">/</span>
      <span className="text-xs text-white/40">{max}</span>
    </div>
  );

  const IconBadge = ({ icon: Icon, count, onClick, label }) => (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
      title={label}
    >
      <Icon size={20} />
      <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold ${
        count > 0 ? 'bg-[#e94560] text-white' : 'bg-white/10 text-white/40'
      }`}>
        {count}
      </span>
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 w-full bg-black/30 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo size="sm" />
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

            {/* Member dropdown — only for guests. Hover reveals Login/Register
                for the merchant/promoter portal. Customer login + signup
                stay as flat links above. */}
            {!isAuthenticated && (
              <div className="relative group">
                <button
                  type="button"
                  className="relative px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 inline-flex items-center gap-1"
                  aria-haspopup="menu"
                >
                  Member
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute right-0 top-full pt-1 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                    <Link
                      to="/member/login"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-[#e94560]" />
                      Login
                      <span className="text-[10px] text-white/30 ml-auto">Merchant / Promoter</span>
                    </Link>
                    <div className="h-px bg-white/5 mx-2" />
                    <Link
                      to="/member/register"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Store className="w-3.5 h-3.5 text-[#e94560]" />
                      Register
                      <span className="text-[10px] text-white/30 ml-auto">Become a Member</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Cart / Wishlist / Credits — always visible */}
            <div className="flex items-center gap-1 ml-4 pl-4 border-l border-white/10">
              {/* Wallet Balance */}
              {(isMerchant || isPromoter) && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 mr-1" title="Wallet Balance">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs font-bold text-white">
                    {walletBalance > 0 ? `₹${walletBalance.toLocaleString('en-IN')}` : '₹0'}
                  </span>
                </div>
              )}
              {!isMerchant && !isPromoter && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 mr-1" title="Credits">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs font-bold text-white">0</span>
                </div>
              )}

              <IconBadge icon={Heart} count={wishlistCount} onClick={() => navigate('/')} label="Wishlist" />
              <IconBadge icon={ShoppingCart} count={cartCount} onClick={() => navigate('/checkout')} label="Cart" />
            </div>

            {isAuthenticated && user && (
              <div className="flex items-center gap-3 ml-3 pl-3 border-l border-white/10">
                {/* Promoter Credits + Share */}
                {isPromoter && credits && (
                  <div className="flex items-center gap-2">
                    <CreditBadge icon={Store} used={credits.shopsUsed} max={credits.shopsMax} color="#10b981" label="Merchant Credits" />
                    <CreditBadge icon={Users} used={credits.promotersUsed} max={credits.promotersMax} color="#3b82f6" label="Promoter Credits" />
                    {/* Share / Onboard button */}
                    <div className="relative" ref={shareRef}>
                      <button
                        onClick={() => setShareOpen((v) => !v)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#e94560]/15 border border-[#e94560]/40 text-[#e94560] hover:bg-[#e94560]/25 transition-colors text-xs font-semibold"
                        title="Share onboarding link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Onboard</span>
                      </button>
                      <AnimatePresence>
                        {shareOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-[#0d0d1f]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
                          >
                            <SharePanel tab={shareTab} setTab={setShareTab} getShareLinks={getShareLinks} copyLink={copyLink} doShare={doShare} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e94560] to-[#c23616] flex items-center justify-center text-white text-xs font-bold uppercase">
                    {user.name?.charAt(0) || <User size={14} />}
                  </div>
                  <div className="flex flex-col">
                    {isMerchant && shopName && (
                      <span className="text-xs font-semibold text-[#e94560] leading-tight truncate max-w-[140px]">{shopName}</span>
                    )}
                    <span className="text-sm text-white/80 font-medium max-w-[140px] truncate leading-tight">
                      {user.name}
                    </span>
                  </div>
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

          {/* Mobile right side */}
          <div className="flex items-center gap-1 md:hidden">
            {/* Wallet Balance */}
            {(isMerchant || isPromoter) ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10" title="Wallet Balance">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-bold text-white">
                  {walletBalance > 0 ? `₹${walletBalance.toLocaleString('en-IN')}` : '₹0'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10" title="Credits">
                <Coins className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] font-bold text-white">0</span>
              </div>
            )}

            <IconBadge icon={Heart} count={wishlistCount} onClick={() => navigate('/')} label="Wishlist" />
            <IconBadge icon={ShoppingCart} count={cartCount} onClick={() => navigate('/checkout')} label="Cart" />

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
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
              {/* Mobile Credits + Share */}
              {isPromoter && credits && (
                <div className="px-3 py-2 mb-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditBadge icon={Store} used={credits.shopsUsed} max={credits.shopsMax} color="#10b981" label="Merchant Credits" />
                    <CreditBadge icon={Users} used={credits.promotersUsed} max={credits.promotersMax} color="#3b82f6" label="Promoter Credits" />
                  </div>
                  <div className="pt-1">
                    <SharePanel tab={shareTab} setTab={setShareTab} getShareLinks={getShareLinks} copyLink={copyLink} doShare={doShare} mobile />
                  </div>
                </div>
              )}

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

              {/* Member section on mobile */}
              {!isAuthenticated && (
                <div className="pt-3 mt-2 border-t border-white/10">
                  <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-white/30 font-semibold">Member</p>
                  <Link
                    to="/member/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Briefcase className="w-4 h-4 text-[#e94560]" />
                    Member Login
                  </Link>
                  <Link
                    to="/member/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Store className="w-4 h-4 text-[#e94560]" />
                    Become a Member
                  </Link>
                </div>
              )}

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

const TABS = [
  { key: 'promoter', label: 'Promoter', icon: UserPlus, color: 'text-[#e94560]', bg: 'bg-[#e94560]/20' },
  { key: 'merchant', label: 'Merchant', icon: Store,    color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
];

function SharePanel({ tab, setTab, getShareLinks, copyLink, doShare, mobile = false }) {
  const active = TABS.find((t) => t.key === tab) || TABS[0];
  const Icon = active.icon;
  const link = getShareLinks()[tab];
  const hasShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className={mobile ? '' : 'p-4'}>
      {/* Tab switcher */}
      <div className={`flex gap-2 ${mobile ? 'mb-3' : 'mb-4'}`}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold transition-colors border ${
              tab === t.key
                ? `${t.bg} ${t.color} border-current/30`
                : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${active.bg}`}>
          <Icon className={`w-4 h-4 ${active.color}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">
            {tab === 'promoter' ? 'Refer a Promoter' : 'Onboard a Merchant'}
          </p>
          <p className="text-[11px] text-white/40">
            {tab === 'promoter'
              ? 'Share your link — they fill the form, you grow your network.'
              : 'Share your link — merchant registers and links to you.'}
          </p>
        </div>
      </div>

      {/* Link box */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 mb-3">
        <Link2 className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
        <span className="text-[11px] text-white/60 truncate flex-1">{link}</span>
        <button
          onClick={() => copyLink(tab)}
          className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors flex-shrink-0"
          title="Copy"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => copyLink(tab)}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white/80 hover:text-white hover:bg-white/12 text-[13px] font-medium transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy Link
        </button>
        <button
          onClick={() => doShare(tab)}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#e94560] to-[#c23616] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
        >
          <Share2 className="w-3.5 h-3.5" />
          {hasShare ? 'Share' : 'WhatsApp'}
        </button>
      </div>

      <p className="text-[10px] text-white/25 mt-3 leading-relaxed">
        When someone signs up through this link, they&apos;ll be linked to you automatically.
      </p>
    </div>
  );
}
