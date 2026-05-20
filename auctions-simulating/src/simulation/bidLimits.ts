import type { StrategyKind } from './types.ts'

export function maxBidForStrategy(
  strategy: StrategyKind,
  valuation: number,
): number {
  switch (strategy) {
    case 'truthful':
      return valuation
    case 'shade':
      return Math.floor(valuation * 0.6)
    case 'aggressive':
      return valuation * 0.95
    case 'passive':
      return Math.floor(valuation * 0.5)
  }
}
