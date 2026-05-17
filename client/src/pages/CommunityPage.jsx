import { useState, useEffect } from 'react';
import { locationsApi } from '../services/api';
import LocationMap from '../components/LocationMap/LocationMap';

function CommunityPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    locationsApi.getLeaderboard(10)
      .then((res) => {
        if (res.data.success) {
          setLeaderboard(res.data.data);
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading-skeleton"><div className="skeleton skeleton-title" /></div>;
  }

  return (
    <div className="community-page">
      <h2>Leaderboard Lokasi</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
        10 lokasi dengan aktivitas vote terbanyak
      </p>

      {error && <div className="error-message">{error}</div>}

      <div className="leaderboard-list">
        {leaderboard.map((loc, index) => (
          <div
            key={loc.geohash}
            className={`leaderboard-item ${selectedLocation?.geohash === loc.geohash ? 'selected' : ''}`}
            onClick={() => setSelectedLocation(loc)}
          >
            <span className="leaderboard-rank">#{index + 1}</span>
            <div className="leaderboard-info">
              <span className="leaderboard-label">{loc.label || loc.geohash}</span>
              <span className="leaderboard-geohash">{loc.geohash}</span>
            </div>
            <div className="leaderboard-stats">
              <span className="leaderboard-votes">{loc.total_votes} votes</span>
              <span className="leaderboard-accuracy">{loc.avg_accuracy_pct.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>

      {selectedLocation && (
        <LocationMap
          lat={selectedLocation.lat}
          lon={selectedLocation.lon}
          label={selectedLocation.label || selectedLocation.geohash}
        />
      )}
    </div>
  );
}

export default CommunityPage;
