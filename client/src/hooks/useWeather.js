import { useState, useEffect, useCallback, useRef } from 'react';
import { weatherApi } from '../services/api';
import { REFRESH_INTERVAL_MS } from '../utils/constants';

function useWeather(lat, lon) {
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchWeather = useCallback(async () => {
    if (!lat || !lon) return;

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await weatherApi.getWeather(lat, lon);
      if (response.data.success) {
        setWeather(response.data.data);
        setHourly(response.data.data.hourly || []);
      }
    } catch (err) {
      setError(err.message || 'Gagal mengambil data cuaca');
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchWeather();

    const interval = setInterval(fetchWeather, REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchWeather]);

  return { weather, hourly, loading, error, refetch: fetchWeather };
}

export default useWeather;
