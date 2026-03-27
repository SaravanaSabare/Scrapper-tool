interface SectionHeaderProps {
  title: string
  description?: string
}

export default function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-(--text-primary)">{title}</h2>
      {description && <p className="text-sm text-(--text-muted)">{description}</p>}
    </div>
  )
}
