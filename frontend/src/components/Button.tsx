interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'ai'
  size?: 'sm' | 'md'
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  className = '',
  ...rest
}: Props) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#07070f] ' +
    'disabled:opacity-40 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500/50',
    secondary: 'border border-white/[0.12] text-slate-300 hover:bg-white/[0.06] hover:text-slate-100 hover:border-white/[0.20] focus:ring-white/20',
    ghost:     'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] focus:ring-white/20',
    ai:        'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white focus:ring-indigo-500/50',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
}
