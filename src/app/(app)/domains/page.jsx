'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Globe } from 'lucide-react'
import { useStore } from '@/store'
import { useAllDomainProgress } from '@/store/selectors'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { DomainCard } from '@/components/domain/DomainCard'
import { DomainModal } from '@/components/domain/DomainModal'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function DomainsPage() {
  const router = useRouter()
  const { domains, goals, addDomain, updateDomain, deleteDomain } = useStore()
  const domainProgress = useAllDomainProgress()
  const { toast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const handleSave = (data: ) => {
    if (editing) {
      updateDomain(editing.id, data)
      toast('Domaine mis à jour ✓', 'success')
    } else {
      addDomain(data)
      toast('Domaine créé ! 🎉', 'success')
    }
    setEditing(null)
  }

  const handleEdit = (domain) => {
    setEditing(domain)
    setModalOpen(true)
  }

  const handleDelete = (id) => setConfirmId(id)

  const doDelete = () => {
    if (!confirmId) return
    deleteDomain(confirmId)
    toast('Domaine supprimé', 'info')
  }

  return (
    <div className="px-4 pt-4 md:p-8 max-w-4xl mx-auto mt-[calc(env(safe-area-inset-top)+52px)] md:mt-0 page-enter">
      <PageHeader
        title="Domaines"
        subtitle="Organisez votre vie en grandes catégories"
        action={
          <Button
            variant="primary"
            onClick={() => { setEditing(null); setModalOpen(true) }}
          >
            <Plus size={16} /> Nouveau domaine
          </Button>
        }
      />

      {domains.length === 0 ? (
        <div className="text-center py-16 text-content-3">
          <Globe size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="font-heading font-bold text-lg text-content-2 mb-2">
            Aucun domaine
          </h3>
          <p className="text-sm max-w-xs mx-auto mb-6">
            Créez des domaines pour organiser vos objectifs et tâches.
          </p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Créer mon premier domaine
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              progress={domainProgress[domain.id] ?? 0}
              goalCount={goals.filter((g) => g.domainId === domain.id).length}
              onClick={() => router.push(`/goals?domain=${domain.id}`)}
              onEdit={() => handleEdit(domain)}
              onDelete={() => handleDelete(domain.id)}
            />
          ))}
        </div>
      )}

      <DomainModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        existing={editing}
      />

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={doDelete}
        title="Supprimer le domaine"
        description="Supprimer ce domaine supprimera également tous ses objectifs et tâches associées. Cette action est irréversible."
        confirmLabel="Supprimer"
      />
    </div>
  )
}
