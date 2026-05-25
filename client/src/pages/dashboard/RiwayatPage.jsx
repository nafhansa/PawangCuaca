import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

function ActivityIcon({ type }) {
  const icons = {
    report: '📝',
    report_vote: '👍',
    thread: '💬',
    thread_post: '💭',
    weather_vote: '🗳️',
  };
  return <span className="activity-icon">{icons[type] || '📌'}</span>;
}

function ActivityContent({ activity }) {
  switch (activity.type) {
    case 'report':
      return (
        <div className="activity-content">
          <p className="activity-text">
            Kamu membuat laporan cuaca <strong>"{activity.title}"</strong>
            {activity.location_label && <span> di {activity.location_label}</span>}
          </p>
          {activity.weather_condition && (
            <div className="activity-tags">
              <span className="activity-tag">{activity.weather_condition}</span>
              {activity.temperature && <span className="activity-tag">{activity.temperature}°C</span>}
            </div>
          )}
          <Link to={`/dashboard/laporan/${activity.id}`} className="activity-link">
            Lihat Laporan →
          </Link>
        </div>
      );
    case 'report_vote':
      return (
        <div className="activity-content">
          <p className="activity-text">
            Kamu vote <strong className={activity.vote_type === 'upvote' ? 'text-success' : 'text-error'}>
              {activity.vote_type === 'upvote' ? '👍 Akurat' : '👎 Meleset'}
            </strong> untuk laporan <strong>"{activity.title}"</strong>
          </p>
          <Link to={`/dashboard/laporan/${activity.id}`} className="activity-link">
            Lihat Laporan →
          </Link>
        </div>
      );
    case 'thread':
      return (
        <div className="activity-content">
          <p className="activity-text">
            Kamu membuat thread <strong>"{activity.title}"</strong>
            {activity.location_label && <span> di {activity.location_label}</span>}
          </p>
          <Link to={`/dashboard/threads/${activity.id}`} className="activity-link">
            Lihat Thread →
          </Link>
        </div>
      );
    case 'thread_post':
      return (
        <div className="activity-content">
          <p className="activity-text">
            Kamu membalas di thread <strong>"{activity.thread_title}"</strong>
          </p>
          {activity.post_content && (
            <p className="activity-quote">"{activity.post_content}..."</p>
          )}
          <Link to={`/dashboard/threads/${activity.id}`} className="activity-link">
            Lihat Thread →
          </Link>
        </div>
      );
    case 'weather_vote':
      return (
        <div className="activity-content">
          <p className="activity-text">
            Kamu vote cuaca <strong className={activity.vote_type === 'upvote' ? 'text-success' : 'text-error'}>
              {activity.vote_type === 'upvote' ? '✅ Akurat' : '❌ Meleset'}
            </strong>
            {activity.location_label && <span> untuk {activity.location_label}</span>}
          </p>
          <Link to="/dashboard/cuaca" className="activity-link">
            Lihat Cuaca →
          </Link>
        </div>
      );
    default:
      return <p className="activity-text">Aktivitas tidak dikenali</p>;
  }
}

function groupByDate(activities) {
  const groups = {};
  activities.forEach(activity => {
    const date = new Date(activity.created_at);
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateLabel = format(date, 'EEEE, d MMMM yyyy', { locale: id });
    if (!groups[dateKey]) {
      groups[dateKey] = { label: dateLabel, items: [] };
    }
    groups[dateKey].items.push(activity);
  });
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function RiwayatPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchActivity() {
      try {
        setLoading(true);
        const res = await api.get('/activity/my');
        setActivities(res.data.data || []);
      } catch (err) {
        setError(err.message || 'Gagal memuat riwayat');
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter);

  const grouped = groupByDate(filteredActivities);

  const filterOptions = [
    { value: 'all', label: 'Semua', icon: '📋' },
    { value: 'report', label: 'Laporan', icon: '📝' },
    { value: 'report_vote', label: 'Vote Laporan', icon: '👍' },
    { value: 'thread', label: 'Thread', icon: '💬' },
    { value: 'weather_vote', label: 'Vote Cuaca', icon: '🗳️' },
  ];

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
        <h1 className="page-title">📜 Riwayat Aktivitas</h1>
        <p className="page-subtitle">Lacak semua aktivitasmu di PawangCuaca</p>
      </div>

      <div className="activity-filters">
        {filterOptions.map(opt => (
          <button
            key={opt.value}
            className={`activity-filter-btn ${filter === opt.value ? 'active' : ''}`}
            onClick={() => setFilter(opt.value)}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="activity-timeline">
        {grouped.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada aktivitas untuk ditampilkan.</p>
            <p className="empty-hint">Mulai dengan memberikan vote cuaca atau membuat laporan!</p>
          </div>
        ) : (
          grouped.map(([dateKey, group]) => (
            <div key={dateKey} className="activity-day">
              <h3 className="activity-day-label">{group.label}</h3>
              <div className="activity-items">
                {group.items.map((activity, index) => (
                  <motion.div
                    key={`${activity.type}-${activity.id}-${index}`}
                    className="activity-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="activity-timeline-line">
                      <ActivityIcon type={activity.type} />
                      <div className="activity-timeline-connector" />
                    </div>
                    <div className="activity-card">
                      <div className="activity-meta">
                        <span className="activity-time">
                          {format(new Date(activity.created_at), 'HH:mm')}
                        </span>
                        <span className="activity-time-relative">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: id })}
                        </span>
                      </div>
                      <ActivityContent activity={activity} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
