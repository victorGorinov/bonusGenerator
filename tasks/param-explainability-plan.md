# Tech-spec: Объяснимость параметров бонуса (Слой A)

Статус: черновик на утверждение. Кодинг не начат.
Дата: 2026-07-19.
Источник: фидбэк доменного эксперта (см. ниже).

## Проблема (из фидбэка)

1. Система предлагает параметры (вейджер, макс-бонус, match%), но **не объясняет почему** именно такие и **что будет, если их менять**.
2. Ожидаемая ментальная модель — «песочница»: калькулятор даёт baseline ≈ того, что ты сделал, дальше ты экспериментируешь («что если снизить вейджер до x25»).
3. Доменная правда, не отражённая в продукте: **велкам = самая низкомаржинальная, но маркетингово-необходимая часть**; вейджер x40 на первый бонус — «выстрел себе в колено», практика x25–x30 (минимум по ЛАТАМ).
4. Непонятно, **откуда взяты данные** — чтобы не строить решения на неверных вводных.

## Что подтвердил разбор кода

- Параметры — это lookup дефолтов гео/лицензии (`src/domain/bonus/buildConfig.ts` → `buildWager`), **не расчёт**. Формулы есть только для сумм (deposit-scaling с клампами), не для вейджера/match.
- `src/domain/campaign/explanation.ts:39` заявляет ложное: *«Wagering ×35 calculated via Truncated Normal — optimal balance»*. Вейджер не оптимизируется — это дефолт. **Оверклейм, чинить.**
- `src/config/geo/latam.ts:9` → `wW: 40` — ровно значение, которое эксперт называет вредным.
- Рядом с полями параметров нет ни рекомендованных диапазонов, ни тултипов (`mpInp()` в configurator.js — голый numeric input). Есть отдельный модальный глоссарий, но он расцеплён с полями.
- Live-пересчёт `/api/recalc` уже работает (основа для «песочницы» есть), но без точки отсчёта baseline и без подсказки direction/tradeoff.
- Провенанс: есть один сворачиваемый блок «Model assumptions» (SEG_LIFT + ARPU) в configurator.js:1398 — расширяемая основа.

## Объём Слоя A

- **A1** — benchmark-бэнды рядом с полями: рекомендованный диапазон + live green/amber/red + тултип «почему».
- **A2** — роли механик (Acquisition/loss-leader vs Retention/margin) + guardrail на высокий вейджер велкама.
- **A3** — честная копирайт-правка (убрать ложное «optimal»).
- **A4** — фикс дефолта ЛАТАМ + провенанс-комментарии на константах гео.

---

## A1. Benchmark-диапазоны параметров

### Новый модуль данных

`src/config/benchmarks/bonusBenchmarks.ts` — единый источник правды по рекомендованным диапазонам. Форма:

```ts
type Band = { min: number; rec: number; max: number };   // amber<min, green in [min,max], red>max
type ParamBenchmark = {
  band: Band;
  unit: 'x' | '%' | 'mult';
  rationaleKey: string;   // i18n-ключ для тултипа "почему"
};
// ключ: `${region}:${license}:${mechanic}:${param}` с фолбэком на region:*:mechanic:param
```

Клиентское зеркало `public/bonus-benchmarks.js` (тот же паттерн, что bonus-cost.js / loyalty-econ.js) + parity-тест.

### Диапазоны вейджера велкама (wW) — ИССЛЕДОВАНО, с источниками

> Собрано веб-исследованием 2026-07-19 (источники внизу раздела). Два значения — **регуляторные потолки** (UKGC, DGA),
> остальные — рыночная практика. Эксперт может подправить `rec`, но регуляторные `max` менять нельзя.

| Регион / лиц. | min | rec | max | Основание |
|---|---|---|---|---|
| eu / mga | 20 | 35 | 45 | Рыночная практика MGA: 35x типично, диапазон 20–50x |
| eu / ukgc | 1 | 5 | **10** | ⚖️ **Регуляторный потолок 10x** — UKGC, действует с 19.01.2026 на ВСЕ бонусы |
| eu / dga (DK) | 1 | 8 | **10** | ⚖️ **Регуляторный потолок 10x** (deposit+bonus) + кэп DKK 1000 |
| latam | — | — | — | **Разбит по странам — см. таблицу ниже** (базовый LATAM = Curaçao offshore для AR/CL) |
| cis | 25 | 35 | 45 | Практика Russia/KZ: 35x типично, диапазон 30–40x, до 50x |
| crypto | 25 | 40 | 50 | Индустр. среднее 35–40x; выше 50x считается «punishing» |

