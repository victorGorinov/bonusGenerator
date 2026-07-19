// avgdep: realistic average deposit per segment in the site currency.
// Omit for EUR/GBP/USD geos — the default (40/100/500) is calibrated for those.
// Required for high-denomination currencies (RUB, KZT, MNT) and DKK.
//
// avgdepUSD: USD equivalent of avgdep.mid — used to derive implied FX rate
// (localUnitsPerUSD = avgdep.mid / avgdepUSD.mid).
// Only required for non-USD/non-EUR geos. Update when local rates shift significantly.
export const GEO_CFG: Record<string, {
  region: string; lic: string; sitecur: string; depcur: string;
  avgdep?:    { new: number; mid: number; vip: number };
  avgdepUSD?: { new: number; mid: number; vip: number };
}> = {
  de: { region:'eu',    lic:'mga',  sitecur:'EUR', depcur:'EUR' },
  dk: { region:'eu',    lic:'dga',  sitecur:'DKK', depcur:'DKK',
        avgdep:    { new: 300,    mid: 700,    vip: 3500   },
        avgdepUSD: { new: 40,     mid: 95,     vip: 470    } },
  fr: { region:'eu',    lic:'mga',  sitecur:'EUR', depcur:'EUR' },
  es: { region:'eu',    lic:'mga',  sitecur:'EUR', depcur:'EUR' },
  it: { region:'eu',    lic:'mga',  sitecur:'EUR', depcur:'EUR' },
  nl: { region:'eu',    lic:'mga',  sitecur:'EUR', depcur:'EUR' },
  uk: { region:'eu',    lic:'ukgc', sitecur:'GBP', depcur:'GBP' },
  ru: { region:'cis',   lic:'none', sitecur:'RUB', depcur:'RUB',
        avgdep:    { new: 2000,   mid: 5000,   vip: 25000  },
        avgdepUSD: { new: 22,     mid: 55,     vip: 275    } },
  kz: { region:'cis',   lic:'none', sitecur:'KZT', depcur:'KZT',
        avgdep:    { new: 8000,   mid: 20000,  vip: 100000 },
        avgdepUSD: { new: 16,     mid: 40,     vip: 200    } },
  us: { region:'sweep', lic:'none', sitecur:'USD', depcur:'USD' },
  mn: { region:'mn',    lic:'none', sitecur:'MNT', depcur:'MNT',
        avgdep:    { new: 40000,  mid: 100000, vip: 500000 },
        avgdepUSD: { new: 12,     mid: 29,     vip: 145    } },
  // LatAm — backend computes in USD; local-currency display is a frontend layer
  // (see public/geo-data.js). Regulated markets carry their own license; Argentina
  // (provincial) and Chile (grey market) use the offshore Curaçao default ('none').
  br: { region:'latam', lic:'bets_br',   sitecur:'USD', depcur:'USD' },
  mx: { region:'latam', lic:'segob',     sitecur:'USD', depcur:'USD' },
  co: { region:'latam', lic:'coljuegos', sitecur:'USD', depcur:'USD' },
  ar: { region:'latam', lic:'none',      sitecur:'USD', depcur:'USD' },
  pe: { region:'latam', lic:'mincetur',  sitecur:'USD', depcur:'USD' },
  cl: { region:'latam', lic:'none',      sitecur:'USD', depcur:'USD' },
};

export const TONE_DESC: Record<string, string> = {
  friendly:   'friendly, warm and personal',
  pro:        'professional and trustworthy',
  aggressive: 'urgent, bold, FOMO-driven',
};

export const LANG_NAME: Record<string, string> = { da:'Danish', de:'German', en:'English', ru:'Russian', es:'Spanish', mn:'Mongolian' };
export const SEG_DESC:  Record<string, string>  = { new:'new players (first-timers)', mid:'regular players', vip:'VIP high-value players' };

