import { Link, useLocation } from 'react-router-dom';
import { Zap, Bell, User, Building2, Radar } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const MobileNavbar = () => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { label: 'Explorar', icon: Zap, path: '/' },
    { label: 'Radar', icon: Radar, path: '/radar' }, // Mock or special view
    { label: 'Alertas', icon: Bell, path: '/alerts', auth: true },
    { label: 'Perfil', icon: User, path: isAuthenticated ? '/profile' : '/login' },
  ];

  if (user?.role === 'seller') {
    navItems.splice(2, 0, { label: 'Negocio', icon: Building2, path: '/vendor/dashboard', auth: true });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[2000] safe-bottom">
      <div className="mx-4 mb-4 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${
                  isActive ? 'text-primary-500' : 'text-white/40'
                }`}
              >
                <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-primary-500/10' : 'bg-transparent'
                }`}>
                  <Icon size={isActive ? 22 : 20} className={isActive ? 'animate-pulse-slow' : ''} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
                  )}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${
                  isActive ? 'opacity-100' : 'opacity-0 scale-90 h-0'
                } transition-all duration-300`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileNavbar;
