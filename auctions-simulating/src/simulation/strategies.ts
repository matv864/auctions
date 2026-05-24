import type {
  AuctionState,
  Player,
  PlayerAction,
  SimulationConfig,
  StrategyKind,
} from './types.ts'
import { maxBidForStrategy } from './bidLimits.ts'
import { minEnglishBid } from './runners/english.ts'
import type { Rng } from './rng.ts'

export { maxBidForStrategy } from './bidLimits.ts'

export function pickStrategy(
  weights: Record<StrategyKind, number>,
  rng: Rng,
): StrategyKind {
  const entries = Object.entries(weights) as [StrategyKind, number][]
  const total = entries.reduce((s, [, w]) => s + w, 0)
  if (total <= 0) return 'truthful'
  let roll = rng.next() * total
  for (const [kind, weight] of entries) {
    roll -= weight
    if (roll <= 0) return kind
  }
  return entries[entries.length - 1]![0]
}

export function decideEnglish(
  player: Player,
  auction: Extract<AuctionState, { kind: 'english' }>,
  config: SimulationConfig,
): PlayerAction {
  if (!auction.activeIds.includes(player.id)) {
    return { type: 'pass' }
  }

  const maxBid = maxBidForStrategy(player.strategy, player.valuation)
  const minRaise = minEnglishBid(auction, config)

  if (maxBid < minRaise) {
    return { type: 'pass' }
  }

  // Пассивные выходят, когда цена съела половину оценки (не половину потолка maxBid).
  if (player.strategy === 'passive' && auction.currentPrice > player.valuation * 0.5) {
    return { type: 'pass' }
  }

  return { type: 'bid', amount: minRaise }
}

export function decideDutch(
  player: Player,
  auction: Extract<AuctionState, { kind: 'dutch' }>,
): PlayerAction {
  if (!auction.activeIds.includes(player.id)) {
    return { type: 'pass' }
  }

  const threshold =
    player.strategy === 'aggressive'
      ? player.valuation
      : maxBidForStrategy(player.strategy, player.valuation)

  if (auction.currentPrice <= threshold) {
    if (player.strategy === 'passive' && auction.currentPrice > threshold * 0.85) {
      return { type: 'pass' }
    }
    return { type: 'accept' }
  }

  return { type: 'pass' }
}

export function decideSealed(
  player: Player,
  config: SimulationConfig,
): PlayerAction {
  const maxBid = maxBidForStrategy(player.strategy, player.valuation)

  let amount = maxBid
  if (config.auctionType === 'sealed_first') {
    if (player.strategy === 'truthful') {
      amount = player.valuation
    } else if (player.strategy === 'aggressive') {
      amount = Math.floor(player.valuation * 0.9)
    }
  }

  amount = Math.max(0, Math.min(amount, player.valuation))
  amount = Math.round(amount / config.minBidIncrement) * config.minBidIncrement

  return { type: 'bid', amount }
}

export function decideAction(
  player: Player,
  auction: AuctionState,
  config: SimulationConfig,
): PlayerAction {
  switch (auction.kind) {
    case 'english':
      return decideEnglish(player, auction, config)
    case 'dutch':
      return decideDutch(player, auction)
    case 'sealed':
      return decideSealed(player, config)
  }
}
