# Feature spec — Game Recommendations for Tournaments

Instruction file for a Claude Code session. Read fully before coding.
Created: 2026-05-31. Owner: Victor.

---

## Session rule (from CLAUDE.md)

**ОБЯЗАТЕЛЬНО перед любым кодингом** — запросить явное подтверждение у пользователя.
Описать план → дождаться "да"/"go"/"реализуй" → только потом менять файлы.

Realize the feature in **3 phases**. After each phase, stop and show the result before continuing.

---

## Goal

Recommend specific casino games for a tournament based on **region (geo) × user segment × tournament type × scoring model**, to raise player participation/conversion. Plugs into the existing Tournament Generator, which already computes economics (`calcTournamentEconomics`) and texts/audit, but says nothing about *which games* to run the tournament on.

## Why it works on conversion

A tournament converts when the entry barrier is low: the game is familiar and popular in the player's region, and its scoring mechanic matches how they already play. Mismatch (e.g. offering live-roulette to a slots VIP) kills participation. Recommendation = intersection of **region × segment × tournament type**.

---

## Decisions already made (do not re-litigate)

1. **Catalog = concrete games** (real market titles + provider), not just categories.
2. **Data source = Slotcatalog.com** — uses their SlotRank metric (live popularity by real casino activity, updates daily, differs per country) + provider + RTP.
3. **Integration = periodic snapshot (Variant A).** A script parses Slotcatalog → commits `catalog.json` to repo. `recommendGames` stays a pure, fast function over the snapshot — **no network call in the request hot path.** Refresh runs manually now; schedule later.
4. **Selection logic = deterministic scoring + AI rationale.** Deterministic scoring picks top-N; Haiku writes a short "why this pool fits this segment/region" (same pattern as existing texts/audit).
5. **Output = top-5 primary + 5 alternatives** per request.

---

## Geo / segment / type vocabulary (match existing schema)

From `src/validation/tournament.schema.ts` and `src/domain/shared/`:

- `type`: `slot | live | mixed | prize_drop`
- `scoring`: `total_wins | highest_multiplier | most_spins | mission_based`
- `segment`: `all | new | vip | dormant | depositors`
- `geo`: country code (de/fr/es/it/nl/dk/uk/ru/kz/mn/us/mx/br), maps to region via `GEO_CFG` in `src/domain/campaign/scenarios.ts`
- regions: `eu | cis | crypto | sweep | mn | latam`

---

## Starter catalog composition (~15–20 games per geo)

Curated from current market popularity (verified May 2026 via Slotcatalog + market research). The refresh script will later re-rank these by live SlotRank; this is the day-1 snapshot.

