import type {
  DutchAuctionState,
  Player,
  PlayerAction,
  SimulationConfig,
  TickLogEntry,
} from '../types.ts'

export function applyDutchAction(
  auction: DutchAuctionState,
  player: Player,
  action: PlayerAction,
): DutchAuctionState {
  const next = { ...auction, activeIds: [...auction.activeIds] }

  if (action.type === 'accept' && next.activeIds.includes(player.id)) {
    if (next.currentPrice >= next.reservePrice) {
      next.winnerId = player.id
      next.sold = true
      next.ended = true
    }
    return next
  }

  if (action.type === 'pass') {
    next.activeIds = next.activeIds.filter((id) => id !== player.id)
  }

  return next
}

export function advanceDutchPrice(
  auction: DutchAuctionState,
  config: SimulationConfig,
): DutchAuctionState {
  if (auction.ended) return auction

  const next = {
    ...auction,
    tick: auction.tick + 1,
    currentPrice: auction.currentPrice - config.dutchPriceStep,
  }

  if (next.currentPrice < next.reservePrice) {
    next.ended = true
    next.sold = false
    return next
  }

  if (next.activeIds.length === 0) {
    next.ended = true
    next.sold = false
  }

  return next
}

export function checkDutchEnd(
  auction: DutchAuctionState,
  maxTicks: number,
): DutchAuctionState {
  if (auction.ended) return auction
  if (auction.tick >= maxTicks) {
    return { ...auction, ended: true, sold: auction.sold }
  }
  return auction
}

export function createDutchLog(
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