export const SCENARIO_MSG: Record<string, [string, string]> = {
  first_launch:     ['Полный бонусный пакет для запуска казино максимизирует конверсию на каждом этапе жизненного цикла игрока', 'Welcome + NDB формируют первое впечатление; Reload удерживает в долгую; Cashback компенсирует потери и снижает churn в первые 90 дней'],
  inactive_3:       ['Reload эффективен при 3-дневном перерыве — игрок ещё помнит платформу и легко конвертируется', 'Короткий срок инактивности снижает CAC на 25–40% vs стандартного бонуса на 1-й депозит'],
  inactive_7:       ['Reload идеален для 7-дневного перерыва: баланс привлекательности и экономической эффективности', '50% match — рыночный стандарт, cost ratio ≈15–20%'],
  inactive_30:      ['После 30+ дней инактивности нужен мощный оффер для возврата — размер бонуса имеет значение', 'Крупный match оправдан высоким retention-эффектом после 30-дневного перерыва (+35%)'],
  churn_risk:       ['Превентивный оффер при риске оттока снижает churn на 20–30% — время действия критично', 'Раннее вмешательство обходится в 3–5 раз дешевле полноценной реактивации'],
  return_win:       ['После крупного выигрыша игрок склонен уйти — Reload мягко возвращает в игровой цикл', 'Фокус на вовлечённость, а не на крупный бонус снижает риск бонусхантинга'],
  return_loss:      ['Cashback после крупного проигрыша снижает фрустрацию и удерживает игрока', 'Возврат % от потерь — наиболее этичный инструмент удержания по требованиям EU-регуляторов'],
  first_dep:        ['Бонус на 1-й депозит — рыночный стандарт, максимизирует конверсию новых игроков', 'Условия 1-го депозита определяют LTV первого года: % и вейджер критически важны для unit-экономики'],
  second_dep:       ['2-й депозитный бонус фиксирует игровую привычку в первую неделю после регистрации', 'Удержание после 2-го депозита коррелирует с LTV 3 мес. в 2.3× выше нормы'],
  big_dep:          ['Крупный депозит сигнализирует о высоком LTV-потенциале — оффер должен соответствовать уровню', 'Персонализированные условия при крупном депозите конвертируют в 40% случаев'],
  vip_retention:    ['VIP-удержание требует персонального подхода — Cashback без вейджера является стандартом', 'Высокий cashback без вейджера — рыночная норма для VIP-сегмента, ожидание игрока'],
  vip_reactivation: ['Реактивация VIP требует значительного оффера для возврата высокодоходного игрока', 'ROI от возврата одного VIP покрывает CAC 10–15 стандартных игроков'],
  sport_event:      ['Фрибет привязан к конкретному событию — создаёт срочность и FOMO-эффект', 'Событийный маркетинг конвертирует спортивную аудиторию в 2.5× эффективнее обычного пуша'],
  tournament:       ['Турнирный формат создаёт долгосрочную вовлечённость через соревновательный элемент', 'Призовой фонд с фиксированным бюджетом — предсказуемый cost ratio без хвостового риска'],
  cashback:         ['Cashback без вейджера — наиболее прозрачный инструмент, лояльный для игрока и регулятора', 'EU/UK регуляторы всё строже требуют отказа от вейджера — cashback опережает тренд'],
  custom:           ['Базовая механика подобрана по параметрам вашего региона и сегмента аудитории', 'Дополнительная настройка параметров доступна на предыдущем экране'],
};

export const SCENARIO_MSG_EN: Record<string, [string, string]> = {
  first_launch:     ['Full bonus package for casino launch maximises conversion at every stage of the player lifecycle', 'Welcome + NDB form the first impression; Reload retains long-term; Cashback offsets losses and reduces churn in the first 90 days'],
  inactive_3:       ['Reload is effective for a 3-day break — the player still remembers the platform and converts easily', 'Short inactivity period reduces CAC by 25–40% vs a standard first-deposit bonus'],
  inactive_7:       ['Reload is ideal for a 7-day break: balance of attractiveness and economic efficiency', '50% match — market standard, cost ratio ≈15–20%'],
  inactive_30:      ['After 30+ days of inactivity a strong offer is needed to bring the player back — bonus size matters', 'Large match is justified by the high retention effect after a 30-day break (+35%)'],
  churn_risk:       ['A preventive offer at churn risk reduces churn by 20–30% — timing is critical', 'Early intervention costs 3–5× less than a full reactivation campaign'],
  return_win:       ['After a big win the player tends to leave — Reload gently returns them to the game cycle', 'Focus on engagement rather than a large bonus reduces the risk of bonus hunting'],
  return_loss:      ['Cashback after a big loss reduces frustration and retains the player', 'Percentage return on losses — the most ethical retention tool per EU regulator requirements'],
  first_dep:        ['First deposit bonus — market standard, maximises new player conversion', 'First deposit terms determine year-one LTV: percentage and wagering requirement are critical for unit economics'],
  second_dep:       ['Second deposit bonus locks in the gaming habit within the first week after registration', 'Retention after the second deposit correlates with 3-month LTV 2.3× above average'],
  big_dep:          ['A large deposit signals high LTV potential — the offer must match the level', 'Personalised terms on a large deposit convert in 40% of cases'],
  vip_retention:    ['VIP retention requires a personal approach — Cashback without wagering is the standard', 'High cashback with no wagering — market norm for the VIP segment, player expectation'],
  vip_reactivation: ['VIP reactivation requires a significant offer to bring back a high-value player', 'ROI from returning one VIP covers the CAC of 10–15 standard players'],
  sport_event:      ['Free bet tied to a specific event — creates urgency and FOMO effect', 'Event marketing converts sports audience 2.5× more effectively than a standard push'],
  tournament:       ['Tournament format creates long-term engagement through a competitive element', 'Prize pool with a fixed budget — predictable cost ratio without tail risk'],
  cashback:         ['Cashback without wagering — the most transparent tool, player- and regulator-friendly', 'EU/UK regulators increasingly require waiver of wagering requirements — cashback leads the trend'],
  custom:           ['Basic mechanics selected based on your region and audience segment parameters', 'Further parameter customisation is available on the previous screen'],
};
