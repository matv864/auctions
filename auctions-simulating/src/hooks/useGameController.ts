import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameController } from '../simulation/gameController.ts'
import type { GameState, SimulationConfig } from '../simulation/types.ts'

export function useGameController() {
  const controllerRef = useRef(new GameController())
  const [, setVersion] = useState(0)

  const bump = useCallback(() => setVersion((v) => v + 1), [])

  const getState = useCallback((): GameState => {
    return controllerRef.current.getState()
  }, [])

  const patchConfig = useCallback(
    (patch: Partial<SimulationConfig>) => {
      controllerRef.current.patchConfig(patch)
      bump()
    },
    [bump],
  )

  const setPhase = useCallback(
    (phase: GameState['phase']) => {
      controllerRef.current.setPhase(phase)
      bump()
    },
    [bump],
  )

  const initPlayers = useCallback(() => {
    controllerRef.current.initPlayers()
    bump()
  }, [bump])

  const startSimulation = useCallback(() => {
    controllerRef.current.startSimulation()
    bump()
  }, [bump])

  const startRoundExecution = useCallback(() => {
    controllerRef.current.startRoundExecution()
    bump()
  }, [bump])

  const submitHumanAction = useCallback(
    (...args: Parameters<GameController['submitHumanAction']>) => {
      controllerRef.current.submitHumanAction(...args)
      bump()
    },
    [bump],
  )

  const advanceTick = useCallback(() => {
    controllerRef.current.advanceTick()
    bump()
  }, [bump])

  const nextRound = useCallback(() => {
    controllerRef.current.nextRound()
    bump()
  }, [bump])

  const reset = useCallback(() => {
    controllerRef.current.reset()
    bump()
  }, [bump])

  const state = getState()

  useEffect(() => {
    if (state.phase !== 'running') return
    const ms = state.config.tickMs
    const id = window.setInterval(() => {
      controllerRef.current.advanceTick()
      setVersion((v) => v + 1)
    }, ms)
    return () => clearInterval(id)
  }, [state.phase, state.config.tickMs, state.pendingHumanPlayerId])

  return useMemo(
    () => ({
      state,
      patchConfig,
      setPhase,
      initPlayers,
      startSimulation,
      startRoundExecution,
      submitHumanAction,
      advanceTick,
      nextRound,
      reset,
    }),
    [
      state,
      patchConfig,
      setPhase,
      initPlayers,
      startSimulation,
      startRoundExecution,
      submitHumanAction,
      advanceTick,
      nextRound,
      reset,
    ],
  )
}
