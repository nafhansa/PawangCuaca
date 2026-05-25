import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import CommunityPage from './pages/CommunityPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CreateReportPage from './pages/CreateReportPage';
import ReportsFeedPage from './pages/ReportsFeedPage';
import ReportDetailPage from './pages/ReportDetailPage';
import CreateThreadPage from './pages/CreateThreadPage';
import ThreadDetailPage from './pages/ThreadDetailPage';
import ThreadsListPage from './pages/ThreadsListPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        PawangCuaca
      </Link>
      <div className="navbar-links">
        <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
          Cuaca
        </Link>
        {user && (
          <>
            <Link to="/reports" className={`navbar-link ${location.pathname.startsWith('/reports') ? 'active' : ''}`}>
              Laporan
            </Link>
            <Link to="/threads" className={`navbar-link ${location.pathname.startsWith('/threads') ? 'active' : ''}`}>
              Threads
            </Link>
          </>
        )}
        <Link to="/komunitas" className={`navbar-link ${location.pathname === '/komunitas' ? 'active' : ''}`}>
          Komunitas
        </Link>
        <Link to="/tentang" className={`navbar-link ${location.pathname === '/tentang' ? 'active' : ''}`}>
          Tentang
        </Link>
      </div>
      <div className="navbar-auth">
        {user ? (
          <div className="navbar-user">
            {user.role === 'superadmin' && (
              <Link to="/admin" className="navbar-link">Admin</Link>
            )}
            <Link to="/profile" className="navbar-link navbar-username">
              @{user.username}
            </Link>
            <button onClick={handleLogout} className="btn-logout">Keluar</button>
          </div>
        ) : (
          <div className="navbar-auth-buttons">
            <Link to="/login" className="navbar-link">Masuk</Link>
            <Link to="/register" className="btn-register">Daftar</Link>
          </div>
        )}
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/komunitas" element={<CommunityPage />} />
      <Route path="/tentang" element={<AboutPage />} />
      <Route path="/admin" element={<ProtectedRoute roles={['superadmin']}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsFeedPage /></ProtectedRoute>} />
      <Route path="/reports/new" element={<ProtectedRoute roles={['produsen']}><CreateReportPage /></ProtectedRoute>} />
      <Route path="/reports/:id" element={<ProtectedRoute><ReportDetailPage /></ProtectedRoute>} />
      <Route path="/threads" element={<ProtectedRoute><ThreadsListPage /></ProtectedRoute>} />
      <Route path="/threads/new" element={<ProtectedRoute roles={['produsen']}><CreateThreadPage /></ProtectedRoute>} />
      <Route path="/threads/:id" element={<ProtectedRoute><ThreadDetailPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <AppRoutes />
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
