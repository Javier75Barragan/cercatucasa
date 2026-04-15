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

  const enterpriseCategories = new Set([
    'garbage_collection', 'utility_delivery', 'telecom',
    'water_delivery', 'gas_delivery', 'municipal'
  ]);

  // Split categories into regular and enterprise
  const regularCategories = categories.filter(c => !enterpriseCategories.has(c.id));
  const enterpriseCats = categories.filter(c => enterpriseCategories.has(c.id));

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
          <div className="border-t border-white/[0.06] p-4 space-y-5 animate-fade-in">
            {/* Radius */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Radio de búsqueda
                </label>
                <span className="text-sm font-bold text-primary-400">{localRadius}m</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={localRadius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                           [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full 
                           [&::-webkit-slider-thumb]:shadow-glow-sm [&::-webkit-slider-thumb]:cursor-grab"
                id="range-radius"
              />
              <div className="flex justify-between text-[10px] text-white/25 mt-1.5">
                <span>100m</span>
                <span>2km</span>
              </div>
            </div>

            {/* Regular Categories */}
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 block">
                Vendedores
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilters({ category: undefined })}
                  className={`pill ${!filters.category ? 'pill-active' : 'pill-inactive'}`}
                  id="filter-cat-all"
                >
                  Todos
                </button>
                {regularCategories.map((cat: Category) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilters({ category: cat.id })}
                    className={`pill flex items-center gap-1.5 ${
                      filters.category === cat.id ? 'pill-active' : 'pill-inactive'
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
                <label className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 block">
                  <span className="gradient-text-warm">Empresas y Servicios</span>
                  <Sparkles className="w-3.5 h-3.5 text-accent-500" />
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
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 block">
                Tipo
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
                      filters.type === type.id ? 'pill-active' : 'pill-inactive'
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
                className="w-full py-2.5 text-xs font-medium text-white/40 hover:text-white/70 border border-white/[0.06] rounded-xl hover:bg-white/5 transition-all"
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
