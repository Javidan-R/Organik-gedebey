export type LoyaltyTier = {
  id: string
  name: string
  emoji: string
  minPoints: number
  maxPoints: number
  nextTierName: string | null
} 

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { id: 'green', name: 'Yaşıl Üzv', emoji: '🌿', minPoints: 0, maxPoints: 499, nextTierName: 'Gümüş' },
  { id: 'silver', name: 'Gümüş Üzv', emoji: '🥈', minPoints: 500, maxPoints: 1499, nextTierName: 'Qızıl' },
  { id: 'gold', name: 'Qızıl Üzv', emoji: '🥇', minPoints: 1500, maxPoints: Infinity, nextTierName: null },
]

export function getLoyaltyTier(points: number): LoyaltyTier {
  const tier = LOYALTY_TIERS.find((t) => points >= t.minPoints && points <= t.maxPoints);
  return tier ?? LOYALTY_TIERS[0];
}

export function getTierProgress(points: number): {
  tier: LoyaltyTier
  nextThreshold: number | null
  progressPercent: number
} {
  const tier = getLoyaltyTier(points)
  if (!tier.nextTierName) {
    return { tier, nextThreshold: null, progressPercent: 100 }
  }
  const currentIndex = LOYALTY_TIERS.indexOf(tier)
  const nextTier = LOYALTY_TIERS[currentIndex + 1]
  if (!nextTier) return { tier, nextThreshold: null, progressPercent: 100 }
  const range = nextTier.minPoints - tier.minPoints
  const progress = points - tier.minPoints
  return {
    tier,
    nextThreshold: nextTier.minPoints,
    progressPercent: Math.min(100, Math.round((progress / range) * 100)),
  }
}

export function computePointsFromOrderTotal(total: number): number {
  return Math.floor(total * 10)
}
