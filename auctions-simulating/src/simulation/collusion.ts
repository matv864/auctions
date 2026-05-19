import type {
  CollusionInfo,
  CollusionRole,
  Player,
  SimulationProbabilities,
} from './types.ts'
import type { Rng } from './rng.ts'

export function assignCollusion(
  players: Player[],
  probs: SimulationProbabilities,
  rng: Rng,
): CollusionInfo {
  const info: CollusionInfo = {
    sellerCollusion: false,
    ringActive: false,
    ringId: null,
    favoredPlayerId: null,
    ringMemberIds: [],
  }

  if (rng.chance(probs.sellerCollusion)) {
    info.sellerCollusion = true
    const bots = players.filter((p) => !p.isHuman)
    const favored = bots.length > 0 ? rng.pick(bots) : rng.pick(players)
    info.favoredPlayerId = favored.id
    favored.collusionRole = 'favored'
  }

  if (rng.chance(probs.participantRing) && players.length >= 3) {
    info.ringActive = true
    info.ringId = rng.nextInt(1, 9999)
    const ringSize = Math.min(
      players.length - 1,
      rng.nextInt(2, Math.max(2, Math.floor(players.length / 2))),
    )
    const shuffled = rng.shuffle(players)
    const members = shuffled.slice(0, ringSize)
    for (const m of members) {
      if (m.collusionRole !== 'favored') {
        m.collusionRole = 'ring_member'
        m.ringId = info.ringId
        info.ringMemberIds.push(m.id)
      } else {
        info.ringMemberIds.push(m.id)
      }
    }
  }

  return info
}

export function collusionRoleLabel(role: CollusionRole): string {
  switch (role) {
    case 'none':
      return '-'
    case 'ring_member':
      return 'кольцо'
    case 'favored':
      return 'фаворит'
  }
}
