import { prepareLot, createPlayers } from './lotSetup.ts'
import { Rng } from './rng.ts'
import { decideAction } from './strategies.ts'
import { settleRound } from './settlement.ts'
import {
  applyEnglishAction,
  checkEnglishEnd,
  createEnglishLog,
  finalizeEnglish,
} from './runners/english.ts'
import {
  advanceDutchPrice,
  applyDutchAction,
  checkDutchEnd,
  createDutchLog,
} from './runners/dutch.ts'
import { applySealedBid } from './runners/sealed.ts'
import type {
  GamePhase,
  GameState,
  Player,
  PlayerAction,
  SimulationConfig,
  TickLogEntry,
} from './types.ts'
import { defaultGameState, isTickAuction } from './types.ts'

export class GameController {
  private state: GameState
  private rng: Rng
  /** Remaining player ids to process in current tick */
  private tickQueue: string[] = []

  constructor(initial?: Partial<GameState>) {
    this.state = { ...defaultGameState(), ...initial }
    this.rng = new Rng(this.state.config.seed)
  }

  getState(): GameState {
    return this.state
  }

  patchConfig(patch: Partial<SimulationConfig>): void {
    this.state = {
      ...this.state,
      config: { ...this.state.config, ...patch },
    }
    this.rng = new Rng(this.state.config.seed)
  }

  setPhase(phase: GamePhase): void {
    this.state = { ...this.state, phase }
  }

  initPlayers(): void {
    const wealthMap = new Map(
      this.state.players.map((p) => [p.id, p.wealth]),
    )
    const players =
      this.state.players.length > 0 && this.state.currentRound > 0
        ? createPlayers(this.state.config, wealthMap)
        : createPlayers(this.state.config)
    this.state = { ...this.state, players }
  }

  startSimulation(): void {
    this.rng = new Rng(this.state.config.seed)
    this.initPlayers()
    this.state = {
      ...this.state,
      currentRound: 0,
      roundResults: [],
      phase: 'round_reveal',
    }
    this.beginRound()
  }

  beginRound(): void {
    const roundIndex = this.state.currentRound
    const { players, collusion, auction } = prepareLot(
      this.state.players,
      this.state.config,
      this.rng,
      roundIndex,
    )

    this.state = {
      ...this.state,
      players,
      collusion,
      auction,
      tickLog: [],
      pendingHumanPlayerId: null,
      humanActionKind: null,
      lastRoundResult: null,
      phase: 'round_reveal',
    }

    if (!isTickAuction(this.state.config.auctionType)) {
      this.runBotSealedBids()
    }
  }

  /** User confirms lot reveal → start running */
  startRoundExecution(): void {
    if (isTickAuction(this.state.config.auctionType)) {
      this.state = { ...this.state, phase: 'running' }
      this.beginTick()
    } else if (this.state.config.humanPlays) {
      const human = this.state.players.find((p) => p.isHuman)
      if (human && this.state.auction?.kind === 'sealed') {
        const bid = this.state.auction.bids[human.id]
        if (bid === null) {
          this.state = {
            ...this.state,
            phase: 'human_input',
            pendingHumanPlayerId: human.id,
            humanActionKind: 'sealed_bid',
          }
          return
        }
      }
      this.finalizeSealedRound()
    } else {
      this.finalizeSealedRound()
    }
  }

  private runBotSealedBids(): void {
    const { config, players, collusion, auction } = this.state
    if (!auction || auction.kind !== 'sealed' || !collusion) return

    let next = auction
    for (const p of players) {
      if (p.isHuman) continue
      const action = decideAction(p, next, collusion, config)
      if (action.type === 'bid') {
        next = applySealedBid(next, p.id, action.amount)
      }
    }
    this.state = { ...this.state, auction: next }
  }

  private beginTick(): void {
    const auction = this.state.auction
    if (!auction || auction.ended) return

    const current = this.state.auction!
    const activeIds =
      current.kind === 'english' || current.kind === 'dutch'
        ? current.activeIds
        : []

    this.tickQueue = this.rng.shuffle(activeIds)
    this.processNextInQueue()
  }

  private processNextInQueue(): void {
    if (this.tickQueue.length === 0) {
      this.finishTick()
      return
    }

    const playerId = this.tickQueue.shift()!
    const player = this.state.players.find((p) => p.id === playerId)
    if (!player || !this.state.auction || !this.state.collusion) {
      this.processNextInQueue()
      return
    }

    const auction = this.state.auction
    if (
      (auction.kind === 'english' || auction.kind === 'dutch') &&
      !auction.activeIds.includes(playerId)
    ) {
      this.processNextInQueue()
      return
    }

    if (player.isHuman) {
      this.state = {
        ...this.state,
        phase: 'human_input',
        pendingHumanPlayerId: player.id,
        humanActionKind:
          auction.kind === 'dutch' ? 'accept' : 'bid',
      }
      return
    }

    const action = decideAction(
      player,
      auction,
      this.state.collusion,
      this.state.config,
    )
    this.applyAction(player, action)
    this.processNextInQueue()
  }

