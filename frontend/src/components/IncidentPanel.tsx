import { X, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';
import { Incident } from '../types';
import { useAuthStore } from '../stores/authStore';
import { incidentsApi } from '../services/api';

interface IncidentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  onAcceptIncident?: (incident: Incident) => void;
}

const incidentTypeIcons: Record<string, string> = {
  accident: '🚗',
  medical: '🚑',
  fire: '🔥',
  police: '👮',
  road_block: '🚧',
  fallen_tree: '🌳',
  flood: '🌊',
  other: '⚠️',
};

const incidentColors: Record<string, string> = {
  accident: '#ef4444',
  medical: '#f43f5e',
  fire: '#f97316',
  police: '#6366f1',
  road_block: '#f59e0b',
  fallen_tree: '#84cc16',
  flood: '#3b82f6',
  other: '#6b7280',
};

// Función de módulo accesible por IncidentCard
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
          <Clock size={10} />
          Pendiente
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-bold text-blue-400 uppercase tracking-wider">
          <Shield size={10} />
          En Atención
        </span>
      );
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-[10px] font-bold text-green-400 uppercase tracking-wider">
          <CheckCircle size={10} />
          Resuelto
        </span>
      );
    default:
      return null;
  }
};

const IncidentPanel = ({ isOpen, onClose, incidents, onAcceptIncident }: IncidentPanelProps) => {
  const { user } = useAuthStore();

  const handleAccept = async (incident: Incident) => {
    try {
      await incidentsApi.updateStatus(incident.id, 'in_progress', `Aceptado por ${user?.name}`);
      onAcceptIncident?.(incident);
    } catch (error) {
      console.error('Error accepting incident:', error);
    }
  };

  const handleResolve = async (incident: Incident) => {
    try {
      await incidentsApi.updateStatus(incident.id, 'resolved', `Resuelto por ${user?.name}`);
      onAcceptIncident?.(incident);
    } catch (error) {
      console.error('Error resolving incident:', error);
    }
  };

  if (!isOpen) return null;

  const pendingIncidents = incidents.filter(i => i.status === 'pending');
  const inProgressIncidents = incidents.filter(i => i.status === 'in_progress');

  return (
    <div className="fixed inset-0 z-[900] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in md:hidden">
      <div className="bg-surface-950 w-full max-w-lg md:rounded-[32px] rounded-t-[32px] border-t md:border border-white/10 shadow-dark-lg max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-white">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Incidentes Cercanos
            </h2>
            <p className="text-xs text-white/40 mt-1">
              {pendingIncidents.length} pendientes · {inProgressIncidents.length} en atención
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-green-500/20">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-white/80 font-semibold mb-1">Todo en Calma</h3>
              <p className="text-white/40 text-sm">No hay incidentes reportados en tu área</p>
            </div>
          ) : (
            <>
              {/* Pendientes */}
              {pendingIncidents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-3">
                    🚨 Pendientes de Atención
                  </h3>
                  {pendingIncidents.map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      onAccept={() => handleAccept(incident)}
                      onResolve={() => handleResolve(incident)}
                      showActions={true}
                    />
                  ))}
                </div>
              )}

              {/* En Atención */}
              {inProgressIncidents.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">
                    🛡️ En Atención
                  </h3>
                  {inProgressIncidents.map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      onResolve={() => handleResolve(incident)}
                      showActions={true}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente individual de tarjeta de incidente
interface IncidentCardProps {
  incident: Incident;
  onAccept?: () => void;
  onResolve?: () => void;
  showActions?: boolean;
}

const IncidentCard = ({ incident, onAccept, onResolve, showActions = false }: IncidentCardProps) => {
  const icon = incidentTypeIcons[incident.type] || '⚠️';
  const color = incidentColors[incident.type] || '#6b7280';

  return (
    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white text-sm truncate">{incident.name}</h4>
            {getStatusBadge(incident.status)}
          </div>
          <p className="text-xs text-white/50 truncate">{incident.phone}</p>
          {incident.distance_meters !== undefined && (
            <p className="text-[10px] text-white/30 mt-1">
              📍 {Math.round(incident.distance_meters)}m de distancia
            </p>
          )}
        </div>
      </div>

      {incident.description && (
        <p className="text-xs text-white/60 mb-3 line-clamp-2">{incident.description}</p>
      )}

      <div className="flex items-center justify-between text-[10px] text-white/40 mb-3">
        <span>{new Date(incident.created_at).toLocaleString('es-CO')}</span>
        <span>📍 {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}</span>
      </div>

      {showActions && incident.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="flex-1 px-3 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all"
          >
            🛡️ Aceptar Reporte
          </button>
          <button
            onClick={onResolve}
            className="flex-1 px-3 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-all"
          >
            ✅ Marcar Resuelto
          </button>
        </div>
      )}

      {showActions && incident.status === 'in_progress' && (
        <button
          onClick={onResolve}
          className="w-full px-3 py-2.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-all"
        >
          ✅ Marcar Resuelto
        </button>
      )}
    </div>
  );
};

export default IncidentPanel;
