type ToastVariant = 'success' | 'error' | 'info'

interface StatusToastProps {
  message?: string
  variant?: ToastVariant
  duration?: number
}

const variantStyles: Record<ToastVariant, { bar: string; icon: string; border: string }> = {
  success: {
    bar: 'bg-(--success)',
    icon: '✓',
    border: 'border-(--success)/30',
  },
  error: {
    bar: 'bg-(--danger)',
    icon: '✕',
    border: 'border-(--danger)/30',
  },
  info: {
    bar: 'bg-(--accent)',
    icon: 'i',
    border: 'border-(--accent)/30',
  },
}

export default function StatusToast({
  message,
  variant = 'success',
  duration = 3200,
}: StatusToastProps) {
  if (!message) return null

  const styles = variantStyles[variant]

  return (
    <div
      className="fixed bottom-6 right-6 z-50 animate-slide-up"
      role="status"
      aria-live="polite"
    >
      <div
        className={`relative overflow-hidden rounded-lg border bg-(--surface-elevated) shadow-(--shadow-card) ${styles.border}`}
        style={{ minWidth: '240px', maxWidth: '360px' }}
      >
        <div className="flex items-start gap-3 px-4 py-3">
          <span
            className={`font-mono-accent mt-px text-xs font-bold ${
              variant === 'success' ? 'text-(--success)' : variant === 'error' ? 'text-(--danger)' : 'text-(--accent)'
            }`}
            aria-hidden="true"
          >
            {styles.icon}
          </span>
          <p className="text-xs text-(--text-primary)">{message}</p>
        </div>
        {/* Progress bar */}
        <div
          className={`h-0.5 ${styles.bar} animate-progress-shrink`}
          style={{ animationDuration: `${duration}ms` }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
