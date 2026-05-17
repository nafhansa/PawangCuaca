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

function VotingPanel({ votes, userVote, onVote, loading }) {
  const [animState, setAnimState] = useState(null);

  const handleVote = async (voteType) => {
    if (userVote || loading) return;

    setAnimState(voteType);
    await onVote(voteType);

    setTimeout(() => setAnimState(null), 600);
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
        <p className="vote-confirmed">Vote kamu sudah tercatat!</p>
      )}

      {loading && !userVote && (
        <p className="vote-loading">Mengirim vote...</p>
      )}
    </div>
  );
}

export default VotingPanel;
