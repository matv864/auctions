import type {
  EnglishAuctionState,
  Player,
  PlayerAction,
  TickLogEntry,
} from '../types.ts'
import type { SimulationConfig } from '../types.ts'

/** Минимальная допустимая ставка в текущем состоянии */
export function minEnglishBid(
  auction: EnglishAuctionState,
  config: SimulationConfig,
): number {
  if (auction.highBidderId === null && auction.currentPrice === 0) {
    return config.minBidIncrement
  }
  return auction.currentPrice + config.minBidIncrement
}

/**
 * Недостаточная ставка → пас (игрок выбывает из раунда).
 * Боты обычно сюда не попадают: decideEnglish заранее сравнивает с minRaise.
 */
export function normalizeEnglishAction(
  auction: EnglishAuctionState,
  player: Player,
  action: PlayerAction,
  config: SimulationConfig,
): PlayerAction {
  if (action.type !== 'bid') return action

  const minValid = minEnglishBid(auction, config)
  const tooLow =
    action.amount <= auction.currentPrice || action.amount < minValid
  const tooHigh = action.amount > player.valuation
  const alreadyLeading = auction.highBidderId === player.id

  if (tooLow || tooHigh || alreadyLeading) {
    return { type: 'pass' }
  }
  return action
}

export function applyEnglishAction(
  auction: EnglishAuctionState,
  player: Player,
  action: PlayerAction,
  config: SimulationConfig,
): { auction: EnglishAuctionState; effectiveAction: PlayerAction } {
  const effective = normalizeEnglishAction(auction, player, action, config)
  const next = { ...auction, activeIds: [...auction.activeIds] }

  if (effective.type !== 'bid') {
    next.activeIds = next.activeIds.filter((id) => id !== player.id)
    return { auction: next, effectiveAction: effective }
  }

  next.currentPrice = effective.amount
  next.highBidderId = player.id
  return { auction: next, effectiveAction: effective }
}

export function checkEnglishEnd(auction: EnglishAuctionState): EnglishAuctionState {
  const next = { ...auction }
  const active = next.activeIds

  if (active.length === 0) {
    next.ended = true
    next.sold =
      next.highBidderId !== null && next.currentPrice >= next.reservePrice
    return next
  }

  if (
    active.length === 1 &&
    next.highBidderId !== null &&
    active[0] === next.highBidderId
  ) {
    next.ended = true
    next.sold = next.currentPrice >= next.reservePrice
    return next
  }

  return next
}

export function finalizeEnglish(auction: EnglishAuctionState): EnglishAuctionState {
  const next = { ...auction, ended: true }
  next.sold =
    next.highBidderId !== null && next.currentPrice >= next.reservePrice
  return next
}

export function createEnglishLog(
  tick: number,
  player: Player,
  action: PlayerAction,
  priceBefore: number,
  priceAfter: number,
): TickLogEntry {
  return {
    tick,
    playerId: player.id,
    playerName: player.name,
    action,
    priceBefore,
    priceAfter,
  }
}
