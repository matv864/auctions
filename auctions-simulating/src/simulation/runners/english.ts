import type {
  EnglishAuctionState,
  Player,
  PlayerAction,
  TickLogEntry,
} from '../types.ts'
import type { SimulationConfig } from '../types.ts'

export function applyEnglishAction(
  auction: EnglishAuctionState,
  player: Player,
  action: PlayerAction,
  config: SimulationConfig,
): EnglishAuctionState {
  const next = { ...auction, activeIds: [...auction.activeIds] }

  if (action.type === 'pass') {
    next.activeIds = next.activeIds.filter((id) => id !== player.id)
    return next
  }

  if (action.type === 'bid') {
    const minValid = next.currentPrice + config.minBidIncrement
    if (action.amount >= minValid && action.amount <= player.valuation) {
      next.currentPrice = action.amount
      next.highBidderId = player.id
    }
  }

  return next
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

  if (active.length === 1 && next.highBidderId !== null) {
    next.ended = true
    next.sold = next.currentPrice >= next.reservePrice
    return next
  }

  if (
    active.length === 1 &&
    next.highBidderId === null &&
    next.currentPrice === 0
  ) {
    next.ended = true
    next.sold = false
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
  priceAfter: number,
): TickLogEntry {
  return {
    tick,
    playerId: player.id,
    playerName: player.name,
    action,
    priceAfter,
  }
}
