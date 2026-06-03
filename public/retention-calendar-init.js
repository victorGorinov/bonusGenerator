// Init for retention-calendar.html — must be an external file (CSP: script-src 'self')

function toggleRCGlossary() {
  let panel = document.getElementById('rc-glossary-panel');
  if (panel) { panel.remove(); return; }
  panel = document.createElement('div');
  panel.id = 'rc-glossary-panel';
  panel.style.cssText = 'position:fixed;top:54px;right:0;width:360px;max-width:100vw;height:calc(100vh - 54px);background:#0f1420;border-left:1px solid #1e2740;z-index:200;display:flex;flex-direction:column;box-shadow:-8px 0 32px rgba(0,0,0,.5);overflow-y:auto;padding:20px';
  panel.innerHTML = [
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">',
    '<span style="font-size:.88rem;font-weight:700;color:#e8eaf0">Glossary</span>',
    '<button onclick="document.getElementById(\'rc-glossary-panel\').remove()"',
    'style="background:rgba(255,255,255,.08);border:none;color:#8892a4;width:26px;height:26px;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">✕</button>',
    '</div>',
    [
      ['Campaign', 'A marketing promotion planned for a specific date range targeting a player segment'],
      ['Segment', 'Target player group: New (recently registered), Mid (regular), or VIP (high-value)'],
      ['Conflict', 'Two or more campaigns of the same type overlapping in date and targeting the same segment'],
      ['Template', 'A saved campaign configuration that can be reused to quickly create new campaigns'],
      ['GGR', 'Gross Gaming Revenue — total player bets minus winnings paid out'],
      ['Retention Rate', 'Percentage of players who remain active month-over-month'],
      ['Bonus Campaign', 'A promotion offering deposit match, free spins, cashback or no-deposit bonuses'],
      ['Tournament', 'A competitive event where players are ranked by score over a fixed period'],
    ].map(function(item) {
      return '<div style="padding:10px 0;border-bottom:1px solid #1e2740">' +
        '<div style="font-size:.8rem;font-weight:700;color:#a0b0ff;margin-bottom:3px">' + item[0] + '</div>' +
        '<div style="font-size:.76rem;color:#8892a4;line-height:1.5">' + item[1] + '</div>' +
        '</div>';
    }).join('')
  ].join('');
  document.body.appendChild(panel);
}

function setRCLang(lang) {
  try { localStorage.setItem('bonusLang', lang); } catch(e) {}
  location.reload();
}

(function() {
  var lang = (function() {
    try { return localStorage.getItem('bonusLang') || 'en'; } catch(e) { return 'en'; }
  })();

  document.querySelectorAll('.lt-btn').forEach(function(b) {
    b.classList.toggle('active', b.id === 'lt-' + lang);
  });

  if (typeof applyNavLang === 'function') applyNavLang(lang);
  if (typeof updateAllBadges === 'function') updateAllBadges();
})();
