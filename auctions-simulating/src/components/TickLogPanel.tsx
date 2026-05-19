import type { PlayerAction, TickLogEntry } from '../simulation/types.ts'

function actionLabel(action: PlayerAction): string {
  switch (action.type) {
    case 'bid':
      return `ставка ${action.amount}`
    case 'pass':
      return 'пас'
    case 'accept':
      return 'принял цену'
  }
}

interface Props {
  entries: TickLogEntry[]
  /** Во время раунда - последние N записей; в итогах - весь журнал */
  limit?: number
  title?: string
}

export function TickLogPanel({
  entries,
  limit,
  title = 'Журнал ходов',
}: Props) {
  if (entries.length === 0) return null

  const visible = limit
    ? [...entries].reverse().slice(0, limit)
    : [...entries].reverse()

  return (
    <div className="log">
      <h3>{title}</h3>
      <ul>
        {visible.map((e, i) => (
          <li key={`${e.tick}-${e.playerId}-${i}`}>
            [тик {e.tick}] {e.playerName}: {actionLabel(e.action)}
            {e.priceBefore !== undefined && e.priceAfter !== undefined
              ? ` · ${e.priceBefore} → ${e.priceAfter}`
              : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
