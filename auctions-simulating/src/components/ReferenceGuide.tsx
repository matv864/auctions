import {
  ALL_STRATEGIES,
  AUCTION_HINTS,
  AUCTION_LABELS,
  STRATEGY_HINTS,
  STRATEGY_LABELS,
} from '../content/reference.ts'
import type { AuctionType } from '../simulation/types.ts'

interface Props {
  auctionType: AuctionType
}

export function ReferenceGuide({ auctionType }: Props) {
  return (
    <aside className="reference-guide" aria-label="Памятка по аукциону и стратегиям">
      <h3 className="reference-title">Памятка</h3>

      <section className="reference-section">
        <h4>{AUCTION_LABELS[auctionType]}</h4>
        <p>{AUCTION_HINTS[auctionType]}</p>
      </section>

      <section className="reference-section">
        <h4>Стратегии участников</h4>
        <ul className="reference-list">
          {ALL_STRATEGIES.map((kind) => (
            <li key={kind}>
              <strong>{STRATEGY_LABELS[kind]}</strong>
              <span>{STRATEGY_HINTS[kind]}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
