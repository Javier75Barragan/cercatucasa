import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, X, MessageCircle } from 'lucide-react';
import { useVendorsStore } from '../stores/vendorsStore';
import { useAuthStore } from '../stores/authStore';
import { Vendor } from '../types';

// Fix Leaflet default markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Enterprise categories
const enterpriseCategories = new Set([
  'garbage_collection', 'utility_delivery', 'telecom',
  'water_delivery', 'gas_delivery', 'municipal'
]);

const colors: Record<string, string> = {
  fruits_vegetables: '#10b981',
  dairy: '#60a5fa',
  bakery: '#f59e0b',
  meat: '#ef4444',
  pharmacy: '#a78bfa',
  groceries: '#22d3ee',
  messenger: '#fb923c',
  hardware: '#94a3b8',
  stationery: '#f472b6',
  cleaning: '#2dd4bf',
  garbage_collection: '#84cc16',
  utility_delivery: '#e879f9',
  telecom: '#38bdf8',
  water_delivery: '#67e8f9',
  gas_delivery: '#fbbf24',
  municipal: '#c084fc',
  other: '#9ca3af',
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

// Iconos personalizados por categoría
const getCategoryIcon = (category: string, isActive: boolean) => {

  const color = colors[category] || colors.other;
  const emoji = categoryIcons[category] || '📍';
  const opacity = isActive ? '1' : '0.4';
  const isEnterprise = enterpriseCategories.has(category);
  const size = isEnterprise ? 48 : 42;
  const glowColor = isEnterprise ? 'rgba(249,131,7,0.3)' : `${color}33`;
  const borderColor = isEnterprise ? 'rgba(249,131,7,0.6)' : 'rgba(255,255,255,0.2)';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle at 30% 30%, ${color}dd, ${color}99);
        border-radius: 50%;
        border: 2.5px solid ${borderColor};
        box-shadow: 0 4px 15px ${glowColor}, 0 0 20px ${glowColor};
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: ${opacity};
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        font-size: ${isEnterprise ? '20px' : '17px'};
      ">
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  });
};

// Componente para centrar el mapa
const MapCenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
};

// Componente para enfocar al usuario y al vendedor (Tracker bounds)
const TrackingBounds = ({ userLoc, vendorLoc }: { userLoc: [number, number]; vendorLoc: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(userLoc, vendorLoc);
    map.fitBounds(bounds, { padding: [50, 50], animate: true });
  }, [userLoc, vendorLoc, map]);

  return null;
};
// Componente para el círculo de radio
const RadiusCircle = ({ center, radius }: { center: [number, number]; radius: number }) => {
  const map = useMap();

  useEffect(() => {
    const circle = L.circle(center, {
      radius,
      color: '#16b979',
      fillColor: '#16b979',
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: '8, 6',
    }).addTo(map);

    return () => {
      map.removeLayer(circle);
    };
  }, [center, radius, map]);

  return null;
};

