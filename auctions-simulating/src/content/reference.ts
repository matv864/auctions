import type { AuctionType, StrategyKind } from '../simulation/types.ts'

export const STRATEGY_LABELS: Record<StrategyKind, string> = {
  truthful: 'Честная',
  shade: 'Занижающая',
  aggressive: 'Агрессивная',
  passive: 'Пассивная',
}

export const STRATEGY_HINTS: Record<StrategyKind, string> = {
  truthful:
    'Ставит до своей оценки лота.',
  shade:
    'Занижает ставки (около 75% от оценки), чтобы платить меньше при победе.',
  aggressive:
    'Готов платить ближе к оценке и чуть выше; чаще остаётся в торгах.',
  passive:
    'Осторожна: часто пасует, если цена уже съела большую часть выгоды.',
}

export const AUCTION_LABELS: Record<AuctionType, string> = {
  english: 'Английский',
  dutch: 'Голландский',
  sealed_first: 'Закрытый (1-я цена)',
  sealed_second: 'Закрытый (2-я цена)',
}

export const AUCTION_HINTS: Record<AuctionType, string> = {
  english:
    'Цена растёт по тикам. Участники по очереди повышают ставку или выходят. Победитель - кто дал максимум; платит свою последнюю ставку. Ниже текущей цены или минимального шага - пас.',
  dutch:
    'Стартовая цена высокая и снижается каждый тик. Первый, кто принимает текущую цену, выигрывает и платит её. «Ждать» - не покупать сейчас, но остаться в торгах при снижении цены.',
  sealed_first:
    'Все подают одну скрытую ставку. Побеждает максимум; платит свою ставку (первая цена). Ставки видны только после разыгрывания.',
  sealed_second:
    'Как закрытый аукцион, но победитель платит вторую по величине ставку (механизм Викри). Честная ставка ≈ своей оценке.',
}

export const ALL_STRATEGIES: StrategyKind[] = [
  'truthful',
  'shade',
  'aggressive',
  'passive',
]

export function strategyLabel(kind: StrategyKind): string {
  return STRATEGY_LABELS[kind]
}

export function auctionTypeLabel(type: AuctionType): string {
  return AUCTION_LABELS[type]
}
