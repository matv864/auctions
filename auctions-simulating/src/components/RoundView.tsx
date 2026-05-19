import { collusionRoleLabel } from '../simulation/collusion.ts'
import { auctionTypeLabel } from '../simulation/reports.ts'
import type { GameState } from '../simulation/types.ts'
import { isTickAuction } from '../simulation/types.ts'
import { HumanActionPanel } from './HumanActionPanel.tsx'
import type { PlayerAction } from '../simulation/types.ts'

interface Props {
  state: GameState
  onStartRound: () => void
  onHumanAction: (action: PlayerAction) => void
}

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

export function RoundView({ state, onStartRound, onHumanAction }: Props) {
  const { config, players, auction, collusion, tickLog, currentRound } = state
  const roundNum = currentRound + 1

  return (
    <section className="card wide">
      <header className="round-header">
        <h2>
          Раунд {roundNum} / {config.roundCount} —{' '}
          {auctionTypeLabel(config.auctionType)}
        </h2>
        {state.phase === 'round_reveal' && (
          <button type="button" className="primary" onClick={onStartRound}>
            Начать торги
          </button>
        )}
      </header>

      {collusion && (
        <div className="collusion-banner">
          {collusion.sellerCollusion && (
            <span className="tag warn">Сговор продавца</span>
          )}
          {collusion.ringActive && (
            <span className="tag warn">Кольцо участников</span>
          )}
          {!collusion.sellerCollusion && !collusion.ringActive && (
            <span className="tag ok">Без сговора</span>
          )}
        </div>
      )}

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
            <th>Сговор</th>
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

            return (
              <tr key={p.id} className={p.isHuman ? 'human-row' : ''}>
                <td>{p.name}</td>
                <td>{p.wealth.toFixed(0)}</td>
                <td>{p.valuation || '—'}</td>
                <td>{p.strategy}</td>
                <td>{collusionRoleLabel(p.collusionRole)}</td>
                <td>
                  {auction?.kind === 'sealed'
                    ? sealedBid !== null
                      ? p.isHuman && state.phase !== 'settle'
                        ? 'скрыто'
                        : sealedBid
                      : 'ожидание'
                    : active
                      ? 'в игре'
                      : 'выбыл'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {state.phase === 'human_input' && (
        <HumanActionPanel state={state} onSubmit={onHumanAction} />
      )}

      {isTickAuction(config.auctionType) && tickLog.length > 0 && (
        <div className="log">
          <h3>Журнал ходов</h3>
          <ul>
            {[...tickLog].reverse().slice(0, 12).map((e, i) => (
              <li key={`${e.tick}-${e.playerId}-${i}`}>
                [тик {e.tick}] {e.playerName}: {actionLabel(e.action)}
                {e.priceBefore !== undefined && e.priceAfter !== undefined
                  ? ` · ${e.priceBefore} → ${e.priceAfter}`
                  : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
