import type { ValuationDistributionConfig } from './types.ts'
import type { Rng } from './rng.ts'

export function sampleValuation(
  config: ValuationDistributionConfig,
  rng: Rng,
): number {
  if (config.kind === 'uniform') {
    return rng.nextInt(config.min, config.max)
  }
  const mean = (config.min + config.max) / 2
  const stdDev = config.stdDev ?? (config.max - config.min) / 6
  let value = mean
  for (let i = 0; i < 12; i++) {
    value += (rng.next() - 0.5) * stdDev
  }
  return Math.round(
    Math.min(config.max, Math.max(config.min, value)),
  )
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2
  }
  return sorted[mid]!
}
