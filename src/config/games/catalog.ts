import { createRequire } from 'module';

export type Mechanic    = 'slot' | 'crash' | 'live' | 'table';
export type Volatility  = 'low' | 'mid' | 'high';
export type MinBetTier  = 'low' | 'mid' | 'high';

export interface Game {
  id:          string;
  name:        string;
  provider:    string;
  mechanic:    Mechanic;
  volatility:  Volatility;
  rtp:         number;
  regions:     string[];   // eu | cis | crypto | sweep | mn | latam
  segments:    string[];   // all | new | mid | vip | dormant | depositors
  mobile:      boolean;
  minBetTier:  MinBetTier;
  slotRank:    number | null;  // lower = more popular; null until refreshed
}

const _require = createRequire(import.meta.url);

export function loadCatalog(): Game[] {
  return _require('./catalog.json') as Game[];
}
