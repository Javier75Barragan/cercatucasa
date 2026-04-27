import { useState, useEffect } from 'react';
import { X, Loader2, ShieldCheck, Phone } from 'lucide-react';
import { incidentsApi } from '../services/api';

interface IncidentType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface IncidentReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const IncidentReportForm = ({ isOpen, onClose, onSuccess }: IncidentReportFormProps) => {
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadIncidentTypes();
      getCurrentLocation();
    }
  }, [isOpen]);

  const loadIncidentTypes = async () => {
    try {
      const response = await incidentsApi.getTypes();
      setIncidentTypes(response.data.data || []);
    } catch (error) {
      console.error('Error loading incident types:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por tu navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        console.error('Error getting location:', err);
        setError('No pudimos obtener tu ubicación. Activa el GPS e intenta de nuevo.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedType || !name || !phone || !location) {
      setError('Por favor completa todos los campos requeridos y verifica tu ubicación');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await incidentsApi.create({
        name,
        phone,
        latitude: location.lat,
        longitude: location.lng,
        type: selectedType,
        description: description || undefined,
      });

      if (response.data.success) {
        onSuccess?.();
        handleClose();
      }
    } catch (err: any) {
      console.error('Error creating incident:', err);
      setError(err.response?.data?.error || 'Error al reportar el incidente. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedType('');
    setName('');
    setPhone('');
    setDescription('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-950 w-full max-w-lg md:rounded-[32px] rounded-t-[32px] border-t md:border border-white/10 shadow-dark-lg max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary-500" />
              Reporte Oficial de Emergencia
            </h2>
            <p className="text-xs text-white/40 mt-1">Tu reporte será enviado directamente a la Policía, Bomberos y Ambulancias.</p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 glass rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Tipo de incidente */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">
              Tipo de Incidente *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {incidentTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-2xl border transition-all text-left ${
                    selectedType === type.id
                      ? 'border-primary-500 bg-primary-500/10 shadow-glow-sm'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{type.icon}</span>
                  <span className="text-xs font-medium text-white/80">{type.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-4 bg-primary-500/5 p-5 rounded-2xl border border-primary-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Phone size={14} className="text-primary-400" />
              <h3 className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em]">Datos de Contacto Obligatorios</h3>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">
                Tu Nombre Completo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="input-glass"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">
                Tu Número de Celular *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="300 123 4567"
                className="input-glass"
                required
              />
            </div>
            <p className="text-[9px] text-white/30 italic">Nota: Las autoridades usarán este número para confirmar la emergencia.</p>
          </div>

          {/* Descripción opcional */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe brevemente lo que sucedió..."
              className="input-glass min-h-[100px]"
              rows={3}
            />
          </div>

          {/* Ubicación */}
          <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-2 h-2 rounded-full ${location ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs font-medium text-white/70">
                {location ? 'Ubicación detectada' : 'Esperando ubicación...'}
              </span>
            </div>
            {location && (
              <p className="text-[10px] text-white/40">
                📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            )}
            {!location && (
              <button
                type="button"
                onClick={getCurrentLocation}
                className="text-xs text-primary-400 hover:text-primary-300 font-medium"
              >
                Intentar de nuevo
              </button>
            )}
          </div>

          {/* Submit button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !location}
              className="btn-primary w-full h-14 text-base bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando reporte...
                </span>
              ) : (
                '🚨 ENVIAR REPORTE DE EMERGENCIA'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentReportForm;
