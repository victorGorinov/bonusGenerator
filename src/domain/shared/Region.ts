export const REGIONS = ['eu', 'cis', 'crypto', 'sweep', 'mn', 'latam'] as const;
export type Region = typeof REGIONS[number];
export const isRegion = (r: unknown): r is Region => REGIONS.includes(r as Region);
