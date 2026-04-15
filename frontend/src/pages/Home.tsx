import { useEffect, useCallback, useState, useRef } from 'react';
import { List, X, Navigation, Loader2, BellRing } from 'lucide-react';
import Map from '../components/Map';
import MapFilters from '../components/MapFilters';
import VendorCard from '../components/VendorCard';
import VendorDetails from '../components/VendorDetails';
import RadarPanel from '../components/RadarPanel';
import { useGeolocation } from '../hooks/useGeolocation';
import { useVendorsStore } from '../stores/vendorsStore';
import { useAuthStore } from '../stores/authStore';
import { vendorsApi } from '../services/api';
import { Vendor } from '../types';

interface RadarEncounter {
  vendor: Vendor;
  lastSeen: Date;
}

const Home = () => {
  const { location, error, isLoading: isGeoLoading, refreshLocation } = useGeolocation();
  const { setLocation } = useAuthStore();
  const { vendors, setVendors, filters, setLoading, selectedVendor, isLoading } = useVendorsStore();
  const [showMobileList, setShowMobileList] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [encounters, setEncounters] = useState<RadarEncounter[]>([]);
  
  // Audio for notifications
  const notificationAudio = useRef<HTMLAudioElement | null>(null);
  const previousVendorIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    notificationAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
  }, []);

  // Sync location with store
  useEffect(() => {
    if (location) {
      setLocation(location);
    }
  }, [location, setLocation]);

  // Load nearby vendors
  const loadVendors = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    try {
      const response = await vendorsApi.getNearby({
        lat: location.lat,
        lng: location.lng,
        radius: filters.radius,
        category: filters.category,
        type: filters.type,
      });
      
      const newVendors: Vendor[] = response.data.data || [];
      
      // Check for new vendors to play sound
      const currentIds = new Set(newVendors.map(v => v.id));
      const hasNewVendor = newVendors.some(v => !previousVendorIds.current.has(v.id));
      
      if (hasNewVendor && previousVendorIds.current.size > 0) {
        notificationAudio.current?.play().catch(e => console.log('Audio play failed:', e));
      }
      
      // Update Radar encounters
      setEncounters(prev => {
        const newEncounters = [...prev];
        newVendors.forEach(v => {
          const idx = newEncounters.findIndex(e => e.vendor.id === v.id);
          if (idx >= 0) {
            newEncounters[idx] = { vendor: v, lastSeen: new Date() };
          } else {
            newEncounters.unshift({ vendor: v, lastSeen: new Date() });
          }
        });
        // Keep only last 20 and filter older than 2 hours
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        return newEncounters
          .filter(e => e.lastSeen > twoHoursAgo)
          .slice(0, 20);
      });
      
      previousVendorIds.current = currentIds;
      setVendors(newVendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  }, [location, filters, setVendors, setLoading]);

  useEffect(() => {
    loadVendors();
    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(loadVendors, 30000);
    return () => clearInterval(interval);
  }, [loadVendors]);

  // Close list when vendor selected
  useEffect(() => {
    if (selectedVendor) {
      setShowMobileList(false);
    }
  }, [selectedVendor]);

  useEffect(() => {
    const handleToggle = () => setShowRadar(prev => !prev);
    window.addEventListener('toggle-radar', handleToggle);
    return () => window.removeEventListener('toggle-radar', handleToggle);
  }, []);

  return (
    <div className="h-screen pt-14 md:pt-16 flex flex-col md:flex-row bg-surface-950 text-white overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-96 glass border-r border-white/[0.06] overflow-hidden z-10 transition-all duration-300">
        <div className="p-6 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold tracking-tight text-white/90">
              Cerca de ti
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary-500/10 rounded-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest leading-none">Vivo</span>
            </div>
          </div>
          <p className="text-xs text-white/40">
            Mostrando <span className="text-white/70 font-semibold">{vendors.length}</span> resultados en <span className="text-white/70 font-semibold">{filters.radius}m</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isLoading && vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
              <p className="text-sm">Buscando en el sector...</p>
            </div>
          ) : vendors.length > 0 ? (
            <div className="space-y-3 animate-fade-in">
              {vendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                <Navigation className="w-8 h-8 text-white/20" />
              </div>
              <h3 className="text-white/80 font-semibold mb-2">Silencio en el área</h3>
              <p className="text-white/40 text-xs leading-relaxed mb-6">
                No encontramos nada en este momento. Prueba expandiendo tu radio de búsqueda o cambiando de categoría.
              </p>
              <button 
                onClick={() => {}} // This should trigger filters expand
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium transition-all"
              >
                Ajustar filtros
              </button>
            </div>
          )}
        </div>
        
        {/* Ad or Promo slot at bottom of sidebar */}
        <div className="p-4 bg-primary-500/5 mt-auto border-t border-white/[0.06]">
          <div className="flex items-center gap-3 glass-accent p-3 rounded-xl border-primary-500/20">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center shadow-glow-sm">
              <BellRing className="w-5 h-5 text-white animate-pulse-slow" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-primary-400 uppercase">Alertas Activas</p>
              <p className="text-[10px] text-white/50">Te avisaremos con un sonido cuando algo nuevo pase cerca.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Map) */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-950 z-50 p-6 animate-fade-in text-center">
            <div className="max-w-xs card-glass p-8 border-red-500/20">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <MapPinIcon className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ubicación Requerida</h3>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">
                Sin coordenadas no podemos decirte qué hay a la vuelta de la esquina. Por favor activa el GPS.
              </p>
              <button
                onClick={refreshLocation}
                className="btn-primary w-full"
              >
                Permitir ubicación
              </button>
            </div>
          </div>
        ) : (
          <>
            <Map />
            <MapFilters />

            {/* Float Action Button (Mobile Only) */}
            <div className="md:hidden absolute bottom-6 left-0 right-0 px-6 z-[400] flex justify-center gap-3">
              <button
                onClick={() => setShowMobileList(true)}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-white text-dark-950 rounded-2xl shadow-2xl font-bold text-sm active:scale-95 transition-all"
              >
                <List className="w-5 h-5" />
                Listado
              </button>
              
              <button
                onClick={() => setShowRadar(!showRadar)}
                className={`p-3.5 backdrop-blur-md rounded-2xl border shadow-2xl transition-all ${
                  showRadar ? 'bg-primary-500 text-white border-primary-400' : 'bg-dark-900/80 text-white border-white/10'
                }`}
              >
                <BellRing className={`w-5 h-5 ${showRadar ? 'animate-pulse' : ''}`} />
              </button>

              <button
                onClick={refreshLocation}
                className="p-3.5 bg-dark-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl text-white active:scale-95 transition-all"
              >
                <Navigation className={`w-5 h-5 ${isGeoLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Radar Panel Desktop/Overlay */}
            {showRadar && (
              <div className="absolute top-0 right-0 bottom-0 w-80 z-[450] animate-slide-up md:animate-slide-in-right">
                <RadarPanel encounters={encounters} onClose={() => setShowRadar(false)} />
              </div>
            )}

            {/* Profile / Details Drawer */}
            <VendorDetails />
          </>
        )}
      </div>

      {/* Mobile Bottom Sheet Drawer */}
      {showMobileList && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[450] md:hidden animate-fade-in"
            onClick={() => setShowMobileList(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-dark-950/95 backdrop-blur-xl rounded-t-[32px] border-t border-white/10 shadow-2xl z-[460] md:hidden h-[80vh] flex flex-col animate-slide-up">
            <div className="bottom-sheet-handle" />
            
            <div className="flex items-center justify-between px-6 pt-4 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Vendedores Cerca</h2>
                <p className="text-xs text-white/30 tracking-wide mt-1">Busca el ícono 🏛️ para empresas oficiales</p>
              </div>
              <button
                onClick={() => setShowMobileList(false)}
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 active:scale-90 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 pt-2">
              {isLoading && vendors.length === 0 ? (
                <div className="py-20 flex flex-col items-center opacity-40">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-4" />
                  <p className="text-sm">Explorando cercanías...</p>
                </div>
              ) : vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))
              ) : (
                <div className="py-20 text-center opacity-30">
                  <div className="text-4xl mb-4">🛸</div>
                  <p className="text-sm">Área despejada.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Internal map pin icon for error state
const MapPinIcon = ({ className }: { className: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default Home;
