/**
 * Componente Button reutilizable con estilo Azure Clean
 */

const variants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white border-transparent',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300',
  success: 'bg-green-500 hover:bg-green-600 text-white border-transparent',
  danger: 'bg-red-500 hover:bg-red-600 text-white border-transparent',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 border-transparent',
  outline: 'bg-transparent hover:bg-slate-50 text-slate-700 border-slate-300',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  ...props
}) => (
  <button
    className={`
      inline-flex items-center justify-center gap-2
      font-medium rounded-lg border
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}
    disabled={disabled || loading}
    {...props}
  >
    {loading && (
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    )}
    {children}
  </button>
);

export const IconButton = ({ icon: Icon, className = '', ...props }) => (
  <button
    className={`
      p-2 rounded-lg
      text-slate-600 hover:text-slate-900
      hover:bg-slate-100
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `}
    {...props}
  >
    <Icon className="w-5 h-5" />
  </button>
);
