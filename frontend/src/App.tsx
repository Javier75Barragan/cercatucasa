import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Build trigger: 2026-04-22T12:42:00
import Header from './components/Header';
import MobileNavbar from './components/MobileNavbar';
import Home from './pages/Home';
// ... (rest of imports)
import Login from './pages/Login';
import Register from './pages/Register';
import VendorDashboard from './pages/VendorDashboard';
import Profile from './pages/Profile';
import Alerts from './pages/Alerts';
import { useAuthStore } from './stores/authStore';

// Componente para rutas protegidas
const ProtectedRoute = ({ children, requireSeller = false }: { children: React.ReactNode; requireSeller?: boolean }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireSeller && user?.role !== 'seller') {
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
                <ProtectedRoute requireSeller>
                  <VendorDashboard />
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
