import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CommunityPage from './pages/CommunityPage';
import AboutPage from './pages/AboutPage';
import './App.css';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        PawangCuaca
      </Link>
      <div className="navbar-links">
        <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
          Cuaca
        </Link>
        <Link to="/komunitas" className={`navbar-link ${location.pathname === '/komunitas' ? 'active' : ''}`}>
          Komunitas
        </Link>
        <Link to="/tentang" className={`navbar-link ${location.pathname === '/tentang' ? 'active' : ''}`}>
          Tentang
        </Link>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p className="footer-text">
        PawangCuaca &copy; 2026 — Cuaca dari warga, untuk warga.
      </p>
    </footer>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/komunitas" element={<CommunityPage />} />
            <Route path="/tentang" element={<AboutPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
