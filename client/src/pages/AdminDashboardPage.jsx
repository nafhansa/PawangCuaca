import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadStats();
    loadUsers();
  }, [filter]);

  const loadStats = async () => {
    try {
      const res = await adminApi.getStats();
      setStats(res.data.data);
    } catch {}
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ status: filter, limit: 50 });
      setUsers(res.data.data.users);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminApi.approveUser(id);
      loadUsers();
      loadStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await adminApi.rejectUser(id);
      loadUsers();
      loadStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus user ini?')) return;
    try {
      await adminApi.deleteUser(id);
      loadUsers();
      loadStats();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <motion.div className="admin-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="page-title">Admin Dashboard</h2>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.usersByStatus?.pending || 0}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.usersByStatus?.approved || 0}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.usersByRole?.produsen || 0}</div>
            <div className="stat-label">Produsen</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.usersByRole?.konsumen || 0}</div>
            <div className="stat-label">Konsumen</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalReports || 0}</div>
            <div className="stat-label">Laporan</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalThreads || 0}</div>
            <div className="stat-label">Threads</div>
          </div>
        </div>
      )}

      <div className="admin-section">
        <div className="admin-section-header">
          <h3>Manajemen User</h3>
          <div className="filter-tabs">
            {['pending', 'approved', 'rejected'].map((s) => (
              <button
                key={s}
                className={`filter-tab ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /></div>
        ) : users.length === 0 ? (
          <p className="empty-text">Tidak ada user dengan status {filter}.</p>
        ) : (
          <div className="user-list">
            {users.map((u) => (
              <div key={u.id} className="user-card">
                <div className="user-info">
                  <span className="user-name">{u.username}</span>
                  <span className="user-email">{u.email}</span>
                  <span className={`user-role-badge role-${u.role}`}>{u.role}</span>
                  <span className={`user-status-badge status-${u.status}`}>{u.status}</span>
                  {u.pawang_level && u.role === 'produsen' && (
                    <span className="pawang-badge-mini">{u.pawang_level}</span>
                  )}
                </div>
                <div className="user-actions">
                  {u.status === 'pending' && (
                    <>
                      <button className="btn-approve" onClick={() => handleApprove(u.id)}>Approve</button>
                      <button className="btn-reject" onClick={() => handleReject(u.id)}>Reject</button>
                    </>
                  )}
                  {u.status === 'rejected' && (
                    <button className="btn-approve" onClick={() => handleApprove(u.id)}>Approve</button>
                  )}
                  {u.id !== currentUser.id && (
                    <button className="btn-delete" onClick={() => handleDelete(u.id)}>Hapus</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
