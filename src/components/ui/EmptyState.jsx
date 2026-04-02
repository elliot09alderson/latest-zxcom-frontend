import { motion } from 'framer-motion';
import Button from './Button';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {Icon && (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-5">
          <Icon className="w-10 h-10 text-white/25" />
        </div>
      )}

      {title && (
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      )}

      {description && (
        <p className="text-sm text-white/50 max-w-xs mb-6">{description}</p>
      )}

      {action && (
        <Button
          variant={action.variant || 'primary'}
          icon={action.icon}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
