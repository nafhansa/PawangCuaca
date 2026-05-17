import { useState, useEffect, useCallback } from 'react';

function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const getLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    const stored = localStorage.getItem('pwc_last_location');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCoords(parsed);
        setLoading(false);
      } catch {
        localStorage.removeItem('pwc_last_location');
      }
    }

    if (!navigator.geolocation) {
      setError('Geolokasi tidak didukung browser ini');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setCoords(location);
        localStorage.setItem('pwc_last_location', JSON.stringify(location));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return { coords, error, loading, retry: getLocation };
}

export default useGeolocation;
