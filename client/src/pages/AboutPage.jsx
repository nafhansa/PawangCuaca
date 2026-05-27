import { motion, useReducedMotion } from 'framer-motion';

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const CloudIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);

const ThumbsUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const LightbulbIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="9" y1="18" x2="15" y2="18"/>
    <line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
);

const STEPS = [
  { number: '01', icon: <MapPinIcon />, title: 'Izinkan Lokasi', desc: 'Buka aplikasi dan izinkan akses lokasi untuk melihat data cuaca di sekitarmu.' },
  { number: '02', icon: <CloudIcon />, title: 'Lihat Cuaca', desc: 'Lihat prakiraan cuaca real-time di lokasimu dari Open-Meteo.' },
  { number: '03', icon: <ThumbsUpIcon />, title: 'Berikan Vote', desc: 'Apakah prakiraan akurat atau meleset? Satu tap sudah cukup.' },
  { number: '04', icon: <UsersIcon />, title: 'Data Komunitas', desc: 'Data agregat vote bisa dilihat oleh semua pengguna di komunitasmu.' },
];

const TECH_STACK = [
  { layer: 'Frontend', items: ['React', 'Vite', 'Framer Motion', 'Leaflet'] },
  { layer: 'Backend', items: ['Node.js', 'Express', 'PostgreSQL'] },
  { layer: 'Data', items: ['Open-Meteo API'] },
];

function AboutPage() {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  return (
    <div className="about-page-v2">
      {/* Hero */}
      <motion.section
        className="about-hero"
        initial="hidden"
        animate="visible"
        variants={stagger}
        aria-labelledby="about-title"
      >
        <div className="about-hero-glow" aria-hidden="true" />
        <motion.span className="about-hero-eyebrow" variants={fadeUp}>
          Platform Citizen Science
        </motion.span>
        <motion.h1 className="about-hero-title" id="about-title" variants={fadeUp}>
          PawangCuaca
        </motion.h1>
        <motion.p className="about-hero-tagline" variants={fadeUp}>
          "Cuaca dari warga, untuk warga."
        </motion.p>
        <motion.p className="about-hero-desc" variants={fadeUp}>
          Platform berbasis web yang memungkinkan masyarakat memvalidasi akurasi prediksi cuaca
          makro dengan laporan ground-truth langsung dari lapangan.
        </motion.p>
      </motion.section>

      {/* Problem + Solution */}
      <motion.div
        className="about-problem-grid"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={stagger}
      >
        <motion.div className="about-problem-card" variants={fadeUp}>
          <div className="about-card-icon about-card-icon--warning" aria-hidden="true">
            <AlertIcon />
          </div>
          <h2 className="about-card-heading">Masalah</h2>
          <p className="about-card-body">
            Prediksi cuaca dari provider besar sering meleset di tingkat kecamatan, menyebabkan
            inefisiensi mobilitas warga kota sehari-hari.
          </p>
        </motion.div>
        <motion.div className="about-solution-card" variants={fadeUp}>
          <div className="about-card-icon about-card-icon--sky" aria-hidden="true">
            <LightbulbIcon />
          </div>
          <h2 className="about-card-heading">Solusi</h2>
          <p className="about-card-body">
            Data crowdsourced dari pengguna di lapangan menjembatani gap antara prediksi makro
            dan kondisi cuaca mikro yang nyata.
          </p>
        </motion.div>
      </motion.div>

      {/* How it Works */}
      <motion.section
        className="about-steps-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={stagger}
        aria-labelledby="steps-heading"
      >
        <motion.h2 className="about-section-heading" id="steps-heading" variants={fadeUp}>
          Cara Kerja
        </motion.h2>
        <div className="about-steps-grid">
          {STEPS.map((step) => (
            <motion.div key={step.number} className="about-step-card" variants={fadeUp}>
              <div className="about-step-number" aria-hidden="true">{step.number}</div>
              <div className="about-step-icon" aria-hidden="true">{step.icon}</div>
              <h3 className="about-step-title">{step.title}</h3>
              <p className="about-step-desc">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Privacy */}
      <motion.div
        className="about-privacy-card"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={fadeUp}
      >
        <div className="about-privacy-icon" aria-hidden="true">
          <LockIcon />
        </div>
        <div className="about-privacy-content">
          <h2 className="about-privacy-heading">Privasi Terjaga</h2>
          <p className="about-privacy-body">
            Kami tidak menyimpan data pribadi. Identitas voter di-hash dari kombinasi IP address,
            fingerprint browser, dan tanggal — dirotasi setiap hari untuk menjaga privasi pengguna.
          </p>
        </div>
      </motion.div>

      {/* Tech Stack */}
      <motion.section
        className="about-tech-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={stagger}
        aria-labelledby="tech-heading"
      >
        <motion.h2 className="about-section-heading" id="tech-heading" variants={fadeUp}>
          Teknologi
        </motion.h2>
        <div className="about-tech-layers">
          {TECH_STACK.map((layer) => (
            <motion.div key={layer.layer} className="about-tech-row" variants={fadeUp}>
              <span className="about-tech-layer-label">{layer.layer}</span>
              <div className="about-tech-badges">
                {layer.items.map((item) => (
                  <span key={item} className="about-tech-badge">{item}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Version */}
      <motion.footer
        className="about-version-footer"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <span className="about-version-label">Versi</span>
        <span className="about-version-value">
          {import.meta.env.VITE_APP_VERSION || '1.0.0'}
        </span>
      </motion.footer>
    </div>
  );
}

export default AboutPage;