### LATAM — по странам (после разбивки региона)

> Структура кода: базовый LATAM = offshore Curaçao (Аргентина, Чили — grey/pending), плюс страновые
> license-блоки `bets_br` / `segob` / `coljuegos` / `mincetur`. Исследовано пострановно 2026-07-19.

| Страна | Блок | min | rec | max | Основание / регуляторика |
|---|---|---|---|---|---|
| 🇧🇷 Brazil | `bets_br` | ⛔ | **N/A** | ⛔ | **Велкам-бонусы ЗАПРЕЩЕНЫ полностью** — Law 14.790/2023, ст. 29 п. I («под любой формой, включая фриспины»). Регулируемый оператор их не предлагает. Текущий `wW: 35` в коде — вводит в заблуждение. |
| 🇲🇽 Mexico | `segob` | 20 | 35 | 45 | SEGOB — пермиссивный режим; 35x рыночное среднее (примеры 35–40x). Базовый inherits 40 → добавить override `wW: 35`. |
| 🇨🇴 Colombia | `coljuegos` | 20 | 30 | 40 | Coljuegos Res. 20250022644: бонусы ограничены **1.6% GGR/мес — это volume-cap, не wager-cap**. Часть операторов (Stake) ушли на 1x из-за VAT. Держим `wW: 35`, но настоящее ограничение — бюджет, не мультипликатор. |
| 🇵🇪 Peru | `mincetur` | 20 | 35 | 45 | MINCETUR — 35x среднее; игроки ценят 20–35x. Базовый inherits 40 → добавить override `wW: 35`. |
| 🇦🇷 Argentina | база LATAM (Curaçao) | 25 | 40 | 50 | Провинц./grey offshore — высокий вейджер обычен. Базовый `wW: 40` ок. |
| 🇨🇱 Chile | база LATAM (Curaçao) | 25 | 40 | 50 | Bill pending/grey; offshore Curaçao-дефолт. `wW: 40` ок. |

**Импликации для A4 (LATAM):**
- 🇧🇷 `bets_br` — **РЕШЕНО (эксперт, 2026-07-19):** подсвечивать запрет **warning-баннером, но НЕ удалять механику автоматически** — оператор решает и убирает велкам вручную. То есть: красный/варнинг-бейдж «Велкам-бонусы запрещены в регулируемом BR (Law 14.790, ст.29)» на карточке welcome при выбранной лицензии `bets_br`, welcome остаётся включаемым/редактируемым, никакого форс-отключения. Не блокировать генерацию.
- 🇲🇽 `segob`, 🇵🇪 `mincetur` — добавить `wager: { wW: 35 }` override (сейчас наследуют 40 из базы — вне rec-бэнда).
- 🇨🇴 `coljuegos` — `wW: 35` оставить; добавить rationale про 1.6%-volume-cap (влияет на бюджет-планирование, не на вейджер-бэнд).
- 🇦🇷/🇨🇱 (база) — базовый `wW: 40` в bende, оставить.

**⚠️ Найденные баги / риски данных (к A4):**
- `eu.ts:36` UKGC `wW: 10` — на грани легального потолка (ок, но rec должен быть ~5).
- `eu.ts:49` DGA `wW: 25` — **превышает легальный потолок 10x** (Дания). Снизить до ≤10. Фикс данных.
- `latam.ts:32` `bets_br.wager.wW: 35` — **велкам в регулируемой Бразилии запрещён вообще**; наличие welcome-блока + вейджера противоречит закону. Решить: hard-варнинг или скрытие механики.
- `latam.ts` `segob` / `mincetur` — нет `wager` override → наследуют базовый `wW: 40`, что выше rec-бэнда (35) для MX/PE. Добавить override.
- `latam.ts:9` базовый `wW: 40` — **корректен** для offshore-дефолта (AR/CL band 25–50), не баг.

**Провенанс-caveat (важно для честности):** рыночные котировки вейджера часто даются на **deposit+bonus (D+B)**, а `wW` в модели применяется к бонусу. При калибровке `rec` это учитываем; в drawer «Методология» (Слой B) явно пометим базу. Не смешивать молча.

### Остальные параметры — ИССЛЕДОВАНО (гео-независимые нормы + регуляторные оверрайды)

