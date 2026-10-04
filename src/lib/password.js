// Longueur minimale des NOUVEAUX mots de passe (inscription, réinitialisation).
// La connexion n'applique pas cette règle : les comptes existants avec un mot de passe plus court doivent rester utilisables.
// À aligner avec Supabase > Authentication > Providers > Email > Minimum password length.
export const MIN_PASSWORD = 8
