import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { votesApi } from '../../services/api';

function ShareButton({ vote, label, lat, lon }) {
  const handleShare = () => {
    const voteText = vote.vote_type === 'upvote' ? '✅ AKURAT' : '❌ MELESET';
    const locationText = label || `${lat?.toFixed(2)}, ${lon?.toFixed(2)}`;
    const text = `Cuaca di ${locationText} ${voteText} menurut warga! \n\nAyo pantau cuaca bersama 👇`;
    const url = `${window.location.origin}/dashboard/cuaca`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank', 'width=550,height=420');
  };

  return (
    <button className="share-btn" onClick={handleShare} title="Bagikan ke X">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      <span>Bagikan</span>
    </button>
  );
}

export default function LatestVotesPage() {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchVotes() {
      try {
        setLoading(true);
        const res = await votesApi.getRecentVotes(50);
        setVotes(res.data.data || []);
      } catch (err) {
        setError(err.message || 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    }
    fetchVotes();

    // Auto refresh setiap 30 detik
    const interval = setInterval(fetchVotes, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredVotes = filter === 'all' 
    ? votes 
    : votes.filter(v => v.vote_type === filter);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-container"><div className="loading-spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">🗳️ Vote Terbaru</h1>
        <p className="page-subtitle">Lihat validasi cuaca terbaru dari warga di seluruh Indonesia</p>
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Semua
        </button>
        <button 
          className={`filter-tab ${filter === 'upvote' ? 'active' : ''}`}
          onClick={() => setFilter('upvote')}
        >
          ✅ Akurat
        </button>
        <button 
          className={`filter-tab ${filter === 'downvote' ? 'active' : ''}`}
          onClick={() => setFilter('downvote')}
        >
          ❌ Meleset
        </button>
      </div>

      <div className="votes-feed">
        {filteredVotes.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada vote untuk filter ini.</p>
          </div>
        ) : (
          filteredVotes.map((vote, index) => (
            <motion.div
              key={vote.id}
              className={`vote-card ${vote.vote_type}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="vote-card-header">
                <div className={`vote-card-badge ${vote.vote_type}`}>
                  <span className="vote-icon">
                    {vote.vote_type === 'upvote' ? '✅' : '❌'}
                  </span>
                  <span className="vote-type-text">
                    {vote.vote_type === 'upvote' ? 'Akurat' : 'Meleset'}
                  </span>
                </div>
                <span className="vote-time">
                  {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true, locale: id })}
                </span>
              </div>
              <div className="vote-card-body">
                <div className="vote-location">
                  <span>📍</span>
                  <span>{vote.label || vote.geohash}</span>
                </div>
                <div className="vote-meta-row">
                  <div className="vote-coords">
                    <span>🌐</span>
                    <span>{vote.lat.toFixed(4)}, {vote.lon.toFixed(4)}</span>
                  </div>
                  {vote.user_username && (
                    <div className="vote-user">
                      <span>👤</span>
                      <span>@{vote.user_username}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="vote-card-footer">
                <ShareButton
                  vote={vote}
                  label={vote.label}
                  lat={vote.lat}
                  lon={vote.lon}
                />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