> Ключевой вывод: match%, вейджер релоуда, NDB — это **общерыночные нормы, слабо зависящие от гео**.
> Гео влияет только через **регуляторные потолки**, и они распространяются на ВСЕ типы бонусов (не только велкам):
> UK/DK вейджер ≤10x на welcome+reload+NDB; DK ≤ DKK 1000 на любой бонус; BR — запрет (см. ниже).

**Match% велкама (welcome pct):**

| | min | rec | max | Основание |
|---|---|---|---|---|
| Глобально | 50 | 100 | 200 | 100% — самый частый стандарт; диапазон 100–250%; выше 200% = агрессивно (требует высокого вейджера, red-flag) |

**Вейджер релоуда (wR):** ⚙️ rec **привязан к велкаму, не фиксированное число**

| | min | rec | max | Основание |
|---|---|---|---|---|
| Глобально | 20 | **`welcome_rec − 5`** (флор 20) | 40 | Практика: релоуд-вейджер сидит на ~5x ниже велкама (ретеншн-аудитория лояльнее, мягче условия). MGA/CIS → 30, LATAM base → 35. UK/DK: потолок 10x перекрывает. Плоское «30» заменил на относительное — точнее отражает практику. |

**Match% релоуда (reload pct):**

| | min | rec | max | Основание |
|---|---|---|---|---|
| Глобально | 25 | 50 | 75 | Релоуд-матч 25–75% (обычно кэп €50–200); ниже велкама по определению. Практика подтверждает rec 50. |

**NDB (no-deposit):**

| Параметр | min | rec | max | Основание |
|---|---|---|---|---|
| Сумма ($) | 5 | 15 | 30 | Типично $10–30; маленькая по дизайну. rec 15 подтверждён. |
| Вейджер | 30 | **35** | 50 | ⬇️ **Скорректировал 40→35 под практику**: сильнейший сигнал research — игроки массово игнорируют NDB с вейджером >35x, тренд рынка идёт к 35. Max-win cap $50–100 защищает оператора и без задранного вейджера. Согласуется с философией «не стреляй себе в колено». Текущий дефолт `latam.ndb.wager: 45` → выше rec (амбер). |

**Макс-бонус (maxBMulti / кэп суммы):**
- **Регуляторных кэпов суммы почти нет** — MGA/EU не фиксируют максимум, регулируют case-by-case (прозрачность/fairness). UK — нет кэпа суммы, но 10x вейджер.
- Жёсткий кэп только **DK: DKK 1000** на любой бонус. И BR — запрет велкама.
- Значит `maxBMulti` — операторский рычаг, не регуляторный: eu/mga 6 (band 3–8), latam 8 (4–10). Слабые источники — на утверждение эксперта.
- 🇨🇴 Colombia: не кэп суммы, а **1.6% GGR/мес на суммарные бонусы** — бюджетное ограничение (см. LATAM-таблицу).

**Регуляторные оверрайды (применять ко всем механикам):**

| Гео/лиц. | Правило | На что влияет |
|---|---|---|
| UKGC | вейджер ≤ 10x | welcome/reload/NDB/dep2/dep3 |
| DGA (DK) | вейджер ≤ 10x + сумма ≤ DKK 1000 | все бонусы |
| BR (bets_br) | велкам запрещён | welcome (reload/NDB — статус неясен, вероятно тоже ограничены; **уточнить**) |
| CO (coljuegos) | Σ бонусов ≤ 1.6% GGR/мес | бюджет кампании, не вейджер |

*(dep2/dep3 наследуют вейджер велкама +offset — отдельные бэнды не нужны. Cashback — вейджер обычно 0 (кэшбэк без отыгрыша) — отдельная категория, бэнд не требуется.)*

