import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Build trigger: 2026-04-22T12:42:00
import Header from './components/Header';
import MobileNavbar from './components/MobileNavbar';
import Home from './pages/Home';
// ... (rest of imports)
import Login from './pages/Login';
import Register from './pages/Register';
import VendorDashboard from './pages/VendorDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import Profile from './pages/Profile';
import Alerts from './pages/Alerts';
import { useAuthStore } from './stores/authStore';

// Componente para rutas protegidas
const ProtectedRoute = ({ children, requireSeller = false, roles }: { children: React.ReactNode; requireSeller?: boolean, roles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role || '')) {
    return <Navigate to="/" replace />;
  }

  // Permitir customer y seller para vendor/dashboard (para que puedan crear su primer negocio)
  // Solo requerir seller para otras rutas específicas de vendedores
  if (requireSeller && user?.role !== 'seller' && user?.role !== 'customer') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface-950 text-white">
        <Header />
        <main className="pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/vendor/dashboard"
              element={
                <ProtectedRoute roles={['seller', 'admin']}>
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/authority/dashboard"
              element={
                <ProtectedRoute roles={['authority', 'admin']}>
                  <AuthorityDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <MobileNavbar />
      </div>
    </BrowserRouter>
  );
}

export default App;
