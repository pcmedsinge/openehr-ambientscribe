import { useNavigate } from 'react-router-dom'

interface Props {
  children: React.ReactNode
  breadcrumbs?: { label: string; to?: string }[]
  action?: React.ReactNode
}

export default function Layout({ children, breadcrumbs, action }: Props) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top nav */}
      <nav className="bg-slate-900 text-white px-6 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="font-bold text-lg tracking-tight hover:text-blue-300 transition-colors"
          >
            AmbientScribe
          </button>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              {breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="text-slate-600">/</span>
                  {b.to ? (
                    <button
                      onClick={() => navigate(b.to!)}
                      className="hover:text-white transition-colors"
                    >
                      {b.label}
                    </button>
                  ) : (
                    <span className="text-white">{b.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-sm text-slate-400">AmbientScribe Clinic</div>
      </nav>

      {/* Page content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {action && (
          <div className="flex justify-end mb-6">{action}</div>
        )}
        {children}
      </main>
    </div>
  )
}