**Источники (match / reload / NDB / maxB):**
- Match%: [rotowire deposit-match](https://www.rotowire.com/betting/casinos/bonuses/deposit-match), [casino.org bonus](https://www.casino.org/us/bonus/)
- Reload: [ijsrp welcome vs reload](https://www.ijsrp.org/knowledge-base/gaming/differences-between-casino-welcome-bonuses-and-reload-offers/), [casinoguid reload](https://casinoguid.com/bonus/reload-bonus/)
- NDB: [covers no-deposit](https://www.covers.com/casino/bonuses/no-deposit), [next.io wagering guide](https://next.io/online-casinos-us/guide/what-are-wagering-requirements/)
- Max-bonus / EU caps: [everymatrix golden rules](https://everymatrix.com/golden-rules-casino-bonusing/), [wizardofvegas EU regs](https://wizardofvegas.com/articles/new-regulations-across-european-markets/)

**Источники (вейджер по гео):**
- MGA: [mr-gamble MGA guide](https://mr-gamble.com/en/online-casino/licenses/malta/), [betterbonus MGA](https://betterbonus.com/mga-casino/)
- UKGC 10x cap: [casinocompare.uk UKGC cap 2026](https://casinocompare.uk/resource/ukgc-wagering-cap-2026/), [ukbookmakers](https://www.ukbookmakers.org.uk/2025/03/gambling-commission-reveals-huge-changes-to-betting-bonus-wagering-requirements/)
- DGA: [iclg Denmark 2026](https://iclg.com/practice-areas/gambling-laws-and-regulations/denmark), [SCCG DGA promo rules](https://sccgmanagement.com/sccg-news/2025/7/16/danish-gambling-regulator-updates-rules-around-promotions-and-advertising/)
- LATAM (регион): [tips.gg Brazil bonuses](https://tips.gg/article/best-welcome-bonuses-for-brazilian-players-story/), [wizardofodds Mexico](https://wizardofodds.com/online-casinos/best-for-players-from-mexico)
- 🇧🇷 Brazil bonus-запрет: [env.media Brazil 2025](https://env.media/online-gambling-regulation-brazil-2025/), [iclg Brazil 2026](https://iclg.com/practice-areas/gambling-laws-and-regulations/brazil/)
- 🇲🇽 Mexico: [betpack Mexico](https://www.betpack.com/online-casinos/mexico/), [casino.guru Mexico](https://casino.guru/no-deposit-bonuses-casino/mexico)
- 🇨🇴 Colombia Res. 20250022644: [SiGMA Coljuegos bonus](https://sigma.world/news/coljuegos-bonus-regulation-colombia/), [gamingamerica Colombia](https://gamingamerica.com/news/14593/colombia-regulator-seeks-to-limit-online-gambling-bonuses)
- 🇵🇪 Peru: [askgamblers Peru](https://www.askgamblers.com/online-casinos/countries/pe/bonus), [wizardofodds Peru](https://wizardofodds.com/online-casinos/best-for-players-from-peru)
- CIS: [tribuna Kazakhstan](https://tribuna.com/en/casino/ratings/kazakhstan-casinos/), [slotsspot Russia](https://slotsspot.com/online-casinos/russia-casinos/)
- Crypto: [coincodex crypto bonuses](https://coincodex.com/article/41632/best-crypto-casino-welcome-bonuses/), [cryptocashspin WR guide](https://cryptocashspin.com/crypto-casino-wagering-requirements-explained-2025-guide/)

### Рендеринг (A1)

- В `renderBonusMechanicsCard` (configurator.js) новый helper `mpInpBench(id,label,val,unit,benchKey)`:
  - под инпутом — строка «Рекоменд.: 25–30x» + цветной чип (green in band / amber below / red above);
  - ℹ-тултип с текстом rationale (RU/EN).
- Цвет/чип пересчитываются на `input`-событии — мгновенно, без API-вызова (данные диапазонов на клиенте).
- Ключи i18n rationale — в `L`/nav-словарь или локальный dict configurator.js (уточню место в реализации).

---

## A2. Роли механик + guardrail

- В карточке каждой механики — бейдж роли:
  - Welcome, NDB → «Привлечение · loss-leader» / «Acquisition · loss-leader»
  - Reload, Cashback, dep2/dep3 → «Удержание · маржа» / «Retention · margin»
- Тултип роли велкама: *«Велкам — самая низкомаржинальная часть экономики, но критична для маркетинга/конверсии. Прибыль живёт в релоуде и кэшбэке.»*
- Guardrail: если `welcome.wW > band.max` → amber-баннер под механикой: *«Высокий вейджер на велкаме снижает конверсию. Рыночная практика: {rec}x.»*
- Данные для acquisition-vs-retention уже частично считаются (`acqCostRatio` vs `costRatio` в buildConfig.ts) — на этом шаге только визуализируем роль; отдельную acq-cost карточку выношу в Слой B (не сейчас).

---

## A3. Честная копирайт-правка

- `src/domain/campaign/explanation.ts:39` — заменить
  `Wagering ×{wW} calculated via Truncated Normal — optimal balance of payouts and margin`
  на
  `Вейджер ×{wW} — baseline для {регион}/{лицензия}; рекоменд. диапазон {min}–{max}x` (RU) / EN-эквивалент.
- Проверить остальные строки explanation.ts на «optimal/calculated» оверклеймы, привести к «baseline/рекомендуемый диапазон».
- НЕ трогаю payout-модель — она реально считает стоимость; правка только про формулировку про вейджер.

---

## A4. Фикс ЛАТАМ + провенанс-комментарии

- `src/config/geo/latam.ts:9` — `wW: 40` → `wW: 30` (внутри band, ближе к практике). **Требует явного ОК эксперта** — это доменное суждение, не мой вызов.
- Добавить провенанс-комментарии к константам гео (arpu/cac/bpct/wW…): помечать «market-practice estimate, illustrative» там, где нет источника — честность про данные (частичный ответ на п.4 фидбэка; полный drawer — Слой B).
- Проверить downstream-эффекты смены wW: `dep2/dep3` наследуют `wW` в buildConfig.ts — пересчитать снапшот-тесты.

---

## Затрагиваемые файлы

Новые:
- `src/config/benchmarks/bonusBenchmarks.ts`
- `public/bonus-benchmarks.js`
- `tests/domain/bonus.benchmarks.parity.test.js`

Правки:
- `public/configurator.js` — `renderBonusMechanicsCard`, новые хелперы, i18n rationale, guardrail
- `public/generator.js` (twin бонус-таба) — те же бэнды, если решаем покрыть и hub
- `src/domain/campaign/explanation.ts` — A3
- `src/config/geo/latam.ts` (+ комментарии в остальных geo/*.ts) — A4
- снапшот-тесты buildConfig при смене wW

## Тесты

- parity: `bonus-benchmarks.js` ↔ `bonusBenchmarks.ts`
- unit: классификация значения в band (below/in/above) на граничных числах
- снапшот buildConfig ЛАТАМ после wW 40→30
- проверка, что explanation.ts больше не содержит «optimal»

## i18n

- Все rationale-строки и бейджи ролей — RU + EN (проект двуязычный, обе локали обязательны).

## Статус исследования данных

- ✅ **Вейджер велкама** — исследован по всем гео + 6 странам LATAM, с источниками. Данные твёрдые.
- ✅ **Match% / релоуд / NDB / макс-бонус** — исследованы (гео-независимые нормы + регуляторные оверрайды), с источниками.
- ✅ **Регуляторные потолки** — UK 10x, DK 10x + DKK 1000, BR-запрет, CO 1.6%-cap — подтверждены первичными/отраслевыми источниками.

## Открытые вопросы к эксперту (доменные суждения, не data-gaps)

1. ✅ **РЕШЕНО** — 🇧🇷 Brazil `bets_br`: подсвечивать запрет warning-баннером, механику НЕ убирать автоматически (оператор удаляет вручную). Не блокировать генерацию. **reload/NDB в BR** — оставляем механики с мягкой пометкой *«Проверьте локальные ограничения»* / *«Check local restrictions»* (юр. статус неясен, не форсим). Итого по BR: welcome → жёсткий warning про запрет; reload/NDB → мягкая пометка.
2. ✅ **РЕШЕНО** — MX/PE: добавить `wager: { wW: 35 }` override для `segob` и `mincetur` (сейчас наследуют базовый 40).
3. ✅ **РЕШЕНО** — rec-значения по практике: match% велкама **100** (универсальный стандарт), релоуд-вейджер **`welcome_rec − 5`** (относительный, ~30 для MGA), релоуд-match **50**, NDB-сумма **$15**, NDB-вейджер **35** (скорректирован 40→35 под тренд). maxBMulti — операторский, eu 6 / latam 8, слабые источники.
4. ✅ **РЕШЕНО (рекоменд.)** — Только **конфигуратор** (`configurator.js`) в Слое A. Причина: там редактируемые поля-инпуты (`renderBonusMechanicsCard`, `mpInp` для `w_wager`/`w_maxB`/`ndb_wager`/`rl_wager`…) — интерактивный бэнд привязывается к полю. `generator.js` (hub) — AI-визард с **ридонли-результатом**, полей ввода нет; там уместна только пассивная приписка «vs benchmark» + подача в AI-optimize — выносится во **вторую итерацию** (данные уже в общем `bonus-benchmarks.js`, порт дешёвый).

## НЕ входит в Слой A (Слой B, отдельная итерация)

- B1 «Δ vs baseline» при правке параметра (цифровой what-if).
- B2 редактируемые допущения (ARPU/CAC/cohort — свои данные юзера).
- B3 drawer «Методология и источники» (полный провенанс всех констант).
