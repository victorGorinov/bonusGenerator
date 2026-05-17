export { EU }     from './eu.js';
export { CIS }    from './cis.js';
export { CRYPTO } from './crypto.js';
export { SWEEP }  from './sweep.js';
export { MN }     from './mn.js';
export { LATAM }  from './latam.js';

import { EU }     from './eu.js';
import { CIS }    from './cis.js';
import { CRYPTO } from './crypto.js';
import { SWEEP }  from './sweep.js';
import { MN }     from './mn.js';
import { LATAM }  from './latam.js';

export const GEO = { eu: EU, cis: CIS, crypto: CRYPTO, sweep: SWEEP, mn: MN, latam: LATAM };
export type GeoKey = keyof typeof GEO;
