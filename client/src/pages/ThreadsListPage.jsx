import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { threadsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function ThreadsListPage() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();

  useEffect(() => { loadThreads(); }, [page]);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const res = await threadsApi.getAll({ page, limit: 12 });
      setThreads(res.data.data.threads);
      setTotalPages(res.data.data.totalPages);
    } catch {} finally { setLoading(false); }
  };

  return (
    <motion.div className="feed-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="feed-header">
        <h2 className="page-title">Cuaca Threads</h2>
        {user?.role === 'produsen' && (
          <Link to="/threads/new" className="btn-primary">+ Thread Baru</Link>
        )}
      </div>

      {loading ? (
        <div className="loading-container"><div className="loading-spinner" /></div>
      ) : threads.length === 0 ? (
        <div className="empty-state">
          <p>Belum ada thread cuaca.</p>
          {user?.role === 'produsen' && <Link to="/threads/new" className="btn-primary">Mulai Thread Pertama</Link>}
        </div>
      ) : (
        <>
          <div className="threads-list">
            {threads.map((thread) => (
              <Link to={`/threads/${thread.id}`} key={thread.id} className="thread-card">
                {thread.cover_media && (
                  <div className="thread-cover">
                    <img src={thread.cover_media} alt="" />
                  </div>
                )}
                <div className="thread-info">
                  <h3 className="thread-title">{thread.title}</h3>
                  <div className="thread-meta">
                    <span>@{thread.username}</span>
                    {thread.pawang_level && <span className="pawang-badge-mini">{thread.pawang_level}</span>}
                    {thread.location_label && <span>📍 {thread.location_label}</span>}
                  </div>
                  <div className="thread-stats">
                    <span>{thread.post_count} posts</span>
                    <span>{new Date(thread.updated_at).toLocaleDateString('id-ID')}</span>
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