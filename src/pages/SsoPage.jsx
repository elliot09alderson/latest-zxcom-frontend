import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

export default function SsoPage() {
  const [searchParams] = useSearchParams();
  const { persist } = useAuth();
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const ticket = searchParams.get('ticket');
    if (!ticket) { navigate('/login', { replace: true }); return; }

    api.get(`/auth/sso?ticket=${encodeURIComponent(ticket)}`)
      .then((res) => {
        const { user, token } = res.data.data;
        persist(user, token);
        navigate('/', { replace: true });
      })
      .catch(() => navigate('/login', { replace: true }));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400">Signing you in…</p>
      </div>
    </div>
  );
}
