// ══════════════════════════════════════════════════════════════════════════
// OFFER-DESC.JS — shared renderer + copy for the customer-facing "Offer
// Description" card (bonus / tournament / loyalty / wheel). One source so the
// copy path is safe everywhere: the button calls a named global that reads the
// caller's own stored description — the data is NEVER inlined into an onclick
// attribute, so apostrophes/quotes in AI copy can't break markup or inject.
// Loaded as a plain script BEFORE the generator scripts; exposes window.OfferDesc.
// ══════════════════════════════════════════════════════════════════════════
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Plain-text serialization for the clipboard.
  function plainText(d, tcLabel) {
    if (!d) return '';
    const parts = [d.title, '', d.hook, ''];
    if (d.howItWorks && d.howItWorks.length) parts.push(...d.howItWorks.map((s, i) => `${i + 1}. ${s}`), '');
    if (d.termsIntro) parts.push(d.termsIntro);
    if (d.terms && d.terms.length) parts.push(...d.terms.map(tm => `• ${tm.label}: ${tm.value}`));
    if (d.cta) parts.push('', `[ ${d.cta} ]`);
    if (d.termsAndConditions && d.termsAndConditions.length) {
      parts.push('', (tcLabel || 'Terms & Conditions') + ':', ...d.termsAndConditions.map((c, i) => `${i + 1}. ${c}`));
    }
    return parts.join('\n');
  }

  // Copy `text` to the clipboard and briefly flash the button. No data is ever
  // put into HTML, so quotes/apostrophes in the copy are irrelevant.
  function copyText(text, btn, doneLabel) {
    return navigator.clipboard.writeText(text).then(() => {
      if (!btn) return;
      const orig = btn.textContent;
      btn.textContent = doneLabel || '✓';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    });
  }

  // Shared card body. `labels` = { note, hint, how, tc, copy, copyFn }.
  // copyFn is the NAME of a global function invoked as `copyFn(this)`; it reads
  // the caller's stored description and calls copyText — data never touches the
  // attribute. Omit copyFn to render without a copy button.
  function render(d, labels) {
    const L = labels || {};
    const steps = (d.howItWorks || []).map(s => `<li style="margin-bottom:6px">${esc(s)}</li>`).join('');
    const terms = (d.terms || []).map(tm =>
      `<div style="display:flex;justify-content:space-between;gap:12px;padding:3px 0;border-bottom:1px solid var(--border)"><span style="color:var(--muted)">${esc(tm.label)}</span><span style="font-weight:600">${esc(tm.value)}</span></div>`).join('');
    const tc = (d.termsAndConditions || []).map(c => `<li style="margin-bottom:5px">${esc(c)}</li>`).join('');
    const copyBtn = L.copyFn
      ? `<button class="btn btn-sm btn-outline" onclick="${esc(L.copyFn)}(this)">${esc(L.copy || 'Copy')}</button>`
      : '';
    return `
<div class="alert" style="background:rgba(79,110,247,.08);border:1px solid rgba(79,110,247,.2);color:#a0b0ff;font-size:.78rem;margin-bottom:12px">✦ ${esc(L.note || '')}</div>
<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">
  <div style="font-size:.72rem;color:var(--muted)">${esc(L.hint || '')}</div>
  ${copyBtn}
</div>
<div style="background:var(--card,rgba(255,255,255,.03));border:1px solid var(--border);border-radius:10px;padding:18px 20px">
  <div style="font-size:1.15rem;font-weight:700;margin-bottom:8px">${esc(d.title)}</div>
  <p style="color:var(--muted);font-size:.9rem;line-height:1.5;margin:0 0 14px">${esc(d.hook)}</p>
  ${steps ? `<div style="font-size:.78rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-bottom:6px">${esc(L.how || '')}</div><ol style="margin:0 0 16px;padding-left:20px;font-size:.88rem;line-height:1.45">${steps}</ol>` : ''}
  ${terms ? `<div style="font-size:.85rem;margin-bottom:8px">${esc(d.termsIntro)}</div><div style="margin-bottom:16px">${terms}</div>` : ''}
  ${d.cta ? `<div style="display:inline-block;background:var(--accent);color:#fff;padding:6px 16px;border-radius:8px;font-weight:700;font-size:.85rem">${esc(d.cta)}</div>` : ''}
  ${tc ? `<div style="border-top:1px solid var(--border);margin-top:18px;padding-top:14px"><div style="font-size:.78rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-bottom:8px">${esc(L.tc || '')}</div><ol style="margin:0;padding-left:20px;font-size:.82rem;line-height:1.5;color:var(--muted)">${tc}</ol></div>` : ''}
</div>`;
  }

  window.OfferDesc = { render, plainText, copyText, esc };
})();
