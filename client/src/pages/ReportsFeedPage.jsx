import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function ReportsFeedPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();

  useEffect(() => { loadReports(); }, [page]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getAll({ page, limit: 12 });
      setReports(res.data.data.reports);
      setTotalPages(res.data.data.totalPages);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleVote = async (reportId, voteType) => {
    try {
      await reportsApi.vote(reportId, voteType);
      loadReports();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <motion.div className="feed-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="feed-header">
        <h2 className="page-title">Laporan Cuaca</h2>
        {user?.role === 'produsen' && (
          <Link to="/dashboard/laporan/baru" className="btn-primary">+ Buat Laporan</Link>
        )}
      </div>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner" /></div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <p>Belum ada laporan cuaca.</p>
          {user?.role === 'produsen' && <Link to="/dashboard/laporan/baru" className="btn-primary">Buat Laporan Pertama</Link>}
        </div>
      ) : (
        <>
          <div className="reports-grid">
            {reports.map((report) => (
              <Link to={`/dashboard/laporan/${report.id}`} key={report.id} className="report-card">
                {report.media_url && (
                  <div className="report-media-thumb">
                    {report.media_type === 'video' ? (
                      <div className="video-placeholder">🎬</div>
                    ) : (
                      <img src={report.media_url} alt="" />
                    )}
                  </div>
                )}
                <div className="report-content">
                  <h3 className="report-title">{report.title}</h3>
                  <div className="report-meta">
                    <span className="report-author">@{report.username}</span>
                    {report.pawang_level && <span className="pawang-badge-mini">{report.pawang_level}</span>}
                    {report.weather_condition && <span className="report-condition">{report.weather_condition}</span>}
                  </div>
                  <div className="report-stats">
                    <span className="stat-up">👍 {report.upvotes}</span>
                    <span className="stat-down">👎 {report.downvotes}</span>
                    {report.accuracy_pct != null && <span className="stat-accuracy">{report.accuracy_pct}% akurat</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</button>
            <span>Halaman {page} dari {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Selanjutnya</button>
          </div>
        </>
      )}
    </motion.div>
  );
}