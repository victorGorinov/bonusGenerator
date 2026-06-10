# Poker Promo Calculator — Спецификация

Версия 0.1 · 2026-06-01 · новая вертикаль Bonus Engine для промо-кампаний покер-рума

Документ описывает доменную модель, параметры, формулы, API и структуру файлов покерных промо-калькуляторов — в архитектурном стиле существующего движка (чистые функции `buildConfig`/`recalcCosts`, инъекция AIProvider, Zod-валидация, factory-контроллеры). Параллель — `SPORTSBOOK_SPEC.md`.

---

## 1. Чем покер отличается от casino и sportsbook

| | Casino | Sportsbook | **Poker** |
|---|---|---|---|
| Источник дохода | house edge (1−RTP) | margin / overround | **rake** (комиссия с банка / бай-ина) |
| Единица экономики | turnover на слотах | turnover ставок | **rake per player** (зависит от лимита и объёма игры) |
| Главный риск промо | дисперсия выплат | арбитраж | **clear rate** (отыгрыш) + **overlay** (недобор гарантии) |
| Возврат стоимости | — | margin recovery | **rake recovery** (промо окупается сгенерённым rake) |
| Флагман-промо | deposit match + FS | free bet | **rakeback** + **deposit bonus с rake-clearing** |

Вывод: **новая доменная модель**, не geo-конфиг. AI-слой (texts/audit/optimize) и loyalty-механика переиспользуются.

---

## 2. Доменные параметры (вход)

```ts
interface PokerParams {
  region: Region;            // переиспользуем
  lic: License;
  sitecur: CurrencyCode;
  players: number;
  segment: Segment;          // new | mid | vip (vip = регуляры/хайроллеры)
  // покер-специфика:
  format: PokerFormat;       // 'cash' | 'mtt' | 'sng' | 'spin'
  rakePct: number;           // комиссия с банка, напр. 0.05 (5%), cap учитывается отдельно
  rakeCap: number;           // потолок rake с одного банка, sitecur
  handsPerWeek: number;      // рук/нед на игрока (cash) — драйвер rake
  avgPot: number;            // средний банк, sitecur (cash)
  avgBuyin: number;          // средний бай-ин (mtt/sng/spin), sitecur
  tourneysPerWeek: number;   // турниров/нед на игрока
  promoType: PokerPromoType;
}

type PokerFormat    = 'cash' | 'mtt' | 'sng' | 'spin';
type PokerPromoType = 'rakeback' | 'deposit_clear' | 'mtt_overlay' | 'freeroll'
                    | 'leaderboard' | 'bad_beat' | 'loyalty_points';
```

---

## 3. Базовая величина — Rake per player

Всё строится поверх ожидаемого rake. Две формулы по формату:

```
// Cash-игры:
rakePerWeek_cash = handsPerWeek × min(avgPot × rakePct, rakeCap) × playerShareOfPot
                   // playerShareOfPot ≈ 1/avgPlayersPerPot (rake делится между игроками банка)

// Турниры (mtt/sng/spin):
rakePerWeek_tourney = tourneysPerWeek × avgBuyin × tourneyRakePct
                      // tourneyRakePct обычно 5–10% поверх призового

rakePerPlayerMonth = (rakePerWeek_*) × 4.3
ggrMonthly         = players × rakePerPlayerMonth   // GGR покер-рума = собранный rake
```

`rakePerPlayerMonth` — покерный аналог `arpu`; от него считается и стоимость промо, и его покрытие.

---

## 4. Формулы стоимости промо

### 4.1 Rakeback

```
costRakeback = rakebackPct × rakePerPlayerMonth × players × activeShare
               // activeShare — доля, реально получающая rakeback (регуляры ≈ 1.0, casual ниже)
```

Чистая стоимость = прямой вычет из rake. Нет дисперсии — детерминированно.

### 4.2 Deposit bonus с rake-clearing

```
bonusSize     = avgdep × matchPct
releaseRatio  = bonusSize / requiredRake        // $ бонуса за $1 rake
expReleased   = bonusSize × clearRate            // clearRate ≈ 0.30–0.60
rakeGenerated = requiredRake × clearRate         // rake, набранный в процессе отыгрыша
netCost       = expReleased − rakeGenerated × rakeMarginKept
```

