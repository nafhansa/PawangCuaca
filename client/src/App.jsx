import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
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
import CommunityPage from './pages/CommunityPage';
import HomeDashboardPage from './pages/dashboard/HomeDashboardPage';
import LatestVotesPage from './pages/dashboard/LatestVotesPage';
import RiwayatPage from './pages/dashboard/RiwayatPage';
import AdminStatsPage from './pages/admin/AdminStatsPage';
import './App.css';

/* ============================================
   LANDING NAVBAR — untuk halaman public saja
   ============================================ */
function LandingNavbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isLanding = location.pathname === '/';

  return (
    <nav className={`landing-navbar ${isLanding ? 'transparent' : ''}`}>
      <div className="landing-navbar-inner">
        <Link to="/" className="landing-brand">
          <span className="landing-brand-icon">🌦️</span>
          <span className="landing-brand-text">PawangCuaca</span>
        </Link>
        <div className="landing-nav-links">
          <Link to="/tentang" className={`landing-nav-link ${location.pathname === '/tentang' ? 'active' : ''}`}>
            Tentang
          </Link>
          {user ? (
            <>
              <Link to={user.role === 'superadmin' ? '/admin' : '/dashboard'} className="landing-nav-link highlight">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="landing-nav-btn-outline">
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="landing-nav-link">Masuk</Link>
              <Link to="/register" className="landing-nav-btn-primary">Daftar</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ============================================
   DASHBOARD SIDEBAR
   ============================================ */
function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const menuItems = [
    { path: '/dashboard/cuaca', icon: '🌦️', label: 'Cuaca' },
    { path: '/dashboard/laporan', icon: '📝', label: 'Laporan' },
    { path: '/dashboard/threads', icon: '💬', label: 'Threads' },
    { path: '/dashboard/komunitas', icon: '🏆', label: 'Komunitas' },
    { path: '/dashboard/vote-terbaru', icon: '🗳️', label: 'Vote Terbaru' },
    { path: '/dashboard/riwayat', icon: '📜', label: 'Riwayat' },
    { path: '/dashboard/profil', icon: '👤', label: 'Profil' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <button className="sidebar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        ☰
      </button>
      {mobileOpen && <div className="sidebar-mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <span className="sidebar-brand-icon">🌦️</span>
            {!collapsed && <span className="sidebar-brand-text">PawangCuaca</span>}
          </Link>
          <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-avatar">{user?.username?.[0]?.toUpperCase() || '?'}</span>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">@{user?.username}</span>
                <span className="sidebar-user-role">{user?.role}</span>
              </div>
            )}
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <span>🚪</span>
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

import { useState } from 'react';

/* ============================================
   ADMIN SIDEBAR
   ============================================ */
function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const adminMenuItems = [
    { path: '/admin/users', icon: '👥', label: 'Pengguna' },
    { path: '/admin/stats', icon: '📊', label: 'Statistik' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <button className="sidebar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        ☰
      </button>
      {mobileOpen && <div className="sidebar-mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/admin" className="sidebar-brand">
            <span className="sidebar-brand-icon">⚡</span>
            {!collapsed && <span className="sidebar-brand-text">Admin Panel</span>}
          </Link>
          <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {adminMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link to="/dashboard/cuaca" className="sidebar-back-link">
            <span>←</span>
            {!collapsed && <span>Ke Dashboard</span>}
          </Link>
          <div className="sidebar-user">
            <span className="sidebar-user-avatar admin-avatar">{user?.username?.[0]?.toUpperCase() || '?'}</span>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">@{user?.username}</span>
                <span className="sidebar-user-role">superadmin</span>
              </div>
            )}
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <span>🚪</span>
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ============================================
   DASHBOARD LAYOUT
   ============================================ */
function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
}

/* ============================================
   ADMIN LAYOUT
   ============================================ */
function AdminLayout() {
  return (
    <div className="dashboard-layout">
      <AdminSidebar />
      <main className="dashboard-main admin-main">
        <Outlet />
      </main>
    </div>
  );
}

/* ============================================
   PUBLIC LAYOUT (Landing + About + Auth)
   ============================================ */
function PublicLayout() {
  return (
    <div className="public-layout">
      <LandingNavbar />
      <main className="public-main">
        <Outlet />
      </main>
    </div>
  );
}

/* ============================================
   ROUTES
   ============================================ */
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes dengan LandingNavbar */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tentang" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Dashboard routes dengan Sidebar */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<HomeDashboardPage />} />
        <Route path="cuaca" element={<HomeDashboardPage />} />
        <Route path="laporan" element={<ReportsFeedPage />} />
        <Route path="laporan/:id" element={<ReportDetailPage />} />
        <Route path="laporan/baru" element={<ProtectedRoute roles={['produsen']}><CreateReportPage /></ProtectedRoute>} />
        <Route path="threads" element={<ThreadsListPage />} />
        <Route path="threads/:id" element={<ThreadDetailPage />} />
        <Route path="threads/baru" element={<ProtectedRoute roles={['produsen']}><CreateThreadPage /></ProtectedRoute>} />
        <Route path="komunitas" element={<CommunityPage />} />
        <Route path="vote-terbaru" element={<LatestVotesPage />} />
        <Route path="riwayat" element={<RiwayatPage />} />
        <Route path="profil" element={<ProfilePage />} />
      </Route>

      {/* Admin routes dengan AdminSidebar */}
      <Route path="/admin" element={<ProtectedRoute roles={['superadmin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminDashboardPage />} />
        <Route path="stats" element={<AdminStatsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
