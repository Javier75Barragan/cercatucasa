import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(email, password);
      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        navigate('/');
      } else {
        setError(response.data.error || 'Credenciales inválidas');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-500/10 rounded-full blur-[120px] animate-pulse-slow font-delay-2000"></div>

      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 glass rounded-3xl shadow-glow-md mb-8 relative group">
            <div className="absolute inset-0 bg-white/5 rounded-3xl blur-xl group-hover:bg-white/10 transition-all"></div>
            <img 
              src="file:///C:/Users/Bafer/.gemini/antigravity/brain/63f63873-21fe-469a-9b3c-9d07fbdde7a2/cercaya_logo_premium_v1_radar_1775874218884.png" 
              alt="Logo CercaYa" 
              className="w-14 h-14 object-contain relative z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] brightness-125"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            Bienvenido de <span className="gradient-text">Nuevo</span>
          </h1>
          <p className="text-white/40 text-sm">
            Toda tu comunidad a solo un clic de distancia.
          </p>
        </div>

        <div className="glass rounded-[32px] p-8 md:p-10 shadow-dark-lg border-white/[0.08]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium animate-shake text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/30 truncate uppercase tracking-widest pl-1">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-white/20 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-glass pl-11"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold text-white/30 uppercase tracking-widest">
                    Contraseña
                  </label>
                  <a href="#" className="text-[11px] font-bold text-primary-400 hover:text-primary-300 transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-white/20 group-focus-within:text-primary-400 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-glass pl-11"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary h-14 flex items-center justify-center gap-3 text-base shadow-glow-sm hover:shadow-glow-md"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Ingresar a CercaYa</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/[0.06] text-center">
            <p className="text-sm text-white/30">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="font-bold text-white hover:text-primary-400 transition-colors inline-flex items-center gap-1 group">
                Regístrate gratis
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </div>
        </div>
        
        {/* Helper footer */}
        <p className="text-center mt-8 text-[11px] text-white/20 uppercase tracking-[0.2em]">
          Plataforma de Confianza Sectorial &bull; 2026
        </p>
      </div>
    </div>
  );
};

export default Login;
