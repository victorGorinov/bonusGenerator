export { EU }     from './eu.js';
export { CIS }    from './cis.js';
export { CRYPTO } from './crypto.js';
export { SWEEP }  from './sweep.js';
export { MN }     from './mn.js';
export { LATAM }  from './latam.js';
export { MENA }   from './mena.js';
export { GCC }    from './gcc.js';

import { EU }     from './eu.js';
import { CIS }    from './cis.js';
import { CRYPTO } from './crypto.js';
import { SWEEP }  from './sweep.js';
import { MN }     from './mn.js';
import { LATAM }  from './latam.js';
import { MENA }   from './mena.js';
import { GCC }    from './gcc.js';

export const GEO = { eu: EU, cis: CIS, crypto: CRYPTO, sweep: SWEEP, mn: MN, latam: LATAM, mena: MENA, gcc: GCC };
export type GeoKey = keyof typeof GEO;
