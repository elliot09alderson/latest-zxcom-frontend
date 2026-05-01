import { useEffect, useState, useRef } from 'react';
import api from '../config/api';

/**
 * Live phone-uniqueness check for onboarding forms — multi-role aware.
 *
 * Debounces 400ms after the user types 10 digits, then asks the backend
 * if the phone can be onboarded for the requested role (`forRole`).
 * Multi-role policy:
 *   - Phone unused → ok to register.
 *   - Phone exists with a DIFFERENT role → ok to register (we'll add the
 *     role to the existing User; the form must show the merge banner).
 *   - Phone exists with the SAME role being added → BLOCKED.
 *   - Phone is admin → BLOCKED.
 *
 * Returns:
 *   {
 *     checking:    bool,
 *     taken:       bool,         // can_add_role = false → block payment
 *     willMerge:   bool,         // phone exists with different role; ok but show merge note
 *     role:        primary existing role (if any),
 *     roles:       full existing roles array,
 *     name:        existing user's name (display only),
 *     reason:      string|null,  // backend conflict reason
 *     error:       string|null,  // network error
 *     reset():     void
 *   }
 *
 * Pass `phone` as the digits-only string. `forRole` defaults to 'merchant'.
 */
export default function usePhoneCheck(phone, forRole = 'merchant') {
  const [checking, setChecking] = useState(false);
  const [taken, setTaken] = useState(false);            // can_add_role = false
  const [willMerge, setWillMerge] = useState(false);    // exists, different role, ok to add
  const [role, setRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState('');
  const [reason, setReason] = useState(null);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const lastQueriedRef = useRef('');

  useEffect(() => {
    const digits = String(phone || '').replace(/\D/g, '');

    if (digits.length !== 10) {
      setTaken(false); setWillMerge(false);
      setRole(null); setRoles([]); setName(''); setReason(null);
      setError(null); setChecking(false);
      lastQueriedRef.current = '';
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    const cacheKey = `${digits}|${forRole}`;
    if (lastQueriedRef.current === cacheKey) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setChecking(true);
      setError(null);
      try {
        const res = await api.get('/promoters/check-phone', {
          params: { phone: digits, for_role: forRole },
        });
        const d = res.data?.data || res.data || {};
        lastQueriedRef.current = cacheKey;
        const blocked = d.exists && !d.can_add_role;
        const merging = d.exists && d.can_add_role;
        setTaken(!!blocked);
        setWillMerge(!!merging);
        setRole(d.role || null);
        setRoles(d.roles || []);
        setName(d.name || '');
        setReason(d.conflict_reason || null);
      } catch (err) {
        // Network/4xx — don't hard-block; backend re-validates at submit.
        setTaken(false); setWillMerge(false);
        setRole(null); setRoles([]); setName(''); setReason(null);
        setError(err.response?.data?.message || 'Failed to verify phone');
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phone, forRole]);

  const reset = () => {
    setTaken(false); setWillMerge(false);
    setRole(null); setRoles([]); setName(''); setReason(null);
    setError(null); setChecking(false);
    lastQueriedRef.current = '';
  };

  return { checking, taken, willMerge, role, roles, name, reason, error, reset };
}
