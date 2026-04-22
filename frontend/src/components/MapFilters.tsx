import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { useVendorsStore } from '../stores/vendorsStore';
import { vendorsApi } from '../services/api';
import { Category } from '../types';

const MapFilters = () => {
  const { filters, setFilters, categories, setCategories } = useVendorsStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localRadius, setLocalRadius] = useState(filters.radius);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await vendorsApi.getCategories();
        setCategories(response.data.data || []);
      } catch (error) {
        console.error('Error cargando categorías:', error);
      }
    };

    if (categories.length === 0) {
      loadCategories();
    }
  }, [categories.length, setCategories]);

  const handleRadiusChange = (value: number) => {
    setLocalRadius(value);
    setFilters({ radius: value });
  };

  const clearFilters = () => {
    setFilters({ category: undefined, type: undefined, radius: 500 });
    setLocalRadius(500);
  };

  const enterpriseIds = [
    'garbage_collection', 'utility_delivery', 'telecom',
    'water_delivery', 'gas_delivery', 'municipal', 'gas_domiciliario', 'servicios_municipales'
  ];

  // Split categories into regular and enterprise
  const regularCategories = categories.filter(c => !enterpriseIds.includes(c.id));
  const enterpriseCats = categories.filter(c => enterpriseIds.includes(c.id));

  return (
    <div className="absolute top-3 left-3 right-3 z-[400] md:left-4 md:right-auto md:max-w-sm">
      <div className="glass rounded-2xl overflow-hidden shadow-dark-lg">
        {/* Search bar */}
        <div className="flex items-center gap-2 p-2.5">
          <div className="flex-1 flex items-center gap-2.5 bg-dark-950/60 rounded-xl px-3.5 py-2.5 border border-white/[0.06] focus-within:border-primary-500/30 transition-colors">
            <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar vendedores, empresas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white/90 text-sm placeholder-white/25"
              id="search-input"
            />
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2.5 rounded-xl transition-all duration-200 flex-shrink-0 ${
              isExpanded 
                ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30' 
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
            }`}
            id="btn-toggle-filters"
          >
            {isExpanded ? <X className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
          </button>
        </div>

        {/* Expandable filters */}
        {isExpanded && (
          <div className="border-t border-white/[0.06] p-4 space-y-5 animate-fade-in max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pb-8">
            {/* Radius */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: '#ffa520' }}>
                  <span>Radio de búsqueda</span>
                  <div className="h-1 flex-1 bg-[#ffa520]/10 rounded-full hidden md:block"></div>
                </label>
                <span className="text-sm font-black bg-[#ffa520]/10 px-2 py-0.5 rounded-md" style={{ color: '#ffa520' }}>{localRadius}m</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={localRadius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="w-full h-2.5 bg-white/20 rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                           [&::-webkit-slider-thumb]:bg-[#f98307] [&::-webkit-slider-thumb]:rounded-full 
                           [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(249,131,7,0.8)] [&::-webkit-slider-thumb]:cursor-grab
                           [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                id="range-radius"
              />
              <div className="flex justify-between text-[10px] text-white/25 mt-1.5">
                <span>100m</span>
                <span>2km</span>
              </div>
            </div>

            {/* Regular Categories */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#ffa520' }}>
                <span>Vendedores</span>
                <div className="h-1 flex-1 bg-[#ffa520]/10 rounded-full"></div>
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilters({ category: undefined })}
                  className={`pill ${!filters.category ? 'bg-accent-500 text-white shadow-glow-sm' : 'pill-inactive'}`}
                  id="filter-cat-all"
                >
                  Todos
                </button>
                {regularCategories.map((cat: Category) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilters({ category: cat.id })}
                    className={`pill flex items-center gap-1.5 ${
                      filters.category === cat.id 
                        ? 'bg-accent-500 text-white shadow-glow-sm scale-105' 
                        : 'pill-inactive'
                    }`}
                    id={`filter-cat-${cat.id}`}
                  >
                    <span className="text-xs">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Enterprise Categories */}
            {enterpriseCats.length > 0 && (
              <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="gradient-text-warm">Empresas y Servicios</span>
                <Sparkles className="w-3.5 h-3.5 text-accent-400" />
                <div className="h-1 flex-1 bg-accent-400/10 rounded-full"></div>
              </label>
                <div className="flex flex-wrap gap-1.5">
                  {enterpriseCats.map((cat: Category) => (
                    <button
                      key={cat.id}
                      onClick={() => setFilters({ category: cat.id })}
                      className={`pill flex items-center gap-1.5 ${
                        filters.category === cat.id 
                          ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md shadow-accent-500/25' 
                          : 'pill-inactive border border-accent-500/10'
                      }`}
                      id={`filter-cat-${cat.id}`}
                    >
                      <span className="text-xs">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Type */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: '#ffa520' }}>
                <span>Tipo de Local</span>
                <div className="h-1 flex-1 bg-[#ffa520]/10 rounded-full"></div>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'ambulant', label: 'Ambulantes', icon: '🚶' },
                  { id: 'store', label: 'Tiendas', icon: '🏪' },
                  { id: 'pharmacy', label: 'Farmacias', icon: '💊' },
                  { id: 'service', label: 'Servicios', icon: '⚡' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() =>
                      setFilters({ type: filters.type === type.id ? undefined : type.id })
                    }
                    className={`pill flex items-center gap-1.5 ${
                      filters.type === type.id 
                        ? 'bg-accent-500 text-white shadow-glow-sm scale-105' 
                        : 'pill-inactive'
                    }`}
                    id={`filter-type-${type.id}`}
                  >
                    <span className="text-xs">{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {(filters.category || filters.type || filters.radius !== 500) && (
              <button
                onClick={clearFilters}
                className="w-full py-3 text-xs font-bold text-accent-400 hover:text-accent-300 border border-accent-400/20 rounded-xl hover:bg-accent-400/5 transition-all uppercase tracking-widest"
                id="btn-clear-filters"
              >
                ✕ Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapFilters;
