import { useState } from 'react';
import { X, Star, MapPin, Phone, Clock, Globe, MessageCircle, Navigation, Building2 } from 'lucide-react';
import { useVendorsStore } from '../stores/vendorsStore';
import { vendorsApi } from '../services/api';


const categoryLabels: Record<string, string> = {
  fruits_vegetables: 'Frutas y Verduras',
  dairy: 'Lácteos',
  bakery: 'Panadería',
  meat: 'Carnicería',
  pharmacy: 'Farmacia',
  groceries: 'Abarrotes',
  messenger: 'Mensajería',
  hardware: 'Ferretería',
  stationery: 'Papelería',
  cleaning: 'Limpieza',
  garbage_collection: 'Recolección de Basura',
  utility_delivery: 'Recibos',
  telecom: 'Telecomunicaciones',
  water_delivery: 'Agua',
  gas_delivery: 'Gas',
  municipal: 'Municipal',
  other: 'Otros',
};

const categoryIcons: Record<string, string> = {
  fruits_vegetables: '🥬',
  dairy: '🥛',
  bakery: '🥖',
  meat: '🥩',
  pharmacy: '💊',
  groceries: '🛒',
  messenger: '📦',
  hardware: '🔧',
  stationery: '📝',
  cleaning: '🧽',
  garbage_collection: '🗑️',
  utility_delivery: '📄',
  telecom: '📱',
  water_delivery: '💧',
  gas_delivery: '🔥',
  municipal: '🏛️',
  other: '📍',
};

const enterpriseCategories = new Set([
  'garbage_collection', 'utility_delivery', 'telecom',
  'water_delivery', 'gas_delivery', 'municipal'
]);

