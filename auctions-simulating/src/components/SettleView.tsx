import type { RoundResult } from '../simulation/types.ts'

interface Props {
  result: RoundResult
  onNext: () => void
  isLast: boolean
}

export function SettleView({ result, onNext, isLast }: Props) {
  return (
    <section className="card wide">
      <h2>Итоги раунда {result.roundIndex + 1}</h2>

      {result.sold ? (
        <p className="result-highlight">
          Победитель: <strong>{result.winnerName}</strong>, цена:{' '}
          <strong>{result.finalPrice}</strong>
          {result.efficient ? (
            <span className="tag ok">эффективно</span>
          ) : (
            <span className="tag warn">неэффективно</span>
          )}
        </p>
      ) : (
        <p className="result-highlight">Лот не продан (ниже резерва или нет ставок)</p>
      )}

      <p>Резервная цена: {result.reservePrice}</p>

      <table className="players-table">
        <thead>
          <tr>
            <th>Участник</th>
            <th>Оценка</th>
            <th>Прибыль</th>
            <th>Богатство</th>
          </tr>
        </thead>
        <tbody>
          {result.playerOutcomes.map((o) => (
            <tr key={o.playerId}>
              <td>{o.playerName}</td>
              <td>{o.valuation}</td>
              <td className={o.profit >= 0 ? 'pos' : 'neg'}>
                {o.profit >= 0 ? '+' : ''}
                {o.profit.toFixed(0)}
              </td>
              <td>{o.wealthAfter.toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" className="primary" onClick={onNext}>
        {isLast ? 'К итоговой статистике →' : 'Следующий раунд →'}
      </button>
    </section>
  )
}
