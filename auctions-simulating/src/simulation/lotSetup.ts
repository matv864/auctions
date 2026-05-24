import { median, sampleValuation } from './distributions.ts'
import { pickStrategy } from './strategies.ts'
import type { Rng } from './rng.ts'
import type {
  AuctionState,
  Player,
  SimulationConfig,
} from './types.ts'
import { isTickAuction } from './types.ts'

export function createPlayers(
  config: SimulationConfig,
  existingWealth?: Map<string, number>,
): Player[] {
  const players: Player[] = []
  for (let i = 0; i < config.participantCount; i++) {
    const id = `p${i}`
    const isHuman = config.humanPlays && i === 0
    players.push({
      id,
      name: isHuman ? 'Вы' : `Участник ${i + 1}`,
      isHuman,
      wealth: existingWealth?.get(id) ?? 100,
      valuation: 0,
      strategy: 'truthful',
      active: true,
    })
  }
  return players
}

export function computeReservePrice(
  valuations: number[],
  config: SimulationConfig,
): number {
  const { reserve } = config
  switch (reserve.mode) {
    case 'fixed':
      return reserve.fixedValue
    case 'median_fraction':
      return Math.round(median(valuations) * reserve.medianFraction)
    case 'auto':
      return Math.round(median(valuations) * 0.9)
  }
}

export function prepareLot(
  players: Player[],
  config: SimulationConfig,
  rng: Rng,
  roundIndex: number,
): { players: Player[]; auction: AuctionState } {
  // Один RNG на лот, состояние сдвигается на каждого участника -
  // иначе fork(одинаковый offset) даёт всем одну оценку и стратегию.
  const lotRng = rng.fork(roundIndex * 1000 + 17)

  const updated = players.map((p) => ({
    ...p,
    valuation: sampleValuation(config.probs.valuation, lotRng),
    strategy: pickStrategy(config.probs.strategies, lotRng),
    active: true,
  }))

  const valuations = updated.map((p) => p.valuation)
  const reservePrice = computeReservePrice(valuations, config)
  const maxVal = Math.max(...valuations)

  let auction: AuctionState

  if (config.auctionType === 'english') {
    auction = {
      kind: 'english',
      tick: 0,
      currentPrice: 0,
      highBidderId: null,
      reservePrice,
      sold: false,
      ended: false,
      activeIds: updated.map((p) => p.id),
    }
  } else if (config.auctionType === 'dutch') {
    const startPrice = Math.ceil(maxVal * config.dutchStartMultiplier)
    auction = {
      kind: 'dutch',
      tick: 0,
      currentPrice: startPrice,
      startPrice,
      reservePrice,
      winnerId: null,
      sold: false,
      ended: false,
      activeIds: updated.map((p) => p.id),
    }
  } else {
    auction = {
      kind: 'sealed',
      reservePrice,
      bids: Object.fromEntries(updated.map((p) => [p.id, null])),
      allSubmitted: false,
      ended: false,
    }
  }

  return { players: updated, auction }
}

export function needsTickLoop(config: SimulationConfig): boolean {
  return isTickAuction(config.auctionType)
}
