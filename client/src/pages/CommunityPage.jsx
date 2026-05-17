import { useState, useEffect } from 'react';
import { locationsApi, votesApi } from '../services/api';
import LocationMap from '../components/LocationMap/LocationMap';

function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  return `${Math.floor(seconds / 86400)} hari lalu`;
}

function CommunityPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentVotes, setRecentVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    Promise.all([
      locationsApi.getLeaderboard(10),
      votesApi.getRecentVotes(20),
    ])
      .then(([lbRes, rvRes]) => {
        if (lbRes.data.success) setLeaderboard(lbRes.data.data);
        if (rvRes.data.success) setRecentVotes(rvRes.data.data);
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
      <h2>Recent Votes</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
        Aktivitas vote terbaru dari komunitas
      </p>

      {error && <div className="error-message">{error}</div>}

      <div className="recent-votes-list">
        {recentVotes.map((vote) => (
          <div
            key={vote.id}
            className="recent-vote-item"
            onClick={() => setSelectedLocation(vote)}
          >
            <span className={`recent-vote-icon ${vote.vote_type === 'upvote' ? 'up' : 'down'}`}>
              {vote.vote_type === 'upvote' ? '👍' : '👎'}
            </span>
            <div className="recent-vote-info">
              <span className="recent-vote-label">{vote.label}</span>
              <span className="recent-vote-time">{timeAgo(vote.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 'var(--space-8)' }}>Leaderboard Lokasi</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
        10 lokasi dengan aktivitas vote terbanyak
      </p>

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
