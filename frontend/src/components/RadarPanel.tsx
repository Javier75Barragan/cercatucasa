import { Clock, ArrowRight } from 'lucide-react';
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

const RadarPanel = ({ encounters }: RadarPanelProps) => {
  const { setSelectedVendor } = useVendorsStore();

  const formatLastSeen = (date: Date) => {
    const diff = (new Date().getTime() - date.getTime()) / 1000;
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    return `Hace ${Math.floor(diff / 3600)} h`;
  };

  return (
    <div className="flex flex-col h-full bg-surface-950/80 backdrop-blur-xl border-l border-white/[0.06] animate-slide-in-right">
      <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-ping"></div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Radar de Actividad</h2>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
        {encounters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-10 text-center opacity-30">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Clock size={24} />
             </div>
             <p className="text-xs font-medium">Buscando rastros...</p>
             <p className="text-[10px] mt-1 italic">Vendedores que hayan pasado cerca aparecerán aquí.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {encounters.map((enc, idx) => (
              <div 
                key={`${enc.vendor.id}-${idx}`}
                onClick={() => setSelectedVendor(enc.vendor)}
                className="group p-5 hover:bg-white/[0.03] transition-all cursor-pointer relative"
               >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110">
                       {categoryIcons[enc.vendor.category] || '📍'}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="font-bold text-sm text-white truncate">{enc.vendor.name}</h4>
                       <div className="flex items-center gap-2 mt-0.5">
                          <Clock size={10} className="text-primary-400" />
                          <span className="text-[10px] font-bold text-primary-400 uppercase tracking-tighter">
                            {formatLastSeen(enc.lastSeen)}
                          </span>
                       </div>
                    </div>
                    <ArrowRight size={14} className="text-white/10 group-hover:text-white group-hover:translate-x-1 transition-all" />
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 bg-primary-500/5 text-center">
         <p className="text-[10px] text-white/30 font-medium">El radar guarda encuentros de las últimas 2 horas.</p>
      </div>
    </div>
  );
};

export default RadarPanel;
