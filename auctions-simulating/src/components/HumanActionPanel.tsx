import { useState } from 'react'
import type { GameState, PlayerAction } from '../simulation/types.ts'

interface Props {
  state: GameState
  onSubmit: (action: PlayerAction) => void
}

export function HumanActionPanel({ state, onSubmit }: Props) {
  const player = state.players.find(
    (p) => p.id === state.pendingHumanPlayerId,
  )
  const auction = state.auction

  const [bidInput, setBidInput] = useState('')

  if (!player || !auction) return null

  const minBid =
    auction.kind === 'english'
      ? auction.currentPrice + state.config.minBidIncrement
      : 0

  if (state.humanActionKind === 'sealed_bid') {
    return (
      <div className="human-panel">
        <h3>Ваша ставка (закрытый аукцион)</h3>
        <p>
          Ваша оценка лота: <strong>{player.valuation}</strong>
        </p>
        <div className="row">
          <input
            type="number"
            min={0}
            max={player.valuation}
            value={bidInput}
            onChange={(e) => setBidInput(e.target.value)}
            placeholder="Ставка"
          />
          <button
            type="button"
            className="primary"
            onClick={() =>
              onSubmit({ type: 'bid', amount: Number(bidInput) || 0 })
            }
          >
            Подать ставку
          </button>
        </div>
      </div>
    )
  }

  if (auction.kind === 'dutch') {
    return (
      <div className="human-panel">
        <h3>Ваш ход (голландский аукцион)</h3>
        <p>
          Текущая цена: <strong>{auction.currentPrice}</strong>, ваша оценка:{' '}
          <strong>{player.valuation}</strong>
        </p>
        <div className="actions">
          <button
            type="button"
            className="primary"
            onClick={() => onSubmit({ type: 'accept' })}
          >
            Принять цену
          </button>
          <button type="button" onClick={() => onSubmit({ type: 'pass' })}>
            Пас
          </button>
        </div>
      </div>
    )
  }

  if (auction.kind === 'english') {
    return (
      <div className="human-panel">
        <h3>Ваш ход (английский аукцион)</h3>
        <p>
          Текущая цена: <strong>{auction.currentPrice}</strong>, мин. повышение:{' '}
          <strong>{minBid}</strong>, ваша оценка:{' '}
          <strong>{player.valuation}</strong>
        </p>
        <div className="row">
          <input
            type="number"
            min={minBid}
            max={player.valuation}
            value={bidInput}
            onChange={(e) => setBidInput(e.target.value)}
            placeholder={`≥ ${minBid}`}
          />
          <button
            type="button"
            className="primary"
            onClick={() =>
              onSubmit({
                type: 'bid',
                amount: Number(bidInput) || minBid,
              })
            }
          >
            Повысить
          </button>
          <button type="button" onClick={() => onSubmit({ type: 'pass' })}>
            Выйти
          </button>
        </div>
      </div>
    )
  }

  return null
}
