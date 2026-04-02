import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  emptyMessage = 'No data available',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
    >
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 sm:px-5 py-3 sm:py-3.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/50 whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-3 text-white/30">
                  <Inbox className="w-10 h-10" />
                  <p className="text-sm">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={`
                  border-b border-white/5 transition-colors duration-150
                  hover:bg-white/[0.04]
                  ${i % 2 === 1 ? 'bg-white/[0.02]' : ''}
                `}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 sm:px-5 py-3 sm:py-3.5 text-sm text-white/80 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </motion.div>
  );
}
