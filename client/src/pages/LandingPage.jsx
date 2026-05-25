import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { locationsApi, reportsApi, votesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function StatCard({ value, label, icon }) {
  return (
    <motion.div 
      className="landing-stat-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <span className="landing-stat-icon">{icon}</span>
      <span className="landing-stat-value">{value}</span>
      <span className="landing-stat-label">{label}</span>
    </motion.div>
  );
}

function FeatureCard({ icon, title, description, delay }) {
  return (
    <motion.div 
      className="landing-feature-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="landing-feature-icon">{icon}</div>
      <h3 className="landing-feature-title">{title}</h3>
      <p className="landing-feature-desc">{description}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ locations: 0, reports: 0, votes: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [locationsRes, reportsRes, votesRes] = await Promise.all([
          locationsApi.getLeaderboard(1),
          reportsApi.getAll({ limit: 1 }),
          votesApi.getRecentVotes(1),
        ]);
        setStats({
          locations: locationsRes.data.data?.length || 0,
          reports: reportsRes.data.data?.total || 0,
          votes: '1000+',
        });
      } catch {
        setStats({ locations: '50+', reports: '200+', votes: '1000+' });
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="landing-page">
      {/* HERO SECTION */}
      <section className="landing-hero">
        <div className="landing-hero-bg" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=1920&q=80)' }}>
          <div className="landing-hero-gradient" />
          <div className="landing-hero-pattern" />
        </div>
        <div className="landing-hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="landing-hero-badge">
              Cuaca dari Warga, untuk Warga
            </div>
            <h1 className="landing-hero-title">
              Pantau Cuaca<br />
              <span className="landing-hero-highlight">Bersama Komunitas</span>
            </h1>
            <p className="landing-hero-subtitle">
              Platform citizen science pertama di Indonesia yang menggabungkan data prakiraan 
              cuaca dengan laporan langsung dari warga. Bantu validasi akurasi cuaca demi 
              keamanan bersama.
            </p>
            <div className="landing-hero-cta">
              {user ? (
                <Link to="/dashboard/cuaca" className="landing-btn-primary">
                  Buka Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="landing-btn-primary">
                    Mulai Sekarang
                  </Link>
                  <Link to="/tentang" className="landing-btn-secondary">
                    Pelajari Lebih Lanjut
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            className="landing-hero-visual"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="landing-hero-card">
              <div className="landing-hero-card-header">
                <span className="landing-hero-card-dot red" />
                <span className="landing-hero-card-dot yellow" />
                <span className="landing-hero-card-dot green" />
              </div>
              <div className="landing-hero-card-body">
                <div className="landing-hero-weather">
                  <span className="landing-hero-weather-icon">⛅</span>
                  <div>
                    <div className="landing-hero-weather-temp">31°C</div>
                    <div className="landing-hero-weather-loc">Jakarta, Indonesia</div>
                  </div>
                </div>
                <div className="landing-hero-vote">
                  <div className="landing-hero-vote-bar">
                    <div className="landing-hero-vote-fill" style={{ width: '78%' }} />
                  </div>
                  <div className="landing-hero-vote-text">78% warga setuju akurat</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="landing-section landing-stats">
        <div className="landing-container">
          <div className="landing-stats-grid">
            <StatCard value={stats.locations} label="Lokasi Terpantau" icon="📍" />
            <StatCard value={stats.reports} label="Laporan Cuaca" icon="📝" />
            <StatCard value={stats.votes} label="Vote Validasi" icon="✅" />
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="landing-section landing-features">
        <div className="landing-container">
          <motion.div
            className="landing-section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="landing-section-title">
              Fitur <span className="landing-section-highlight">PawangCuaca</span>
            </h2>
            <p className="landing-section-subtitle">
              Semua yang kamu butuhkan untuk pantau dan lapor cuaca, dalam satu platform.
            </p>
          </motion.div>
          <div className="landing-features-grid">
            <FeatureCard
              icon="📡"
              title="Prakiraan Real-Time"
              description="Data cuaca terkini dari Open-Meteo dengan pembaruan berkala untuk lokasimu."
              delay={0}
            />
            <FeatureCard
              icon="👍"
              title="Vote Akurasi"
              description="Bantu validasi apakah prakiraan cuaca akurat atau meleset dengan satu klik."
              delay={0.1}
            />
            <FeatureCard
              icon="🗺️"
              title="Peta Interaktif"
              description="Lihat kondisi cuaca di berbagai lokasi melalui peta interaktif yang mudah digunakan."
              delay={0.2}
            />
            <FeatureCard
              icon="🏘️"
              title="Komunitas Aktif"
              description="Diskusi dan berbagi informasi cuaca dengan warga lain di seluruh Indonesia."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="landing-section landing-how">
        <div className="landing-container">
          <motion.div
            className="landing-section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="landing-section-title">
              Cara <span className="landing-section-highlight">Kerja</span>
            </h2>
          </motion.div>
          <div className="landing-how-grid">
            {[
              { step: '01', title: 'Pantau Cuaca', desc: 'Lihat prakiraan cuaca real-time untuk lokasimu saat ini.' },
              { step: '02', title: 'Beri Vote', desc: 'Tap 👍 jika akurat atau 👎 jika meleset. Bantu validasi data!' },
              { step: '03', title: 'Laporkan', desc: 'Produsen cuaca bisa membuat laporan detail dengan foto/video.' },
              { step: '04', title: 'Diskusi', desc: 'Bergabung di threads komunitas untuk diskusi cuaca daerahmu.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="landing-how-card"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="landing-how-step">{item.step}</span>
                <h3 className="landing-how-title">{item.title}</h3>
                <p className="landing-how-desc">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="landing-section landing-cta">
        <div className="landing-container">
          <motion.div
            className="landing-cta-box"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="landing-cta-title">Siap Jadi Pawang Cuaca?</h2>
            <p className="landing-cta-desc">
              Bergabunglah dengan ribuan warga Indonesia yang sudah memantau dan melaporkan 
              kondisi cuaca demi keselamatan bersama.
            </p>
            <div className="landing-cta-buttons">
              {user ? (
                <Link to="/dashboard/cuaca" className="landing-btn-primary large">
                  Buka Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="landing-btn-primary large">
                    Daftar Gratis
                  </Link>
                  <Link to="/tentang" className="landing-btn-outline large">
                    Pelajari Lebih Lanjut
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <span className="landing-footer-brand-icon">🌦️</span>
              <span className="landing-footer-brand-text">PawangCuaca</span>
              <p className="landing-footer-tagline">Cuaca dari Warga, untuk Warga.</p>
            </div>
            <div className="landing-footer-links">
              <h4>Platform</h4>
              <Link to="/tentang">Tentang Kami</Link>
              <Link to="/login">Masuk</Link>
              <Link to="/register">Daftar</Link>
            </div>
            <div className="landing-footer-links">
              <h4>Fitur</h4>
              <span>Prakiraan Cuaca</span>
              <span>Vote Akurasi</span>
              <span>Komunitas</span>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <p>🇮🇩 PawangCuaca &copy; 2026 — Dibuat dengan bangga di Indonesia.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
