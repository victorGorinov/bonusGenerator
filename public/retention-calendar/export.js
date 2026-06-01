/**
 * Client-side export — no dependencies, Blob + download.
 * Designed for extensibility: add XLSX/Google Sheets as separate formatters.
 */

const CSV_FIELDS = ['id','title','type','segment','geo','startDate','endDate','status','mechanic','notes','tags','createdAt'];

/**
 * @param {import('./types.js').Campaign[]} campaigns
 * @returns {string}
 */
export function toCSV(campaigns) {
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [CSV_FIELDS.join(',')];
  for (const c of campaigns) {
    rows.push(CSV_FIELDS.map(f => escape(Array.isArray(c[f]) ? c[f].join(';') : c[f])).join(','));
  }
  return rows.join('\n');
}

/**
 * @param {import('./types.js').Campaign[]} campaigns
 * @returns {string}
 */
export function toJSON(campaigns) {
  return JSON.stringify(campaigns, null, 2);
}

/**
 * @param {string} content
 * @param {string} filename
 * @param {string} mimeType
 */
export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCSV(campaigns, filename = 'retention-calendar.csv') {
  downloadFile(toCSV(campaigns), filename, 'text/csv;charset=utf-8;');
}

export function exportJSON(campaigns, filename = 'retention-calendar.json') {
  downloadFile(toJSON(campaigns), filename, 'application/json');
}
