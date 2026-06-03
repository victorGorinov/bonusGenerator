// Init for retention-calendar.html — must be an external file (CSP: script-src 'self')

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
