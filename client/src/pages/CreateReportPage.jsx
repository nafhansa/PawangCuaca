import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../services/api';
import { motion } from 'framer-motion';

export default function CreateReportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', weather_condition: '', temperature: '', lat: '', lon: '' });
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMedia(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setMediaPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      if (form.description) formData.append('description', form.description);
      if (form.weather_condition) formData.append('weather_condition', form.weather_condition);
      if (form.temperature) formData.append('temperature', form.temperature);
      if (form.lat) formData.append('lat', form.lat);
      if (form.lon) formData.append('lon', form.lon);
      if (media) formData.append('media', media);
      await reportsApi.create(formData);
      navigate('/reports');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const weatherOptions = ['Cerah', 'Berawan', 'Hujan Ringan', 'Hujan Lebat', 'Badai Petir', 'Berkabut', 'Angin Kencang', 'Salju'];

  return (
    <motion.div className="form-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="page-title">Buat Laporan Cuaca</h2>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="content-form">
        <div className="form-group">
          <label className="form-label">Judul Laporan *</label>
          <input name="title" value={form.title} onChange={handleChange} className="form-input" placeholder="Contoh: Hujan Lebat di Bandung" required />
        </div>
        <div className="form-group">
          <label className="form-label">Kondisi Cuaca</label>
          <select name="weather_condition" value={form.weather_condition} onChange={handleChange} className="form-input">
            <option value="">Pilih kondisi cuaca</option>
            {weatherOptions.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group flex-1">
            <label className="form-label">Suhu (°C)</label>
            <input name="temperature" type="number" value={form.temperature} onChange={handleChange} className="form-input" placeholder="25" step="0.1" />
          </div>
          <div className="form-group flex-1">
            <label className="form-label">Latitude</label>
            <input name="lat" type="number" value={form.lat} onChange={handleChange} className="form-input" placeholder="-6.9175" step="any" />
          </div>
          <div className="form-group flex-1">
            <label className="form-label">Longitude</label>
            <input name="lon" type="number" value={form.lon} onChange={handleChange} className="form-input" placeholder="107.6191" step="any" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Deskripsi</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="form-textarea" placeholder="Jelaskan kondisi cuaca yang kamu alami..." rows={4} />
        </div>
        <div className="form-group">
          <label className="form-label">Media (Foto/Video/GIF)</label>
          <input type="file" accept="image/jpeg,image/png,image/gif,video/mp4,video/webm" onChange={handleMediaChange} className="form-file-input" />
          {mediaPreview && <img src={mediaPreview} alt="Preview" className="media-preview" />}
          {media && !mediaPreview && <div className="media-preview-placeholder">Video: {media.name}</div>}
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Batal</button>
          <button type="submit" className="auth-button" disabled={loading}>{loading ? 'Mengunggah...' : 'Publikasikan Laporan'}</button>
        </div>
      </form>
    </motion.div>
  );
}