import type { SimulationConfig } from '../simulation/types.ts'

interface Props {
  config: SimulationConfig
  onChange: (patch: Partial<SimulationConfig>) => void
  onBack: () => void
  onNext: () => void
}

export function StepParticipants({ config, onChange, onBack, onNext }: Props) {
  return (
    <section className="card">
      <h2>2. Участники</h2>

      <label className="field">
        <span>Количество участников</span>
        <input
          type="number"
          min={2}
          max={20}
          value={config.participantCount}
          onChange={(e) =>
            onChange({ participantCount: Number(e.target.value) })
          }
        />
      </label>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={config.humanPlays}
          onChange={(e) => onChange({ humanPlays: e.target.checked })}
        />
        <span>Я участвую в аукционе (игрок «Вы»)</span>
      </label>

      <div className="actions">
        <button type="button" onClick={onBack}>
          ← Назад
        </button>
        <button type="button" className="primary" onClick={onNext}>
          Далее →
        </button>
      </div>
    </section>
  )
}
