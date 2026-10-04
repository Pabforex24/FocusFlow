// Lecture complète d'une table par pages.
// Pourquoi : l'API de Supabase renvoie au plus 1 000 lignes par requête (réglage "Max rows"). Sans boucle, les lignes
// au-delà seraient ignorées EN SILENCE, et l'XP, la série et les statistiques (calculés à partir de toutes les lignes)
// deviendraient faux. `fetchPage(from, to)` doit renvoyer le tableau de lignes de l'intervalle [from, to] inclus.
export const PAGE_SIZE = 1000
const MAX_PAGES = 200 // garde-fou : 200 000 lignes par table

export async function fetchAllPages(fetchPage, pageSize = PAGE_SIZE) {
  const rows = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * pageSize
    const chunk = await fetchPage(from, from + pageSize - 1)
    rows.push(...chunk)
    if (chunk.length < pageSize) return rows
  }
  throw new Error('Trop de lignes à charger (limite de sécurité atteinte).')
}
