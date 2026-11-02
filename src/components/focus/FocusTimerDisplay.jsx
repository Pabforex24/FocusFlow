import { cn } from '../../lib/cn.js'
import { splitFocusTime } from '../../lib/focus.js'

function TimeText({ text, className }) {
  return (
    <div className={cn('focus-time-main', className)} aria-hidden>
      {text.split('').map((character, index) => (
        character === ':'
          ? <span key={`colon-${index}`} className="focus-colon" />
          : <span key={`digit-${index}`}>{character}</span>
      ))}
    </div>
  )
}

function DigitCard({ value, calendar }) {
  return (
    <span className={cn('focus-card', calendar && 'focus-card--calendar')}>
      <span key={value} className="focus-card__value">{value}</span>
    </span>
  )
}

function CardClock({ parts, calendar }) {
  const groups = parts.showHours
    ? [{ value: parts.hours, label: 'heures' }, { value: parts.minutes, label: 'minutes' }, { value: parts.seconds, label: 'secondes' }]
    : [{ value: parts.minutes, label: 'minutes' }, { value: parts.seconds, label: 'secondes' }]

  return (
    <div className="focus-groups">
      {groups.map((group, groupIndex) => (
        <div key={group.label} className="focus-groups__item">
          <div className="focus-group">
            <div className="focus-digits" aria-hidden>
              {group.value.split('').map((digit, digitIndex) => (
                <DigitCard key={`${groupIndex}-${digitIndex}`} value={digit} calendar={calendar} />
              ))}
            </div>
            <span className="focus-group-label">{group.label}</span>
          </div>
          {groupIndex < groups.length - 1 && <span className="focus-separator" aria-hidden />}
        </div>
      ))}
    </div>
  )
}

function RingClock({ parts, percentage }) {
  const radius = 46
  const circumference = 2 * Math.PI * radius
  return (
    <div className="focus-ring">
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle className="focus-ring__track" cx="50" cy="50" r={radius} fill="none" />
        <circle className="focus-ring__bar" cx="50" cy="50" r={radius} fill="none" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percentage)} />
      </svg>
      <div className="focus-ring__content"><TimeText text={parts.text} /></div>
    </div>
  )
}

export default function FocusTimerDisplay({ style = 'flip', remainingMs, totalMs, paused = false, preview = false }) {
  const parts = splitFocusTime(remainingMs, totalMs)
  const percentage = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0
  const cardStyle = style === 'flip' || style === 'calendar' || style === 'glass'
  const ringStyle = style === 'ring' || style === 'orbit'

  return (
    <div role={preview ? undefined : 'timer'} aria-hidden={preview || undefined}
      aria-label={preview ? undefined : `Temps restant : ${parts.text}`}
      className={cn('focus-timer', `focus-timer--${style}`, parts.showHours && 'is-hours', paused && 'is-paused', preview && 'is-preview')}>
      {ringStyle
        ? <RingClock parts={parts} percentage={percentage} />
        : cardStyle
          ? <CardClock parts={parts} calendar={style === 'calendar'} />
          : <TimeText text={parts.text} />}
    </div>
  )
}
