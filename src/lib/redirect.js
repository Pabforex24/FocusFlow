// Chemin interne sûr pour le paramètre `next` (connexion, retour après une invitation).
// Refuse les URL absolues, protocol-relative (`//evil.com`), les antislashs (`/\evil.com`,
// que les navigateurs normalisent en `//`) et les caractères de contrôle.
// Seuls les chemins de l'application sont acceptés.
export function safeInternalPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return null
  if (value.startsWith('//') || value.includes('\\')) return null
  if ([...value].some((char) => char.codePointAt(0) < 0x20 || char.codePointAt(0) === 0x7f)) return null
  // Un séparateur encodé (%2F, %5C) pourrait redevenir « // » après décodage.
  if (/%(2f|5c)/i.test(value)) return null
  return value
}
