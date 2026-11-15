export const territoryCodes = ['GP', 'MQ', 'GF'] as const
export type TerritoryCode = (typeof territoryCodes)[number]

export const territoryLabels: Record<TerritoryCode, string> = {
  GP: 'Guadeloupe',
  MQ: 'Martinique',
  GF: 'Guyane',
}

export const territorySourceKinds = ['artist_declaration', 'public_source'] as const
export type TerritorySourceKind = (typeof territorySourceKinds)[number]
