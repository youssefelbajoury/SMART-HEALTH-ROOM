import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-800 day:bg-slate-100 day:border-slate-200 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-500" />
      </div>
      <p className="text-slate-300 day:text-slate-600 font-medium">{title}</p>
      {description && <p className="text-slate-500 text-sm mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({ title = "An error occurred", description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <span className="text-red-400 text-2xl">!</span>
      </div>
      <p className="text-slate-200 font-medium">{title}</p>
      {description && <p className="text-slate-500 text-sm mt-1 max-w-sm">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}
