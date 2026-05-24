import type { Player, RoundResult } from './types.ts'

export interface PlayerAggregate {
  playerId: string
  playerName: string
  totalProfit: number
  wins: number
  roundsPlayed: number
  finalWealth: number
}

export interface SimulationReport {
  totalRounds: number
  efficiencyRate: number
  avgFinalPrice: number
  soldRate: number
  playerAggregates: PlayerAggregate[]
  roundSummaries: {
    round: number
    winner: string | null
    price: number
    sold: boolean
    efficient: boolean
  }[]
}

export function buildReport(
  results: RoundResult[],
  players: Player[],
): SimulationReport {
  const playerAggregates: PlayerAggregate[] = players.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    totalProfit: 0,
    wins: 0,
    roundsPlayed: results.length,
    finalWealth: p.wealth,
  }))

  for (const r of results) {
    for (const o of r.playerOutcomes) {
      const agg = playerAggregates.find((a) => a.playerId === o.playerId)
      if (!agg) continue
      agg.totalProfit += o.profit
      if (o.won) agg.wins += 1
    }
  }

  const sold = results.filter((r) => r.sold)
  const efficient = results.filter((r) => r.efficient)

  return {
    totalRounds: results.length,
    efficiencyRate:
      results.length > 0 ? efficient.length / results.length : 0,
    avgFinalPrice:
      sold.length > 0
        ? sold.reduce((s, r) => s + r.finalPrice, 0) / sold.length
        : 0,
    soldRate: results.length > 0 ? sold.length / results.length : 0,
    playerAggregates,
    roundSummaries: results.map((r) => ({
      round: r.roundIndex + 1,
      winner: r.winnerName,
      price: r.finalPrice,
      sold: r.sold,
      efficient: r.efficient,
    })),
  }
}

export { auctionTypeLabel } from '../content/reference.ts'
