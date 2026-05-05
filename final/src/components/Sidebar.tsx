import type { ReactNode } from 'react'

export function Sidebar({ children }: { children: ReactNode }) {
  return (
    <aside className="flex min-h-screen flex-col gap-4 border-stone-200 bg-[#f8f7f3] p-4 xl:border-r xl:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Workspace</p>
        <h2 className="mt-2 text-xl font-semibold text-stone-950">Tasks and focus timer</h2>
      </div>
      {children}
    </aside>
  )
}
