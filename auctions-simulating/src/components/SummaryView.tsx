import { buildReport, auctionTypeLabel } from '../simulation/reports.ts'
import type { GameState } from '../simulation/types.ts'

interface Props {
  state: GameState
  onReset: () => void
}

export function SummaryView({ state, onReset }: Props) {
  const report = buildReport(state.roundResults, state.players)

  return (
    <section className="card wide">
      <h2>Итоговая статистика</h2>
      <p className="subtitle">
        {auctionTypeLabel(state.config.auctionType)} · {report.totalRounds}{' '}
        раундов
      </p>

      <div className="stats-grid">
        <div className="stat">
          <span className="stat-label">Доля продаж</span>
          <span className="stat-value">
            {(report.soldRate * 100).toFixed(0)}%
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Эффективность</span>
          <span className="stat-value">
            {(report.efficiencyRate * 100).toFixed(0)}%
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Раунды со сговором</span>
          <span className="stat-value">{report.collusionRounds}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Средняя цена</span>
          <span className="stat-value">
            {report.avgFinalPrice.toFixed(1)}
          </span>
        </div>
      </div>

      <h3>Участники</h3>
      <table className="players-table">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Итоговое богатство</th>
            <th>Суммарная прибыль</th>
            <th>Побед</th>
          </tr>
        </thead>
        <tbody>
          {report.playerAggregates.map((a) => (
            <tr key={a.playerId}>
              <td>{a.playerName}</td>
              <td>{a.finalWealth.toFixed(0)}</td>
              <td className={a.totalProfit >= 0 ? 'pos' : 'neg'}>
                {a.totalProfit >= 0 ? '+' : ''}
                {a.totalProfit.toFixed(0)}
              </td>
              <td>{a.wins}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>По раундам</h3>
      <table className="players-table compact">
        <thead>
          <tr>
            <th>#</th>
            <th>Победитель</th>
            <th>Цена</th>
            <th>Продано</th>
            <th>Эфф.</th>
            <th>Сговор</th>
          </tr>
        </thead>
        <tbody>
          {report.roundSummaries.map((r, i) => (
            <tr key={`round-${i}-${r.round}`}>
              <td>{r.round}</td>
              <td>{r.winner ?? '—'}</td>
              <td>{r.sold ? r.price : '—'}</td>
              <td>{r.sold ? 'да' : 'нет'}</td>
              <td>{r.efficient ? 'да' : 'нет'}</td>
              <td>{r.collusion ? 'да' : 'нет'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="wealth-chart">
        <h3>Богатство участников</h3>
        {report.playerAggregates.map((a) => {
          const max = Math.max(
            ...report.playerAggregates.map((x) => x.finalWealth),
            1,
          )
          const pct = (a.finalWealth / max) * 100
          return (
            <div key={a.playerId} className="bar-row">
              <span className="bar-label">{a.playerName}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="bar-value">{a.finalWealth.toFixed(0)}</span>
            </div>
          )
        })}
      </div>

      <button type="button" className="primary" onClick={onReset}>
        Новая симуляция
      </button>
    </section>
  )
}
