/** Visual fixtures only. They do not describe the actual origins of these artists. */
export type TerritoryCode = 'GP' | 'MQ' | 'GF'
export type TerritoryCredit = {
  territories: TerritoryCode[]
  featuredTerritories: TerritoryCode[][]
  source: 'demo'
}
export const demoTerritoryCredits: Record<string, TerritoryCredit> = {
  'jooslyf-jalou-jalouz': { territories: ['GP'], featuredTerritories: [['MQ']], source: 'demo' },
  'reyel-ay-chargeur-camembert': { territories: ['GF'], featuredTerritories: [], source: 'demo' },
  'x-man-bad': { territories: ['MQ'], featuredTerritories: [], source: 'demo' },
  'saa-turn-gwo-kankan': {
    territories: ['GP'],
    featuredTerritories: [['GF'], ['MQ', 'GP']],
    source: 'demo',
  },
  'le-youth-bazarde': { territories: ['GF'], featuredTerritories: [['MQ']], source: 'demo' },
}
export const territoryLabels: Record<TerritoryCode, string> = {
  GP: 'Guadeloupe',
  MQ: 'Martinique',
  GF: 'Guyane',
}
export function getDemoTerritories(slug: string): TerritoryCode[] {
  const credits = demoTerritoryCredits[slug]
  return credits
    ? [...new Set([...credits.territories, ...credits.featuredTerritories.flat()])]
    : []
}
