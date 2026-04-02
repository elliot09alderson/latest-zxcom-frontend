import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = false, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hover ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={`
        bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl
        shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
