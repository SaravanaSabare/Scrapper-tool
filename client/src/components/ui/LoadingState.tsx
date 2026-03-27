interface LoadingStateProps {
  label?: string
}

export default function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <div
      className="flex items-center gap-2.5 font-mono-accent text-xs text-(--text-faint)"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-(--border) border-t-(--accent)"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  )
}
