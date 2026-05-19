import { StepConfig } from './components/StepConfig.tsx'
import { StepParticipants } from './components/StepParticipants.tsx'
import { StepProbabilities } from './components/StepProbabilities.tsx'
import { RoundView } from './components/RoundView.tsx'
import { SettleView } from './components/SettleView.tsx'
import { SummaryView } from './components/SummaryView.tsx'
import { useGameController } from './hooks/useGameController.ts'
import './App.css'

function App() {
  const {
    state,
    patchConfig,
    setPhase,
    startSimulation,
    startRoundExecution,
    submitHumanAction,
    nextRound,
    reset,
  } = useGameController()

  const { config, phase } = state

  return (
    <div className="app">
      <header className="app-header">
        <h1>Симуляция аукционов</h1>
        <p className="tagline">Курсовой проект — сравнение механизмов торгов</p>
        <nav className="phase-nav">
          {(
            [
              ['config', '1. Аукцион'],
              ['participants', '2. Участники'],
              ['probabilities', '3. Вероятности'],
              ['round_reveal', '4. Раунд'],
              ['summary', '5. Итоги'],
            ] as const
          ).map(([p, label]) => (
            <span
              key={p}
              className={
                phase === p ||
                (p === 'round_reveal' &&
                  ['running', 'human_input', 'settle'].includes(phase))
                  ? 'active'
                  : ''
              }
            >
              {label}
            </span>
          ))}
        </nav>
      </header>

      <main>
        {phase === 'config' && (
          <StepConfig
            config={config}
            onChange={patchConfig}
            onNext={() => setPhase('participants')}
          />
        )}

        {phase === 'participants' && (
          <StepParticipants
            config={config}
            onChange={patchConfig}
            onBack={() => setPhase('config')}
            onNext={() => setPhase('probabilities')}
          />
        )}

        {phase === 'probabilities' && (
          <StepProbabilities
            config={config}
            onChange={patchConfig}
            onChangeProbs={(probs) =>
              patchConfig({ probs: { ...config.probs, ...probs } })
            }
            onChangeReserve={(reserve) =>
              patchConfig({ reserve: { ...config.reserve, ...reserve } })
            }
            onBack={() => setPhase('participants')}
            onStart={startSimulation}
          />
        )}

        {['round_reveal', 'running', 'human_input'].includes(phase) && (
          <RoundView
            state={state}
            onStartRound={startRoundExecution}
            onHumanAction={submitHumanAction}
          />
        )}

        {phase === 'settle' && state.lastRoundResult && (
          <SettleView
            result={state.lastRoundResult}
            onNext={nextRound}
            isLast={state.currentRound + 1 >= config.roundCount}
          />
        )}

        {phase === 'summary' && (
          <SummaryView state={state} onReset={reset} />
        )}
      </main>
    </div>
  )
}

export default App
