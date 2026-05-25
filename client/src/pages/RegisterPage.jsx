import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('konsumen');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await register(username, email, password, role);
      setSuccess('Registrasi berhasil! Silakan tunggu persetujuan admin, lalu login.');
    } catch (err) {
      setError(err.message || 'Registrasi gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="auth-card">
        <h2 className="auth-title">Daftar PawangCuaca</h2>
        <p className="auth-subtitle">Bergabung sebagai kontributor cuaca komunitas.</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="username_kamu"
              required
              minLength={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="nama@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Daftar sebagai</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-option ${role === 'produsen' ? 'active' : ''}`}
                onClick={() => setRole('produsen')}
              >
                <span className="role-icon">🌤️</span>
                <span className="role-name">Produsen</span>
                <span className="role-desc">Kontributor laporan cuaca</span>
              </button>
              <button
                type="button"
                className={`role-option ${role === 'konsumen' ? 'active' : ''}`}
                onClick={() => setRole('konsumen')}
              >
                <span className="role-icon">👀</span>
                <span className="role-name">Konsumen</span>
                <span className="role-desc">Penikmat & validator laporan</span>
              </button>
            </div>
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="auth-footer-text">
          Sudah punya akun? <Link to="/login" className="auth-link">Masuk</Link>
        </p>
      </div>
    </motion.div>
  );
}
