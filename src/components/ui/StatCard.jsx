import { cn, hexToRgba } from '@/lib/utils'


export function StatCard({ label, value, sub, icon, color = '#d4a843', className }) {
  return (
    <div
      className={cn(
        'relative rounded-2xl p-4 overflow-hidden transition-all duration-300 group',
        className
      )}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget 
        el.style.background = 'rgba(255,255,255,0.04)'
        el.style.borderColor = hexToRgba(color, 0.2)
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget 
        el.style.background = 'rgba(255,255,255,0.025)'
        el.style.borderColor = 'rgba(255,255,255,0.07)'
      }}
    >
      {/* Top corner glow */}
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300"
        style={{ background: color, filter: 'blur(16px)' }}
      />

      {/* Icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 relative z-10"
        style={{
          background: hexToRgba(color, 0.1),
          border: `1px solid ${hexToRgba(color, 0.2)}`,
          color,
        }}
      >
        {icon}
      </div>

      {/* Value */}
      <div
        className="font-heading font-extrabold text-[28px] tracking-tight leading-none mb-1 relative z-10 tabular-nums"
        style={{ color: '#eeeef5' }}
      >
        {value}
      </div>

      {/* Label */}
      <div className="text-[10px] uppercase tracking-[0.15em] text-content-3 font-semibold relative z-10">
        {label}
      </div>

      {/* Sub */}
      {sub && (
        <div className="text-[11px] text-content-3 mt-1 relative z-10">{sub}</div>
      )}
    </div>
  )
}
