import type { StrategyKind } from './types.ts'

export function maxBidForStrategy(
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
