import { useState } from 'react';

// Fields where the user should only be able to type digits.
// `tel` is phone, `number` is any numeric field; callers can also pass
// `digitsOnly` explicitly for pincode/aadhaar-style fields.
const DIGIT_TYPES = new Set(['tel', 'number']);

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  name,
  required = false,
  disabled = false,
  readOnly = false,
  digitsOnly = false,
  maxLength,
  inputMode,
  className = '',
}) {
  const [focused, setFocused] = useState(false);
  const isDigitField = digitsOnly || DIGIT_TYPES.has(type);

  // Strip any non-digit characters the user tries to type/paste into a
  // digit-only field. Still fires the caller's onChange with a cleaned value
  // so form state never holds garbage.
  const handleChange = (e) => {
    if (isDigitField) {
      const cleaned = e.target.value.replace(/\D+/g, '');
      if (cleaned !== e.target.value) {
        e.target.value = cleaned;
      }
    }
    onChange?.(e);
  };

  // Block non-numeric keystrokes early so the caret doesn't visibly jump.
  const handleKeyDown = (e) => {
    if (!isDigitField) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const allowed = ['Backspace', 'Delete', 'Tab', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight'];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-white/80">
          {label}
          {required && <span className="text-[#e94560] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            className={`
              absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4
              transition-colors duration-200
              ${focused ? 'text-[#e94560]' : 'text-white/40'}
            `}
          />
        )}

        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          inputMode={inputMode || (isDigitField ? 'numeric' : undefined)}
          pattern={isDigitField ? '[0-9]*' : undefined}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full bg-white/5 backdrop-blur-xl
            border rounded-xl px-4 py-2.5 text-sm text-white
            placeholder:text-white/30
            outline-none transition-all duration-200
            ${Icon ? 'pl-11' : ''}
            ${error
              ? 'border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
              : 'border-white/10 focus:border-[#e94560]/60 focus:ring-1 focus:ring-[#e94560]/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
