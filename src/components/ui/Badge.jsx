const variantStyles = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger:  'bg-red-500/15 text-red-400 border-red-500/20',
  info:    'bg-blue-500/15 text-blue-400 border-blue-500/20',
  default: 'bg-white/10 text-white/70 border-white/10',
};

export default function Badge({ text, variant = 'default' }) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-xs font-medium border
        ${variantStyles[variant] || variantStyles.default}
      `}
    >
      {text}
    </span>
  );
}
