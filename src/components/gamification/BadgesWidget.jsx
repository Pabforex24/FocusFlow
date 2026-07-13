'use client'

import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'


export function BadgeCard({ badge, size = 'md' }: BadgeCardProps) {
  const unlocked = !!badge.unlockedAt

  if (size === 'sm') {
    return (
      <div
        title={badge.title + (unlocked ? '' : ' — Verrouillé')}
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all',
          unlocked ? 'bg-bg-3 border border-border-2' : 'bg-bg-3 border border-border opacity-30 grayscale'
        )}
      >
        {unlocked ? badge.icon : <Lock size={14} className="text-content-4" />}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all',
        unlocked
          ? 'bg-bg-3 border-border-2'
          : 'bg-bg-2 border-border opacity-50 grayscale'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0',
          unlocked ? 'bg-bg-4' : 'bg-bg-3'
        )}
      >
        {unlocked ? badge.icon : <Lock size={16} className="text-content-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-bold truncate', unlocked ? 'text-content' : 'text-content-3')}>
          {badge.title}
        </p>
        <p className="text-[10px] text-content-3 truncate">{badge.description}</p>
        {unlocked && badge.unlockedAt && (
          <p className="text-[10px] text-accent mt-0.5">
            ✓ {format(new Date(badge.unlockedAt), 'd MMM yyyy', { locale: fr })}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <span className="text-[10px] font-bold text-warning">+{badge.xpReward} XP</span>
      </div>
    </div>
  )
}

export function BadgesWidget({ limit = 6 }: { limit }) {
  const { badges } = useStore()
  const unlocked = badges.filter((b) => b.unlockedAt)
  const locked = badges.filter((b) => !b.unlockedAt)

  return (
    <div className="bg-bg-2 border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-sm uppercase tracking-widest text-content-2">
          Badges
        </h2>
        <span className="text-xs text-content-3">{unlocked.length}/{badges.length}</span>
      </div>

      {unlocked.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-4xl mb-2">🔒</p>
          <p className="text-xs text-content-3">Complète des tâches pour débloquer des badges</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...unlocked, ...locked].slice(0, limit).map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      )}
    </div>
  )
}
