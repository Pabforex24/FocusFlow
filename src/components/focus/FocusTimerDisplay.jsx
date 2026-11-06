import { cn } from '../../lib/cn.js'
import { splitFocusTime } from '../../lib/focus.js'

function Digits({ value }) {
  return value.split('').map((digit, index) => <span key={`${index}-${digit}`}>{digit}</span>)
}

function TimeText({ parts, className }) {
  return (
    <div className={cn('focus-time-main', className)} aria-hidden>
      <span className={cn('focus-time-hours', !parts.showHours && 'is-hidden')} aria-hidden={!parts.showHours}>
        <Digits value={parts.hours} />
        <span className="focus-colon" />
      </span>
      <Digits value={parts.minutes} />
      <span className="focus-colon" />
      <Digits value={parts.seconds} />
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
  const groups = [
    { key: 'hours', value: parts.hours, label: 'heures', hidden: !parts.showHours },
    { key: 'minutes', value: parts.minutes, label: 'minutes' },
    { key: 'seconds', value: parts.seconds, label: 'secondes' },
  ]

  return (
    <div className="focus-groups">
      {groups.map((group, groupIndex) => (
        <div key={group.key} className={cn('focus-groups__item', group.hidden && 'is-hidden-hours')} aria-hidden={group.hidden || undefined}>
          <div className="focus-group">
            <div className="focus-digits" aria-hidden>
              {group.value.split('').map((digit, digitIndex) => (
                <DigitCard key={`${group.key}-${digitIndex}`} value={digit} calendar={calendar} />
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
      <div className="focus-ring__content"><TimeText parts={parts} /></div>
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
          : <TimeText parts={parts} />}
    </div>
  )
}
