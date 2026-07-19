# Копидек: тексты для объяснимости параметров (Слой A)

Статус: на вычитку эксперта. Все строки — RU + EN (проект двуязычный).
Плейсхолдеры `{wW}`, `{rec}`, `{min}`, `{max}`, `{value}`, `{регион}`, `{лицензия}` подставляются в рантайме.
Дата: 2026-07-19. Связано с [param-explainability-plan.md](param-explainability-plan.md).

---

## A1 — Бенчмарк-бэнды у полей

### Строка диапазона под инпутом

| Случай | RU | EN |
|---|---|---|
| Обычный бэнд | `Рекоменд.: {min}–{max}×` | `Rec.: {min}–{max}×` |
| С регуляторным потолком | `Лимит: ≤{cap}× ({лиц.})` | `Cap: ≤{cap}× ({lic.})` |
| Match% / суммы | `Рекоменд.: {min}–{max}%` | `Rec.: {min}–{max}%` |

### Состояния чипа (цветной индикатор)

| Состояние | Цвет | RU | EN |
|---|---|---|---|
| В диапазоне | 🟢 | `в норме` | `on target` |
| Ниже min | 🟡 | `ниже нормы` | `below range` |
| Выше max | 🟡 | `выше нормы` | `above range` |
| Выше рег. потолка | 🔴 | `превышает лимит` | `exceeds cap` |

### Тултипы «почему» (ℹ у каждого параметра)

**Вейджер велкама (w_wager)**
- RU: «Вейджер велкама — баланс между привлекательностью для игрока и защитой от абуза. Велкам работает на **привлечение** (низкая маржа), поэтому высокий вейджер бьёт по конверсии. Рыночная практика: {rec}×. Выше {max}× игроки воспринимают бонус как невыгодный.»
- EN: «Welcome wager balances player appeal against abuse protection. Welcome is an **acquisition** tool (low margin), so a high wager hurts conversion. Market practice: {rec}×. Above {max}× players see the bonus as poor value.»

**Вейджер релоуда (rl_wager)**
- RU: «Релоуд нацелен на лояльную аудиторию — условия мягче велкама, обычно на ~5× ниже. Здесь живёт маржа, но не задирайте вейджер: цель — удержание, а не разовый заработок.»
- EN: «Reload targets loyal players — softer terms than welcome, usually ~5× lower. Margin lives here, but don't over-raise the wager: the goal is retention, not one-off profit.»

**Вейджер NDB (ndb_wager)**
- RU: «NDB — бездепозитный бонус (free money), поэтому вейджер выше и обычно есть кэп на макс-выигрыш. Но игроки массово игнорируют NDB с вейджером выше 35× — тренд рынка вниз. Рекоменд.: {rec}×.»
- EN: «NDB is a no-deposit bonus (free money), so the wager is higher and a max-win cap is typical. But players widely ignore NDB above 35× — the market trend is downward. Rec.: {rec}×.»

**Match% велкама (w_pct)**
- RU: «Процент матча: 100% — универсальный стандарт (казино удваивает депозит). Выше 100% — осознанные маркетинговые траты, а не дефолт: требует более высокого вейджера и повышает стоимость. Диапазон практики: 100–200%.»
- EN: «Match %: 100% is the universal standard (the casino doubles the deposit). Above 100% is deliberate marketing spend, not a default: it needs a higher wager and raises cost. Practice range: 100–200%.»

**Match% релоуда (rl_pct)**
- RU: «Матч релоуда обычно ниже велкама (25–75%), с кэпом суммы. Частая практика — 50%.»
- EN: «Reload match is usually lower than welcome (25–75%), with an amount cap. Common practice — 50%.»

**Макс-бонус (w_maxB / rl_maxB)**
- RU: «Макс-бонус — операторский рычаг; жёстких регуляторных лимитов почти нет (исключение — Дания, DKK 1000). Задаётся кратно депозиту. Чем выше кэп, тем больше макс-риск на игрока.»
- EN: «Max bonus is an operator lever — few hard regulatory caps (exception: Denmark, DKK 1000). Set as a multiple of the deposit. A higher cap means higher max risk per player.»

**Сумма NDB (ndb_amt)**
- RU: «Сумма NDB маленькая по дизайну ($10–30) — «пробник» без депозита. Обычно ограничен макс-выигрыш ($50–100).»
- EN: «NDB amount is small by design ($10–30) — a no-deposit taster. Max win is usually capped ($50–100).»

---

## A2 — Роли механик + guardrail

### Бейджи ролей

| Механики | RU | EN |
|---|---|---|
| Welcome, NDB | `Привлечение · low-margin` | `Acquisition · low-margin` |
| Reload, Cashback, dep2, dep3 | `Удержание · маржа` | `Retention · margin` |

