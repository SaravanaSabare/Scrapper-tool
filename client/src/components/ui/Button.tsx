import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-1 focus-visible:ring-offset-(--surface) disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.97]'

const variants = {
  primary:
    'bg-(--accent) text-white px-4 py-2 shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_4px_12px_var(--accent-glow)] hover:bg-(--accent-strong)',
  secondary:
    'border border-(--border) bg-transparent text-(--text-primary) px-4 py-2 hover:border-(--accent) hover:text-(--accent)',
  ghost:
    'bg-transparent text-(--text-muted) px-3 py-2 hover:bg-(--surface-elevated) hover:text-(--text-primary)',
}

export default function Button({
  children,
  variant = 'secondary',
  loading = false,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`${base} ${variants[variant]}`}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
