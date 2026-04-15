import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut, Zap, Building2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuthStore();

  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              <div className="relative w-12 h-12 overflow-hidden rounded-xl bg-white/5 p-1 border border-white/10 group-hover:border-primary-500/50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <img 
                  src="file:///C:/Users/Bafer/.gemini/antigravity/brain/63f63873-21fe-469a-9b3c-9d07fbdde7a2/cercaya_logo_premium_v1_radar_1775874218884.png" 
                  alt="Logo CercaYa" 
                  className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] brightness-125 contract-125"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-lg font-black text-white tracking-tighter leading-none">Cerca</span>
                  <span className="text-lg font-black text-primary-500 tracking-tighter leading-none">Ya</span>
                </div>
                <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold leading-none mt-1 group-hover:text-primary-500/50 transition-colors">
                  Premium
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
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
              {user?.role === 'seller' && (
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
                  <button 
                    onClick={() => {
                       // We need to communicate with Home.tsx, but since we don't have a shared store for UI state yet
                       // we'll just use a CustomEvent as a quick 'toque de Antigravity'
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

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              id="btn-mobile-menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden py-3 border-t border-white/[0.06] animate-fade-in">
              <nav className="flex flex-col gap-1">
                <Link
                  to="/"
                  className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Zap className="w-4 h-4" />
                  Explorar
                </Link>
                {isAuthenticated && (
                  <>
                    <Link
                      to="/alerts"
                      className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Bell className="w-4 h-4" />
                      Mis Alertas
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Mi Perfil
                    </Link>
                  </>
                )}
                {user?.role === 'seller' && (
                  <Link
                    to="/vendor/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Building2 className="w-4 h-4" />
                    Mi Negocio
                  </Link>
                )}
                <div className="h-px bg-white/[0.06] my-2" />
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      to="/register"
                      className="mx-3 py-3 btn-primary text-center text-sm"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Registrarse gratis
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl text-left transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
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