Ключ: при `requiredRake` достаточно высоком сгенерённый rake **полностью покрывает** выданный бонус (rake recovery). `clearRate` — главный рычаг экономики.

### 4.3 MTT overlay (гарантированные турниры)

```
entriesExpected = eligible × participationRate
buyinsCollected = entriesExpected × avgBuyin
prizeContribution = buyinsCollected × (1 − tourneyRakePct)
overlay         = max(0, guarantee − prizeContribution)   // прямой убыток при недоборе
rakeFromEvent   = buyinsCollected × tourneyRakePct
netCost_overlay = overlay − rakeFromEvent
```

Критично: `overlay` — реальные деньги из кармана оператора. Калькулятор подбирает `guarantee`, при котором ожидаемый недобор приемлем.

### 4.4 Freeroll / ticket value

```
costFreeroll = prizePool   // прямой расход
roiFreeroll  = (newPlayers × LTV_rake) / prizePool   // окупаемость через привлечённый rake
```

### 4.5 Leaderboard / rake race

```
costLeaderboard = leaderboardPool
// ВАЖНО: каннибализация с rakeback — один rake «оплачивается» дважды
effectiveRakeGiveback = rakebackPct + leaderboardPool / ggrMonthly
// econ показывает СОВОКУПНЫЙ giveback, иначе оператор переплачивает
```

### 4.6 Bad beat jackpot

```
contribPerHand = avgPot × bbjDropPct
P(trigger)     = биномиальная вероятность квалифицирующей раздачи (редкое событие)
jackpotFunding = contribPerHand × totalHands
expectedPayout = P(trigger) × jackpotSize
// риск — недофинансирование при кластеризации срабатываний
```

---

## 5. econ объект (по образцу casino)

```ts
interface PokerEcon {
  rakePerPlayerMonth: number;  // sitecur — ядро
  ggrMonthly: number;          // = собранный rake
  promoCost: number;           // из §4, sitecur
  rakeRecovery: number;        // часть стоимости, покрытая сгенерённым rake
  netPromoCost: number;        // promoCost − rakeRecovery
  costRatio: number;           // netPromoCost / ggrMonthly
  clearRate?: number;          // для deposit_clear
  overlayRisk?: number;        // для mtt_overlay — ожидаемый недобор
  combinedGiveback?: number;   // rakeback + leaderboard (анти-каннибализация)
  retentionLift: number;       // удержание регуляров
  roi3: number;
  breakeven_rake: number;      // rake, нужный чтобы промо вышло в ноль = promoCost / rakeMarginKept
}
```

`breakeven_rake` — покерный аналог `breakeven_wager`/`breakeven_turnover`.

---

## 6. Регуляторные блоки

| Лицензия | Правила для покер-промо |
|---|---|
| **UKGC** | прозрачность rakeback/clear-условий; запрет вводящих в заблуждение «гарантий»; RG-лимиты; bonus T&C значимость |
| **MGA** | прозрачные условия отыгрыша, fair rake disclosure |
| **DGA (DK)** | ROFUS-совместимость; ограничения на рекламные формулировки |
| **none** (CIS/crypto/latam) | базовые T&C; агрессивный rakeback/VIP допустим |

Отдельный аудит-чек `clear_transparency`: условия rake-clearing должны быть явными (hard-fail для UKGC при скрытых требованиях).

---

## 7. API-роуты

| Method | Path | Limiter | Schema | Handler |
|---|---|---|---|---|
| POST | `/api/poker/generate` | 20/min | PokerGenerateSchema | `createPokerController().generate` |
| POST | `/api/poker/recalc` | 30/min | PokerRecalcSchema | `createPokerController().recalc` |
| POST | `/api/poker/texts` | 15/min | PokerTextsSchema | `createPokerController().texts` |
| POST | `/api/poker/audit` | 15/min | PokerAuditSchema | `createPokerController().audit` |
| POST | `/api/poker/optimize` | 15/min | PokerOptimizeSchema | `createPokerController().optimize` |

---

## 8. Структура файлов

