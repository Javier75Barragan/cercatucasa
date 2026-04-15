import { useState } from 'react';
import { Bell, Plus, Settings, ArrowLeft, Trash2 } from 'lucide-react';
import { useNotificationsStore } from '../stores/notificationsStore';
import { Link } from 'react-router-dom';

const Alerts = () => {
  const { alerts } = useNotificationsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mocking an initial alert for UI display since backend endpoints might be empty locally initially
  const displayedAlerts = alerts.length > 0 ? alerts : [
    { id: '1', category: 'Panadería', radius: 500, active: true },
    { id: '2', category: 'Recolección de Basura', radius: 1000, active: false }
  ];

  return (
    <div className="min-h-screen bg-surface-950 flex justify-center p-4 pt-20 relative overflow-hidden">
      {/* Background Decorative */}
      <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] bg-accent-500/10 rounded-full blur-[140px] animate-pulse-slow"></div>

      <div className="w-full max-w-2xl z-10 animate-scale-in">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Explorar
          </Link>
          <button 
             className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-white/60"
             onClick={() => alert('Configuración general de notificaciones pronto disponible')}
          >
             <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="glass rounded-[32px] p-8 md:p-10 shadow-dark-lg border-white/[0.08]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
                <Bell className="text-primary-400" />
                Mis Alertas
              </h1>
              <p className="text-white/40 text-sm">
                Recibe notificaciones cuando los negocios que te interesan pasen cerca de tu zona.
              </p>
            </div>
            
            <button 
               onClick={() => setIsModalOpen(true)}
               className="btn-primary flex-shrink-0 flex items-center gap-2 shadow-glow-sm hover:shadow-glow-md px-6 py-3"
            >
              <Plus className="w-5 h-5" />
              Nueva Alerta
            </button>
          </div>

          <div className="space-y-4">
             {displayedAlerts.map((alertItem: any) => (
                <div key={alertItem.id} className="group flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden">
                  {/* Glass highlight on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative z-10 flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center ${alertItem.active !== false ? 'bg-primary-500/10 text-primary-400' : 'bg-white/5 text-white/30'}`}>
                        <Bell className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="font-bold text-white mb-0.5">{alertItem.category}</h3>
                        <p className="text-xs text-white/40">Radio de búsqueda: {alertItem.radius} metros</p>
                     </div>
                  </div>

                  <div className="relative z-10 flex items-center gap-4">
                     <div className="flex flex-col items-end mr-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${alertItem.active !== false ? 'text-primary-400' : 'text-white/30'}`}>
                            {alertItem.active !== false ? 'Rastreando' : 'Pausada'}
                        </span>
                     </div>
                     <button className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:bg-red-500/20">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
             ))}
          </div>

        </div>
      </div>

      {isModalOpen && (
         <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in p-4">
            <div className="bg-surface-900 border border-white/10 rounded-3xl p-8 w-full max-w-sm text-center shadow-dark-lg">
               <div className="w-16 h-16 bg-primary-500/20 text-primary-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bell className="w-8 h-8" />
               </div>
               <h2 className="text-xl font-bold text-white mb-2">Crear Alerta Radar</h2>
               <p className="text-white/40 text-sm mb-6">
                 Esta función está temporalmente deshabilitada en el entorno local mientras conectamos la API en vivo.
               </p>
               <button onClick={() => setIsModalOpen(false)} className="btn-primary w-full py-3">
                 Entendido
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default Alerts;
