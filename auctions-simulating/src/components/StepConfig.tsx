import type { SimulationConfig, AuctionType } from '../simulation/types.ts'
import { auctionTypeLabel } from '../simulation/reports.ts'

interface Props {
  config: SimulationConfig
  onChange: (patch: Partial<SimulationConfig>) => void
  onNext: () => void
}

const AUCTION_TYPES: AuctionType[] = [
  'english',
  'dutch',
  'sealed_first',
  'sealed_second',
]

export function StepConfig({ config, onChange, onNext }: Props) {
  return (
    <section className="card">
      <h2>1. Тип аукциона и раунды</h2>

      <label className="field">
        <span>Тип аукциона</span>
        <select
          value={config.auctionType}
          onChange={(e) =>
            onChange({ auctionType: e.target.value as AuctionType })
          }
        >
          {AUCTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {auctionTypeLabel(t)}
            </option>
          ))}
        </select>
      </label>

      <div className="row">
        <label className="field">
          <span>Число раундов</span>
          <input
            type="number"
            min={1}
            max={100}
            value={config.roundCount}
            onChange={(e) =>
              onChange({ roundCount: Number(e.target.value) })
            }
          />
        </label>
        <label className="field">
          <span>Длительность тика (мс)</span>
          <input
            type="number"
            min={200}
            step={100}
            value={config.tickMs}
            onChange={(e) => onChange({ tickMs: Number(e.target.value) })}
          />
        </label>
      </div>

      <div className="row">
        <label className="field">
          <span>Макс. тиков в раунде</span>
          <input
            type="number"
            min={5}
            value={config.maxTicks}
            onChange={(e) => onChange({ maxTicks: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Шаг ставки</span>
          <input
            type="number"
            min={1}
            value={config.minBidIncrement}
            onChange={(e) =>
              onChange({ minBidIncrement: Number(e.target.value) })
            }
          />
        </label>
      </div>

      <label className="field">
        <span>Seed (воспроизводимость)</span>
        <input
          type="number"
          value={config.seed}
          onChange={(e) => onChange({ seed: Number(e.target.value) })}
        />
      </label>

      <button type="button" className="primary" onClick={onNext}>
        Далее →
      </button>
    </section>
  )
}
