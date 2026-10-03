// Assemble des noms de classes en ignorant les valeurs vides : cn('a', cond && 'b')
export function cn(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(' ')
}
