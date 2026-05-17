import { useState, useEffect } from 'react';
import { generateFingerprint } from '../utils/fingerprint';

function useFingerprint() {
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateFingerprint()
      .then((fp) => {
        setFingerprint(fp);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { fingerprint, loading };
}

export default useFingerprint;
