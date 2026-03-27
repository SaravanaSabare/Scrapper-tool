import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  id: string
}

export default function PageContainer({ children, id }: PageContainerProps) {
  return (
    <section id={id} className="space-y-6" role="tabpanel">
      {children}
    </section>
  )
}
