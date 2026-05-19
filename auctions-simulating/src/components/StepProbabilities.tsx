import { ALL_STRATEGIES, STRATEGY_LABELS } from '../content/reference.ts'
import type {
  ReserveConfig,
  ReserveMode,
  SimulationConfig,
  SimulationProbabilities,
  ValuationDistributionKind,
} from '../simulation/types.ts'

interface Props {
  config: SimulationConfig
  onChange: (patch: Partial<SimulationConfig>) => void
  onChangeProbs: (patch: Partial<SimulationProbabilities>) => void
  onChangeReserve: (patch: Partial<ReserveConfig>) => void
  onBack: () => void
  onStart: () => void
}

export function StepProbabilities({
  config,
  onChange,
  onChangeProbs,
  onChangeReserve,
  onBack,
  onStart,
}: Props) {
  const { probs, reserve } = config

  return (
    <section className="card">
      <h2>3. Вероятности и распределения</h2>

      <div className="row">
        <label className="field">
          <span>Вероятность сговора продавца</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={probs.sellerCollusion}
            onChange={(e) =>
              onChangeProbs({ sellerCollusion: Number(e.target.value) })
            }
          />
          <em>{(probs.sellerCollusion * 100).toFixed(0)}%</em>
        </label>
        <label className="field">
          <span>Вероятность кольца участников</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={probs.participantRing}
            onChange={(e) =>
              onChangeProbs({ participantRing: Number(e.target.value) })
            }
          />
          <em>{(probs.participantRing * 100).toFixed(0)}%</em>
        </label>
      </div>

      <h3>Веса стратегий</h3>
      <div className="strategy-grid">
        {ALL_STRATEGIES.map((s) => (
          <label key={s} className="field">
            <span>{STRATEGY_LABELS[s]}</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={probs.strategies[s]}
              onChange={(e) =>
                onChangeProbs({
                  strategies: {
                    ...probs.strategies,
                    [s]: Number(e.target.value),
                  },
                })
              }
            />
          </label>
        ))}
      </div>

      <h3>Оценки лота</h3>
      <div className="row">
        <label className="field">
          <span>Распределение</span>
          <select
            value={probs.valuation.kind}
            onChange={(e) =>
              onChangeProbs({
                valuation: {
                  ...probs.valuation,
                  kind: e.target.value as ValuationDistributionKind,
                },
              })
            }
          >
            <option value="uniform">Равномерное</option>
            <option value="normal">Нормальное</option>
          </select>
        </label>
        <label className="field">
          <span>Мин</span>
          <input
            type="number"
            value={probs.valuation.min}
            onChange={(e) =>
              onChangeProbs({
                valuation: {
                  ...probs.valuation,
                  min: Number(e.target.value),
                },
              })
            }
          />
        </label>
        <label className="field">
          <span>Макс</span>
          <input
            type="number"
            value={probs.valuation.max}
            onChange={(e) =>
              onChangeProbs({
                valuation: {
                  ...probs.valuation,
                  max: Number(e.target.value),
                },
              })
            }
          />
        </label>
      </div>

      <h3>Резервная цена</h3>
      <div className="row">
        <label className="field">
          <span>Режим</span>
          <select
            value={reserve.mode}
            onChange={(e) =>
              onChangeReserve({ mode: e.target.value as ReserveMode })
            }
          >
            <option value="fixed">Фиксированная</option>
            <option value="median_fraction">Доля от медианы оценок</option>
            <option value="auto">Авто (90% медианы)</option>
          </select>
        </label>
        {reserve.mode === 'fixed' && (
          <label className="field">
            <span>Значение</span>
            <input
              type="number"
              value={reserve.fixedValue}
              onChange={(e) =>
                onChangeReserve({ fixedValue: Number(e.target.value) })
              }
            />
          </label>
        )}
        {reserve.mode === 'median_fraction' && (
          <label className="field">
            <span>Доля медианы</span>
            <input
              type="number"
              min={0}
              max={2}
              step={0.05}
              value={reserve.medianFraction}
              onChange={(e) =>
                onChangeReserve({ medianFraction: Number(e.target.value) })
              }
            />
          </label>
        )}
      </div>

      {(config.auctionType === 'dutch' || config.auctionType === 'english') && (
        <div className="row">
          {config.auctionType === 'dutch' && (
            <>
              <label className="field">
                <span>Старт цены (× макс. оценки)</span>
                <input
                  type="number"
                  min={1}
                  step={0.05}
                  value={config.dutchStartMultiplier}
                  onChange={(e) =>
                    onChange({ dutchStartMultiplier: Number(e.target.value) })
                  }
                />
              </label>
              <label className="field">
                <span>Снижение за тик</span>
                <input
                  type="number"
                  min={1}
                  value={config.dutchPriceStep}
                  onChange={(e) =>
                    onChange({ dutchPriceStep: Number(e.target.value) })
                  }
                />
              </label>
            </>
          )}
        </div>
      )}

      <div className="actions">
        <button type="button" onClick={onBack}>
          ← Назад
        </button>
        <button type="button" className="primary" onClick={onStart}>
          Запустить симуляцию
        </button>
      </div>
    </section>
  )
}
