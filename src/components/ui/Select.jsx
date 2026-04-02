import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  name,
  className = '',
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-white/80">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full appearance-none bg-white/5 backdrop-blur-xl
            border rounded-xl px-4 py-2.5 pr-10 text-sm text-white
            outline-none transition-all duration-200 cursor-pointer
            ${!value ? 'text-white/30' : ''}
            ${error
              ? 'border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
              : 'border-white/10 focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/20'
            }
          `}
        >
          <option value="" disabled className="bg-[#1a1a2e] text-white/40">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1a1a2e] text-white">
              {opt.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className={`
            absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none
            transition-colors duration-200
            ${focused ? 'text-[#e94560]' : 'text-white/40'}
          `}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
