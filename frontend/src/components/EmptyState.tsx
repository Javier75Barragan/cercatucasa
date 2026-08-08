import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  className?: string;
}

/**
 * Componente reutilizable de estado vacío (empty state).
 * Usado en RadarPanel, IncidentPanel y otros listados cuando no hay resultados.
 * Cumple mobile-first: área táctil adecuada, texto legible en pantallas pequeñas.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actions = [],
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-4 py-8 gap-3 ${className}`}
      role="status"
      aria-label={title}
    >
      {/* Ícono principal */}
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>

      {/* Título */}
      <p className="text-sm font-semibold text-white/90 leading-snug max-w-[220px]">
        {title}
      </p>

      {/* Descripción opcional */}
      {description && (
        <p className="text-xs text-white/60 leading-relaxed max-w-[240px]">
          {description}
        </p>
      )}

      {/* Acciones opcionales */}
      {actions.length > 0 && (
        <div className="flex flex-col gap-2 w-full max-w-[240px] mt-1">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`
                w-full py-2.5 px-4 rounded-xl text-xs font-semibold
                transition-all duration-200 active:scale-95
                min-h-[44px]
                ${
                  action.variant === 'secondary'
                    ? 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                    : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/25'
                }
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