### Тултип роли — Привлечение

- RU: «Велкам и NDB — самая низкомаржинальная часть экономики бонусов, но критичны для маркетинга и конверсии новых игроков. Не гонитесь за маржой здесь — прибыль приходит из релоуда, кэшбэка и депозитной цепочки.»
- EN: «Welcome and NDB are the lowest-margin part of bonus economics but critical for marketing and new-player conversion. Don't chase margin here — profit comes from reload, cashback, and the deposit chain.»

### Тултип роли — Удержание

- RU: «Релоуд, кэшбэк и 2-й/3-й депозиты работают на удержание уже привлечённых игроков. Здесь основная маржа — но мягкие условия важнее разового заработка.»
- EN: «Reload, cashback, and 2nd/3rd deposits drive retention of already-acquired players. The main margin sits here — but soft terms matter more than one-off profit.»

### Guardrail-баннер (велкам-вейджер > band.max)

- RU: «⚠ Вейджер велкама {value}× выше рыночной практики ({rec}×). Высокий вейджер на первом бонусе снижает конверсию новых игроков — велкам должен привлекать, а не зарабатывать. Рассмотрите {min}–{max}×.»
- EN: «⚠ Welcome wager {value}× is above market practice ({rec}×). A high wager on the first bonus reduces new-player conversion — welcome should attract, not earn. Consider {min}–{max}×.»

---

## A3 — Честная копирайт-правка (explanation.ts)

**Было** (`src/domain/campaign/explanation.ts:39`):
`Wagering ×{wW} calculated via Truncated Normal — optimal balance of payouts and margin`
→ ложный оверклейм: вейджер не оптимизируется моделью, это дефолт гео.

**Станет:**
- RU: «Вейджер ×{wW} — baseline для {регион}/{лицензия}; рекоменд. диапазон {min}–{max}×»
- EN: «Wagering ×{wW} — baseline for {region}/{license}; recommended range {min}–{max}×»

*(При реализации подстрою под текущую локализацию файла + просканирую остальные строки на «optimal/calculated» оверклеймы.)*

---

## A4 — Регуляторные предупреждения

### 🇧🇷 BR welcome — жёсткий запрет (лиц. bets_br, механика welcome)

- RU: «🚫 Регуляторный запрет: в регулируемой Бразилии (режим «Bets», Law 14.790/2023, ст. 29) велкам-бонусы запрещены в любой форме, включая фриспины. Механика оставлена для оффшорных/грей-сценариев — для лицензированного BR удалите её вручную.»
- EN: «🚫 Regulatory ban: in regulated Brazil ("Bets" regime, Law 14.790/2023, Art. 29) welcome bonuses are prohibited in any form, including free spins. The mechanic is kept for offshore/grey scenarios — for licensed BR, remove it manually.»

### 🇧🇷 BR reload/NDB — мягкая пометка

- RU: «⚠ Проверьте локальные ограничения: правила Бразилии по бонусам действующим игрокам неоднозначны — уточните перед запуском.»
- EN: «⚠ Check local restrictions: Brazil's rules on bonuses for existing players are ambiguous — verify before launch.»

### ⚖️ UKGC — потолок вейджера (лиц. ukgc)

- RU: «⚖ Лимит UKGC: вейджер на все бонусы ≤ 10× (действует с 19.01.2026).»
- EN: «⚖ UKGC cap: wager on all bonuses ≤ 10× (effective 19 Jan 2026).»

### ⚖️ DGA (Дания) — потолок вейджера + суммы (лиц. dga)

- RU: «⚖ Лимит Дании (DGA): вейджер ≤ 10× и сумма бонуса ≤ DKK 1000 на любой бонус.»
- EN: «⚖ Denmark (DGA) cap: wager ≤ 10× and bonus amount ≤ DKK 1000 for any bonus.»

### ℹ️ CO (Колумбия) — volume-cap (лиц. coljuegos)

- RU: «ℹ Колумбия (Coljuegos, Res. 20250022644): суммарные бонусы ограничены 1.6% GGR/мес — планируйте бюджет, а не вейджер.»
- EN: «ℹ Colombia (Coljuegos, Res. 20250022644): total bonuses capped at 1.6% of GGR/month — plan budget, not wager.»

---

## Сводка объёма текстов

- A1: 3 формата строки-диапазона + 4 состояния чипа + 7 тултипов «почему»
- A2: 2 бейджа + 2 тултипа роли + 1 guardrail-баннер
- A3: 1 замена (+ скан оверклеймов)
- A4: 5 регуляторных сообщений

Всего ~24 текстовых блока × 2 локали. Все встают в существующие i18n-паттерны (configurator.js dict / `_NAV_I18N` / explanation.ts).