  submitHumanAction(action: PlayerAction): void {
    const playerId = this.state.pendingHumanPlayerId
    if (!playerId) return

    const player = this.state.players.find((p) => p.id === playerId)
    if (!player) return

    if (this.state.auction?.kind === 'sealed') {
      if (action.type === 'bid') {
        const next = applySealedBid(
          this.state.auction,
          playerId,
          action.amount,
        )
        this.state = {
          ...this.state,
          auction: next,
          phase: 'running',
          pendingHumanPlayerId: null,
          humanActionKind: null,
        }
        this.finalizeSealedRound()
      }
      return
    }

    this.applyAction(player, action)
    this.state = {
      ...this.state,
      phase: 'running',
      pendingHumanPlayerId: null,
      humanActionKind: null,
    }
    this.processNextInQueue()
  }

  private applyAction(player: Player, action: PlayerAction): void {
    const { config, collusion } = this.state
    if (!collusion) return

    let auction = this.state.auction!
    const tick =
      auction.kind === 'english' || auction.kind === 'dutch'
        ? auction.tick
        : 0

    const logs: TickLogEntry[] = [...this.state.tickLog]

    if (auction.kind === 'english') {
      const priceBefore = auction.currentPrice
      const { auction: nextAuction, effectiveAction } = applyEnglishAction(
        auction,
        player,
        action,
        config,
      )
      auction = checkEnglishEnd(nextAuction)
      logs.push(
        createEnglishLog(
          tick,
          player,
          effectiveAction,
          priceBefore,
          auction.currentPrice,
        ),
      )
    } else if (auction.kind === 'dutch') {
      const priceBefore = auction.currentPrice
      auction = applyDutchAction(auction, player, action)
      logs.push(
        createDutchLog(
          tick,
          player,
          action,
          priceBefore,
          auction.currentPrice,
        ),
      )
      if (auction.ended) {
        this.state = { ...this.state, auction, tickLog: logs }
        this.endRunningRound()
        return
      }
    }

    this.state = { ...this.state, auction, tickLog: logs }

    if (auction.kind === 'english' && auction.ended) {
      this.endRunningRound()
    }
  }

  private finishTick(): void {
    let auction = this.state.auction!
    const { config } = this.state

    if (auction.kind === 'english') {
      const prevTick = auction.tick
      auction = { ...auction, tick: prevTick + 1 }
      auction = checkEnglishEnd(auction)

      const activeWithBids =
        auction.activeIds.length > 0 || auction.highBidderId !== null
      const noActivity =
        this.state.tickLog.filter((l) => l.tick === prevTick).length === 0

      if (auction.tick >= config.maxTicks) {
        auction = finalizeEnglish(auction)
      } else if (
        auction.activeIds.length <= 1 &&
        auction.highBidderId !== null
      ) {
        auction = finalizeEnglish(auction)
      } else if (!activeWithBids && noActivity && auction.tick > 0) {
        auction = finalizeEnglish(auction)
      }

      this.state = { ...this.state, auction }
      if (auction.ended) {
        this.endRunningRound()
        return
      }
    } else if (auction.kind === 'dutch') {
      auction = advanceDutchPrice(auction, config)
      auction = checkDutchEnd(auction, config.maxTicks)
      this.state = { ...this.state, auction }
      if (auction.ended) {
        this.endRunningRound()
        return
      }
    }

    if (!auction.ended) {
      this.beginTick()
    }
  }

  /** Called on timer from UI */
  advanceTick(): void {
    if (this.state.phase !== 'running') return
    if (this.state.pendingHumanPlayerId) return
    if (!isTickAuction(this.state.config.auctionType)) return

    if (this.tickQueue.length > 0) {
      this.processNextInQueue()
    } else {
      this.beginTick()
    }
  }

  private endRunningRound(): void {
    this.tickQueue = []
    this.completeRound()
  }

  private finalizeSealedRound(): void {
    const auction = this.state.auction
    if (auction?.kind === 'sealed') {
      this.state = {
        ...this.state,
        auction: { ...auction, ended: true, allSubmitted: true },
      }
    }
    this.completeRound()
  }

  private completeRound(): void {
    const { config, players, auction, collusion } = this.state
    if (!auction || !collusion) return

    const tickCount =
      auction.kind === 'english' || auction.kind === 'dutch'
        ? auction.tick
        : 1

    const { players: updated, result } = settleRound(
      this.state.currentRound,
      config,
      players,
      auction,
      collusion,
      tickCount,
    )

    this.state = {
      ...this.state,
      players: updated,
      roundResults: [...this.state.roundResults, result],
      lastRoundResult: result,
      phase: 'settle',
      pendingHumanPlayerId: null,
      humanActionKind: null,
    }
  }

  nextRound(): void {
    const nextRound = this.state.currentRound + 1
    if (nextRound >= this.state.config.roundCount) {
      this.state = { ...this.state, phase: 'summary', currentRound: nextRound }
      return
    }
    this.state = { ...this.state, currentRound: nextRound }
    this.beginRound()
    this.state = { ...this.state, phase: 'round_reveal' }
    if (!isTickAuction(this.state.config.auctionType)) {
      this.runBotSealedBids()
    }
  }

  goToSummary(): void {
    this.state = { ...this.state, phase: 'summary' }
  }

  reset(): void {
    this.state = defaultGameState()
    this.rng = new Rng(this.state.config.seed)
    this.tickQueue = []
  }
}
