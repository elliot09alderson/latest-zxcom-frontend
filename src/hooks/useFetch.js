import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../config/api';

export default function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!url) {
      setLoading(false);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(url, { signal: controller.signal });
      // Unwrap the { success, data } wrapper so components get the inner data directly
      setData(response.data?.data ?? response.data);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    return () => controllerRef.current?.abort();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
