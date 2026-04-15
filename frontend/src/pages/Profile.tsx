import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { LogOut, User, Camera, Mail, Phone, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface-950 flex justify-center p-4 pt-24 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>

      <div className="w-full max-w-lg z-10 animate-scale-in">
        <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Volver a explorar
        </Link>

        {/* Profile Card */}
        <div className="glass rounded-[32px] p-8 md:p-10 shadow-dark-lg border-white/[0.08] relative overflow-hidden">
          
          <div className="text-center mb-8 relative">
            {/* Avatar Section */}
            <div 
              className="relative inline-block cursor-pointer mb-5"
              onMouseEnter={() => setIsHoveringAvatar(true)}
              onMouseLeave={() => setIsHoveringAvatar(false)}
              onClick={() => alert('¡Pronto podrás cambiar tu foto de perfil!')}
            >
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.name} 
                  className="w-28 h-28 rounded-[2rem] object-cover ring-2 ring-primary-500/30 shadow-glow-sm"
                />
              ) : (
                <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-primary-500/20 to-primary-600/10 flex items-center justify-center ring-1 ring-primary-500/20 shadow-glow-sm">
                  <User className="w-12 h-12 text-primary-400" />
                </div>
              )}
              
              {/* Hover overlay for changing photo */}
              <div className={`absolute inset-0 bg-dark-950/60 rounded-[2rem] flex flex-col items-center justify-center backdrop-blur-sm transition-opacity duration-200 ${isHoveringAvatar ? 'opacity-100' : 'opacity-0'}`}>
                <Camera className="w-8 h-8 text-white mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Cambiar Foto</span>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">
              {user.name}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Shield className="w-3.5 h-3.5 text-primary-400" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/70">
                {user.role === 'customer' ? 'Comprador' : 'Vendedor'}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            {/* Dato Correo */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white/40" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest mb-0.5">Correo Electrónico</p>
                <p className="text-sm font-medium text-white/90">{user.email}</p>
              </div>
            </div>

            {/* Dato Teléfono */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Phone className="w-4 h-4 text-white/40" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest mb-0.5">Teléfono</p>
                <p className="text-sm font-medium text-white/90">{user.phone || 'No registrado'}</p>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="pt-6 border-t border-white/[0.06] flex flex-col gap-3">
             <button 
                className="w-full flex items-center gap-3 p-4 rounded-2xl text-left bg-white/5 hover:bg-white/10 transition-colors text-white text-sm font-semibold border border-white/5"
                onClick={() => alert('Próximamente: Historial de pedidos y reviews')}
             >
               <span className="flex-1">Historial del Perfil</span>
               <div className="w-2 h-2 rounded-full bg-primary-500"></div>
             </button>

             <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors text-sm font-semibold border border-red-500/20 group"
             >
               <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
               Cerrar Sesión Segura
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
