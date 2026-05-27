import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => { loadReport(); }, [id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getById(id);
      setReport(res.data.data.report);
      setUserVote(res.data.data.userVote);
    } catch {
      navigate('/dashboard/laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    if (!user || user.role !== 'konsumen') return alert('Hanya konsumen yang dapat vote.');
    setVoting(true);
    try {
      await reportsApi.vote(id, voteType);
      setUserVote(voteType);
      loadReport();
    } catch (err) {
      alert(err.message);
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Yakin ingin menghapus laporan ini?')) return;
    try {
      await reportsApi.delete(id);
      navigate('/dashboard/laporan');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner" /></div>;
  if (!report) return null;

  const isOwner = user?.id === report.user_id;

  return (
    <motion.div className="detail-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <button className="btn-back" onClick={() => navigate('/dashboard/laporan')}>← Kembali</button>

      <div className="detail-card">
        <div className="detail-header">
          <h2 className="detail-title">{report.title}</h2>
          <div className="detail-meta">
            <span className="report-author">@{report.username}</span>
            {report.pawang_level && <span className="pawang-badge-mini">{report.pawang_level}</span>}
            <span className="detail-time">{new Date(report.created_at).toLocaleString('id-ID')}</span>
          </div>
        </div>

        {report.media_url && (
          <div className="detail-media">
            {report.media_type === 'video' ? (
              <video src={report.media_url} controls className="detail-video" />
            ) : (
              <img src={report.media_url} alt={report.title} className="detail-image" />
            )}
          </div>
        )}

        <div className="detail-body">
          {report.weather_condition && <div className="detail-condition">🌤️ {report.weather_condition}</div>}
          {report.temperature != null && <div className="detail-temp">🌡️ {report.temperature}°C</div>}
          {report.description && <p className="detail-description">{report.description}</p>}
          {report.location_label && <div className="detail-location">📍 {report.location_label}</div>}
        </div>

        <div className="detail-voting">
          <div className="vote-stats">
            <span className="vote-up-count">👍 {report.upvotes} setuju</span>
            <span className="vote-down-count">👎 {report.downvotes} tidak setuju</span>
            {report.accuracy_pct != null && <span className="vote-accuracy">{report.accuracy_pct}% akurat</span>}
          </div>
          {user?.role === 'konsumen' && (
            <div className="vote-buttons">
              <button className={`vote-btn vote-up ${userVote === 'upvote' ? 'active' : ''}`} onClick={() => handleVote('upvote')} disabled={voting}>
                👍 Akurat
              </button>
              <button className={`vote-btn vote-down ${userVote === 'downvote' ? 'active' : ''}`} onClick={() => handleVote('downvote')} disabled={voting}>
                👎 Meleset
              </button>
            </div>
          )}
        </div>

        {(isOwner || user?.role === 'superadmin') && (
          <div className="detail-actions">
            {isOwner && <button className="btn-secondary" onClick={() => navigate(`/dashboard/laporan/${id}/edit`)}>Edit</button>}
            <button className="btn-danger" onClick={handleDelete}>Hapus</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}