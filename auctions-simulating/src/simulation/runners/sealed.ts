import type {
  Player,
  SealedAuctionState,
  SimulationConfig,
} from '../types.ts'

export interface SealedOutcome {
  winnerId: string | null
  finalPrice: number
  sold: boolean
  secondPrice: number | null
}

export function applySealedBid(
  auction: SealedAuctionState,
  playerId: string,
  amount: number,
): SealedAuctionState {
  const bids = { ...auction.bids, [playerId]: amount }
  const allSubmitted = Object.values(bids).every((b) => b !== null)
  return { ...auction, bids, allSubmitted }
}

export function resolveSealed(
  auction: SealedAuctionState,
  players: Player[],
  config: SimulationConfig,
): SealedOutcome {
  const entries = players
    .map((p) => ({
      id: p.id,
      bid: auction.bids[p.id] ?? 0,
    }))
    .sort((a, b) => b.bid - a.bid)

  if (entries.length === 0 || entries[0]!.bid < auction.reservePrice) {
    return {
      winnerId: null,
      finalPrice: 0,
      sold: false,
      secondPrice: null,
    }
  }

  const winner = entries[0]!
  const second = entries[1] ?? null
  const secondPrice = second?.bid ?? 0

  const isSecondPrice =
    config.auctionType === 'sealed_second'

  const finalPrice = isSecondPrice
    ? Math.max(auction.reservePrice, secondPrice)
    : winner.bid

  return {
    winnerId: winner.id,
    finalPrice,
    sold: winner.bid >= auction.reservePrice,
    secondPrice: second?.bid ?? null,
  }
}
