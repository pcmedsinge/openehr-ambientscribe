import { useNavigate } from 'react-router-dom'

interface Props {
  children: React.ReactNode
  breadcrumbs?: { label: string; to?: string }[]
  action?: React.ReactNode
}

function EKGIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      className="text-indigo-400">
      <polyline points="2 12 5 12 7 6 9 18 11 10 13 14 15 12 22 12" />
    </svg>
  )
}

export default function Layout({ children, breadcrumbs, action }: Props) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-[#080810] border-b border-white/[0.07] h-14 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
          >
            <EKGIcon />
            <span className="font-bold text-lg tracking-tight text-white">AmbientScribe</span>
          </button>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="text-slate-700 text-xs">/</span>
                  {b.to ? (
                    <button
                      onClick={() => navigate(b.to!)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {b.label}
                    </button>
                  ) : (
                    <span className="text-slate-300 font-medium">{b.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8">
        {action && (
          <div className="flex justify-end mb-6">{action}</div>
        )}
        {children}
      </main>
    </div>
  )
}
