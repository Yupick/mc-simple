/**
 * Componente Badge reutilizable con estilo Azure Clean
 */

const variants = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-primary-100 text-primary-700 border-primary-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
};

export const Badge = ({
  children,
  variant = 'default',
  className = '',
  dot = false,
  ...props
}) => (
  <span
    className={`
      inline-flex items-center gap-1.5
      px-2.5 py-0.5 rounded-full
      text-xs font-medium border
      ${variants[variant]}
      ${className}
    `}
    {...props}
  >
    {dot && (
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
    )}
    {children}
  </span>
);
