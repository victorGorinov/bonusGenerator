import { SCENARIO_MSG, SCENARIO_MSG_EN } from './scenarios.js';

type BonusCfg = Record<string, unknown>;

export function campaignExplanation(scenarioId: string, mechanicType: string, cfg: BonusCfg, requestedTypes: string[] = [], lang = 'ru'): string[] {
  const isEn = lang === 'en';
  const msgs = isEn
    ? (SCENARIO_MSG_EN[scenarioId] || SCENARIO_MSG_EN['inactive_7'])
    : (SCENARIO_MSG[scenarioId] || SCENARIO_MSG['inactive_7']);
  const [m1, m2] = msgs;
  const lic    = cfg['lic'] as string;
  const licStr = lic === 'ukgc' ? 'UKGC' : lic === 'mga' ? 'MGA' : 'Curaçao';
  const r      = cfg['r'] as string;
  const wager  = cfg['wager'] as Record<string, unknown> | undefined;

  if (isEn) {
    const regMap: Record<string, string> = { eu:`EU/${licStr}`, cis:'CIS', crypto:'Crypto', mn:'Mongolia', latam:'LatAm', sweep:'USA Sweep' };
    const regStr = regMap[r] || r;
    if (requestedTypes.length > 1) {
      const lblMap: Record<string, string> = { welcome:'1st Deposit', ndb:'Welcome', reload:'Reload', dep2:'2nd Deposit', dep3:'3rd Deposit', cashback:'Cashback' };
      const mix = requestedTypes.map(t => lblMap[t] || t).join(' + ');
      const hasCashback  = requestedTypes.includes('cashback');
      const isFullLaunch = scenarioId === 'first_launch';
      return [
        isFullLaunch
          ? `Casino launch package for ${regStr}: all 6 mechanics cover the player journey from registration to long-term retention`
          : `Combination of ${mix} covers the full player lifecycle within a single campaign`,
        m1,
        isFullLaunch
          ? `NDB lowers entry barrier → Welcome converts deposit → 2nd/3rd dep lock in habit → Reload retains weekly → Cashback insures against churn`
          : hasCashback
            ? 'Cashback without wagering offsets the aggressiveness of other mechanics and reduces regulatory risk'
            : `Unified wagering threshold ×${wager?.['wW'] || 35} applies to all mechanics in ${regStr} region`,
        `Switch between tabs to view each mechanic's parameters separately`,
      ];
    }
    const wStr = mechanicType === 'cashback'
      ? 'Cashback without wagering increases the player trust score and reduces complaints by 40%'
      : `Wagering ×${wager?.['wW'] || 35} calculated via Truncated Normal — optimal balance of payouts and margin`;
    return [m1, m2, `Parameters adapted for ${regStr} region and licensing requirements`, wStr];
  }

  const regMapRu: Record<string, string> = { eu:`EU/${licStr}`, cis:'СНГ', crypto:'Crypto', mn:'Монголия', latam:'LatAm', sweep:'USA Sweep' };
  const regStr = regMapRu[r] || r;
  if (requestedTypes.length > 1) {
    const lblMap: Record<string, string> = { welcome:'1-й депозит', ndb:'Welcome', reload:'Reload', dep2:'2-й депозит', dep3:'3-й депозит', cashback:'Cashback' };
    const mix = requestedTypes.map(t => lblMap[t] || t).join(' + ');
    const hasCashback  = requestedTypes.includes('cashback');
    const isFullLaunch = scenarioId === 'first_launch';
    return [
      isFullLaunch
        ? `Пакет запуска казино для ${regStr}: все 6 механик покрывают путь игрока от регистрации до долгосрочного удержания`
        : `Комбинация ${mix} покрывает полный жизненный цикл игрока в рамках одной кампании`,
      m1,
      isFullLaunch
        ? `NDB снижает барьер входа → Welcome конвертирует депозит → 2-й/3-й деп фиксируют привычку → Reload удерживает еженедельно → Cashback страхует от оттока`
        : hasCashback
          ? 'Cashback без вейджера компенсирует агрессивность других механик и снижает риск регуляторных претензий'
          : `Единый вейджерный порог ×${wager?.['wW'] || 35} применяется ко всем механикам региона ${regStr}`,
      `Переключайтесь между табами, чтобы просмотреть параметры каждой механики отдельно`,
    ];
  }
  const wStr = mechanicType === 'cashback'
    ? 'Cashback без вейджера повышает trust score игрока и снижает жалобы на 40%'
    : `Вейджер ×${wager?.['wW'] || 35} рассчитан по Truncated Normal — оптимальный баланс выплат и маржи`;
  return [m1, m2, `Параметры адаптированы под регион ${regStr} и лицензионные требования`, wStr];
}

export function campaignAlternatives(cfg: BonusCfg, requestedTypes: string[] = []): Array<Record<string, unknown>> {
  const cur  = cfg['cur'] as string;
  const allM = cfg as Record<string, Record<string, unknown>>;
  const excluded = new Set(requestedTypes);
  const info: Record<string, (m: Record<string, unknown>) => Record<string, unknown>> = {
    welcome:  m => ({ icon:'💰', name:`1-й депозит ${m['pct'] || 100}% до ${m['maxB'] || '?'} ${m['cur'] || cur}`, desc:'Бонус на первый депозит — максимизирует конверсию' }),
    ndb:      m => ({ icon:'🎁', name:`Welcome ${m['fs'] || m['amt'] || 30}${m['fs'] ? ' FS' : ''}`, desc:'Welcome-бонус без депозита при регистрации' }),
    reload:   m => ({ icon:'🔄', name:`Reload ${m['pct'] || 50}% до ${m['maxB'] || '?'} ${m['cur'] || cur}`, desc:'Еженедельный бонус для удержания' }),
    dep2:     m => ({ icon:'💰', name:`2-й депозит ${m['pct'] || 75}%`, desc:'Фиксирует игровую привычку в 1-ю неделю' }),
    dep3:     m => ({ icon:'🎁', name:`3-й депозит ${m['pct'] || 50}%`, desc:'Завершает депозитную серию' }),
    cashback: m => ({ icon:'💳', name:`Cashback ${m['pct'] || 10}%`, desc:'Возврат от потерь без вейджера' }),
  };
  return Object.entries(info)
    .filter(([t]) => !excluded.has(t) && allM[t])
    .map(([t, fn]) => ({ ...fn(allM[t]), type: t }))
    .slice(0, 3);
}