const Map = () => {
  const { vendors, selectedVendor, setSelectedVendor, trackingVendor, setTrackingVendor, filters } = useVendorsStore();
  const { location } = useAuthStore();
  const [mapCenter, setMapCenter] = useState<[number, number]>([4.6097, -74.0817]); // Bogotá por defecto

  useEffect(() => {
    if (location) {
      setMapCenter([location.lat, location.lng]);
    }
  }, [location]);

  useEffect(() => {
    if (selectedVendor?.latitude && selectedVendor?.longitude) {
      setMapCenter([selectedVendor.latitude, selectedVendor.longitude]);
    }
  }, [selectedVendor]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (filters.category && v.category !== filters.category) return false;
      if (filters.type && v.type !== filters.type) return false;
      return v.latitude && v.longitude;
    });
  }, [vendors, filters]);

  const handleGetDirections = (vendor: Vendor) => {
    if (vendor.latitude && vendor.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${vendor.latitude},${vendor.longitude}`;
      window.open(url, '_blank');
    }
  };

  const isEnterprise = (category: string) => enterpriseCategories.has(category);

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
    utility_delivery: 'Entrega de Recibos',
    telecom: 'Telecomunicaciones',
    water_delivery: 'Agua',
    gas_delivery: 'Gas',
    municipal: 'Municipal',
    other: 'Otros',
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={16}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Zoom control en posición personalizada */}
        <MapCenter center={mapCenter} />

        {location && filters.radius > 0 && (
          <RadiusCircle
            center={[location.lat, location.lng]}
            radius={filters.radius}
          />
        )}

        {/* Marcador de usuario */}
        {location && (
          <Marker
            position={[location.lat, location.lng]}
            icon={L.divIcon({
              className: 'user-marker-glow',
              html: `
                <div style="
                  position: relative;
                  width: 20px;
                  height: 20px;
                ">
                  <div style="
                    position: absolute;
                    inset: 0;
                    background: #3b82f6;
                    border-radius: 50%;
                    animation: pulse-ring 2s ease-out infinite;
                    opacity: 0.4;
                  "></div>
                  <div style="
                    position: relative;
                    width: 20px;
                    height: 20px;
                    background: linear-gradient(135deg, #60a5fa, #3b82f6);
                    border-radius: 50%;
                    border: 3px solid rgba(255,255,255,0.9);
                    box-shadow: 0 0 15px rgba(59,130,246,0.5), 0 2px 8px rgba(0,0,0,0.4);
                  "></div>
                </div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          />
        )}

        {/* Marcadores de vendedores */}
        {filteredVendors.map((vendor) => (
          vendor.latitude && vendor.longitude && (
            <Marker
              key={vendor.id}
              position={[vendor.latitude, vendor.longitude]}
              icon={getCategoryIcon(vendor.category, vendor.location_active ?? true)}
              eventHandlers={{
                click: () => setSelectedVendor(vendor),
              }}
            >
              <Popup className="rounded-2xl">
                <div className="p-3 min-w-[220px]">
                  <div className="flex items-center gap-3 mb-3">
                    {vendor.avatar_url ? (
                      <img
                        src={vendor.avatar_url}
                        alt={vendor.name}
                        className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500/30 to-primary-600/30 flex items-center justify-center ring-1 ring-primary-500/20">
                        <span className="text-lg">{vendor.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{vendor.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-white/50">{categoryLabels[vendor.category] || vendor.category}</span>
                        {isEnterprise(vendor.category) && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-400 font-medium">EMPRESA</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {vendor.rating > 0 && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-yellow-400 text-sm">★</span>
                      <span className="text-sm font-medium text-white/80">{vendor.rating}</span>
                      <span className="text-xs text-white/30">({vendor.review_count})</span>
                    </div>
                  )}

                  {vendor.distance_meters && (
                    <p className="text-xs text-white/40 mb-3">
                      📍 {Math.round(vendor.distance_meters)} metros de ti
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedVendor(vendor)}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-medium rounded-lg hover:shadow-glow-sm transition-all"
                    >
                      Ver perfil
                    </button>
                    <button
                      onClick={() => handleGetDirections(vendor)}
                      className="flex items-center justify-center px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-all"
                    >
                      <Navigation size={14} />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* MODO RASTREO: Línea y encuadre */}
        {location && trackingVendor && trackingVendor.latitude && trackingVendor.longitude && (
          <>
            <Polyline 
              positions={[
                [location.lat, location.lng], 
                [trackingVendor.latitude, trackingVendor.longitude]
              ]} 
              color="#16b979" 
              weight={4} 
              dashArray="10, 10" 
              className="animate-pulse opacity-70"
            />
            <TrackingBounds 
               userLoc={[location.lat, location.lng]} 
               vendorLoc={[trackingVendor.latitude, trackingVendor.longitude]} 
            />
          </>
        )}
      </MapContainer>

      {/* PANEL DE RASTREO FLOTANTE */}
      {trackingVendor && location && (
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[1000] glass rounded-[32px] p-5 shadow-[0_10px_40px_rgba(22,185,121,0.2)] border border-primary-500/30 animate-slide-up flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center mb-3 ring-2 ring-primary-500/40">
               <span className="text-2xl">{categoryIcons[trackingVendor.category] || '📦'}</span>
            </div>
            
            <h3 className="text-white font-bold text-center text-lg leading-tight">Rastreando a {trackingVendor.name}</h3>
            
            {trackingVendor.distance_meters && (
              <p className="text-primary-400 text-sm font-bold mt-1 uppercase tracking-widest gap-1 flex items-center">
                <Navigation size={12} className="text-primary-400" />
                A {Math.round(trackingVendor.distance_meters)} metros
              </p>
            )}

            <div className="flex gap-2 w-full mt-5">
               <button 
                  onClick={() => {
                     const phone = trackingVendor.whatsapp || trackingVendor.phone;
                     if (phone) {
                        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=Hola, estoy haciendo seguimiento a mi pedido en CercaYa`, '_blank');
                     }
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 flex justify-center items-center gap-2 font-medium transition-colors border border-white/5"
               >
                  <MessageCircle size={18} />
                  Contactar
               </button>
               <button 
                  onClick={() => setTrackingVendor(null)}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl py-3 flex justify-center items-center gap-2 font-bold transition-colors border border-red-500/20"
               >
                  <X size={18} />
                  Finalizar
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default Map;
