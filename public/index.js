// Mark JS as active. The .reveal animation in CSS only applies inside .js —
// without it (JS blocked or failed), all content is visible by default.
document.documentElement.classList.add('js');

// ════ I18N ════
const LANG = {
  en: {
    nav_features: 'Features',
    nav_how: 'How it works',
    nav_problem: 'Why Retomat',
    nav_cta: '🚀 Try Retomat Free →',

    badge: 'The Retention OS for iGaming',
    hero_h1a: 'Stop launching bonus campaigns blind.',
    hero_h1b: 'Know the cost before you hit send.',
    hero_sub: 'Pick a scenario and a GEO — AI selects the right bonus mechanic, writes the copy for 5 channels, checks compliance, and models the P10/P50/P90 cost. No spreadsheets, no guesswork.',
    hero_cta1: '🚀 Try Retomat Free →',
    hero_cta2: '▶ See how it works',
    tr1: 'Ready in 2 min', tr2: 'Free beta access', tr3: 'Free during beta', tr4: '17 jurisdictions',

    sim_title: 'Campaign simulation',
    sim_new: 'New simulation',
    sim_f1_l: 'Bonus type', sim_f1_v: 'Deposit Match',
    sim_f2_l: 'GEO',
    sim_f3_l: 'Segment', sim_f3_v: 'New players',
    sim_f4_l: 'Wagering',
    sim_summary: 'Summary',
    sim_m1_l: 'Expected ROI',
    sim_m2_l: 'Bonus cost (P50)',
    sim_m3_l: 'Max risk (P90)',
    sim_m4_l: '3-mo LTV impact',
    sim_list_t: 'Top scenarios by lift',
    sim_s1: 'New player welcome',
    sim_s2: 'Mid-value reactivation',
    sim_s3: 'VIP retention',

    cal_title: 'Retention Calendar',
    cal_open: 'Open calendar',
    cal_range: 'Jun 2–8',
    cal_tab_month: 'Month',
    cal_tab_week: 'Week',
    cal_tab_list: 'List',
    cal_ev1: 'VIP Cashback',
    cal_ev1_sub: 'VIP segment · 15% weekly',
    cal_ev2: 'First Deposit Bonus',
    cal_ev2_sub: 'New players',
    cal_ev3: 'Slot Tournament',
    cal_ev3_sub: 'All segments',
    cal_active: 'ACTIVE',
    cal_sched: 'SCHED',
    cal_draft: 'DRAFT',
    cal_overlap: 'VIP Cashback overlaps First Deposit Bonus on Jun 3 · same segment',
    cal_forecast_label: "This week's forecast",
    cal_f1_l: 'Gross lift',
    cal_f2_l: 'Overlap loss',
    cal_f3_l: 'Net impact',
    cal_f4_l: 'Coverage',

    prob_tag: 'The problem',
    prob_h2: "Most bonus campaigns are guesswork or hindsight.",
    prob_1: "Hard to know a campaign's real cost until after it's launched",
    prob_2: 'Specs live in scattered spreadsheets — slow, error-prone, easy to lose track of',
    prob_3: 'Compliance rules differ by license — mistakes get expensive fast',
    prob_4: 'Overlapping offers hit the same segment twice, wasting budget',

    sol_tag: 'The solution',
    sol_h2: 'Model the mechanic, cost, and compliance before you launch.',
    sol_1: 'See expected cost (P10/P50/P90) and ROI before you approve a budget',
    sol_2: 'One workspace — every campaign, tournament, and offer in a shared calendar',
    sol_3: 'AI checks wager caps and license rules automatically, per jurisdiction',
    sol_4: 'Overlap detection flags conflicts before they go live',
    sol_5: 'Benchmark any offer against real competitors before you launch — no more launching blind',

    how_tag: 'How it works',
    how_h2: '3 steps to a campaign you can trust',
    how1_h: 'Choose a scenario & GEO',
    how1_p: 'Pick from 15+ CRM scenarios — reactivation, first deposit, VIP, sport event — and set your region and segment.',
    how2_h: 'AI models the mechanic & cost',
    how2_p: 'AI picks the bonus mechanic, writes copy for 5 channels, runs a compliance audit, and shows the full cost model.',
    how3_h: 'Add it to your calendar',
    how3_p: 'Drop it on the Retention Calendar, check for overlaps, and export the spec — ready for your CRM team.',

    feat_tag: 'Built for growing iGaming teams',
    feat_h2: 'Powerful economics. No spreadsheets.',
    feat_sub: 'Everything a CRM or bonus manager needs to plan retention with confidence — without a data team.',
    fs1_h: 'Multi-geo ready',
    fs1_p: '17 jurisdictions pre-configured — correct wager caps, currencies, and license rules out of the box.',
    fs2_h: 'Compliance built in',
    fs2_p: 'Every campaign is checked automatically against wager caps, RG requirements, and license-specific rules.',
    fs3_h: 'Know your costs first',
    fs3_p: 'Best case, expected, and worst case — see the real cost of a bonus before you approve the budget.',
    fs4_h: 'Ready in under 2 minutes',
    fs4_p: 'Mechanic, 5-channel copy, and cost model — generated together, ready to hand to your CRM team.',
    fs5_h: 'Benchmark against rivals',
    fs5_p: 'See how your bonus, tournament or loyalty offer stacks up against competitors in your GEO — AI finds their terms and shows where you win or lose the player.',

    cta_h2: 'Ready to plan your next campaign?',
    cta_p: 'Free during beta. No credit card — just create an account, pick a scenario, and see the numbers.',
    cta_btn: '🚀 Try Retomat Free →',
    cta_c1: '✓ No commitment',
    cta_c2: '✓ Ready in under 2 minutes',
    cta_c3: '✓ Free during beta',

    footer_rights: 'All rights reserved.',
    footer_privacy: 'Privacy', footer_terms: 'Terms',

    sticky_cta: '🚀 Try Retomat Free →',

    cookie_title: 'We use cookies',
    cookie_text: 'We use only functional storage (language preference) to improve your experience. No tracking or advertising cookies.',
    cookie_link: 'Privacy Policy',
    cookie_decline: 'Decline',
    cookie_accept: 'Accept',
  },
  ru: {
    nav_features: 'Возможности',
    nav_how: 'Как это работает',
    nav_problem: 'Почему Retomat',
    nav_cta: '🚀 Попробовать бесплатно →',

    badge: 'Retention OS для iGaming',
    hero_h1a: 'Хватит запускать бонусные кампании вслепую.',
    hero_h1b: 'Узнайте стоимость ещё до запуска.',
    hero_sub: 'Выберите сценарий и GEO — AI подберёт механику бонуса, напишет тексты для 5 каналов, проверит комплаенс и рассчитает стоимость P10/P50/P90. Без таблиц и догадок.',
    hero_cta1: '🚀 Попробовать бесплатно →',
    hero_cta2: '▶ Посмотреть, как это работает',
    tr1: 'Готово за 2 минуты', tr2: 'Бесплатный доступ в бете', tr3: 'Бесплатно в бете', tr4: '17 юрисдикций',

    sim_title: 'Симуляция кампании',
    sim_new: 'Новая симуляция',
    sim_f1_l: 'Тип бонуса', sim_f1_v: 'Матч депозита',
    sim_f2_l: 'GEO',
    sim_f3_l: 'Сегмент', sim_f3_v: 'Новые игроки',
    sim_f4_l: 'Вейджер',
    sim_summary: 'Сводка',
    sim_m1_l: 'Ожидаемый ROI',
    sim_m2_l: 'Стоимость бонуса (P50)',
    sim_m3_l: 'Макс. риск (P90)',
    sim_m4_l: 'Эффект на LTV (3 мес)',
    sim_list_t: 'Топ-сценарии по приросту',
    sim_s1: 'Приветствие новых игроков',
    sim_s2: 'Реактивация Mid',
    sim_s3: 'VIP-удержание',

    cal_title: 'Retention Calendar',
    cal_open: 'Открыть календарь',
    cal_range: '2–8 июня',
    cal_tab_month: 'Месяц',
    cal_tab_week: 'Неделя',
    cal_tab_list: 'Список',
    cal_ev1: 'VIP-кэшбек',
    cal_ev1_sub: 'VIP-сегмент · 15% еженедельно',
    cal_ev2: 'Бонус на первый депозит',
    cal_ev2_sub: 'Новые игроки',
    cal_ev3: 'Слот-турнир',
    cal_ev3_sub: 'Все сегменты',
    cal_active: 'АКТИВНА',
    cal_sched: 'ЗАПЛАН.',
    cal_draft: 'ЧЕРНОВИК',
    cal_overlap: '«VIP-кэшбек» пересекается с «Бонус на первый депозит» 3 июня · один сегмент',
    cal_forecast_label: 'Прогноз на неделю',
    cal_f1_l: 'Брутто-прирост',
    cal_f2_l: 'Потери на пересечениях',
    cal_f3_l: 'Нетто-эффект',
    cal_f4_l: 'Покрытие',

    prob_tag: 'Проблема',
    prob_h2: 'Большинство бонусных кампаний — это догадки или разбор полётов постфактум.',
    prob_1: 'Реальную стоимость кампании узнаёшь только после запуска',
    prob_2: 'Спеки живут в разрозненных таблицах — медленно, легко ошибиться и потерять контроль',
    prob_3: 'Правила комплаенса отличаются по лицензиям — ошибки обходятся дорого',
    prob_4: 'Пересекающиеся офферы бьют по одному сегменту дважды, тратя бюджет впустую',

    sol_tag: 'Решение',
    sol_h2: 'Просчитайте механику, стоимость и комплаенс ещё до запуска.',
    sol_1: 'Видите ожидаемую стоимость (P10/P50/P90) и ROI до утверждения бюджета',
    sol_2: 'Один воркспейс — все кампании, турниры и офферы в общем календаре',
    sol_3: 'AI автоматически проверяет лимиты вейджера и правила лицензии по каждой юрисдикции',
    sol_4: 'Обнаружение пересечений — конфликты видны до запуска',
    sol_5: 'Сравнивайте оффер с реальными конкурентами до запуска — больше никаких запусков вслепую',

    how_tag: 'Как это работает',
    how_h2: '3 шага к кампании, которой можно доверять',
    how1_h: 'Выберите сценарий и GEO',
    how1_p: 'Выберите один из 15+ CRM-сценариев — реактивация, первый депозит, VIP, спортивное событие — задайте регион и сегмент.',
    how2_h: 'AI считает механику и стоимость',
    how2_p: 'AI подбирает механику бонуса, пишет тексты для 5 каналов, проводит аудит комплаенса и показывает полную модель стоимости.',
    how3_h: 'Добавьте в календарь',
    how3_p: 'Разместите кампанию в Retention Calendar, проверьте пересечения и экспортируйте спеку — готово для CRM-команды.',

    feat_tag: 'Для растущих iGaming-команд',
    feat_h2: 'Мощная экономика. Без таблиц.',
    feat_sub: 'Всё, что нужно бонусному или CRM-менеджеру для уверенного планирования ретеншена — без команды дата-сайентистов.',
    fs1_h: 'Мульти-гео из коробки',
    fs1_p: '17 юрисдикций уже настроены — верные лимиты вейджера, валюты и правила лицензий из коробки.',
    fs2_h: 'Комплаенс встроен',
    fs2_p: 'Каждая кампания автоматически проверяется на лимиты вейджера, RG-требования и правила конкретной лицензии.',
    fs3_h: 'Стоимость наперёд',
    fs3_p: 'Лучший, ожидаемый и худший сценарий — реальная стоимость бонуса ещё до утверждения бюджета.',
    fs4_h: 'Готово меньше чем за 2 минуты',
    fs4_p: 'Механика, тексты для 5 каналов и модель стоимости — генерируются вместе, готовы для CRM-команды.',
    fs5_h: 'Сравнение с конкурентами',
    fs5_p: 'Узнайте, как ваш бонус, турнир или программа лояльности выглядят на фоне конкурентов в вашем гео — AI находит их условия и показывает, где вы выигрываете или проигрываете игрока.',

    cta_h2: 'Готовы спланировать следующую кампанию?',
    cta_p: 'Бесплатно в период беты. Без карты — просто создайте аккаунт, выберите сценарий и посмотрите цифры.',
    cta_btn: '🚀 Попробовать бесплатно →',
    cta_c1: '✓ Без обязательств',
    cta_c2: '✓ Готово меньше чем за 2 минуты',
    cta_c3: '✓ Бесплатно в бете',

    footer_rights: 'Все права защищены.',
    footer_privacy: 'Конфиденциальность', footer_terms: 'Условия',

    sticky_cta: '🚀 Попробовать бесплатно →',

    cookie_title: 'Мы используем cookies',
    cookie_text: 'Мы используем только функциональное хранилище (языковые настройки) для улучшения работы. Без отслеживания и рекламных куки.',
    cookie_link: 'Политика конфиденциальности',
    cookie_decline: 'Отказаться',
    cookie_accept: 'Принять',
  }
};

