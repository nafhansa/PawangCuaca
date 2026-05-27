import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../services/api';
import { motion } from 'framer-motion';

const WEATHER_OPTIONS = [
  'Cerah', 'Cerah Berawan', 'Berawan', 'Mendung',
  'Gerimis', 'Hujan Ringan', 'Hujan Lebat', 'Badai Petir',
  'Berkabut', 'Angin Kencang', 'Salju',
];

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const LocationIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

export default function CreateReportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', weather_condition: '', temperature: '', lat: '', lon: '',
  });
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locDetected, setLocDetected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const detectLocation = () => {
    if (!navigator.geolocation) { setError('Browser tidak mendukung geolokasi.'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lon: pos.coords.longitude.toFixed(6),
        }));
        setLocDetected(true);
        setLocLoading(false);
      },
      () => {
        setError('Gagal mendeteksi lokasi. Isi koordinat secara manual.');
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const processFile = useCallback((file) => {
    if (!file) return;
    setFileError('');
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Format tidak didukung. Gunakan JPG, PNG, GIF, MP4, atau WebM.');
      return;
    }
    const isVideo = file.type.startsWith('video/');
    if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
      setFileError(`Ukuran terlalu besar. Maksimal ${isVideo ? '50MB' : '10MB'}.`);
      return;
    }
    setMedia(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setMediaPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(null);
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Judul laporan wajib diisi.'); return; }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      if (form.description) fd.append('description', form.description);
      if (form.weather_condition) fd.append('weather_condition', form.weather_condition);
      if (form.temperature) fd.append('temperature', form.temperature);
      if (form.lat) fd.append('lat', form.lat);
      if (form.lon) fd.append('lon', form.lon);
      if (media) fd.append('media', media);
      await reportsApi.create(fd);
      navigate('/dashboard/laporan');
    } catch (err) {
      setError(err.message || 'Gagal membuat laporan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="create-report-page" initial="hidden" animate="visible" variants={stagger}>
      {/* Header */}
      <motion.div className="page-header" variants={fadeUp}>
        <h1 className="page-title">Buat Laporan Cuaca</h1>
        <p className="page-subtitle">Bagikan kondisi cuaca yang kamu alami langsung dari lapangan</p>
      </motion.div>

      {error && (
        <motion.div className="cr-error-banner" role="alert" variants={fadeUp}>{error}</motion.div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Informasi Cuaca */}
        <motion.div className="cr-section" variants={fadeUp}>
          <h2 className="cr-section-title">Informasi Cuaca</h2>

          <div className="form-group">
            <div className="cr-label-row">
              <label htmlFor="cr-title" className="form-label">
                Judul Laporan <span className="cr-required">*</span>
              </label>
              <span className={`cr-char-count ${form.title.length > 220 ? 'cr-char-count--warn' : ''}`}>
                {form.title.length}/255
              </span>
            </div>
            <input
              id="cr-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="form-input"
              placeholder="Contoh: Hujan Lebat Disertai Petir di Sekitar Alun-Alun"
              maxLength={255}
              required
            />
          </div>

          <div className="cr-row-2">
            <div className="form-group">
              <label htmlFor="cr-weather" className="form-label">Kondisi Cuaca</label>
              <select id="cr-weather" name="weather_condition" value={form.weather_condition} onChange={handleChange} className="form-input">
                <option value="">Pilih kondisi</option>
                {WEATHER_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cr-temp" className="form-label">Suhu (°C)</label>
              <input
                id="cr-temp"
                name="temperature"
                type="number"
                value={form.temperature}
                onChange={handleChange}
                className="form-input"
                placeholder="Contoh: 26"
                step="0.1"
                min="-20"
                max="60"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="cr-label-row">
              <label htmlFor="cr-desc" className="form-label">Deskripsi</label>
              <span className={`cr-char-count ${form.description.length > 1800 ? 'cr-char-count--warn' : ''}`}>
                {form.description.length}/2000
              </span>
            </div>
            <textarea
              id="cr-desc"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Jelaskan kondisi cuaca yang kamu alami secara detail…"
              rows={4}
              maxLength={2000}
            />
          </div>
        </motion.div>

        {/* Lokasi */}
        <motion.div className="cr-section" variants={fadeUp}>
          <h2 className="cr-section-title">Lokasi <span className="cr-optional">(opsional)</span></h2>

          <div className="cr-location-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="cr-lat" className="form-label">Latitude</label>
              <input
                id="cr-lat"
                name="lat"
                type="number"
                value={form.lat}
                onChange={(e) => { handleChange(e); setLocDetected(false); }}
                className="form-input"
                placeholder="-6.9175"
                step="any"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="cr-lon" className="form-label">Longitude</label>
              <input
                id="cr-lon"
                name="lon"
                type="number"
                value={form.lon}
                onChange={(e) => { handleChange(e); setLocDetected(false); }}
                className="form-input"
                placeholder="107.6191"
                step="any"
              />
            </div>
            <div className="form-group cr-detect-wrap">
              <span className="form-label" aria-hidden="true">&nbsp;</span>
              <button
                type="button"
                className={`cr-detect-btn${locDetected ? ' cr-detect-btn--done' : ''}`}
                onClick={detectLocation}
                disabled={locLoading}
              >
                <LocationIcon />
                {locLoading ? 'Mendeteksi…' : locDetected ? 'Terdeteksi ✓' : 'Lokasimu'}
              </button>
            </div>
          </div>

          {locDetected && form.lat && form.lon && (
            <motion.div
              className="cr-loc-pill"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LocationIcon />
              {parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lon).toFixed(4)}
            </motion.div>
          )}
        </motion.div>

        {/* Media */}
        <motion.div className="cr-section" variants={fadeUp}>
          <h2 className="cr-section-title">Media <span className="cr-optional">(opsional)</span></h2>

          {!media ? (
            <div
              className={`cr-dropzone${isDragOver ? ' cr-dropzone--active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label="Upload foto atau video"
            >
              <div className="cr-dropzone-icon"><UploadIcon /></div>
              <p className="cr-dropzone-label">Drag & drop foto atau video ke sini</p>
              <p className="cr-dropzone-sub">atau klik untuk pilih dari perangkat</p>
              <p className="cr-dropzone-formats">JPG · PNG · GIF (maks 10MB) &nbsp;|&nbsp; MP4 · WebM (maks 50MB)</p>
            </div>
          ) : (
            <div className="cr-media-wrap">
              {mediaPreview
                ? <img src={mediaPreview} alt="Preview unggahan" className="cr-media-img" />
                : (
                  <div className="cr-media-video">
                    <span className="cr-media-play">▶</span>
                    <div className="cr-media-info">
                      <span className="cr-media-name">{media.name}</span>
                      <span className="cr-media-size">{(media.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  </div>
                )
              }
              <button type="button" className="cr-media-remove" onClick={removeMedia} aria-label="Hapus media">
                <XIcon />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,video/mp4,video/webm"
            onChange={(e) => processFile(e.target.files[0])}
            style={{ display: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
          />
          {fileError && <p className="cr-file-error" role="alert">{fileError}</p>}
        </motion.div>

        {/* Actions */}
        <motion.div className="cr-actions" variants={fadeUp}>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
            Batal
          </button>
          <button type="submit" className="cr-submit-btn" disabled={loading || !form.title.trim()}>
            {loading
              ? <><span className="cr-spinner" aria-hidden="true" /> Mengunggah…</>
              : 'Publikasikan Laporan'
            }
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}