**EU (mga/ukgc/dga) — slots + live-casino**
Slots: Gates of Olympus, Sweet Bonanza, Big Bass Bonanza, Big Bass Splash (Pragmatic/Reel Kingdom); Book of Dead, Reactoonz (Play'n GO); Fire in the Hole 3, San Quentin xWays (Nolimit City); Gonzo's Quest, Starburst (NetEnt); Bonanza Megaways (BTG); Sugar Rush 1000 (Pragmatic).
Live: Crazy Time, Lightning Roulette, Monopoly Live, XXXtreme Lightning Roulette, Gonzo's Treasure Hunt (Evolution).
UK note: bet-cap slots + game-shows under UKGC.

**CIS (ru/kz) — high-vol slots, RUB/KZT**
Gates of Olympus, Sweet Bonanza, The Dog House (Pragmatic); Book of Dead (Play'n GO); Fire in the Hole 3, Tombstone RIP (Nolimit City); Slot of Wonders, Solar Queen (Playson); Big Bass 10k Ways (ReelPlay); Red Tiger / Quickspin / ELK titles; Aviator (Spribe — very popular in CIS); live roulette/blackjack with Russian-speaking dealers.

**LATAM (mx/br) — crash-dominant + slots**
Aviator (Spribe — #1 in Brazil), JetX (SmartSoft), Spaceman (Pragmatic); Gates of Olympus, Sweet Bonanza, Big Bass (Pragmatic); Fortune Tiger, Fortune Ox (PG Soft — huge in BR). Note: in Brazil crash outperforms slots on demand — reflect in scoring weights.

**Crypto (global) — provably-fair, crash**
Aviator (Spribe); Crash, Plinko, Limbo, Dice, Mines (Stake Originals); Gates of Olympus, Sweet Bonanza, Fire in the Hole 3, Sugar Rush (Pragmatic/Nolimit); Wanted Dead or a Wild (Hacksaw). Emphasis on provably-fair + instant cycle.

**Sweep (us) — sweepstakes-compatible**
Sweepstakes-compatible slots: Big Bass titles, Buffalo themes, Huff N' More Puff, classic Vegas slots; keno; scratch. Separate tags — content specific to sweepstakes model.

**MN (Mongolia) — slots, MNT, mobile-first**
Pragmatic/Play'n GO base (Gates, Sweet Bonanza, Book of Dead), PG Soft mobile slots; Aviator. Low minBet matters due to MNT denomination.

---

## Catalog data model

Each game in `catalog.json`:

```jsonc
{
  "id": "gates-of-olympus",
  "name": "Gates of Olympus",
  "provider": "Pragmatic Play",
  "mechanic": "slot",            // slot | crash | live | table
  "volatility": "high",          // low | mid | high
  "rtp": 96.5,
  "regions": ["eu", "cis", "crypto", "mn", "latam"],
  "segments": ["mid", "vip", "depositors"],  // tournament segment set
  "mobile": true,
  "minBetTier": "low",           // low | mid | high — for minBet-vs-segment penalty
  "slotRank": 3                  // from Slotcatalog; lower = more popular. null until refreshed
}
```

Notes:
- Tags not present in Slotcatalog (mechanic/volatility/segments/minBetTier) are set by heuristic from provider + mechanic, flagged for review.
- `segments` here uses the tournament segment vocabulary (`all/new/vip/dormant/depositors`), not the bonus `Segment` type.

---

## Files to create

```
scripts/refreshCatalog.ts              # parses Slotcatalog per-geo → catalog.json
src/config/games/catalog.json          # the snapshot (day-1 hand-seeded, later auto-refreshed)
src/config/games/catalog.ts            # types + loader for catalog.json
src/domain/tournament/recommendGames.ts# PURE scoring function
src/ai/prompts/tournament-games.prompt.ts  # buildGamesPrompt() — Haiku rationale
tests/domain/recommendGames.test.js
```

Files to modify:
```
src/ai/parser.ts                       # add GamesResponseSchema + parseGamesResponse()
src/use-cases/GenerateTournament.ts    # recommendTournamentGames(input, ai)
src/controllers/tournament.controller.ts # add games handler
src/routes/tournament.routes.ts        # POST /api/tournament/games (15/min, aiLimiter)
src/validation/tournament.schema.ts    # TournamentGamesSchema + Input type
public/tournament-generator.js         # "Recommended games" block in Step 2/3
public/tournament-generator.html       # markup hook
CLAUDE.md                              # document the new module + route + flow
```

---

## recommendGames — pure function

```ts
// src/domain/tournament/recommendGames.ts
export function recommendGames(params: {
  geo: string;        // country code
  region: string;     // resolved region (eu/cis/...)
  segment: string;    // all/new/vip/dormant/depositors
  type: string;       // slot/live/mixed/prize_drop
  scoring: string;    // total_wins/highest_multiplier/most_spins/mission_based
  plat?: string;      // mobile/desk/both — optional
}): {
  primary: Game[];        // top 5
  alternatives: Game[];   // next 5
  scores: Record<string, number>;
};
```

Scoring (additive, then sort desc):
- **+W_region** if `game.regions` includes `region`.
- **+W_segment** if `game.segments` includes `segment` (or segment === 'all').
- **Mechanic gate by tournament type:**
  - `type=live` → only `mechanic=live`/`table`.
  - `type=slot` → exclude `live`/`table`.
  - `type=mixed`/`prize_drop` → all mechanics allowed.
- **Scoring-model fit:**
  - `highest_multiplier` → boost `crash` + `high` volatility; penalize `low` vol.
  - `most_spins` → boost fast-cycle slots / `crash`.
  - `total_wins` → broad pool, slight boost to popular (low `slotRank`).
  - `mission_based` → neutral, prefer feature-rich slots.
- **Popularity:** `+ f(slotRank)` — lower rank → higher score (clamp when null).
- **minBet penalty:** if `minBetTier` high but segment is `new`/low-denomination geo (mn/cis) → penalty.
- **Mobile bonus:** if `plat` is mobile/both and `game.mobile` → small boost.

Keep it pure and deterministic — testable exactly like `calcEconomics.ts`. No network, no AI here.

Region resolution: reuse `GEO_CFG` from `src/domain/campaign/scenarios.ts` to map geo→region; don't duplicate.

---

## AI rationale layer (phase 2)

- `buildGamesPrompt({ region, segment, type, primary })` → Haiku writes 1 short paragraph + per-game one-liner ("why it fits"). Budget ~600 tokens.
- `GamesResponseSchema` (Zod) in `src/ai/parser.ts`:
  `{ rationale: string, games: { id: string, why: string }[] }`
- Route: `POST /api/tournament/games`, `aiLimiter` (15/min), validate via `TournamentGamesSchema`.
- Use-case method `recommendTournamentGames(input, ai)` in `GenerateTournament.ts`; controller via factory injection (`createTournamentController({ ai })`).
- MockAIProvider coverage in tests.

The deterministic pool is computed first (server-side, no AI). AI only annotates the already-chosen games — so a failed/slow AI call degrades gracefully to the unannotated pool.

---

## refreshCatalog.ts — snapshot generator

- Iterates over the supported country codes; fetches the per-country Slotcatalog ranking page.
- Parses: game name, provider, RTP, SlotRank position.
- Merges with existing tag data (mechanic/volatility/segments/minBetTier) — preserves hand-curated tags, only updates ranking/RTP/availability.
- Writes `src/config/games/catalog.json` (stable key order for clean diffs).
- Run manually: `tsx scripts/refreshCatalog.ts`. Later wire to the `schedule` skill (weekly).
- Respect robots/ToS; cache politely; this is a build-time script, not a request-path call.

---

## Frontend (phase 3)

- "Recommended games" block in Tournament Generator Step 2/3 (`tournament-generator.js`).
- Cards: name, provider, volatility tag, RTP, one-line rationale.
- Recompute on segment chip / type / scoring change (same reactive pattern as the eligible-count hint).
- i18n RU/EN/MN/ES (match existing key style).
- AI-draft disclaimer consistent with `ai_draft_note` used in Campaign Generator.

---

## Tests (phase 1)

`tests/domain/recommendGames.test.js`:
- `br` + `highest_multiplier` → crash (Aviator/JetX) ranks top.
- `eu` + `vip` + `type=live` → Evolution game-shows; no slots in result.
- `ru` + `new` → low-vol simple slots near top; high-vol penalized.
- `type=slot` → zero `live`/`table` games in output.
- `mn` → high `minBetTier` games penalized.
- Determinism: same input → same ordering.
- Edge: empty pool after gating → returns empty primary, no throw.

Run: `npm test` (vitest). Add to existing 137-test suite.

---

## Phased plan

**Phase 1** — `catalog.json` (hand-seeded) + `catalog.ts` + `refreshCatalog.ts` + `recommendGames.ts` + `recommendGames.test.js`. Stop, show results.

**Phase 2** — `GamesResponseSchema` + prompt + use-case + controller + route + validation schema + MockAIProvider tests. Stop, show results.

**Phase 3** — frontend block + i18n + CLAUDE.md update. Stop, show results.

---

## Definition of done

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all green.
- `recommendGames` is pure (no imports of network/AI).
- Day-1 catalog works without running the refresh script.
- CLAUDE.md updated: new module, route table row, data-flow block.
