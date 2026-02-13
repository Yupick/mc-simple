/**
 * Componente Card reutilizable con estilo Azure Clean
 */

export const Card = ({ children, className = '', hover = false, ...props }) => (
  <div
    className={`
      bg-white rounded-xl border border-slate-200 shadow-card
      ${hover ? 'hover:shadow-card-hover transition-shadow duration-300' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 border-b border-slate-200 ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-text-primary ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-text-secondary mt-1 ${className}`} {...props}>
    {children}
  </p>
);
