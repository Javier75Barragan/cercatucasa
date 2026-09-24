import { Activity, ArrowRight, Clock, ShieldAlert, X } from 'lucide-react';
import { Vendor } from '../types';
import { useVendorsStore } from '../stores/vendorsStore';

interface RadarEncounter {
  vendor: Vendor;
  lastSeen: Date;
}

interface RadarPanelProps {
  encounters: RadarEncounter[];
  onClose: () => void;
}

const categoryIcons: Record<string, string> = {
  fruits_vegetables: '🥬',
  dairy: '🥛',
  bakery: '🥖',
  meat: '🥩',
  pharmacy: '💊',
  groceries: '🛒',
  messenger: '📦',
  garbage_collection: '🗑️',
  utility_delivery: '📄',
  telecom: '📱',
  water_delivery: '💧',
  gas_delivery: '🔥',
  municipal: '🏛️',
  other: '📍',
};

const RadarPanel = ({ encounters, onClose }: RadarPanelProps) => {
  const { setSelectedVendor } = useVendorsStore();
  const pendingReviewCount = encounters.length ? Math.max(1, Math.ceil(encounters.length / 3)) : 0;

  const formatLastSeen = (date: Date) => {
    const diff = (new Date().getTime() - date.getTime()) / 1000;
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    return `Hace ${Math.floor(diff / 3600)} h`;
  };

  return (
    <div className="flex h-full flex-col border-l border-white/[0.07] bg-surface-950/90 shadow-dark-lg backdrop-blur-xl animate-slide-in-right">
      <div className="border-b border-white/[0.07] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-ping rounded-full bg-primary-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-400">Radar comunitario</p>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Actividad local</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
            aria-label="Cerrar radar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-primary-300">
              <Activity className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Actividad hoy</span>
            </div>
            <strong className="mt-2 block text-3xl font-black text-white">{encounters.length}</strong>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-red-300">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Por revisar</span>
            </div>
            <strong className="mt-2 block text-3xl font-black text-white">{pendingReviewCount}</strong>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
        {encounters.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-10 py-20 text-center opacity-50">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5">
              <Clock size={24} />
            </div>
            <p className="text-xs font-medium">Buscando rastros...</p>
            <p className="mt-1 text-[10px] italic">Vendedores que hayan pasado cerca aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {encounters.map((enc, idx) => (
              <button
                type="button"
                key={`${enc.vendor.id}-${idx}`}
                onClick={() => setSelectedVendor(enc.vendor)}
                className="group w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 text-left transition-all hover:border-primary-500/30 hover:bg-primary-500/5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-xl transition-transform group-hover:scale-110">
                    {categoryIcons[enc.vendor.category] || '📍'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-bold text-white">{enc.vendor.name}</h4>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Clock size={10} className="text-primary-400" />
                      <span className="text-[10px] font-bold uppercase tracking-tighter text-primary-400">
                        {formatLastSeen(enc.lastSeen)}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-white/10 transition-all group-hover:translate-x-1 group-hover:text-white" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] bg-primary-500/5 p-6 text-center">
        <p className="text-[10px] font-medium text-white/30">El radar guarda encuentros de las últimas 2 horas.</p>
      </div>
    </div>
  );
};

export default RadarPanel;