const VendorDetails = () => {
  const { selectedVendor, setSelectedVendor, setTrackingVendor } = useVendorsStore();
  const [userRating, setUserRating] = useState<number>(0);
  const [isRating, setIsRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  const handleRate = async (value: number) => {
    if (!selectedVendor || isRating) return;
    setIsRating(true);
    try {
      const response = await vendorsApi.rate(selectedVendor.id, value);
      if (response.data.success) {
        setUserRating(value);
        setRatingSuccess(true);
        // Opcional: refrescar el vendor en el store para ver el nuevo promedio
      }
    } catch (error) {
      console.error('Error al calificar:', error);
    } finally {
      setIsRating(false);
    }
  };

  if (!selectedVendor) return null;

  const isEnterprise = enterpriseCategories.has(selectedVendor.category);

  const handleWhatsApp = () => {
    const phone = selectedVendor.whatsapp || selectedVendor.phone;
    if (phone) {
      const message = `Hola, los vi en CercaYa y me gustaría solicitar sus servicios/productos.`;
      window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleGetDirections = () => {
    if (selectedVendor.latitude && selectedVendor.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedVendor.latitude},${selectedVendor.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <>
      {/* Overlay móvil */}
      <div
        className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-[500] transition-opacity"
        onClick={() => setSelectedVendor(null)}
      />

      {/* Panel responsivo: Drawer en móvil, Sidebar a la derecha en escritorio */}
      <div className="fixed bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl md:h-full md:top-0 md:rounded-none md:left-auto md:w-[400px] glass-light z-[600] shadow-dark-lg overflow-y-auto animate-slide-up flex flex-col">
        
        {/* Handle de arrastre móvil */}
        <div className="flex justify-center pt-3 pb-2 md:hidden">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Header con imagen dinámica */}
        <div className={`relative h-48 sm:h-56 shrink-0 ${
            isEnterprise 
              ? 'bg-gradient-to-br from-accent-600 to-accent-900' 
              : 'bg-gradient-to-br from-primary-600 to-primary-900'
          }`}
        >
          {selectedVendor.photos?.[0] ? (
            <img
              src={selectedVendor.photos[0]}
              alt={selectedVendor.name}
              className="w-full h-full object-cover opacity-80 mix-blend-overlay"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center opacity-60">
              <span className="text-6xl mb-2">{categoryIcons[selectedVendor.category] || '📍'}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />

          {/* Botones de cerrar / volver */}
          <button
            onClick={() => setSelectedVendor(null)}
            className="absolute top-4 right-4 w-9 h-9 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Avatar principal flotante superpuesto */}
          <div className="absolute -bottom-6 left-6 flex items-end gap-4">
             <div className={`w-20 h-20 rounded-2xl p-1 shadow-lg backdrop-blur-md flex-shrink-0 ${
               isEnterprise ? 'bg-accent-500/20 ring-1 ring-accent-500/40' : 'bg-primary-500/20 ring-1 ring-primary-500/40'
             }`}>
               {selectedVendor.avatar_url ? (
                 <img
                   src={selectedVendor.avatar_url}
                   alt={selectedVendor.name}
                   className="w-full h-full object-cover rounded-xl"
                 />
               ) : (
                 <div className="w-full h-full rounded-xl bg-dark-900/80 flex items-center justify-center text-3xl">
                   {categoryIcons[selectedVendor.category] || '📍'}
                 </div>
               )}
             </div>
             
             {/* Indicador de estado */}
             <div className="mb-2">
              <div className={selectedVendor.location_active ? 'badge-active bg-dark-900/90' : 'badge-inactive bg-dark-900/90'}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  selectedVendor.location_active ? 'bg-primary-400 animate-pulse' : 'bg-white/30'
                }`} />
                {selectedVendor.location_active ? 'Activo' : 'Inactivo'}
              </div>
             </div>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 p-6 pt-10 overflow-y-auto">
          {/* Título y categoría */}
          <div className="mb-6 border-b border-white/[0.06] pb-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
                {selectedVendor.name}
              </h1>
              {selectedVendor.is_verified && (
                <span className="flex-shrink-0 w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center mt-1" title="Servicio Verificado">
                  <span className="text-primary-400 text-sm font-bold">✓</span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-white/50">
                {categoryLabels[selectedVendor.category] || selectedVendor.category}
              </span>
              <span className="text-white/20">•</span>
              {isEnterprise ? (
                <span className="badge-enterprise">
                  <Building2 className="w-3.5 h-3.5" />
                  Empresa de Servicios
                </span>
              ) : (
                <span className="badge-inactive">
                  {selectedVendor.type === 'ambulant' ? 'Vendedor Ambulante' : 'Tienda / Local'}
                </span>
              )}
            </div>

            {/* Rating */}
            {selectedVendor.rating > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                <span className="font-semibold text-white/90">{selectedVendor.rating}</span>
                <span className="text-sm text-white/40">({selectedVendor.review_count} opiniones)</span>
              </div>
            )}
          </div>

          {/* RASTREO EN VIVO (Solo para mensajeros y flotas) */}
          {['messenger', 'gas_delivery', 'water_delivery', 'utility_delivery', 'garbage_collection'].includes(selectedVendor.category) && (
             <button
               onClick={() => {
                 setTrackingVendor(selectedVendor);
                 setSelectedVendor(null); // Cerrar panel principal para abrir panel de tracking
               }}
               className="w-full flex items-center justify-center gap-2 py-4 mb-3 bg-primary-500/20 text-primary-400 border border-primary-500/50 rounded-xl font-bold shadow-[0_0_15px_rgba(22,185,121,0.2)] hover:bg-primary-500/30 transition-all hover:scale-[1.02]"
             >
               <MapPin className="w-5 h-5 animate-pulse" />
               Rastrear en Vivo (Radar)
             </button>
          )}

          {/* Botones de acción principal */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Contactar
            </button>
            <button
              onClick={handleGetDirections}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/5 text-white hover:bg-white/10 rounded-xl font-medium border border-white/10 transition-all hover:-translate-y-0.5"
            >
              <Navigation className="w-5 h-5" />
              Ruta
            </button>
          </div>

          {/* Tabs - Simplificado a solo Info */}
          <div className="flex border-b border-white/[0.06] mb-6">
            <div className="flex-1 pb-3 text-sm font-semibold text-primary-400 relative text-center">
              Perfil del Servicio
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full shadow-[0_-2px_8px_rgba(22,185,121,0.5)]" />
            </div>
          </div>

          {/* Contenido del tab */}
          <div className="min-h-[200px]">
            <div className="space-y-6 animate-fade-in pb-10">
              {/* Calificar (Nueva Sección) */}
              <div className="card-glass p-5 border-primary-500/10 mb-2">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">¿Qué tal fue el servicio?</h3>
                {ratingSuccess ? (
                  <div className="flex items-center gap-3 text-primary-400 animate-scale-in">
                    <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">✓</div>
                    <span className="text-sm font-medium">¡Gracias por calificar con {userRating} estrellas!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRate(star)}
                        disabled={isRating}
                        onMouseEnter={() => setUserRating(star)}
                        onMouseLeave={() => !isRating && setUserRating(0)}
                        className="transition-all hover:scale-125 disabled:opacity-50"
                      >
                        <Star 
                          className={`w-8 h-8 ${
                            (userRating >= star) 
                              ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' 
                              : 'text-white/10'
                          }`} 
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs text-white/20 font-medium">Pulsa para votar</span>
                  </div>
                )}
              </div>

              {/* Descripción */}
              {selectedVendor.description && (
                <div className="card-glass p-4 group">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 group-hover:text-primary-500/50 transition-colors">Acerca de</h3>
                  <p className="text-white/80 text-sm leading-relaxed">{selectedVendor.description}</p>
                </div>
              )}

              {/* Información de contacto */}
              <div className="card-glass p-4 space-y-4">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">Contacto y Ubicación</h3>
                
                {selectedVendor.phone && (
                  <a href={`tel:${selectedVendor.phone}`} className="flex items-center gap-3.5 text-white/70 hover:text-primary-400 transition-colors group">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-sm">{selectedVendor.phone}</span>
                  </a>
                )}

                {selectedVendor.address && (
                  <div className="flex items-center gap-3.5 text-white/70">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shadow-inner-glow">
                      <MapPin className="w-4 h-4 text-white/50" />
                    </div>
                    <span className="text-sm">{selectedVendor.address}</span>
                  </div>
                )}

                {selectedVendor.website && (
                  <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3.5 text-white/70 hover:text-primary-400 transition-colors group">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="text-sm truncate">{selectedVendor.website}</span>
                  </a>
                )}
              </div>

              {/* Horario */}
              {selectedVendor.schedule && (
                <div className="card-glass p-4 mt-6">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Horario de Atención
                  </h3>
                  <div className="space-y-2.5">
                    {Object.entries(selectedVendor.schedule).map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center text-sm border-b border-white/[0.03] pb-2 last:border-0 last:pb-0">
                        <span className="text-white/50 capitalize font-medium">{
                          { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' }[day] || day
                        }</span>
                        {hours ? (
                          <span className="text-white/90 bg-white/5 px-2.5 py-1 rounded-md">{hours.open} - {hours.close}</span>
                        ) : (
                          <span className="text-white/30 text-xs uppercase">Cerrado</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorDetails;
