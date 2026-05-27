import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { threadsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function ThreadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [postWeather, setPostWeather] = useState('');
  const [postTemp, setPostTemp] = useState('');
  const [postMedia, setPostMedia] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadThread(); }, [id]);

  const loadThread = async () => {
    setLoading(true);
    try {
      const res = await threadsApi.getById(id);
      setThread(res.data.data.thread);
    } catch { navigate('/dashboard/threads'); } finally { setLoading(false); }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', postContent);
      if (postWeather) formData.append('weather_condition', postWeather);
      if (postTemp) formData.append('temperature', postTemp);
      if (postMedia) formData.append('media', postMedia);
      await threadsApi.addPost(id, formData);
      setPostContent('');
      setPostWeather('');
      setPostTemp('');
      setPostMedia(null);
      loadThread();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Yakin ingin menghapus thread ini?')) return;
    try {
      await threadsApi.delete(id);
      navigate('/dashboard/threads');
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="loading-container"><div className="loading-spinner" /></div>;
  if (!thread) return null;

  const isOwner = user?.id === thread.user_id;
  const weatherOptions = ['Cerah', 'Berawan', 'Hujan Ringan', 'Hujan Lebat', 'Badai Petir', 'Berkabut', 'Angin Kencang', 'Salju'];

  return (
    <motion.div className="detail-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <button className="btn-back" onClick={() => navigate('/dashboard/threads')}>← Kembali</button>

      <div className="detail-card">
        <div className="detail-header">
          <h2 className="detail-title">{thread.title}</h2>
          <div className="detail-meta">
            <span className="report-author">@{thread.username}</span>
            {thread.pawang_level && <span className="pawang-badge-mini">{thread.pawang_level}</span>}
            {thread.location_label && <span>📍 {thread.location_label}</span>}
            <span>{thread.posts?.length || 0} posts</span>
          </div>
        </div>

        {(isOwner || user?.role === 'superadmin') && (
          <div className="detail-actions">
            <button className="btn-danger" onClick={handleDelete}>Hapus Thread</button>
          </div>
        )}
      </div>

      <div className="thread-posts">
        {thread.posts?.length === 0 && (
          <div className="empty-state">
            <p>Belum ada post di thread ini.</p>
            {user?.role === 'produsen' && <p className="empty-hint">Jadilah yang pertama berbagi update cuaca!</p>}
          </div>
        )}
        {thread.posts?.map((post, idx) => (
          <motion.div key={post.id} className="thread-post-card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
            <div className="post-header">
              <span className="post-position">#{post.position + 1}</span>
              <span className="post-author">@{post.username}</span>
              {post.pawang_level && <span className="pawang-badge-mini">{post.pawang_level}</span>}
              <span className="post-time">{new Date(post.created_at).toLocaleString('id-ID')}</span>
            </div>
            {post.media_url && (
              <div className="post-media">
                {post.media_type === 'video' ? (
                  <video src={post.media_url} controls className="detail-video" />
                ) : (
                  <img src={post.media_url} alt="" className="detail-image" />
                )}
              </div>
            )}
            <p className="post-content">{post.content}</p>
            <div className="post-weather-info">
              {post.weather_condition && <span>🌤️ {post.weather_condition}</span>}
              {post.temperature != null && <span>🌡️ {post.temperature}°C</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {user?.role === 'produsen' && (
        <div className="thread-reply-card">
          <h3>Tambah Post</h3>
          <form onSubmit={handleSubmitPost} className="content-form">
            <div className="form-group">
              <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} className="form-textarea" placeholder="Bagikan update cuaca terbaru..." rows={3} required />
            </div>
            <div className="form-row">
              <div className="form-group flex-1">
                <select value={postWeather} onChange={(e) => setPostWeather(e.target.value)} className="form-input">
                  <option value="">Kondisi cuaca</option>
                  {weatherOptions.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="form-group flex-1">
                <input type="number" value={postTemp} onChange={(e) => setPostTemp(e.target.value)} className="form-input" placeholder="Suhu °C" step="0.1" />
              </div>
            </div>
            <div className="form-group">
              <input type="file" accept="image/jpeg,image/png,image/gif,video/mp4,video/webm" onChange={(e) => setPostMedia(e.target.files[0])} className="form-file-input" />
            </div>
            <button type="submit" className="auth-button" disabled={submitting}>{submitting ? 'Mengirim...' : 'Kirim Post'}</button>
          </form>
        </div>
      )}
    </motion.div>
  );
}