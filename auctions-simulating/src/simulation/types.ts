export type AuctionType =
  | 'english'
  | 'dutch'
  | 'sealed_first'
  | 'sealed_second'

export type GamePhase =
  | 'config'
  | 'participants'
  | 'probabilities'
  | 'round_reveal'
  | 'running'
  | 'human_input'
  | 'settle'
  | 'summary'

export type StrategyKind = 'truthful' | 'shade' | 'aggressive' | 'passive'

export type CollusionRole = 'none' | 'ring_member' | 'favored'

export type ReserveMode = 'fixed' | 'median_fraction' | 'auto'

export type ValuationDistributionKind = 'uniform' | 'normal'

export interface ValuationDistributionConfig {
  kind: ValuationDistributionKind
  min: number
  max: number
  /** For normal: mean is (min+max)/2, stdDev derived if not set */
  stdDev?: number
}

export interface ReserveConfig {
  mode: ReserveMode
  /** Used when mode is fixed */
  fixedValue: number
  /** Used when mode is median_fraction: reserve = median * fraction */
  medianFraction: number
}

export interface SimulationProbabilities {
  sellerCollusion: number
  participantRing: number
  strategies: Record<StrategyKind, number>
  valuation: ValuationDistributionConfig
}

export interface SimulationConfig {
  auctionType: AuctionType
  roundCount: number
  tickMs: number
  maxTicks: number
  minBidIncrement: number
  participantCount: number
  humanPlays: boolean
  seed: number
  probs: SimulationProbabilities
  reserve: ReserveConfig
  /** Dutch: opening price = max(valuations) * multiplier */
  dutchStartMultiplier: number
  /** Dutch: price drop per tick */
  dutchPriceStep: number
}

export interface Player {
  id: string
  name: string
  isHuman: boolean
  wealth: number
  valuation: number
  strategy: StrategyKind
  collusionRole: CollusionRole
  ringId: number | null
  active: boolean
}

export interface CollusionInfo {
  sellerCollusion: boolean
  ringActive: boolean
  ringId: number | null
  favoredPlayerId: string | null
  ringMemberIds: string[]
}

export interface EnglishAuctionState {
  kind: 'english'
  tick: number
  currentPrice: number
  highBidderId: string | null
  reservePrice: number
  sold: boolean
  ended: boolean
  /** Player ids still in the auction */
  activeIds: string[]
}

export interface DutchAuctionState {
  kind: 'dutch'
  tick: number
  currentPrice: number
  startPrice: number
  reservePrice: number
  winnerId: string | null
  sold: boolean
  ended: boolean
  activeIds: string[]
}

export interface SealedAuctionState {
  kind: 'sealed'
  reservePrice: number
  bids: Record<string, number | null>
  allSubmitted: boolean
  ended: boolean
}

export type AuctionState =
  | EnglishAuctionState
  | DutchAuctionState
  | SealedAuctionState

export type PlayerAction =
  | { type: 'bid'; amount: number }
  | { type: 'pass' }
  | { type: 'accept' }

export type HumanActionKind = 'bid' | 'pass' | 'accept' | 'sealed_bid'

export interface TickLogEntry {
  tick: number
  playerId: string
  playerName: string
  action: PlayerAction
  priceBefore?: number
  priceAfter?: number
}

export interface RoundResult {
  roundIndex: number
  auctionType: AuctionType
  collusion: CollusionInfo
  reservePrice: number
  winnerId: string | null
  winnerName: string | null
  finalPrice: number
  sold: boolean
  tickCount: number
  /** Player with highest valuation (efficiency benchmark) */
  efficientPlayerId: string | null
  efficient: boolean
  playerOutcomes: PlayerRoundOutcome[]
  valuations: Record<string, number>
}

export interface PlayerRoundOutcome {
  playerId: string
  playerName: string
  valuation: number
  strategy: StrategyKind
  wealthBefore: number
  wealthAfter: number
  profit: number
  won: boolean
}

export interface GameState {
  phase: GamePhase
  config: SimulationConfig
  players: Player[]
  currentRound: number
  roundResults: RoundResult[]
  auction: AuctionState | null
  collusion: CollusionInfo | null
  tickLog: TickLogEntry[]
  pendingHumanPlayerId: string | null
  humanActionKind: HumanActionKind | null
  lastRoundResult: RoundResult | null
}

export function isTickAuction(type: AuctionType): boolean {
  return type === 'english' || type === 'dutch'
}

export function isSealedAuction(type: AuctionType): boolean {
  return type === 'sealed_first' || type === 'sealed_second'
}

export function defaultConfig(): SimulationConfig {
  return {
    auctionType: 'english',
    roundCount: 5,
    tickMs: 1000,
    maxTicks: 50,
    minBidIncrement: 1,
    participantCount: 4,
    humanPlays: true,
    seed: Math.floor(Math.random() * 1000),
    probs: {
      sellerCollusion: 0,
      participantRing: 0,
      strategies: {
        truthful: 0.4,
        shade: 0.3,
        aggressive: 0.2,
        passive: 0.1,
      },
      valuation: { kind: 'uniform', min: 50, max: 150 },
    },
    reserve: { mode: 'median_fraction', fixedValue: 80, medianFraction: 0.85 },
    dutchStartMultiplier: 1.25,
    dutchPriceStep: 2,
  }
}

export function defaultGameState(): GameState {
  return {
    phase: 'config',
    config: defaultConfig(),
    players: [],
    currentRound: 0,
    roundResults: [],
    auction: null,
    collusion: null,
    tickLog: [],
    pendingHumanPlayerId: null,
    humanActionKind: null,
    lastRoundResult: null,
  }
}
