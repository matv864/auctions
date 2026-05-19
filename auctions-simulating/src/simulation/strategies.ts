import type {
  AuctionState,
  CollusionInfo,
  Player,
  PlayerAction,
  SimulationConfig,
  StrategyKind,
} from './types.ts'
import { minEnglishBid } from './runners/english.ts'
import type { Rng } from './rng.ts'

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

function maxBidForStrategy(
  strategy: StrategyKind,
  valuation: number,
): number {
  switch (strategy) {
    case 'truthful':
      return valuation
    case 'shade':
      return Math.floor(valuation * 0.75)
    case 'aggressive':
      return Math.min(valuation + 5, valuation * 1.05)
    case 'passive':
      return Math.floor(valuation * 0.6)
  }
}

function ringShouldDefer(
  player: Player,
  collusion: CollusionInfo,
  highBidderId: string | null,
): boolean {
  if (!collusion.ringActive || player.collusionRole !== 'ring_member') {
    return false
  }
  if (!highBidderId) return false
  return (
    collusion.ringMemberIds.includes(highBidderId) &&
    highBidderId !== player.id
  )
}

export function decideEnglish(
  player: Player,
  auction: Extract<AuctionState, { kind: 'english' }>,
  collusion: CollusionInfo,
  config: SimulationConfig,
): PlayerAction {
  if (!auction.activeIds.includes(player.id)) {
    return { type: 'pass' }
  }

  const maxBid = maxBidForStrategy(player.strategy, player.valuation)
  const minRaise = minEnglishBid(auction, config)

  if (ringShouldDefer(player, collusion, auction.highBidderId)) {
    return { type: 'pass' }
  }

  if (maxBid < minRaise) {
    return { type: 'pass' }
  }

  if (player.strategy === 'passive' && auction.currentPrice > maxBid * 0.5) {
    return { type: 'pass' }
  }

  if (player.collusionRole === 'favored' && collusion.sellerCollusion) {
    return { type: 'bid', amount: Math.min(player.valuation, minRaise) }
  }

  return { type: 'bid', amount: minRaise }
}

export function decideDutch(
  player: Player,
  auction: Extract<AuctionState, { kind: 'dutch' }>,
  collusion: CollusionInfo,
): PlayerAction {
  if (!auction.activeIds.includes(player.id)) {
    return { type: 'pass' }
  }

  if (ringShouldDefer(player, collusion, auction.winnerId)) {
    return { type: 'pass' }
  }

  const threshold =
    player.strategy === 'aggressive'
      ? player.valuation
      : maxBidForStrategy(player.strategy, player.valuation)

  if (auction.currentPrice <= threshold) {
    if (player.collusionRole === 'favored' && collusion.sellerCollusion) {
      return { type: 'accept' }
    }
    if (player.strategy === 'passive' && auction.currentPrice > threshold * 0.85) {
      return { type: 'pass' }
    }
    return { type: 'accept' }
  }

  return { type: 'pass' }
}

export function decideSealed(
  player: Player,
  collusion: CollusionInfo,
  config: SimulationConfig,
): PlayerAction {
  const maxBid = maxBidForStrategy(player.strategy, player.valuation)

  if (player.collusionRole === 'ring_member' && collusion.ringActive) {
    const ringLeader = collusion.ringMemberIds[0]
    if (ringLeader && ringLeader !== player.id) {
      return { type: 'bid', amount: 0 }
    }
  }

  let amount = maxBid
  if (config.auctionType === 'sealed_first') {
    if (player.strategy === 'truthful') {
      amount = player.valuation-1
    } else if (player.strategy === 'aggressive') {
      amount = Math.floor(player.valuation * 0.9)
    }
  }
  if (player.collusionRole === 'favored' && collusion.sellerCollusion) {
    amount = player.valuation
  }

  amount = Math.max(0, Math.min(amount, player.valuation))
  amount = Math.round(amount / config.minBidIncrement) * config.minBidIncrement

  return { type: 'bid', amount }
}

export function decideAction(
  player: Player,
  auction: AuctionState,
  collusion: CollusionInfo,
  config: SimulationConfig,
): PlayerAction {
  switch (auction.kind) {
    case 'english':
      return decideEnglish(player, auction, collusion, config)
    case 'dutch':
      return decideDutch(player, auction, collusion)
    case 'sealed':
      return decideSealed(player, collusion, config)
  }
}
