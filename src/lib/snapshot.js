// Copie locale (IndexedDB) du dernier état chargé : permet d'afficher l'application sans réseau et de la rouvrir instantanément.
// Lecture seule : les modifications restent envoyées au serveur, jamais stockées ici. Efface à la déconnexion.
// Toutes les fonctions échouent en silence (navigation privée, stockage plein, IndexedDB absent) : l'application
// fonctionne alors comme avant, sans mode hors-ligne.
const DB_NAME = 'focusflow'
const STORE = 'snapshot'
const KEY = 'current'

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB indisponible'))
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore(mode, run) {
  const db = await openDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const request = run(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

// `user` = résumé du compte (id, e-mail) : sert uniquement à rouvrir l'application hors-ligne, quand Supabase ne peut pas
// renouveler une session expirée et la supprime.
export async function saveSnapshot(userId, data, user = null) {
  const owner = user ? { id: user.id, email: user.email, user_metadata: user.user_metadata ?? {} } : null
  try { await withStore('readwrite', (store) => store.put({ userId, savedAt: Date.now(), data, user: owner }, KEY)) }
  catch (error) { console.warn('[hors-ligne] copie locale impossible', error) }
}

// Renvoie { savedAt, data } si la copie appartient bien à cet utilisateur, sinon null.
export async function loadSnapshot(userId) {
  try {
    const saved = await withStore('readonly', (store) => store.get(KEY))
    return saved && saved.userId === userId ? { savedAt: saved.savedAt, data: saved.data } : null
  } catch { return null }
}

// Compte auquel appartient la copie locale (ou null).
export async function loadSnapshotOwner() {
  try {
    const saved = await withStore('readonly', (store) => store.get(KEY))
    return saved?.user?.id ? saved.user : null
  } catch { return null }
}

export async function clearSnapshot() {
  try { await withStore('readwrite', (store) => store.delete(KEY)) } catch { /* rien à effacer */ }
}
