function AboutPage() {
  return (
    <div className="about-page">
      <h2>Tentang PawangCuaca</h2>

      <div className="about-section">
        <h3>Tagline</h3>
        <p className="tagline">"Cuaca dari warga, untuk warga."</p>
      </div>

      <div className="about-section">
        <h3>Apa itu PawangCuaca?</h3>
        <p>
          PawangCuaca adalah platform citizen science berbasis web yang memungkinkan
          masyarakat untuk memvalidasi akurasi prediksi cuaca makro (berbasis satelit/API publik)
          dengan laporan ground-truth dari lapangan.
        </p>
      </div>

      <div className="about-section">
        <h3>Masalah yang Diselesaikan</h3>
        <p>
          Prediksi cuaca dari provider besar seperti Open-Meteo sering meleset di tingkat
          kecamatan/mikro, menyebabkan inefisiensi mobilitas warga kota. PawangCuaca hadir
          untuk menjembatani gap ini dengan data crowdsourced dari pengguna di lapangan.
        </p>
      </div>

      <div className="about-section">
        <h3>Cara Kerja</h3>
        <ol>
          <li>Buka aplikasi dan izinkan akses lokasi</li>
          <li>Lihat cuaca real-time di lokasimu</li>
          <li>Berikan vote: apakah prakiraan akurat atau meleset?</li>
          <li>Data agregat vote bisa dilihat oleh komunitas</li>
        </ol>
      </div>

      <div className="about-section">
        <h3>Privasi</h3>
        <p>
          Kami tidak menyimpan data pribadi. Identitas voter di-hash dari kombinasi
          IP address, fingerprint browser, dan tanggal. Hash dirotasi setiap hari
          untuk menjaga privasi pengguna.
        </p>
      </div>

      <div className="about-section">
        <h3>Teknologi</h3>
        <ul>
          <li>Frontend: React + Vite + Framer Motion + Leaflet</li>
          <li>Backend: Node.js + Express + PostgreSQL</li>
          <li>Weather Data: Open-Meteo Weather Forecast API</li>
        </ul>
      </div>

      <div className="about-section">
        <h3>Versi</h3>
        <p className="version-mono">{import.meta.env.VITE_APP_VERSION || '1.0.0'}</p>
      </div>
    </div>
  );
}

export default AboutPage;
