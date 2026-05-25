import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '../../services/api';

function StatCard({ value, label, icon, color }) {
  return (
    <motion.div 
      className="admin-stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={`admin-stat-icon ${color}`}>{icon}</div>
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-label">{label}</div>
    </motion.div>
  );
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await adminApi.getDetailedStats();
        setStats(res.data.data);
      } catch (err) {
        setError(err.message || 'Gagal memuat statistik');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page admin-page">
        <div className="loading-container"><div className="loading-spinner" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page admin-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const totalUsers = Object.values(stats.usersByRole || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="dashboard-page admin-page">
      <div className="page-header">
        <h1 className="page-title">📊 Statistik Detail</h1>
        <p className="page-subtitle">Gambaran lengkap aktivitas platform PawangCuaca</p>
      </div>

      <div className="admin-stats-grid">
        <StatCard value={totalUsers} label="Total Pengguna" icon="👥" color="blue" />
        <StatCard value={stats.totalReports} label="Total Laporan" icon="📝" color="green" />
        <StatCard value={stats.totalThreads} label="Total Threads" icon="💬" color="purple" />
        <StatCard value={stats.totalVotes} label="Total Vote Cuaca" icon="🗳️" color="orange" />
        <StatCard value={stats.totalLocations} label="Lokasi Terpantau" icon="📍" color="red" />
      </div>

      <div className="admin-charts-row">
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Distribusi Role Pengguna</h3>
          <div className="admin-chart-body">
            {Object.entries(stats.usersByRole || {}).map(([role, count]) => (
              <div key={role} className="admin-chart-bar-row">
                <span className="admin-chart-label">{role}</span>
                <div className="admin-chart-bar-bg">
                  <motion.div 
                    className={`admin-chart-bar ${role}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / totalUsers) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <span className="admin-chart-value">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Status Pengguna</h3>
          <div className="admin-chart-body">
            {Object.entries(stats.usersByStatus || {}).map(([status, count]) => (
              <div key={status} className="admin-chart-bar-row">
                <span className="admin-chart-label">{status}</span>
                <div className="admin-chart-bar-bg">
                  <motion.div 
                    className={`admin-chart-bar ${status}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / totalUsers) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <span className="admin-chart-value">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-chart-card full">
        <h3 className="admin-chart-title">Aktivitas Vote 30 Hari Terakhir</h3>
        <div className="admin-chart-body">
          <div className="admin-sparkline">
            {stats.voteActivity?.map((day, i) => {
              const maxCount = Math.max(...stats.voteActivity.map(d => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <motion.div
                  key={day.date}
                  className="admin-spark-bar"
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.5, delay: i * 0.02 }}
                  title={`${day.date}: ${day.count} vote`}
                />
              );
            })}
          </div>
          <div className="admin-spark-labels">
            {stats.voteActivity?.length > 0 && (
              <>
                <span>{stats.voteActivity[0].date}</span>
                <span>{stats.voteActivity[stats.voteActivity.length - 1].date}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="admin-chart-card">
        <h3 className="admin-chart-title">Top 10 Lokasi Paling Aktif</h3>
        <div className="admin-top-locations">
          {stats.topLocations?.map((loc, i) => (
            <div key={i} className="admin-top-location">
              <span className="admin-top-location-rank">#{i + 1}</span>
              <span className="admin-top-location-name">{loc.label || `${loc.lat.toFixed(2)}, ${loc.lon.toFixed(2)}`}</span>
              <span className="admin-top-location-votes">{loc.vote_count} vote</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
