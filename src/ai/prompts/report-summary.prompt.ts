import type { ReportSummaryInput } from '../../validation/report.schema.js';

function describeActivity(a: ReportSummaryInput['activities'][number], idx: number): string {
  const econStr = a.econ
    ? [
        a.econ.arpu   != null ? `ARPU $${a.econ.arpu}`       : null,
        a.econ.ltv3   != null ? `LTV3 $${a.econ.ltv3}`       : null,
        a.econ.roi3   != null ? `ROI ${a.econ.roi3}%`        : null,
        a.econ.costRatio != null ? `costRatio ${a.econ.costRatio}` : null,
      ].filter(Boolean).join(', ')
    : 'no economics data';
  return `${idx + 1}. "${a.title}" — ${a.promoType}, GEO: ${a.geo}, segment: ${a.segment}. ${econStr}`;
}

export function buildReportSummaryPrompt(data: ReportSummaryInput): string {
  const { type, activities, forecast, uiLang } = data;
  const lang = uiLang === 'ru' ? 'Russian' : 'English';
  const activityBlock = activities.map(describeActivity).join('\n');

  if (type === 'single') {
    return `You are a retention analytics expert for iGaming. Write an executive summary (3-4 sentences) in ${lang} for a single campaign report.

Campaign:
${activityBlock}

Focus on: key strengths, risks, expected ROI, and one actionable recommendation. Be specific with numbers. Write for a C-level audience. Return ONLY the summary text, no JSON wrapping.`;
  }

  if (type === 'comparison') {
    return `You are a retention analytics expert for iGaming. Write an executive summary (4-6 sentences) in ${lang} comparing these campaigns:

${activityBlock}

Focus on: which campaign has better unit economics and why, trade-offs between them, and a clear recommendation. Use specific numbers. Write for a C-level audience deciding which to approve. Return ONLY the summary text, no JSON wrapping.`;
  }

  // period
  const forecastStr = forecast
    ? `Forecast: gross $${forecast.gross.toFixed(0)}, cannibalization -$${forecast.overlapLoss.toFixed(0)}, net $${forecast.net.toFixed(0)}, profit $${forecast.netProfit.toFixed(0)}. Coverage: ${forecast.coverage.withEcon}/${forecast.coverage.total} activities have economics.`
    : 'No forecast data available.';

  return `You are a retention analytics expert for iGaming. Write an executive summary (4-6 sentences) in ${lang} for a period retention plan.

Activities:
${activityBlock}

${forecastStr}

Focus on: total budget assessment, cannibalization concerns, coverage gaps, and overall plan quality. Be specific with numbers. Write for a C-level audience approving the monthly retention budget. Return ONLY the summary text, no JSON wrapping.`;
}
