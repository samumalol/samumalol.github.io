import type { ReactNode } from 'react'

type LayoutProps = {
  sidebar: ReactNode
  children: ReactNode
}

export function Layout({ sidebar, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)]">
        {sidebar}
        <section className="flex min-h-[70vh] flex-col overflow-hidden border-l border-stone-200 bg-white shadow-2xl shadow-stone-300/40">
          {children}
        </section>
      </div>
    </div>
  )
}