let currentLang = 'en';

function setLang(lang) {
  currentLang = lang;
  try { localStorage.setItem('bonusLang', lang); } catch(e) {}
  const L = LANG[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (L[key] !== undefined) el.textContent = L[key];
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === lang.toUpperCase());
  });
  document.documentElement.setAttribute('lang', lang);
}

// ════ COOKIE CONSENT ════
function cookieAccept() {
  try { localStorage.setItem('cookieConsent', 'accepted'); } catch(e) {}
  document.getElementById('cookie-banner').style.display = 'none';
}
function cookieDecline() {
  try { localStorage.setItem('cookieConsent', 'declined'); } catch(e) {}
  document.getElementById('cookie-banner').style.display = 'none';
}
function initCookieBanner() {
  try {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setTimeout(() => {
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.style.display = 'flex';
      }, 1200);
    }
  } catch(e) {}
}

// ════ INIT ════
(function() {
  try {
    const saved = localStorage.getItem('bonusLang');
    if (saved && LANG[saved]) { setLang(saved); }
    else setLang('en');
  } catch(e) { setLang('en'); }
  initCookieBanner();
})();

// ════ STICKY MOBILE CTA ════
(function() {
  const el = document.getElementById('stickyCta');
  const hero = document.querySelector('.hero');
  if (!el || !hero) return;
  function checkSticky() {
    if (window.innerWidth > 680) { el.style.display = 'none'; return; }
    el.style.display = hero.getBoundingClientRect().bottom < 0 ? 'block' : 'none';
  }
  window.addEventListener('scroll', checkSticky, { passive: true });
  window.addEventListener('resize', checkSticky, { passive: true });
  checkSticky();
})();

// ════ HERO SLIDES ════
let heroSlideIndex = 0;
function heroSlide(i) {
  const slides = document.querySelectorAll('.sim-slide');
  const dots = document.querySelectorAll('.sim-dot');
  if (!slides.length) return;
  heroSlideIndex = ((i % slides.length) + slides.length) % slides.length;
  slides.forEach((s, idx) => s.classList.toggle('active', idx === heroSlideIndex));
  dots.forEach((d, idx) => d.classList.toggle('active', idx === heroSlideIndex));
}
(function() {
  const card = document.querySelector('.sim-card');
  if (!card) return;
  let timer = null;
  function start() {
    timer = setInterval(() => heroSlide(heroSlideIndex + 1), 5000);
  }
  function stop() { if (timer) clearInterval(timer); }
  card.addEventListener('mouseenter', stop);
  card.addEventListener('mouseleave', start);
  start();
})();

// ════ REVEAL ON SCROLL ════
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('in'), i * 60);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
}
