import { Star, MapPin, Building2, MessageCircle, Phone } from 'lucide-react';
import { Vendor } from '../types';
import { useVendorsStore } from '../stores/vendorsStore';

interface VendorCardProps {
  vendor: Vendor;
}

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

const typeLabels: Record<string, string> = {
  ambulant: 'Ambulante',
  store: 'Tienda',
  pharmacy: 'Farmacia',
  service: 'Servicio',
};

const enterpriseCategories = new Set([
  'garbage_collection', 'utility_delivery', 'telecom',
  'water_delivery', 'gas_delivery', 'municipal'
]);

const VendorCard = ({ vendor }: VendorCardProps) => {
  const { setSelectedVendor } = useVendorsStore();
  const isEnterprise = enterpriseCategories.has(vendor.category);

  return (
    <div
      onClick={() => setSelectedVendor(vendor)}
      className={`card-interactive group ${isEnterprise ? 'border-accent-500/10' : ''}`}
      id={`vendor-card-${vendor.id}`}
    >
      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        {vendor.avatar_url ? (
          <img
            src={vendor.avatar_url}
            alt={vendor.name}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 ring-1 ring-white/10 group-hover:ring-primary-500/30 transition-all"
          />
        ) : (
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl
            ${isEnterprise 
              ? 'bg-gradient-to-br from-accent-500/20 to-accent-600/10 ring-1 ring-accent-500/20' 
              : 'bg-gradient-to-br from-primary-500/20 to-primary-600/10 ring-1 ring-primary-500/20'
            }`}>
            {categoryIcons[vendor.category] || '📍'}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white/90 text-sm truncate group-hover:text-white transition-colors">
              {vendor.name}
            </h3>
            {vendor.is_verified && (
              <span className="flex-shrink-0 w-4 h-4 bg-primary-500/20 rounded-full flex items-center justify-center" title="Verificado">
                <span className="text-primary-400 text-[10px]">✓</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5 mb-2">
            <span className="text-xs text-white/40">
              {categoryLabels[vendor.category] || vendor.category}
            </span>
            <span className="text-white/15">•</span>
            <span className="text-xs text-white/30">{typeLabels[vendor.type]}</span>
            {isEnterprise && (
              <span className="badge-enterprise text-[10px] py-0.5 px-1.5 ml-1">
                <Building2 className="w-2.5 h-2.5" />
                Empresa
              </span>
            )}
          </div>

          {/* Rating */}
          {vendor.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-white/70">{vendor.rating}</span>
              <span className="text-[10px] text-white/25">({vendor.review_count})</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            {(vendor.whatsapp || vendor.phone) && (
              <div className="flex gap-1.5 mr-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const phone = (vendor.whatsapp || vendor.phone)!.replace(/\D/g, '');
                    window.open(`https://wa.me/${phone}?text=Hola,%20los%20vi%20en%20CercaYa`, '_blank');
                  }}
                  className="w-7 h-7 bg-green-500/10 text-green-400 rounded-lg flex items-center justify-center hover:bg-green-500/20 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
                {vendor.phone && (
                  <a
                    href={`tel:${vendor.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-7 h-7 bg-white/5 text-white/70 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                    title="Llamar"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Distance */}
            {vendor.distance_meters !== undefined && (
              <div className="flex items-center gap-1 text-xs text-white/35 ml-auto">
                <MapPin className="w-3 h-3" />
                <span>{Math.round(vendor.distance_meters)}m</span>
              </div>
            )}

            {/* Status */}
            <div className={vendor.location_active ? 'badge-active' : 'badge-inactive'}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                vendor.location_active ? 'bg-primary-400 animate-pulse' : 'bg-white/30'
              }`} />
              {vendor.location_active ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorCard;