```
src/
├── domain/
│   └── poker/                        # НОВОЕ
│       ├── buildPokerConfig.ts       # params → полный poker-конфиг
│       ├── recalcPokerCosts.ts       # cfg + overrides → { costs, ratio, rakeRecovery }
│       ├── rake.ts                   # rakePerPlayer по формату (cash/mtt/sng/spin)
│       ├── rakeback.ts               # §4.1
│       ├── depositClear.ts           # §4.2 — clear rate модель
│       ├── overlay.ts                # §4.3 — MTT overlay
│       ├── leaderboard.ts            # §4.5 — анти-каннибализация
│       └── badBeat.ts                # §4.6 — биномиальный джекпот
├── ai/prompts/
│   ├── poker-texts.prompt.ts
│   ├── poker-audit.prompt.ts         # + per-license (UKGC clear_transparency hard-fail)
│   └── poker-optimize.prompt.ts
├── use-cases/GeneratePoker.ts
├── controllers/poker.controller.ts   # createPokerController({ ai })
├── services/poker.service.ts
├── routes/poker.routes.ts
└── validation/
    ├── poker-generate.schema.ts
    ├── poker-recalc.schema.ts
    ├── poker-texts.schema.ts
    ├── poker-audit.schema.ts
    └── poker-optimize.schema.ts

public/
├── poker-generator.html
├── poker-generator.js
└── poker-econ.js                     # клиентский порт recalcPokerCosts (для live-превью + balance-solver)

tests/
└── domain/
    ├── rake.test.js                  # cash vs tourney rake, cap, playerShareOfPot
    ├── depositClear.test.js          # clearRate → netCost, rake recovery
    ├── overlay.test.js               # недобор → overlay > 0, перебор → 0
    └── leaderboard.test.js           # combinedGiveback учитывает rakeback
```

---

## 9. AI response schemas

`PokerAuditResponseSchema`: `checks[5]{label,status,note,rule?}` — обязательные чеки `clear_transparency`, `overlay_risk`, `rake_recovery`, `giveback_cannibalization`, `rg_limits`.

`PokerOptimizeResponseSchema`: `{ recommendations[1-5]{param,current,target,reason,impact} }` — параметры: `rakebackPct`, `requiredRake`, `matchPct`, `guarantee`, `leaderboardPool`, `bbjDropPct`.

---

## 10. Переиспользование существующих модулей

- **Loyalty-генератор** — poker points / VPP это та же tier+missions механика; earn считается от rake вместо депозита. Можно не строить заново, а добавить `earnBasis: 'rake'` в loyalty-параметры.
- **Tournament econ** — MTT overlay это инверсия `calcTournamentEconomics`; часть логики (eligible, participation) переиспользуется.
- **Auto-Balance (группа J)** — `balance-solver.js` применим: чистый рычаг для покера — `requiredRake↑` (удешевляет deposit-clear, не трогая привлекательность) и `guarantee↓` (режет overlay). Метрика — `costRatio` / `netPromoCost`.

---

## 11. Порядок внедрения (MVP → full)

1. **MVP:** `rake.ts` + `rakeback.ts` + `overlay.ts` + `buildPokerConfig` + `/generate` + `/recalc` + UI (rakeback + MTT overlay — два самых востребованных). Daily-метрики: rake per player, costRatio, overlay risk.
2. Deposit bonus с rake-clearing (clear rate модель).
3. Leaderboard (анти-каннибализация) + freeroll + bad beat.
4. AI texts + audit (UKGC clear_transparency hard-fail) + optimize.
5. Poker points через loyalty-генератор (`earnBasis: 'rake'`).
6. Auto-Balance кнопка (переиспользует `balance-solver.js`).

---

## Открытые вопросы

- **playerShareOfPot** — упрощать до константы (≈0.18 при 5.5 игроков/банк) или параметризовать по лимиту/формату?
- **clearRate** — фиксированный бенчмарк по сегменту или вход пользователя со слайдером?
- **Spin-формат** (лотерейные SnG) — отдельный RTP-калькулятор множителей или out of scope для v1?
- **Poker points** — строить внутри poker-вертикали или расширить loyalty-генератор флагом `earnBasis`?
