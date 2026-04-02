import { motion } from 'framer-motion';
import Spinner from './Spinner';

const variants = {
  primary:
    'bg-gradient-to-r from-[#e94560] to-[#c23616] text-white hover:brightness-110 shadow-lg shadow-[#e94560]/20',
  secondary:
    'bg-white/10 text-white hover:bg-white/20 border border-white/10',
  outline:
    'border border-white/20 text-white hover:bg-white/5',
  danger:
    'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20',
  ghost:
    'text-white/70 hover:bg-white/5 hover:text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-7 py-3.5 text-base gap-2.5 rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  onClick,
  type = 'button',
  className = '',
  fullWidth = false,
}) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.03 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 select-none
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      ) : null}
      {children}
    </motion.button>
  );
}
