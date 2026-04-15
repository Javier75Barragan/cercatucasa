import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, Store, UserCheck, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'customer' as 'customer' | 'seller',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(formData);
      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        navigate(formData.role === 'seller' ? '/vendor/dashboard' : '/');
      } else {
        setError(response.data.error || 'Error al registrarse');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center items-center p-4 py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>

      <div className="w-full max-w-xl animate-scale-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 glass rounded-3xl shadow-glow-md mb-8 relative group -rotate-3">
            <div className="absolute inset-0 bg-white/5 rounded-3xl blur-xl group-hover:bg-white/10 transition-all"></div>
            <img 
              src="file:///C:/Users/Bafer/.gemini/antigravity/brain/63f63873-21fe-469a-9b3c-9d07fbdde7a2/cercaya_logo_premium_v1_radar_1775874218884.png" 
              alt="Logo CercaYa" 
              className="w-14 h-14 object-contain relative z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] brightness-125"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Únete a la <span className="gradient-text">Comunidad</span>
          </h1>
          <p className="text-white/40 text-sm">
            Toda tu red local en la palma de tu mano.
          </p>
        </div>

        <div className="glass rounded-[32px] p-8 md:p-12 shadow-dark-lg border-white/[0.08]">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium animate-shake text-center">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-white/30 uppercase tracking-widest pl-1 block text-center">
                ¿Qué rol tendrás en CercaYa?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({...p, role: 'customer'}))}
                  className={`relative p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden group ${
                    formData.role === 'customer' 
                    ? 'border-primary-500/50 bg-primary-500/10 shadow-glow-sm' 
                    : 'border-white/5 bg-white/5 hover:bg-white/[0.08]'
                  }`}
                >
                  <UserCheck className={`w-6 h-6 mb-3 transition-colors ${formData.role === 'customer' ? 'text-primary-400' : 'text-white/20'}`} />
                  <p className="font-bold text-sm text-white mb-1">Soy Comprador</p>
                  <p className="text-[10px] text-white/40 leading-tight">Busco productos y servicios cerca de mí.</p>
                  {formData.role === 'customer' && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary-500 rounded-full animate-ping"></div>}
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(p => ({...p, role: 'seller'}))}
                  className={`relative p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden group ${
                    formData.role === 'seller' 
                    ? 'border-accent-500/50 bg-accent-500/10 shadow-[0_0_15px_rgba(249,131,7,0.1)]' 
                    : 'border-white/5 bg-white/5 hover:bg-white/[0.08]'
                  }`}
                >
                  <Store className={`w-6 h-6 mb-3 transition-colors ${formData.role === 'seller' ? 'text-accent-400' : 'text-white/20'}`} />
                  <p className="font-bold text-sm text-white mb-1">Soy Vendedor</p>
                  <p className="text-[10px] text-white/40 leading-tight">Quiero ofrecer mi negocio o servicios públicos.</p>
                  {formData.role === 'seller' && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent-500 rounded-full animate-ping"></div>}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/30 uppercase tracking-widest pl-1">
                  Nombre Completo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-white/20 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-glass pl-11"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/30 uppercase tracking-widest pl-1">
                  Teléfono / Móvil
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-white/20 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-glass pl-11"
                    placeholder="+57 300..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/30 uppercase tracking-widest pl-1">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-white/20 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input-glass pl-11"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/30 uppercase tracking-widest pl-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-white/20 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input-glass pl-11"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-14 flex items-center justify-center gap-3 text-base shadow-lg transition-all duration-300 rounded-2xl font-bold text-white ${
                formData.role === 'seller' 
                ? 'bg-gradient-to-r from-accent-500 to-accent-600 shadow-accent-500/20 hover:shadow-accent-500/40' 
                : 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-primary-500/20 hover:shadow-primary-500/40'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Crear mi cuenta en CercaYa</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/[0.06] text-center">
            <p className="text-sm text-white/30">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-bold text-white hover:text-primary-400 transition-colors inline-flex items-center gap-1 group">
                Inicia sesión aquí
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[11px] text-white/20 uppercase tracking-[0.2em]">
          Conectando Barrios &bull; 2026
        </p>
      </div>
    </div>
  );
};

export default Register;
