import { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MapPin, Power, Store, Package, X, Clock, Signal, Edit3, Heart, Eye, Loader2, AlertTriangle, Bell, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useGeolocation } from '../hooks/useGeolocation';
import { useSocket } from '../hooks/useSocket';
import { vendorsApi } from '../services/api';
import { Vendor, Category, Incident } from '../types';
import ImageUploader from '../components/ImageUploader';

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const VENDOR_TYPES = [
  { id: 'ambulant', label: 'Vendedor Ambulante', icon: '🚶' },
  { id: 'store', label: 'Tienda Física', icon: '🏪' },
  { id: 'pharmacy', label: 'Farmacia', icon: '💊' },
  { id: 'service', label: 'Servicio a Domicilio', icon: '⚡' },
];

const VendorDashboard = () => {
  const { user, location, setLocation } = useAuthStore();
  const { location: geoLocation } = useGeolocation();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  // Estado de alertas de incidentes en tiempo real
  const [incidentAlerts, setIncidentAlerts] = useState<Incident[]>([]);
  const [showIncidentPanel, setShowIncidentPanel] = useState(false);

  const handleIncidentAlert = useCallback((incident: Incident) => {
    setIncidentAlerts(prev => [incident, ...prev].slice(0, 10));
    setShowIncidentPanel(true);
  }, []);

  const { updateLocation, toggleVisibility, joinVendorRoom, isConnected } = useSocket(handleIncidentAlert);
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: '',
    phone: '',
    whatsapp: '',
    description: '',
    email: '',
    website: '',
    address: '',
    avatar_url: '',
    photos: [] as string[],
    subcategories: [] as string[],
    schedule: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '18:00' },
      saturday: { open: '08:00', close: '14:00' },
      sunday: null,
    } as Record<string, { open: string; close: string } | null>,
  });

  const [stats] = useState({
    views: 124, // Mock stats for display
    contacts: 18,
    rating: 4.8,
    favorites: 32
  });

  useEffect(() => {
    loadCategories();
    loadVendor();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await vendorsApi.getCategories();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  useEffect(() => {
    if (geoLocation) {
      setLocation(geoLocation);
    }
  }, [geoLocation, setLocation]);

  const loadVendor = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await vendorsApi.getMe();
      if (response.data.success && response.data.data) {
        const vendorData = response.data.data;
        setVendor(vendorData);
        setIsActive(!!vendorData.online_status);
        // Unirse a la sala personal del vendedor para recibir alertas de incidentes
        joinVendorRoom(vendorData.id);
      }
    } catch (error) {
      console.error('Error cargando vendor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!vendor) return;
    
    if (!location) {
      alert('Necesitamos acceso a tu ubicación GPS para poder transmitirte a los clientes cercanos. Por favor, actívala en tu navegador.');
      return;
    }

    setIsLoading(true);
    try {
      const newState = !isActive;
      await toggleVisibility(vendor.id, newState);

      if (newState) {
        await updateLocation(vendor.id, location.lat, location.lng);
      }

      setIsActive(newState);
    } catch (error) {
      console.error('Error toggling visibility:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!vendor || !location) return;

    setIsLoading(true);
    try {
      await updateLocation(vendor.id, location.lat, location.lng);
    } catch (error) {
      console.error('Error updating location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name || !formData.type || !formData.category || !formData.phone) {
      setFormError('Por favor completa todos los campos requeridos');
      return;
    }

    // Verificar ubicación
    if (!location) {
      setFormError('Necesitamos tu ubicación para registrar el negocio. Activa el GPS e intenta de nuevo.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await vendorsApi.create({
        ...formData,
        type: formData.type as 'store' | 'ambulant' | 'pharmacy' | 'service',
        schedule: formData.schedule as any,
        latitude: location.lat,
        longitude: location.lng,
        accuracy: 10,
      });

      if (response.data.success) {
        setVendor(response.data.data);
        setIsModalOpen(false);
        
        // Actualizar el rol del usuario y el token en el store si se recibió uno nuevo
        const { updateUser, setToken } = useAuthStore.getState();
        updateUser({ role: 'seller' });
        
        if (response.data.token) {
          setToken(response.data.token);
        }
      } else {
        setFormError(response.data.error || 'Error al crear el negocio');
      }
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      setFormError(error.response?.data?.error || 'Error al crear el negocio. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: prev.schedule[day] ? null : { open: '08:00', close: '18:00' },
      },
    }));
  };

  const updateScheduleTime = (day: string, field: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: prev.schedule[day] ? { ...prev.schedule[day], [field]: value } : null,
      },
    }));
  };

  // State if no vendor is created
  if (!vendor) {
    return (
      <div className="min-h-screen pt-16 bg-surface-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary-500/5 rounded-full blur-[120px]"></div>
        
        <div className="max-w-xl w-full glass rounded-[32px] p-10 text-center animate-scale-in">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 ring-1 ring-primary-500/30">
            <Store className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="text-3xl font-extrabold mb-4 tracking-tight">Potencia tu Negocio</h1>
          <p className="text-white/40 mb-10 leading-relaxed">
            Aún no has configurado tu perfil de vendedor. Actívalo hoy mismo y empieza a aparecer en el radar de miles de clientes cerca de ti.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary w-full h-14 text-lg shadow-glow-sm"
          >
            Configurar mi Negocio Ahora
          </button>
        </div>

        {/* Modal Premium Creation */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface-950 w-full max-w-2xl md:rounded-[32px] rounded-t-[32px] border-t md:border border-white/10 shadow-dark-lg max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
              <div className="p-8 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Crear Perfil Pro</h2>
                  <p className="text-sm text-white/30 mt-1">Llévanos a donde tus clientes están.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 glass rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {formError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-medium text-center">
                    {formError}
                  </div>
                )}

                {/* Section 1 */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-primary-500 rounded-full"></div>
                    <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Identidad Visual</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5 mb-4">
                    <ImageUploader 
                      label="Logo / Avatar" 
                      onUploadSuccess={(url) => handleInputChange('avatar_url', url)}
                    />
                    <ImageUploader 
                      label="Foto Portada" 
                      onUploadSuccess={(url) => {
                        setFormData(prev => ({ ...prev, photos: [url] }));
                      }}
                      aspectRatio="video"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">Nombre Comercial</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ej: Panadería Artesanal"
                      className="input-glass"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">Tipo de Operación</label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="input-glass appearance-none"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {VENDOR_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">Categoría Principal</label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="input-glass appearance-none"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-accent-500 rounded-full"></div>
                    <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Contacto Directo</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">Teléfono</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="300 123 4567"
                        className="input-glass"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">WhatsApp</label>
                      <input
                        type="tel"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        placeholder="Mismo o diferente"
                        className="input-glass"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Schedule */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-white/40 rounded-full"></div>
                    <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Disponibilidad Semanal</h3>
                  </div>
                  
                  <div className="grid gap-3">
                    {DAYS.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.schedule[key] !== null}
                            onChange={() => toggleDay(key)}
                            className="w-4 h-4 rounded ring-offset-surface-950 bg-white/5 border-white/10 text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-white/70">{label}</span>
                        </label>
                        {formData.schedule[key] && (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={formData.schedule[key]?.open}
                              onChange={(e) => updateScheduleTime(key, 'open', e.target.value)}
                              className="bg-surface-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                            />
                            <span className="text-white/20">-</span>
                            <input
                              type="time"
                              value={formData.schedule[key]?.close}
                              onChange={(e) => updateScheduleTime(key, 'close', e.target.value)}
                              className="bg-surface-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 pb-2">
                  <button type="submit" disabled={isLoading} className="btn-primary w-full h-14 text-base">
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Lanzar mi Negocio'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard View (Simplified Premium Version)
  return (
    <div className="min-h-screen pt-16 bg-surface-950 text-white relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary-500/10 to-transparent"></div>
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-10 z-10">
        {/* Header Dashboard */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in px-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
               <div className="badge-active bg-primary-500/10 border-primary-500/30">
                  <Signal className="w-2.5 h-2.5 text-primary-400 animate-pulse" />
                  <span className="text-primary-400 font-bold tracking-widest text-[9px] uppercase">Radar Pro</span>
               </div>
               <div className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${isConnected ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                 {isConnected ? 'ONLINE' : 'OFFLINE'}
               </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter">Panel de <span className="gradient-text">Control</span></h1>
            <p className="text-white/40 text-sm font-medium">{vendor.name}</p>
          </div>
          
          <div className="flex gap-3">
             <button
                onClick={handleToggleActive}
                disabled={isLoading || !isConnected}
                className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all duration-300 transform active:scale-95 shadow-2xl ${
                  isActive 
                  ? 'bg-red-500 text-white shadow-red-500/20' 
                  : 'bg-primary-500 text-white shadow-glow-sm hover:shadow-glow-md'
                }`}
             >
                <Power className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                {isActive ? 'DETENER SEÑAL' : 'TRANSMITIR AHORA'}
             </button>
             
             {location && isActive && (
               <button
                 onClick={handleUpdateLocation}
                 className="p-4 glass hover:bg-white/10 rounded-2xl text-white transition-all border border-white/10 active:rotate-180 duration-500"
               >
                 <MapPin size={22} />
               </button>
             )}

             {/* Botón de alertas de incidentes */}
             <button
               onClick={() => setShowIncidentPanel(prev => !prev)}
               className={`relative p-4 rounded-2xl border transition-all ${
                 incidentAlerts.length > 0
                   ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                   : 'glass border-white/10 text-white/60 hover:text-white'
               }`}
             >
               <Bell size={22} />
               {incidentAlerts.length > 0 && (
                 <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                   {incidentAlerts.length}
                 </span>
               )}
             </button>
          </div>
        </div>

        {/* Stats Grid - Optimized for Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-slide-up px-2">
           {[
             { label: 'Visitas', val: stats.views, icon: Eye, color: 'text-blue-400', bg: 'bg-blue-400/10' },
             { label: 'Contactos', val: stats.contacts, icon: MessageCircle, color: 'text-primary-400', bg: 'bg-primary-400/10' },
             { label: 'Rating', val: stats.rating, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
             { label: 'Favoritos', val: stats.favorites, icon: Heart, color: 'text-red-400', bg: 'bg-red-400/10' },
           ].map((s, i) => (
             <div key={i} className="glass p-4 md:p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 ${s.bg} rounded-bl-full opacity-30 flex items-center justify-center pt-1 pl-1`}>
                   <s.icon className={`w-4 h-4 md:w-5 md:h-5 ${s.color}`} />
                </div>
                <p className="text-2xl md:text-3xl font-black text-white">{s.val}</p>
                <p className="text-[9px] md:text-[10px] uppercase font-bold text-white/30 tracking-widest mt-0.5">{s.label}</p>
             </div>
           ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Products & Events */}
           <div className="lg:col-span-2 space-y-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="glass rounded-[32px] p-8 border border-white/5">
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                       <Package className="text-primary-400" />
                       Catálogo Premium
                    </h2>
                    <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all">
                       + Agregar Item
                    </button>
                 </div>
                 
                 <div className="flex flex-col items-center justify-center py-16 opacity-30 border-2 border-dashed border-white/5 rounded-3xl">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                       <Package size={32} />
                    </div>
                    <p className="text-sm font-medium">No has publicado productos aún.</p>
                    <p className="text-xs mt-1">Los productos ayudan a los clientes a encontrarte más rápido.</p>
                 </div>
              </div>
           </div>

           {/* Sidebar Info */}
           <div className="space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {/* Profile Card */}
              <div className="glass rounded-[32px] overflow-hidden border border-white/5">
                 <div className="h-24 bg-gradient-to-r from-primary-600/30 to-primary-900/40 relative">
                    <div className="absolute -bottom-6 left-6 w-20 h-20 bg-surface-900 rounded-2xl ring-4 ring-surface-950 p-1">
                       {vendor.avatar_url ? (
                         <img src={vendor.avatar_url} className="w-full h-full object-cover rounded-xl" />
                       ) : (
                         <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center text-3xl">
                           {VENDOR_TYPES.find(t => t.id === vendor.type)?.icon || '🏢'}
                         </div>
                       )}
                    </div>
                 </div>
                 <div className="p-8 pt-10">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="font-bold text-xl">{vendor.name}</h3>
                       <button className="text-primary-400 hover:text-white transition-colors cursor-pointer">
                          <Edit3 size={16} />
                       </button>
                    </div>
                    <p className="text-xs text-white/40 mb-6 leading-relaxed">
                       {vendor.description || 'Sin descripción configurada. Actualiza tu perfil para que tus clientes te conozcan mejor.'}
                    </p>
                    
                    <div className="space-y-4 pt-4 border-t border-white/[0.06]">
                        <div className="flex items-center gap-3 text-xs text-white/50">
                           <Clock size={14} className="text-primary-500/60" />
                           <span>Cierra hoy a las 18:00</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/50">
                           <MapPin size={14} className="text-primary-500/60" />
                           <span className="truncate">{vendor.address || 'Ubicación dinámica'}</span>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Quick actions/links */}
              <div className="glass-accent rounded-[32px] p-6 border border-primary-500/10">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400 mb-4">Tips de Visibilidad</h4>
                 <div className="space-y-4">
                     <p className="text-[11px] text-white/60 leading-tight">
                        &bull; Mantén tu aplicación abierta para que el GPS se actualice con tu movimiento real.
                     </p>
                     <p className="text-[11px] text-white/60 leading-tight">
                        &bull; Sube fotos de tus mejores productos hoy. Las fotos aumentan los clics en un 40%.
                     </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Panel de Alertas de Incidentes en Tiempo Real */}
      {showIncidentPanel && (
        <div className="fixed inset-0 z-[900] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-950 w-full max-w-lg md:rounded-[32px] rounded-t-[32px] border-t md:border border-white/10 shadow-dark-lg max-h-[80vh] overflow-hidden flex flex-col animate-slide-up">
            {/* Header */}
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-red-500/5">
              <div>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-white">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  Alertas de Incidentes
                </h2>
                <p className="text-xs text-white/40 mt-1">
                  {incidentAlerts.length} alerta{incidentAlerts.length !== 1 ? 's' : ''} cerca de tu ubicación
                </p>
              </div>
              <div className="flex items-center gap-2">
                {incidentAlerts.length > 0 && (
                  <button
                    onClick={() => setIncidentAlerts([])}
                    className="px-3 py-1.5 text-[10px] font-bold text-white/40 hover:text-white border border-white/10 rounded-lg transition-all"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  onClick={() => setShowIncidentPanel(false)}
                  className="w-10 h-10 glass rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Lista de incidentes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {incidentAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-green-500/20">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-white/80 font-semibold mb-1">Todo Tranquilo</h3>
                  <p className="text-white/40 text-sm">No hay incidentes reportados cerca de ti.</p>
                </div>
              ) : (
                incidentAlerts.map((incident, idx) => {
                  const typeIcons: Record<string, string> = {
                    accident: '🚗', medical: '🚑', fire: '🔥',
                    police: '👮', road_block: '🚧', fallen_tree: '🌳',
                    flood: '🌊', other: '⚠️',
                  };
                  const typeNames: Record<string, string> = {
                    accident: 'Accidente de Tránsito', medical: 'Emergencia Médica',
                    fire: 'Incendio', police: 'Incidente de Seguridad',
                    road_block: 'Bloqueo de Vía', fallen_tree: 'Árbol Caído',
                    flood: 'Inundación', other: 'Otro',
                  };
                  return (
                    <div key={incident.id || idx} className="p-4 bg-red-500/5 border border-red-500/15 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-red-500/10 flex-shrink-0">
                          {typeIcons[incident.type] || '⚠️'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white text-sm">{typeNames[incident.type] || 'Incidente'}</h4>
                            <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-md text-[9px] font-bold text-red-400 uppercase">
                              🚨 Nuevo
                            </span>
                          </div>
                          <p className="text-xs text-white/60">Reportado por: <span className="text-white/80 font-medium">{incident.name}</span></p>
                          {incident.description && (
                            <p className="text-xs text-white/50 mt-1 line-clamp-2">{incident.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            {incident.distance_meters !== undefined && (
                              <span className="text-[10px] text-white/30">
                                📍 {Math.round(incident.distance_meters)}m de distancia
                              </span>
                            )}
                            <span className="text-[10px] text-white/30">
                              {new Date(incident.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Internal icon for contacts
const MessageCircle = ({ className, size }: { className?: string, size?: number }) => (
  <svg viewBox="0 0 24 24" width={size || 24} height={size || 24} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

// Internal icon for star
const Star = ({ className, size }: { className?: string, size?: number }) => (
  <svg viewBox="0 0 24 24" width={size || 22} height={size || 22} fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default VendorDashboard;
