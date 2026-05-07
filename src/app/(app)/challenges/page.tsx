'use client'

import { useState } from 'react'
import { CHALLENGE_CATALOGUE } from '@/store'
import { useStore } from '@/store'
import { Challenge } from '@/types'
import { ChallengeCard } from '@/components/challenge/ChallengeCard'
import { ChallengeStartModal } from '@/components/challenge/ChallengeStartModal'
import { ChallengeEditModal } from '@/components/challenge/ChallengeEditModal'
import { PageHeader } from '@/components/layout/PageHeader'
import { Zap, CheckCircle2, Plus, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export default function ChallengesPage() {
  const {
    activeChallenges, getChallengeProgress, stopChallenge,
    customChallenges, deleteCustomChallenge,
    deleteCatalogueChallenge, deletedCatalogueIds,
  } = useStore()
  const { toast } = useToast()

  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [editingChallenge,  setEditingChallenge]  = useState<Challenge | null | undefined>(undefined)
  const [showCreateModal,   setShowCreateModal]   = useState(false)

  // IDs des challenges actuellement actifs
  const activeIds = new Set(
    activeChallenges.filter((ac) => ac.isActive).map((ac) => ac.challengeId)
  )

  const completedCount = activeChallenges.filter((ac) => {
    const prog = getChallengeProgress(ac.id, ac.challengeId)
    return prog === 100
  }).length

  const allChallenges = [...CHALLENGE_CATALOGUE, ...(customChallenges || [])]

  const hiddenCatalogueIds = new Set(deletedCatalogueIds || [])

  const handleDeleteCatalogue = (id: string) => {
    if (!confirm('Masquer ce challenge du catalogue ?')) return
    deleteCatalogueChallenge(id)
    toast('Challenge masqué', 'info')
  }

  const handleDeleteCustom = (id: string) => {
    if (!confirm('Supprimer ce challenge ? Les tâches en cours seront conservées.')) return
    deleteCustomChallenge(id)
    toast('Challenge supprimé', 'info')
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto page-enter pb-24 md:pb-8">

      {/* Header + Créer */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <PageHeader
          title="Challenges"
          subtitle="Lance-toi des défis. Les tâches se génèrent automatiquement jusqu'à l'échéance."
        />
        <button
          onClick={() => { setEditingChallenge(null); setShowCreateModal(true) }}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border mt-1"
          style={{
            background: 'rgba(123,97,255,0.12)',
            borderColor: 'rgba(123,97,255,0.35)',
            color: '#7B61FF',
            boxShadow: '0 0 16px rgba(123,97,255,0.18)',
          }}
        >
          <Plus size={15} />
          Créer
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <div className="flex items-center gap-2 bg-bg-3 border border-border-2 rounded-xl px-4 py-2.5">
          <Zap size={14} className="text-yellow-400" />
          <span className="text-sm font-semibold text-content">
            {activeChallenges.filter((ac) => ac.isActive).length} actif(s)
          </span>
        </div>
        <div className="flex items-center gap-2 bg-bg-3 border border-border-2 rounded-xl px-4 py-2.5">
          <CheckCircle2 size={14} className="text-green-400" />
          <span className="text-sm font-semibold text-content">
            {completedCount} terminé(s)
          </span>
        </div>
      </div>

      {/* En cours */}
      {activeChallenges.filter((ac) => ac.isActive).length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading font-bold text-xs uppercase tracking-widest text-content-3 mb-3">
            🔥 En cours
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {activeChallenges.filter((ac) => ac.isActive).map((ac) => {
              const challenge = allChallenges.find((c) => c.id === ac.challengeId)
              if (!challenge) return null
              return (
                <ChallengeCard
                  key={ac.id}
                  challenge={challenge}
                  activeChallenge={ac}
                  progress={getChallengeProgress(ac.id, ac.challengeId)}
                  onStart={() => setSelectedChallenge(challenge)}
                  onStop={() => stopChallenge(ac.id)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Mes challenges (custom) */}
      {(customChallenges || []).filter((c) => !activeIds.has(c.id)).length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading font-bold text-xs uppercase tracking-widest text-content-3 mb-3">
            ✨ Mes challenges
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {(customChallenges || []).filter((c) => !activeIds.has(c.id)).map((challenge) => {
              const pastAc = activeChallenges.find((ac) => ac.challengeId === challenge.id && !ac.isActive)
              return (
                <div key={challenge.id} className="relative group">
                  <ChallengeCard
                    challenge={challenge}
                    activeChallenge={pastAc}
                    progress={pastAc ? getChallengeProgress(pastAc.id, challenge.id) : 0}
                    onStart={() => setSelectedChallenge(challenge)}
                    onStop={() => pastAc && stopChallenge(pastAc.id)}
                  />
                  <div className="absolute top-10 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => setEditingChallenge(challenge)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-4 border border-border-2 text-content-3 hover:text-accent hover:border-accent/40 transition-all"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => handleDeleteCustom(challenge.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-4 border border-border-2 text-content-3 hover:text-danger hover:border-danger/40 transition-all"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Catalogue suggéré — modifiable et supprimable */}
      <div>
        <h2 className="font-heading font-bold text-xs uppercase tracking-widest text-content-3 mb-1">
          📚 Catalogue
        </h2>
        <p className="text-[11px] text-content-3 mb-3">
          Ces challenges suggérés peuvent être modifiés ou supprimés.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {CHALLENGE_CATALOGUE.filter((c) => !activeIds.has(c.id) && !hiddenCatalogueIds.has(c.id)).map((challenge) => {
            const pastAc = activeChallenges.find((ac) => ac.challengeId === challenge.id && !ac.isActive)
            return (
              <div key={challenge.id} className="relative group">
                <ChallengeCard
                  challenge={challenge}
                  activeChallenge={pastAc}
                  progress={pastAc ? getChallengeProgress(pastAc.id, challenge.id) : 0}
                  onStart={() => setSelectedChallenge(challenge)}
                  onStop={() => pastAc && stopChallenge(pastAc.id)}
                />
                {/* Actions sur catalogue */}
                <div className="absolute top-10 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => setEditingChallenge(challenge)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-4 border border-border-2 text-content-3 hover:text-accent hover:border-accent/40 transition-all"
                    title="Modifier"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() => handleDeleteCatalogue(challenge.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-4 border border-border-2 text-content-3 hover:text-danger hover:border-danger/40 transition-all"
                    title="Masquer du catalogue"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ChallengeStartModal
        challenge={selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
      />
      <ChallengeEditModal
        open={showCreateModal || editingChallenge !== undefined}
        onClose={() => { setShowCreateModal(false); setEditingChallenge(undefined) }}
        existing={editingChallenge ?? null}
      />
    </div>
  )
}
