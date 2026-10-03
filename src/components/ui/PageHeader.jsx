export function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted first-letter:uppercase">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  )
}

export default PageHeader
