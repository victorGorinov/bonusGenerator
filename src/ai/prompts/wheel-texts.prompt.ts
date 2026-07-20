import { GEO_CFG, LANG_NAME } from '../../domain/campaign/scenarios.js';

interface WheelTextsParams {
  params: Record<string, unknown>;
  spec:   Record<string, unknown>;
}

const PRIZE_LABEL: Record<string, string> = {
  bonus_money: 'bonus money', free_spins: 'free spins', cashback: 'cashback',
  multiplier: 'deposit multiplier', jackpot: 'jackpot', physical: 'prize', nothing: 'no win',
};

export function buildWheelTextsPrompt({ params, spec }: WheelTextsParams): string {
  const geo  = GEO_CFG[String(params['geo'] || 'de')] || GEO_CFG['de'];
  const lang = LANG_NAME[String(params['lang'] || 'en')] || 'English';
  const cur  = geo.sitecur;

  const preset    = String(spec['preset']    || 'welcome');
  const frequency = String(spec['frequency'] || 'daily');
  const segments  = Array.isArray(spec['segments']) ? spec['segments'] as Array<Record<string, unknown>> : [];
  const prizeList = segments
    .filter((s) => s['prizeType'] !== 'nothing')
    .map((s) => `${PRIZE_LABEL[String(s['prizeType'])] ?? s['prizeType']} (${s['prizeValue']})`)
    .join(', ');

  return `You are a casino CRM copywriter. Write promotional texts for a "Wheel of Fortune" gamification mechanic.

Wheel: ${preset} wheel, spin cadence: ${frequency}
Prizes on the wheel: ${prizeList}
Currency: ${cur}, Region: ${String(params['geo'] || 'de').toUpperCase()}
IMPORTANT: Write ALL text in ${lang}. Emphasise the excitement of spinning and the chance to win. Do NOT promise guaranteed wins.

Return ONLY valid JSON, no markdown:
{
  "push":     ["<variant 1>", "<variant 2>", "<variant 3>"],
  "email":    [{"subject": "<subj>", "body": "<body>"}, {"subject": "<subj>", "body": "<body>"}, {"subject": "<subj>", "body": "<body>"}],
  "sms":      ["<variant 1>", "<variant 2>", "<variant 3>"],
  "telegram": ["<variant 1>", "<variant 2>", "<variant 3>"],
  "popup":    [{"headline": "<h>", "subtext": "<s>", "cta": "<cta>"}, {"headline": "<h>", "subtext": "<s>", "cta": "<cta>"}, {"headline": "<h>", "subtext": "<s>", "cta": "<cta>"}]
}`;
}
