import { useState } from 'react';
import { motion } from 'framer-motion';
import './VotingPanel.css';

const voteSuccessVariants = {
  tap: { scale: 0.92 },
  success: {
    scale: [1, 1.2, 0.95, 1.05, 1],
    transition: { duration: 0.5, times: [0, 0.3, 0.6, 0.8, 1] },
  },
};

function VotingPanel({ votes, userVote, onVote, loading, lat, lon, locationLabel }) {
  const [animState, setAnimState] = useState(null);

  const handleVote = async (voteType) => {
    if (userVote || loading) return;

    setAnimState(voteType);
    await onVote(voteType);

    setTimeout(() => setAnimState(null), 600);
  };

  const handleShare = () => {
    if (!userVote) return;
    const voteText = userVote === 'upvote' ? '✅ AKURAT' : '❌ MELESET';
    const locationText = locationLabel || `${lat?.toFixed(2)}, ${lon?.toFixed(2)}`;
    const text = `Cuaca di ${locationText} ${voteText} menurut warga!\n\nAyo pantau cuaca bersama 👇`;
    const url = `${window.location.origin}/dashboard/cuaca`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank', 'width=550,height=420');
  };

  const total = votes?.total || 0;
  const upPct = total > 0 ? ((votes?.upvotes || 0) / total) * 100 : 50;

  return (
    <div className="voting-panel">
      <h3 className="voting-title">Apakah prakiraan ini akurat?</h3>

      <div className="vote-score-bar">
        <div
          className="vote-score-fill-up"
          style={{ width: `${upPct}%` }}
        />
        <div
          className="vote-score-fill-down"
          style={{ width: `${100 - upPct}%` }}
        />
      </div>

      <div className="vote-stats">
        <span className="vote-stat up">
          {votes?.upvotes || 0} setuju
        </span>
        <span className="vote-stat down">
          {votes?.downvotes || 0} tidak setuju
        </span>
      </div>

      <div className="vote-buttons">
        <motion.button
          className={`vote-btn upvote ${userVote === 'upvote' ? 'active' : ''}`}
          onClick={() => handleVote('upvote')}
          disabled={!!userVote || loading}
          variants={voteSuccessVariants}
          animate={animState === 'upvote' ? 'success' : userVote === 'upvote' ? 'success' : undefined}
          whileTap={!userVote ? 'tap' : undefined}
        >
          <span className="vote-icon">
            {userVote === 'upvote' ? '✓' : '👍'}
          </span>
          <span className="vote-label">Akurat</span>
        </motion.button>

        <motion.button
          className={`vote-btn downvote ${userVote === 'downvote' ? 'active' : ''}`}
          onClick={() => handleVote('downvote')}
          disabled={!!userVote || loading}
          variants={voteSuccessVariants}
          animate={animState === 'downvote' ? 'success' : userVote === 'downvote' ? 'success' : undefined}
          whileTap={!userVote ? 'tap' : undefined}
        >
          <span className="vote-icon">
            {userVote === 'downvote' ? '✓' : '👎'}
          </span>
          <span className="vote-label">Meleset</span>
        </motion.button>
      </div>

      {userVote && (
        <div className="vote-confirmed-section">
          <p className="vote-confirmed">Vote kamu sudah tercatat!</p>
          <button className="vote-share-btn" onClick={handleShare}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Bagikan ke X
          </button>
        </div>
      )}

      {loading && !userVote && (
        <p className="vote-loading">Mengirim vote...</p>
      )}
    </div>
  );
}

export default VotingPanel;
