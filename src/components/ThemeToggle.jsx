import { Moon, Sun } from 'lucide-react'
import { IconButton } from './ui/Button.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'

export default function ThemeToggle({ className }) {
  const { resolved, toggle } = useTheme()
  const dark = resolved === 'dark'
  return <IconButton icon={dark ? Sun : Moon} label={dark ? 'Passer au thème clair' : 'Passer au thème sombre'} onClick={toggle} className={className} />
}
