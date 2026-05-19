import type {
  AuctionState,
  CollusionInfo,
  Player,
  PlayerRoundOutcome,
  RoundResult,
  SimulationConfig,
} from './types.ts'
import { resolveSealed } from './runners/sealed.ts'

export function settleRound(
  roundIndex: number,
  config: SimulationConfig,
  players: Player[],
  auction: AuctionState,
  collusion: CollusionInfo,
  tickCount: number,
): { players: Player[]; result: RoundResult } {
  let winnerId: string | null = null
  let finalPrice = 0
  let sold = false

  if (auction.kind === 'english') {
    winnerId = auction.sold ? auction.highBidderId : null
    finalPrice = auction.sold ? auction.currentPrice : 0
    sold = auction.sold
  } else if (auction.kind === 'dutch') {
    winnerId = auction.sold ? auction.winnerId : null
    finalPrice = auction.sold ? auction.currentPrice : 0
    sold = auction.sold
  } else {
    const outcome = resolveSealed(auction, players, config)
    winnerId = outcome.winnerId
    finalPrice = outcome.finalPrice
    sold = outcome.sold
  }

  const valuations = Object.fromEntries(
    players.map((p) => [p.id, p.valuation]),
  )

  const maxVal = Math.max(...players.map((p) => p.valuation))
  const efficientPlayers = players.filter((p) => p.valuation === maxVal)
  const efficientPlayerId = efficientPlayers[0]?.id ?? null

  const updatedPlayers = players.map((p) => {
    const wealthBefore = p.wealth
    let wealthAfter = wealthBefore
    const won = winnerId === p.id && sold

    if (won) {
      wealthAfter = wealthBefore + p.valuation - finalPrice
    }

    return { ...p, wealth: wealthAfter }
  })

  const playerOutcomes: PlayerRoundOutcome[] = players.map((p, i) => {
    const updated = updatedPlayers[i]!
    return {
      playerId: p.id,
      playerName: p.name,
      valuation: p.valuation,
      wealthBefore: p.wealth,
      wealthAfter: updated.wealth,
      profit: updated.wealth - p.wealth,
      won: winnerId === p.id && sold,
    }
  })

  const winner = updatedPlayers.find((p) => p.id === winnerId)

  const result: RoundResult = {
    roundIndex,
    auctionType: config.auctionType,
    collusion,
    reservePrice:
      auction.kind === 'sealed' ? auction.reservePrice : auction.reservePrice,
    winnerId,
    winnerName: winner?.name ?? null,
    finalPrice,
    sold,
    tickCount,
    efficientPlayerId,
    efficient: sold && winnerId !== null && winnerId === efficientPlayerId,
    playerOutcomes,
    valuations,
  }

  return { players: updatedPlayers, result }
}
