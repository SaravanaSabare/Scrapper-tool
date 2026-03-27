interface EmptyStateProps {
  title: string
  description: string
  icon?: string
}

export default function EmptyState({ title, description, icon = '◌' }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-(--border) bg-(--surface) px-8 py-16 text-center"
      role="status"
    >
      <span
        className="font-mono-accent text-4xl text-(--text-faint)"
        aria-hidden="true"
      >
        {icon}
      </span>
      <h3 className="mt-4 font-mono-accent text-sm font-semibold text-(--text-muted)">{title}</h3>
      <p className="mt-1.5 max-w-xs text-xs text-(--text-faint)">{description}</p>
    </div>
  )
}
