import { useState, useEffect, useCallback } from 'react';
import { MapPin, Shield, AlertTriangle, CheckCircle, Phone, Clock, List, LayoutGrid, X, Bell, User, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useSocket } from '../hooks/useSocket';
import { incidentsApi } from '../services/api';
import { Incident } from '../types';

const AuthorityDashboard = () => {
  const { user } = useAuthStore();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const handleNewIncident = useCallback((incident: Incident) => {
    setIncidents(prev => {
      // Evitar duplicados
      if (prev.find(i => i.id === incident.id)) return prev;
      return [incident, ...prev];
    });
    
    // Notificación sonora simple (opcional)
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {});
  }, []);

  const { joinAuthorityRoom, isConnected } = useSocket(handleNewIncident);

  useEffect(() => {
    loadIncidents();
    joinAuthorityRoom();
  }, [joinAuthorityRoom]);

  const loadIncidents = async () => {
    try {
      // Como autoridad, cargamos incidentes recientes de la zona
      // Usamos una ubicación central por defecto para el primer load
      const response = await incidentsApi.getNearby({
        lat: 7.065,
        lng: -73.84,
        radius: 50000, // Radio grande para autoridades
        status: 'pending'
      });
      if (response.data.success) {
        setIncidents(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: Incident['status']) => {
    try {
      const response = await incidentsApi.updateStatus(id, status, `Atendido por ${user?.name} (${user?.role})`);
      if (response.data.success) {
        setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status } : inc));
        if (selectedIncident?.id === id) {
          setSelectedIncident(prev => prev ? { ...prev, status } : null);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'PENDIENTE', color: 'bg-red-500/20 text-red-500 border-red-500/30' };
      case 'in_progress': return { label: 'EN ATENCIÓN', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' };
      case 'resolved': return { label: 'RESUELTO', color: 'bg-green-500/20 text-green-500 border-green-500/30' };
      default: return { label: status, color: 'bg-gray-500/20 text-gray-500 border-gray-500/30' };
    }
  };

  const activeIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'cancelled');

  return (
    <div className="min-h-screen pt-16 bg-surface-950 text-white flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="bg-surface-900/50 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-glow-sm">
            <Shield className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter">CENTRO DE OPERACIONES <span className="text-primary-400">CERCAYA</span></h1>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {isConnected ? 'Sistema en Línea' : 'Sistema Desconectado'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
          <button 
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'map' ? 'bg-primary-500 text-white' : 'text-white/40 hover:text-white'}`}
          >
            <LayoutGrid size={14} /> MAPA
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-white/40 hover:text-white'}`}
          >
            <List size={14} /> LISTADO
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 relative bg-surface-950">
          {viewMode === 'map' ? (
            <div className="absolute inset-0">
               {/* Aquí va el componente de Mapa con los incidentes marcados */}
               <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin size={48} className="text-primary-500 mx-auto mb-4 opacity-20" />
                    <p className="text-white/20 font-medium">Cargando Mapa Táctico...</p>
                  </div>
               </div>
            </div>
          ) : (
            <div className="absolute inset-0 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {activeIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                  <Bell className="w-12 h-12 mb-4" />
                  <p className="text-xl font-bold">No hay emergencias activas</p>
                  <p className="text-sm">Todo está bajo control en tu sector.</p>
                </div>
              ) : (
                activeIncidents.map(inc => (
                  <div 
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-6 rounded-[24px] border transition-all cursor-pointer group ${
                      selectedIncident?.id === inc.id 
                      ? 'bg-primary-500/10 border-primary-500/40 shadow-glow-sm' 
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-2xl">
                          {inc.type === 'accident' ? '🚗' : inc.type === 'medical' ? '🚑' : '⚠️'}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-lg">{inc.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${getStatusLabel(inc.status).color}`}>
                              {getStatusLabel(inc.status).label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/40">
                             <span className="flex items-center gap-1"><Phone size={12} /> {inc.phone}</span>
                             <span className="flex items-center gap-1"><Clock size={12} /> {new Date(inc.created_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      <button className="p-2 glass rounded-lg text-white/40 group-hover:text-white transition-all">
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar Detail Area */}
        <div className={`w-full md:w-96 bg-surface-900 border-l border-white/5 flex flex-col transition-all duration-300 ${selectedIncident ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
          {selectedIncident ? (
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h2 className="font-bold uppercase tracking-widest text-xs text-white/40">Detalles del Incidente</h2>
                <button onClick={() => setSelectedIncident(null)} className="md:hidden p-2 text-white/40"><X size={20} /></button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
                {/* Status Badge */}
                <div className={`p-4 rounded-2xl border text-center font-black text-sm ${getStatusLabel(selectedIncident.status).color}`}>
                  ESTADO: {getStatusLabel(selectedIncident.status).label}
                </div>

                {/* Reporter Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-primary-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Informante</h3>
                  </div>
                  <div className="glass p-5 rounded-2xl">
                    <p className="text-lg font-bold mb-1">{selectedIncident.name}</p>
                    <a href={`tel:${selectedIncident.phone}`} className="flex items-center gap-2 text-primary-400 font-bold hover:underline">
                      <Phone size={14} /> {selectedIncident.phone}
                    </a>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Descripción del Suceso</h3>
                  </div>
                  <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl">
                    <p className="text-sm leading-relaxed text-white/70">
                      {selectedIncident.description || 'Sin descripción adicional proporcionada.'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-8 space-y-3">
                  {selectedIncident.status === 'pending' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedIncident.id, 'in_progress')}
                      className="w-full h-14 bg-blue-500 hover:bg-blue-600 rounded-2xl font-black text-xs shadow-glow-sm transition-all flex items-center justify-center gap-3"
                    >
                      <Shield size={18} /> CONFIRMAR Y ASIGNAR
                    </button>
                  )}
                  {selectedIncident.status === 'in_progress' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedIncident.id, 'resolved')}
                      className="w-full h-14 bg-green-500 hover:bg-green-600 rounded-2xl font-black text-xs shadow-glow-sm transition-all flex items-center justify-center gap-3"
                    >
                      <CheckCircle size={18} /> MARCAR COMO RESUELTO
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-20">
              <Shield size={64} className="mb-6" />
              <p className="font-bold">Selecciona un incidente para ver detalles tácticos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
