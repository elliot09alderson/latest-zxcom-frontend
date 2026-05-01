// Shared field validators for onboarding / registration forms.
// Each validator returns a string error message when invalid, or '' when OK.
// Callers merge the results into a `{ fieldName: errorMessage }` map and feed
// it to the Input component's `error` prop so mistakes appear inline.

export const validateName = (name) => {
  const v = String(name || '').trim();
  if (!v) return 'Name is required';
  if (v.length < 2) return 'Name is too short';
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(v)) return 'Use letters, spaces, . \' or -';
  return '';
};

// Indian mobile: 10 digits, must start with 6, 7, 8, or 9.
export const validatePhone = (phone) => {
  const v = String(phone || '').trim();
  if (!v) return 'Phone is required';
  if (!/^[6-9]\d{9}$/.test(v)) return 'Enter a valid 10-digit mobile number';
  return '';
};

export const validatePassword = (password) => {
  const v = String(password || '');
  if (!v) return 'Password is required';
  if (v.length < 6) return 'Password must be at least 6 characters';
  return '';
};

export const validateConfirmPassword = (confirm, password) => {
  const c = String(confirm || '');
  const p = String(password || '');
  if (!c) return 'Please confirm your password';
  if (c !== p) return 'Passwords do not match';
  return '';
};

// Email is optional on most forms — empty is valid. Only format-check when set.
export const validateEmail = (email) => {
  const v = String(email || '').trim();
  if (!v) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email';
  return '';
};

// Indian PIN code: 6 digits, first digit 1-9.
export const validatePincode = (pin, { required = false } = {}) => {
  const v = String(pin || '').trim();
  if (!v) return required ? 'Pincode is required' : '';
  if (!/^[1-9]\d{5}$/.test(v)) return 'Pincode must be 6 digits';
  return '';
};

// GSTIN: 15 chars, state code + 10-char PAN + entity + Z + check digit.
// Optional on most forms.
export const validateGstin = (gstin) => {
  const v = String(gstin || '').trim().toUpperCase();
  if (!v) return '';
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v)) {
    return 'Enter a valid 15-character GSTIN';
  }
  return '';
};

export const validateRequired = (value, label = 'Field') => {
  return String(value || '').trim() ? '' : `${label} is required`;
};

// Drop empty-string keys so callers can check `Object.keys(errors).length === 0`.
export const pruneErrors = (errs) => {
  const out = {};
  for (const [k, v] of Object.entries(errs || {})) {
    if (v) out[k] = v;
  }
  return out;
};
