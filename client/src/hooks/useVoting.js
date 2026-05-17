import { useState, useCallback, useEffect } from 'react';
import { votesApi, weatherApi } from '../services/api';
import { VOTE_STORAGE_KEY } from '../utils/constants';

function useVoting(lat, lon, forecastHour) {
  const [votes, setVotes] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(VOTE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed[forecastHour]) {
          setUserVote(parsed[forecastHour]);
        }
      } catch {
        localStorage.removeItem(VOTE_STORAGE_KEY);
      }
    }
  }, [forecastHour]);

  const fetchVotes = useCallback(async () => {
    if (!lat || !lon || !forecastHour) return;

    setLoading(true);
    try {
      const response = await weatherApi.getVotes(lat, lon, 48);
      if (response.data.success) {
        const hourData = response.data.data.votes_by_hour.find(
          (v) => v.forecast_hour === forecastHour
        );
        if (hourData) {
          setVotes(hourData);
          if (hourData.user_voted) {
            setUserVote(hourData.user_voted);
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lat, lon, forecastHour]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const submitVote = useCallback(
    async (voteType, voterFingerprint) => {
      if (!lat || !lon || !forecastHour) return;

      setLoading(true);
      setError(null);

      try {
        const optimisticUp = voteType === 'upvote' ? (votes?.upvotes || 0) + 1 : votes?.upvotes || 0;
        const optimisticDown = voteType === 'downvote' ? (votes?.downvotes || 0) + 1 : votes?.downvotes || 0;
        setVotes({
          ...votes,
          upvotes: optimisticUp,
          downvotes: optimisticDown,
          total: optimisticUp + optimisticDown,
        });
        setUserVote(voteType);

        const response = await votesApi.submitVote({
          lat,
          lon,
          forecast_hour: forecastHour,
          vote_type: voteType,
          voter_fingerprint: voterFingerprint,
        });

        if (response.data.success) {
          setVotes(response.data.data.updated_aggregate);

          const stored = JSON.parse(localStorage.getItem(VOTE_STORAGE_KEY) || '{}');
          stored[forecastHour] = voteType;
          localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(stored));
        }
      } catch (err) {
        setError(err.message || 'Gagal mengirim vote');
        fetchVotes();
      } finally {
        setLoading(false);
      }
    },
    [lat, lon, forecastHour, votes, fetchVotes]
  );

  return { votes, userVote, submitVote, loading, error, refetch: fetchVotes };
}

export default useVoting;
