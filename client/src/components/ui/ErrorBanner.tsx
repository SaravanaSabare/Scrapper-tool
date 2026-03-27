interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      className="mx-auto mt-4 max-w-6xl px-6 sm:px-10 lg:px-14"
      role="alert"
    >
      <div className="flex items-start justify-between gap-4 rounded-lg border border-(--danger)/30 bg-(--danger)/8 px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="font-mono-accent mt-px shrink-0 text-xs text-(--danger)" aria-hidden="true">
            ✕
          </span>
          <div className="min-w-0">
            <p className="font-mono-accent text-xs font-semibold text-(--danger)">Error</p>
            <p className="mt-0.5 text-xs text-(--text-muted)">{message}</p>
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            className="shrink-0 rounded-md border border-(--danger)/30 px-3 py-1 font-mono-accent text-xs text-(--danger) transition-colors duration-150 hover:bg-(--danger)/10"
            onClick={onRetry}
          >
            retry
          </button>
        )}
      </div>
    </div>
  )
}
