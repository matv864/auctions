import { useEffect, useState } from 'react'
import { strategyLabel } from '../content/reference.ts'
import { auctionTypeLabel } from '../simulation/reports.ts'
import type { GameState } from '../simulation/types.ts'
import { isTickAuction } from '../simulation/types.ts'
import { HumanActionPanel } from './HumanActionPanel.tsx'
import { TickLogPanel } from './TickLogPanel.tsx'
import type { PlayerAction } from '../simulation/types.ts'

interface Props {
  state: GameState
  onStartRound: () => void
  onHumanAction: (action: PlayerAction) => void
}

const MASK = '···'

export function RoundView({ state, onStartRound, onHumanAction }: Props) {
  const { config, players, auction, tickLog, currentRound } = state
  const roundNum = currentRound + 1
  const [detailsVisible, setDetailsVisible] = useState(false)

  useEffect(() => {
    setDetailsVisible(false)
  }, [currentRound])

  return (
    <section className="card wide">
      <header className="round-header">
        <h2>
          Раунд {roundNum} / {config.roundCount} -{' '}
          {auctionTypeLabel(config.auctionType)}
        </h2>
        <div className="round-header-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => setDetailsVisible((v) => !v)}
          >
            {detailsVisible
              ? 'Скрыть данные участников'
              : 'Показать оценки, стратегии и статусы'}
          </button>
          {state.phase === 'round_reveal' && (
            <button type="button" className="primary" onClick={onStartRound}>
              Начать торги
            </button>
          )}
        </div>
      </header>

      {auction && (
        <div className="auction-status">
          {auction.kind === 'english' && (
            <>
              <p>
                Цена: <strong>{auction.currentPrice}</strong> · Резерв:{' '}
                {auction.reservePrice} · Тик: {auction.tick}
              </p>
              {auction.highBidderId && (
                <p>
                  Лидер:{' '}
                  {players.find((p) => p.id === auction.highBidderId)?.name}
                </p>
              )}
            </>
          )}
          {auction.kind === 'dutch' && (
            <p>
              Цена: <strong>{auction.currentPrice}</strong> (старт{' '}
              {auction.startPrice}) · Резерв: {auction.reservePrice} · Тик:{' '}
              {auction.tick}
            </p>
          )}
          {auction.kind === 'sealed' && (
            <p>
              Резерв: {auction.reservePrice} · Закрытые ставки до разыгрывания
            </p>
          )}
        </div>
      )}

      <table className="players-table">
        <thead>
          <tr>
            <th>Участник</th>
            <th>Богатство</th>
            <th>Оценка</th>
            <th>Стратегия</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const active =
              auction?.kind === 'english' || auction?.kind === 'dutch'
                ? auction.activeIds.includes(p.id)
                : true
            const sealedBid =
              auction?.kind === 'sealed' ? auction.bids[p.id] : null

            const statusText =
              auction?.kind === 'sealed'
                ? sealedBid !== null
                  ? p.isHuman && state.phase !== 'settle'
                    ? 'скрыто'
                    : String(sealedBid)
                  : 'ожидание'
                : active
                  ? 'в игре'
                  : 'выбыл'

            return (
              <tr key={p.id} className={p.isHuman ? 'human-row' : ''}>
                <td>{p.name}</td>
                <td>{p.wealth.toFixed(0)}</td>
                <td className={detailsVisible ? '' : 'cell-masked'}>
                  {detailsVisible ? p.valuation || '-' : MASK}
                </td>
                <td className={detailsVisible ? '' : 'cell-masked'}>
                  {detailsVisible ? strategyLabel(p.strategy) : MASK}
                </td>
                <td className={detailsVisible ? '' : 'cell-masked'}>
                  {detailsVisible ? statusText : MASK}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {state.phase === 'human_input' && (
        <HumanActionPanel state={state} onSubmit={onHumanAction} />
      )}

      {isTickAuction(config.auctionType) && (
        <TickLogPanel entries={tickLog} limit={12} />
      )}
    </section>
  )
}
