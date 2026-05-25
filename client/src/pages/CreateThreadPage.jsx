import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { threadsApi } from '../services/api';
import { motion } from 'framer-motion';

export default function CreateThreadPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await threadsApi.create({
        title,
        lat: lat ? parseFloat(lat) : undefined,
        lon: lon ? parseFloat(lon) : undefined,
      });
      navigate(`/threads/${res.data.data.thread.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="form-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="page-title">Buat Cuaca Thread</h2>
      <p className="page-subtitle">Mulai thread baru untuk berbagi cerita cuaca berkelanjutan.</p>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="content-form">
        <div className="form-group">
          <label className="form-label">Judul Thread *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" placeholder="Contoh: Perjalanan Hujan Hari Ini" required />
        </div>
        <div className="form-row">
          <div className="form-group flex-1">
            <label className="form-label">Latitude</label>
            <input type="number" value={lat} onChange={(e) => setLat(e.target.value)} className="form-input" placeholder="-6.9175" step="any" />
          </div>
          <div className="form-group flex-1">
            <label className="form-label">Longitude</label>
            <input type="number" value={lon} onChange={(e) => setLon(e.target.value)} className="form-input" placeholder="107.6191" step="any" />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Batal</button>
          <button type="submit" className="auth-button" disabled={loading}>{loading ? 'Membuat...' : 'Buat Thread'}</button>
        </div>
      </form>
    </motion.div>
  );
}