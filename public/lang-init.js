// Runs render-blocking in <head> — sets data-lang on <html> before any body content paints.
// This prevents flash of wrong language for both static HTML and CSS-driven translations.
(function(){
  try {
    document.documentElement.setAttribute('data-lang', localStorage.getItem('bonusLang') || 'en');
  } catch(e) {
    document.documentElement.setAttribute('data-lang', 'en');
  }
})();
