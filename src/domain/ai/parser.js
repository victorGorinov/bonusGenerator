export function bonusLine(mech, type) {
  if (!mech) return 'bonus offer';
  if (type === 'cashback') return `Cashback ${mech.pct||10}% of losses, no wagering`;
  if (type === 'ndb')      return `Welcome: ${mech.fs||mech.amt||30}${mech.fs?' free spins':''} no deposit, wager ×${mech.wager||50}`;
  return `${mech.pct||100}% match up to ${mech.maxB||'?'} ${mech.cur||''}${mech.fs?`, ${mech.fs} free spins`:''}, min dep ${mech.minD||'?'} ${mech.cur||''}, wager ×${mech.wager||35}, ${mech.days||30} days${mech.code?`, code: ${mech.code}`:''}`;
}

export function tryRepairJSON(s) {
  try {
    const opens = [];
    let inStr = false, esc = false;
    for (const c of s) {
      if (esc)               { esc = false; continue; }
      if (c === '\\' && inStr){ esc = true;  continue; }
      if (c === '"')          { inStr = !inStr; continue; }
      if (inStr)              continue;
      if (c === '{' || c === '[') opens.push(c === '{' ? '}' : ']');
      else if ((c === '}' || c === ']') && opens.length) opens.pop();
    }
    let repaired = s;
    if (inStr) repaired += '"';
    for (let i = opens.length - 1; i >= 0; i--) repaired += opens[i];
    return JSON.parse(repaired);
  } catch (_) { return null; }
}

export function parseAI(text) {
  const s   = text.trim();
  const raw = s.startsWith('```') ? s.replace(/```json?\n?/g, '').replace(/```/g, '').trim() : s;
  try {
    return JSON.parse(raw);
  } catch (e) {
    const repaired = tryRepairJSON(raw);
    if (repaired) return repaired;
    throw e;
  }
}
