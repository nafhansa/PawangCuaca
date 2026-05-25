import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi, reportsApi } from '../services/api';
import { motion } from 'framer-motion';

const PAWANG_LABELS = { pemula: 'Pemula', andal: 'Andal', elite: 'Elite', legenda: 'Legenda' };
const PAWANG_COLORS = { pemula: '#6B7280', andal: '#22C55E', elite: '#38BDF8', legenda: '#F59E0B' };

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [myReports, setMyReports] = useState([]);

  useEffect(() => {
    if (user?.role === 'produsen') loadMyReports();
  }, [user]);

  const loadMyReports = async () => {
    try {
      const res = await reportsApi.getAll({ userId: user.id, limit: 5 });
      setMyReports(res.data.data.reports);
    } catch {}
  };

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      const res = await authApi.updateProfile({ bio });
      updateUser(res.data.data.user);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div className="profile-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="profile-card">
        <div className="profile-avatar">
          {user.avatar_url ? <img src={user.avatar_url} alt="" /> : <div className="avatar-placeholder">{user.username[0].toUpperCase()}</div>}
        </div>
        <div className="profile-info">
          <h2 className="profile-name">@{user.username}</h2>
          <p className="profile-email">{user.email}</p>
          <span className={`user-role-badge role-${user.role}`}>{user.role}</span>
          {user.role === 'produsen' && (
            <span className="pawang-badge" style={{ background: PAWANG_COLORS[user.pawang_level] || '#6B7280' }}>
              🌩️ Pawang {PAWANG_LABELS[user.pawang_level] || 'Pemula'}
            </span>
          )}
        </div>
      </div>

      {user.role === 'produsen' && (
        <div className="profile-stats">
          <div className="stat-card"><div className="stat-value">{user.report_count || 0}</div><div className="stat-label">Laporan</div></div>
          <div className="stat-card"><div className="stat-value">{user.accuracy_score || 0}%</div><div className="stat-label">Akurasi</div></div>
        </div>
      )}

      <div className="profile-bio-section">
        <h3>Tentang Saya</h3>
        {editing ? (
          <div className="bio-edit">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="form-textarea" rows={3} placeholder="Ceritakan tentang dirimu..." />
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => { setEditing(false); setBio(user?.bio || ''); }}>Batal</button>
              <button className="auth-button" onClick={handleSaveBio} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        ) : (
          <div className="bio-display">
            <p>{user.bio || 'Belum ada bio.'}</p>
            <button className="btn-secondary" onClick={() => setEditing(true)}>Edit Bio</button>
          </div>
        )}
      </div>

      {user.role === 'produsen' && myReports.length > 0 && (
        <div className="profile-reports">
          <h3>Laporan Terbaru</h3>
          {myReports.map(r => (
            <div key={r.id} className="profile-report-item">
              <span>{r.title}</span>
              <span>👍 {r.upvotes} 👎 {r.downvotes}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}