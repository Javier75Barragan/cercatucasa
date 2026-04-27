import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut, Zap, Building2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useSocket } from '../hooks/useSocket';
import { useGeolocation } from '../hooks/useGeolocation';
import { vendorsApi } from '../services/api';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuthStore();

  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false); // Slider state
  const [vendorId, setVendorId] = useState<string | null>(null);
  
  const { toggleVisibility, updateLocation } = useSocket();
  const { location } = useGeolocation();

  // Load vendor status
  useEffect(() => {
    const loadVendorStatus = async () => {
      if (user?.role === 'seller') {
        try {
          const res = await vendorsApi.getMe();
          if (res.data.success && res.data.data) {
            setVendorId(res.data.data.id);
            setIsOnline(!!res.data.data.online_status);
          }
        } catch (e) {
          console.error('Error loading vendor for header', e);
        }
      }
    };
    loadVendorStatus();
  }, [user]);

  const handleToggleOnline = async () => {
    let currentVendorId = vendorId;
    
    if (!currentVendorId) {
      try {
        const res = await vendorsApi.getMe();
        if (res.data.success && res.data.data) {
          currentVendorId = res.data.data.id;
          setVendorId(currentVendorId);
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!currentVendorId) {
      navigate('/vendor/dashboard');
      return;
    }
    const newState = !isOnline;
    
    // Si intenta conectarse pero no hay GPS
    if (newState && !location) {
      alert('Necesitamos acceso a tu ubicación GPS para activarte en el radar. Por favor, permite el acceso a tu ubicación en el navegador.');
      return;
    }

    setIsOnline(newState);
    toggleVisibility(currentVendorId, newState);
    if (newState && location) {
      updateLocation(currentVendorId, location.lat, location.lng);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 safe-top">
      <div className="glass border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group" id="header-logo">
              <div className="relative w-10 h-10 md:w-12 md:h-12 overflow-hidden rounded-xl bg-white/5 p-1 border border-white/10 group-hover:border-primary-500/50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <img 
                  src="/logo.png" 
                  alt="Logo CercaYa" 
                  className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] brightness-125 contract-125"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base md:text-lg font-black text-white tracking-tighter leading-none">Cerca</span>
                  <span className="text-base md:text-lg font-black text-primary-500 tracking-tighter leading-none">Ya</span>
                </div>
                <span className="hidden md:block text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold leading-none mt-1 group-hover:text-primary-500/50 transition-colors">
                  Premium
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {/* ... (existing nav links) ... */}
              <Link
                to="/"
                className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg font-medium text-sm transition-all duration-200"
                id="nav-explore"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Explorar
                </span>
              </Link>
              {isAuthenticated && (
                <Link
                  to="/alerts"
                  className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg font-medium text-sm transition-all duration-200"
                  id="nav-alerts"
                >
                  Mis Alertas
                </Link>
              )}
              {isAuthenticated && (user?.role === 'seller' || user?.role === 'customer') && (
                <Link
                  to="/vendor/dashboard"
                  className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg font-medium text-sm transition-all duration-200"
                  id="nav-dashboard"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Mi Negocio
                  </span>
                </Link>
              )}
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {user?.role === 'seller' && (
                    <div className="flex items-center gap-2.5 mr-2 bg-surface-900/50 px-3 py-1.5 rounded-xl border border-white/5">
                      <div className="flex flex-col items-end leading-none">
                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${isOnline ? 'text-primary-400' : 'text-white/40'}`}>
                          {isOnline ? 'En línea' : 'Desconectado'}
                        </span>
                      </div>
                      <button
                        onClick={handleToggleOnline}
                        className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                          isOnline ? 'bg-primary-500 shadow-[0_0_10px_rgba(249,131,7,0.4)]' : 'bg-white/10'
                        }`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                          isOnline ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                       window.dispatchEvent(new CustomEvent('toggle-radar'));
                    }}
                    className="relative p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200" 
                    id="btn-notifications"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary-500 rounded-full shadow-glow-sm animate-pulse" />
                  </button>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="flex items-center gap-2">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-200"
                      id="btn-profile"
                    >
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-7 h-7 rounded-lg object-cover ring-2 ring-primary-500/30"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500/30 to-primary-600/30 flex items-center justify-center ring-1 ring-primary-500/20">
                          <User className="w-3.5 h-3.5 text-primary-400" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-white/80">{user?.name?.split(' ')[0]}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                      id="btn-logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn-glass text-sm"
                    id="btn-login"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm"
                    id="btn-register"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button - Still useful for secondary actions like Logout */}
            <div className="md:hidden flex items-center gap-2">
              {isAuthenticated && (user?.role === 'seller' || user?.role === 'customer') && (
                <button
                  onClick={handleToggleOnline}
                  className={`relative w-9 h-5 mr-1 rounded-full transition-all duration-300 ${
                    isOnline ? 'bg-primary-500 shadow-[0_0_10px_rgba(249,131,7,0.4)]' : 'bg-white/10'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                    isOnline ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              )}
              {isAuthenticated && (
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('toggle-radar'))}
                  className="p-2 text-white/40 active:text-primary-500 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                id="btn-mobile-menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu - Simplified since MobileNavbar handles main nav */}
          {isMenuOpen && (
            <div className="md:hidden py-3 border-t border-white/[0.06] animate-fade-in bg-surface-950/50 backdrop-blur-md rounded-b-2xl">
              <nav className="flex flex-col gap-1 px-4">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 py-3 text-white/70"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4 text-primary-500" />
                  Ver Perfil
                </Link>
                <div className="h-px bg-white/[0.06] my-1" />
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 py-3 text-red-400 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-3 py-3 text-white/70"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
