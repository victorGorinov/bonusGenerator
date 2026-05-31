// ════ I18N ════
const LANG = {
  en: {
    nav_dashboard: '🚀 Try Retomat Free →',
    nav_cfg: '⚙️ Configurator', nav_tourn: '🏆 Tournaments',
    hero_cta2: '🏆 Tournament Generator →',
    t1_name: 'AI Campaign Generator', t1_desc: '5-channel CRM copy + economics in 2 min',
    t2_name: 'Bonus Configurator',    t2_desc: 'P10/P50/P90 cost model, live recalc',
    t3_name: 'Tournament Generator',  t3_desc: 'ROI model, prize distribution, setup guide + AI texts',
    t_try: 'Try →',
    badge: 'The Retention OS for iGaming',
    hero_h1a: 'Stop Building Retention in Spreadsheets.',
    hero_h1b: 'Retomat is the Retention OS — AI builds it, compliant and costed.',
    hero_sub: 'Bonuses, tournaments and CRM campaigns in one place. Pick a scenario, set your geo — AI selects the right mechanic, writes ready-to-send copy for 5 channels, models the cost (P10/P50/P90), and flags compliance issues. Or design a full tournament: prize structure, economics, setup guide, AI texts. Everything in under 2 minutes.',
    hero_cta1: '🤖 Generate My Campaign Free →',
    tr1: 'Ready in 2 min', tr2: 'No signup required', tr3: 'Free during beta', tr4: '9 jurisdictions',
    stat1: 'CRM Scenarios',
    stat2: 'AI Text Channels',
    stat5: 'Tournament Types',
    stat3: 'Jurisdictions',
    stat4: 'Any Promo Ready',
    feat_tag: 'Core Features',
    feat_h2: 'Campaigns. Tournaments. Compliance.',
    feat_sub: 'One platform for your entire promo operation: AI campaign generation, tournament design with setup guide, P10/P50/P90 cost modelling, 5-channel CRM copy, and regulatory audit — all in one place.',
    f1_h: 'AI Campaign Generator',
    f1_p: '5-step wizard: pick a scenario (reactivation, first deposit, VIP, sport event…), set geo and segment — AI selects the optimal mechanic, explains the reasoning, and shows alternatives.',
    f2_h: '5-Channel Text Generation',
    f2_p: 'AI writes Push, Email, SMS, Telegram, and Popup copy in your language — 3 variants per channel, ready to copy-paste into your CRM. Regenerate any time.',
    f3_h: 'AI Compliance Audit',
    f3_p: 'Each campaign is automatically checked for bonus abuse risk, wager cap violations, regulatory issues, and localisation gaps — before you send a single message. Compliance fines are expensive. This isn\'t.',
    f4_h: 'Multi-Geo Retention Engine',
    f4_p: 'EU, CIS, LatAm, Crypto, and more — every region ships with its own wager caps, currencies, and regulatory rules. Welcome / D2 / D3 / NDB / Reload / Cashback mechanics pre-built. New markets added continuously.',
    f5_h: 'Know Your Costs Before You Launch',
    f5_p: 'Every campaign shows you three cost estimates: best case, expected, and worst case. See what the bonus will realistically cost — before you approve the budget.',
    f6_h: 'Admin-Ready Export',
    f6_p: 'Export as JSON, CSV, curl snippet, or full Admin Config text with all wager rules, free spin specs, and game contributions — ready for your dev team.',
    f7_h: 'Tournament Generator',
    f7_p: 'Design Slot, Live, Mixed, and Prize Drop tournaments in minutes. Choose prize pool model, scoring, and distribution schema — get ROI projections, break-even analysis, and a full operator setup guide with checklist + launch timeline. AI writes promo copy for 5 channels and audits compliance.',
    reg_tag: 'Markets',
    reg_h2: 'Works Across Your Markets',
    reg_sub: 'Each region ships pre-configured — correct wager caps, local currencies, and regulatory strings out of the box. New geos are added on an ongoing basis.',
    lic_tag: 'License Rules',
    lic_h2: 'Every Bonus Configured for Your Jurisdiction',
    lic_sub: 'Bonus caps, wager limits, mandatory regulatory strings, and self-exclusion checks — each license has its own rules. Retomat knows them and applies them automatically.',
    lic_lv_high: 'Strict', lic_lv_mid: 'Standard', lic_lv_perm: 'Permissive', lic_lv_flex: 'Flexible',
    lic_none_name: 'Offshore', lic_none_region: 'No license',
    mga_r1: 'Wager 20–40× typical range',
    mga_r2: 'Responsible gambling tools required',
    mga_r3: 'T&Cs must be clearly accessible',
    mga_r4: 'No misleading winning probability claims',
    ukgc_r1: 'Max £10 per spin / bet while wagering',
    ukgc_r2: 'Gamstop self-exclusion check required',
    ukgc_r3: 'BeGambleAware.org reference mandatory',
    ukgc_r4: 'No countdown timers on active bonuses',
    dga_r1: 'Hard cap: 1,000 DKK per bonus offer',
    dga_r2: 'Minimum validity: 60 days',
    dga_r3: 'ROFUS self-exclusion check required',
    dga_r4: 'T&Cs same font size as promotional headline',
    cur_r1: 'No statutory bonus or wager cap',
    cur_r2: 'Basic KYC & AML compliance required',
    cur_r3: 'T&Cs must be published on site',
    cur_r4: 'No mandatory self-exclusion registry',
    anj_r1: 'No statutory bonus or wager cap',
    anj_r2: 'Basic KYC required, no wagering mandate',
    anj_r3: 'Responsible gambling disclaimer recommended',
    anj_r4: 'Fewer enforcement precedents than Curaçao',
    kah_r1: 'No statutory bonus or wager cap',
    kah_r2: 'Player dispute resolution mechanism required',
    kah_r3: 'KYC & AML compliance required',
    kah_r4: 'No mandatory self-exclusion registry',
    gib_r1: 'Wager requirements must be fair & clear',
    gib_r2: 'Responsible gambling tools required',
    gib_r3: 'No statutory bonus cap',
    gib_r4: 'GRA monitors for unfair bonus terms',
    iom_r1: 'T&Cs must be fair, transparent, clearly shown',
    iom_r2: 'Responsible gambling obligations apply',
    iom_r3: 'No statutory hard cap on bonuses',
    iom_r4: 'Trusted European jurisdiction',
    none_r1: 'No statutory restrictions',
    none_r2: 'Operator sets own bonus terms',
    none_r3: 'Base geo config applied as-is',
    none_r4: 'Best practices still recommended',
    how_tag: 'Process',
    how_h2: 'Full Campaign in 5 Steps',
    how_sub: 'From blank page to ready-to-send campaign — in under 2 minutes.',
    step1_h: 'Choose a Scenario',
    step1_p: 'Pick from 15+ templates: reactivation, first deposit, VIP retention, sport event, cashback, casino launch…',
    step2_h: 'Set Parameters',
    step2_p: 'Geo, player segment, budget, communication tone, risk level, and bonus mix. Under 60 seconds.',
    step3_h: 'AI Generates Mechanics',
    step3_p: 'Optimal bonus type, wager conditions, expected cost estimate, and alternatives — calculated for your market and scenario.',
    step4_h: 'Get Texts & Audit',
    step4_p: 'AI writes Push, Email, SMS, Telegram and Popup copy in your language, then audits the campaign for compliance risks.',
    step5_h: 'Export & Launch',
    step5_p: 'Download JSON, CSV, or Admin Config. Copy texts directly. Campaign saved to history with full economics snapshot.',
    prev_tag: 'Unit Economics',
    prev_h2: 'Know Your Costs Before You Launch',
    prev_sub: 'The built-in cost model shows you three versions of reality: the best case if players convert poorly, the expected outcome, and the worst case if the campaign over-performs. No surprises after launch.',
    prev_ui: 'Retomat — EU / MGA · €50 avg. deposit · 1000 players',
    ec_arpu: 'ARPU', ec_arpu_sub: 'avg. deposit / player',
    ec_ltv: 'LTV 12m', ec_ltv_sub: 'expected value',
    ec_roi: 'Bonus ROI', ec_roi_sub: 'expected scenario',
    ec_cost: 'Campaign Cost', ec_cost_sub: 'expected / 1000 players',
    ec_ratio_l: 'Cost Ratio',
    cheap: 'Cheap', warn: 'Warn',
    aud_tag: "Who It's For",
    aud_h2: 'Built for the People Who Actually Configure Bonuses',
    aud_sub: 'Not for the CEO — for the Bonus Manager, CRM Lead, and Compliance Officer who carries the spreadsheet every Monday morning.',
    a1_h: 'Bonus Managers',
    a1_p: 'Stop building specs in spreadsheets. AI generates mechanics, writes CRM texts for 5 channels, and audits compliance — in one session. What used to take a day now takes minutes.',
    a2_h: 'CRM Team Leads',
    a2_p: 'Brief, approve, send — faster. Instead of explaining what a wager condition is, hand your team a pre-built spec with economics already validated.',
    a3_h: 'iGaming Consultants',
    a3_p: 'Deliver polished bonus strategy documents to clients. Export Admin Config, show best/expected/worst-case cost projections, and generate channel copy — all in one session.',
    a4_h: 'Compliance Officers',
    a4_p: 'Every campaign goes through AI audit before it leaves the door — wager caps, regulatory strings, UKGC/MGA/DGA rules checked automatically. Less exposure, less stress.',
    su_tag: 'Early Access',
    su_h2: 'Get Early Access',
    su_sub: 'Free during beta. No credit card. If you configure bonuses for a living — this is for you.',
    ph_name: 'Your name', ph_email: 'Work email',
    ph_role: 'Your role...',
    role1: 'Bonus Manager', role2: 'CRM Lead / Product Owner', role3: 'iGaming Consultant',
    role4: 'Compliance Officer', role5: 'Founder / CEO', role6: 'Other',
    su_btn: 'Get Free Access →',
    su_note: '🔒 No spam. Unsubscribe anytime. GDPR compliant.',
    footer_rights: 'All rights reserved.',
    footer_privacy: 'Privacy', footer_terms: 'Terms',
    cookie_title: 'We use cookies',
    cookie_text: 'We use only functional storage (language preference) to improve your experience. No tracking or advertising cookies.',
    cookie_link: 'Privacy Policy',
    cookie_decline: 'Decline',
    cookie_accept: 'Accept',
    ex_tag: 'See What You Get',
    ex_h2: 'Real Campaign Output — in Under 2 Minutes',
    ex_sub: 'This is exactly what Retomat generates: the right bonus mechanic, compliance-checked texts for 5 channels, and a full cost model — ready to hand to your dev team.',
    ex1_scenario: 'Dormant players · 30+ days inactive',
    ex1_mechanic: '50% Deposit Match — up to £50',
    ex1_text: '📲 Push: "Hey! We\'ve missed you. Claim your 50% bonus now — 10× wagering applies. 18+ BeGambleAware.org"',
    ex1_c1: '✓ UKGC compliant', ex1_c2: '✓ Gamstop verified',
    ex2_scenario: 'New registrations · EU market',
    ex2_mechanic: '100% Welcome Bonus + 30 Free Spins',
    ex2_text: '✉️ Email: "Welcome! Your 100% bonus + 30 FS are waiting. Wagering: 25×. Responsible gambling tools available."',
    ex2_c1: '✓ MGA compliant', ex2_c2: '✓ RG tools added',
    ex3_scenario: 'High-value segment · no-KYC',
    ex3_mechanic: '15% Weekly Cashback — No Wagering',
    ex3_wager: 'None (crypto standard)',
    ex3_text: '💬 Telegram: "💎 Your weekly cashback is ready! 15% back on net losses — zero wagering. Credited instantly."',
    ex3_c1: '✓ No wager', ex3_c2: '✓ USDT / BTC',
    ex_cost_l: 'Expected cost', ex_ch_l: 'Texts generated', ex_ch_v: '5 channels × 3 variants',
    ex_cc3: '✓ Cost modeled',
    ex_cta: '🤖 Generate Your Own Campaign →',
    sticky_cta: '🤖 Generate My Campaign Free →',
    demo_h: 'Your Next Campaign or Tournament Is 2 Minutes Away.',
    demo_p: 'Pick a scenario, set your geo — get bonus mechanics, texts for 5 channels, cost model, and compliance audit. Or build a full tournament with economics, setup guide, and AI copy. Free, instant, no login required.',
    demo_btn: '🤖 Generate My Campaign Free →',
    demo_btn2: '🏆 Try Tournament Generator',
    marquee: ['AI Campaign Generator', 'Tournament Generator', 'Compliance-Ready Config', '5 Channel Texts', 'Push · Email · SMS · TG · Popup', 'Slot · Live · Mixed · Prize Drop', 'Best / Expected / Worst-Case Cost', 'UKGC · MGA · DGA · Curaçao', 'Auto-Applied License Rules', 'Welcome + D2 + D3 + NDB', 'Reload & Cashback', 'AI Compliance Audit', 'Tournament Setup Guide', 'ROI & Break-Even Model', 'Prize Distribution Engine', 'Multi-Geo Support', '15+ CRM Scenarios', 'No Spreadsheets'],
  },
  ru: {
    nav_dashboard: '🚀 Попробовать бесплатно →',
    nav_cfg: '⚙️ Конфигуратор', nav_tourn: '🏆 Турниры',
    hero_cta2: '🏆 Генератор Турниров →',
    t1_name: 'AI-генератор кампаний',  t1_desc: 'Тексты для 5 каналов + экономика за 2 мин',
    t2_name: 'Конфигуратор бонусов',   t2_desc: 'Модель P10/P50/P90, пересчёт в реальном времени',
    t3_name: 'Генератор турниров',     t3_desc: 'ROI-модель, призовая таблица, гайд по запуску + AI-тексты',
    t_try: 'Открыть →',
    badge: 'Retention OS для iGaming',
    hero_h1a: 'Хватит собирать ретеншен в таблицах.',
    hero_h1b: 'Retomat — это Retention OS. AI всё соберёт: комплаенс и экономика учтены.',
    hero_sub: 'Выберите сценарий, задайте гео — AI подберёт правильную механику, напишет тексты для 5 каналов, рассчитает стоимость и проверит комплаенс. Или создайте турнир: призовая структура, экономика, гайд по запуску, AI-тексты. Всё за 2 минуты.',
    hero_cta1: '🤖 Сгенерировать бесплатно →',
    tr1: 'Готово за 2 мин', tr2: 'Без регистрации', tr3: 'Бесплатно в бете', tr4: '9 юрисдикций',
    stat1: 'CRM-сценариев',
    stat2: 'Каналов AI-текстов',
    stat5: 'Типа турниров',
    stat3: 'Юрисдикций',
    stat4: 'Любая промо готова',
    feat_tag: 'Функциональность',
    feat_h2: 'Кампании. Турниры. Комплаенс.',
    feat_sub: 'Одна платформа для всего промо-управления: AI-генератор кампаний, дизайн турниров с гайдом по запуску, модель P10/P50/P90, тексты для 5 каналов и регуляторный аудит — всё в одном месте.',
    f1_h: 'AI-генератор кампаний',
    f1_p: 'Мастер из 5 шагов: выберите сценарий (реактивация, первый депозит, VIP, спортивное событие…), задайте гео и сегмент — AI подберёт оптимальную механику, объяснит логику и покажет альтернативы.',
    f2_h: 'Тексты для 5 каналов',
    f2_p: 'AI пишет Push, Email, SMS, Telegram и Popup на вашем языке — 3 варианта на каждый канал, готовы к копированию в CRM. Перегенерация в любой момент.',
    f3_h: 'AI-аудит соответствия',
    f3_p: 'Каждая кампания автоматически проверяется на риски злоупотреблений, превышение лимитов вейджера, регуляторные нарушения и пробелы в локализации — до того, как вы что-то отправите. Штрафы регуляторов стоят дорого. Это — нет.',
    f4_h: 'Мульти-гео движок ретеншена',
    f4_p: 'ЕС, СНГ, LatAm, Крипто и другие — каждый регион поставляется со своими лимитами вейджера, валютами и регуляторными правилами. Welcome / D2 / D3 / NDB / Reload / Cashback собраны заранее. Новые рынки добавляются регулярно.',
    f5_h: 'Узнайте затраты до запуска',
    f5_p: 'По каждой кампании — три сценария стоимости: лучший случай, ожидаемый и худший. Видите, во сколько реально обойдётся бонус, до того как подписали бюджет.',
    f6_h: 'Экспорт для администраторов',
    f6_p: 'Экспорт в JSON, CSV, curl или полный Admin Config с вейджерными правилами, спекой по фриспинам и контрибуциями игр — готово для разработчиков.',
    f7_h: 'Генератор Турниров',
    f7_p: 'Создавайте Slot, Live, Mixed и Prize Drop турниры за минуты. Выберите модель призового фонда, скоринг и схему распределения — получите ROI-прогноз, точку безубыточности и полный гайд для оператора с чек-листом и таймлайном. AI напишет рекламные тексты и проведёт комплаенс-аудит.',
    reg_tag: 'Рынки',
    reg_h2: 'Работает на ваших рынках',
    reg_sub: 'Каждый регион поставляется настроенным — правильные лимиты вейджера, местные валюты и регуляторные строки из коробки. Новые гео добавляются на постоянной основе.',
    lic_tag: 'Лицензионные правила',
    lic_h2: 'Каждый бонус настроен под вашу юрисдикцию',
    lic_sub: 'Лимиты бонусов, лимиты вейджера, обязательные регуляторные строки и проверки на самоисключение — у каждой лицензии свои правила. Retomat знает их и применяет автоматически.',
    lic_lv_high: 'Строгая', lic_lv_mid: 'Стандарт', lic_lv_perm: 'Мягкая', lic_lv_flex: 'Гибко',
    lic_none_name: 'Офшор', lic_none_region: 'Без лицензии',
    mga_r1: 'Вейджер 20–40× — типичный диапазон',
    mga_r2: 'Инструменты ответственной игры обязательны',
    mga_r3: 'T&C должны быть легкодоступны',
    mga_r4: 'Запрещены вводящие в заблуждение заявления о выигрыше',
    ukgc_r1: 'Лимит £10 на ставку при игре с бонусом',
    ukgc_r2: 'Обязательна проверка через Gamstop',
    ukgc_r3: 'Обязательна ссылка на BeGambleAware.org',
    ukgc_r4: 'Таймеры обратного отсчёта на бонусах запрещены',
    dga_r1: 'Жёсткий лимит: 1 000 DKK на один бонус',
    dga_r2: 'Минимальный срок действия: 60 дней',
    dga_r3: 'Обязательна проверка через ROFUS',
    dga_r4: 'T&C должны быть в том же размере шрифта, что и оффер',
    cur_r1: 'Нет законодательных ограничений на бонус или вейджер',
    cur_r2: 'Базовый KYC и AML-комплаенс обязательны',
    cur_r3: 'T&C должны быть опубликованы на сайте',
    cur_r4: 'Обязательный реестр самоисключений не требуется',
    anj_r1: 'Нет законодательных ограничений на бонус или вейджер',
    anj_r2: 'Базовый KYC обязателен, вейджер не регулируется',
    anj_r3: 'Дисклеймер об ответственной игре рекомендован',
    anj_r4: 'Меньше прецедентов правоприменения, чем у Curaçao',
    kah_r1: 'Нет законодательных ограничений на бонус или вейджер',
    kah_r2: 'Обязателен механизм разрешения споров игроков',
    kah_r3: 'KYC и AML-комплаенс обязательны',
    kah_r4: 'Обязательный реестр самоисключений не требуется',
    gib_r1: 'Условия вейджера должны быть честными и понятными',
    gib_r2: 'Инструменты ответственной игры обязательны',
    gib_r3: 'Законодательного лимита на бонус нет',
    gib_r4: 'GRA контролирует несправедливые условия бонусов',
    iom_r1: 'T&C должны быть честными, прозрачными и хорошо видимыми',
    iom_r2: 'Обязательства по ответственной игре применяются',
    iom_r3: 'Законодательного лимита на бонус нет',
    iom_r4: 'Авторитетная европейская юрисдикция',
    none_r1: 'Никаких законодательных ограничений',
    none_r2: 'Оператор устанавливает условия бонусов самостоятельно',
    none_r3: 'Применяется базовая конфигурация гео',
    none_r4: 'Соблюдение лучших практик всё равно рекомендуется',
    how_tag: 'Процесс',
    how_h2: 'Полная кампания за 5 шагов',
    how_sub: 'От чистого листа до готовой к отправке кампании — менее чем за 2 минуты.',
    step1_h: 'Выберите сценарий',
    step1_p: 'Более 15 шаблонов: реактивация, первый депозит, VIP-удержание, спортивное событие, кэшбек, запуск казино…',
    step2_h: 'Задайте параметры',
    step2_p: 'Гео, сегмент игроков, бюджет, тон коммуникации, уровень риска и бонусный микс. Менее 60 секунд.',
    step3_h: 'AI генерирует механику',
    step3_p: 'Оптимальный тип бонуса, условия вейджера, ожидаемые затраты и альтернативные механики — рассчитаны под ваш рынок и сценарий.',
    step4_h: 'Тексты и аудит',
    step4_p: 'AI пишет Push, Email, SMS, Telegram и Popup на вашем языке, затем проверяет кампанию на соответствие регуляторным требованиям.',
    step5_h: 'Экспорт и запуск',
    step5_p: 'Скачайте JSON, CSV или Admin Config. Скопируйте тексты напрямую. Кампания сохраняется в историю с полным снимком экономики.',
    prev_tag: 'Юнит-экономика',
    prev_h2: 'Знайте затраты до запуска',
    prev_sub: 'Встроенная модель считает три варианта: лучший (игроки конвертируются плохо), ожидаемый (реалистичный прогноз) и худший (кампания выстрелила сильнее бюджета). Никаких сюрпризов после запуска.',
    prev_ui: 'Retomat — ЕС / MGA · €50 ср. депозит · 1000 игроков',
    ec_arpu: 'ARPU', ec_arpu_sub: 'ср. депозит / игрок',
    ec_ltv: 'LTV 12м', ec_ltv_sub: 'ожидаемое значение',
    ec_roi: 'ROI бонусов', ec_roi_sub: 'ожидаемый сценарий',
    ec_cost: 'Затраты на кампанию', ec_cost_sub: 'ожидаемо / 1000 игроков',
    ec_ratio_l: 'Коэффициент затрат',
    cheap: 'Дёшево', warn: 'Внимание',
    aud_tag: 'Для кого',
    aud_h2: 'Для тех, кто реально настраивает бонусы',
    aud_sub: 'Не для CEO — для бонусного менеджера, лида CRM и комплаенс-офицера, который каждый понедельник открывает таблицу.',
    a1_h: 'Бонусные менеджеры',
    a1_p: 'Хватит собирать спеки в таблицах. AI генерирует механику, пишет CRM-тексты для 5 каналов и проводит аудит — за одну сессию. То, что занимало день, теперь занимает минуты.',
    a2_h: 'Лиды CRM-команд',
    a2_p: 'Поставить задачу, согласовать, запустить — быстрее. Вместо объяснений что такое вейджер — передайте команде готовую спеку с проверенной экономикой.',
    a3_h: 'Консультанты iGaming',
    a3_p: 'Предоставляйте клиентам проработанные документы по бонусной стратегии. Экспортируйте Admin Config, показывайте лучший/ожидаемый/худший варианты затрат и генерируйте тексты — всё за одну сессию.',
    a4_h: 'Комплаенс-офицеры',
    a4_p: 'Каждая кампания проходит AI-аудит перед отправкой — лимиты вейджера, регуляторные строки, правила UKGC/MGA/DGA проверяются автоматически. Меньше риска, меньше стресса.',
    su_tag: 'Ранний доступ',
    su_h2: 'Получить ранний доступ',
    su_sub: 'Бесплатно в период бета-тестирования. Карта не нужна. Если вы настраиваете бонусы каждый день — это для вас.',
    ph_name: 'Ваше имя', ph_email: 'Рабочий email',
    ph_role: 'Ваша роль...',
    role1: 'Бонусный менеджер', role2: 'Лид CRM / Продакт', role3: 'Консультант iGaming',
    role4: 'Комплаенс-офицер', role5: 'Основатель / CEO', role6: 'Другое',
    su_btn: 'Получить бесплатный доступ →',
    su_note: '🔒 Без спама. Отписка в любое время. Соответствие GDPR.',
    footer_rights: 'Все права защищены.',
    footer_privacy: 'Конфиденциальность', footer_terms: 'Условия',
    cookie_title: 'Мы используем cookies',
    cookie_text: 'Мы используем только функциональное хранилище (языковые настройки) для улучшения работы. Без отслеживания и рекламных куки.',
    cookie_link: 'Политика конфиденциальности',
    cookie_decline: 'Отказаться',
    cookie_accept: 'Принять',
    ex_tag: 'Смотрите, что получите',
    ex_h2: 'Реальный аутпут кампании — за 2 минуты',
    ex_sub: 'Именно это генерирует Retomat: правильная механика бонуса, тексты для 5 каналов с проверкой комплаенса и полная модель стоимости — готово для передачи в разработку.',
    ex1_scenario: 'Спящие игроки · неактивны 30+ дней',
    ex1_mechanic: '50% матч депозита — до £50',
    ex1_text: '📲 Push: «Мы скучали! Заберите бонус 50% прямо сейчас — вейджер 10×. 18+ BeGambleAware.org»',
    ex1_c1: '✓ UKGC-комплаенс', ex1_c2: '✓ Проверка Gamstop',
    ex2_scenario: 'Новые регистрации · рынок ЕС',
    ex2_mechanic: '100% велком-бонус + 30 фриспинов',
    ex2_text: '✉️ Email: «Добро пожаловать! Ваш бонус 100% + 30 FS ждут. Вейджер: 25×. Инструменты ответственной игры подключены.»',
    ex2_c1: '✓ MGA-комплаенс', ex2_c2: '✓ RG-инструменты',
    ex3_scenario: 'VIP-сегмент · без KYC',
    ex3_mechanic: '15% еженедельный кэшбек — без вейджера',
    ex3_wager: 'Без вейджера (крипто-стандарт)',
    ex3_text: '💬 Telegram: «💎 Ваш еженедельный кэшбек готов! 15% от чистых потерь — вейджера нет. Начислено мгновенно.»',
    ex3_c1: '✓ Без вейджера', ex3_c2: '✓ USDT / BTC',
    ex_cost_l: 'Ожидаемые затраты', ex_ch_l: 'Тексты сгенерированы', ex_ch_v: '5 каналов × 3 варианта',
    ex_cc3: '✓ Стоимость рассчитана',
    ex_cta: '🤖 Сгенерировать свою кампанию →',
    sticky_cta: '🤖 Сгенерировать бесплатно →',
    demo_h: 'Кампания или турнир — за 2 минуты.',
    demo_p: 'Выберите сценарий, задайте гео — получите механику, тексты для 5 каналов, модель стоимости и аудит. Или создайте турнир с экономикой, гайдом и AI-текстами. Бесплатно, мгновенно, без регистрации.',
    demo_btn: '🤖 Сгенерировать бесплатно →',
    demo_btn2: '🏆 Генератор Турниров',
    marquee: ['AI-генератор кампаний', 'Генератор турниров', 'Compliance-Ready конфиг', 'Тексты для 5 каналов', 'Push · Email · SMS · TG · Popup', 'Слот · Лайв · Смешанный · Prize Drop', 'Лучший / ожидаемый / худший сценарий', 'UKGC · MGA · DGA · Curaçao', 'Автоприменение лицензионных правил', 'Welcome + D2 + D3 + NDB', 'Reload и Cashback', 'AI-аудит соответствия', 'Гайд по запуску турнира', 'ROI и точка безубыточности', 'Движок распределения призов', 'Мульти-гео поддержка', '15+ CRM-сценариев', 'Без таблиц'],
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
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (L[key] !== undefined) el.placeholder = L[key];
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === lang.toUpperCase());
  });
  buildMarquee(lang);
}

// ════ MARQUEE ════
function buildMarquee(lang) {
  const items = LANG[lang].marquee;
  const track = document.getElementById('marqueeTrack');
  const html = [...items, ...items].map(t =>
    `<span class="marquee-item"><span class="marquee-dot"></span>${t}</span>`
  ).join('');
  track.innerHTML = html;
}

// ════ SIGNUP ════
async function handleSignup(e) {
  e.preventDefault();
  const btn = e.target;
  const form = btn.closest('.signup-form');
  const name  = form.querySelector('input[type="text"]').value.trim();
  const email = form.querySelector('input[type="email"]').value.trim();
  const role  = form.querySelector('select').value;

  if (!email) {
    form.querySelector('input[type="email"]').focus();
    return;
  }

  btn.disabled = true;
  btn.textContent = currentLang === 'ru' ? 'Отправка...' : 'Sending...';

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role }),
    });
    if (res.ok) {
      btn.textContent = currentLang === 'ru' ? '✓ Заявка отправлена!' : '✓ You\'re on the list!';
      btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else {
      btn.textContent = currentLang === 'ru' ? 'Ошибка, попробуйте снова' : 'Error, try again';
      btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      btn.disabled = false;
    }
  } catch {
    btn.textContent = currentLang === 'ru' ? 'Ошибка, попробуйте снова' : 'Error, try again';
    btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    btn.disabled = false;
  }
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

// Intersection Observer for subtle entrance animations
if ('IntersectionObserver' in window) {
  const style = document.createElement('style');
  style.textContent = `
    .feature-card, .region-card, .audience-card, .step {
      opacity: 0; transform: translateY(24px);
      transition: opacity .5s ease, transform .5s ease;
    }
    .feature-card.visible, .region-card.visible,
    .audience-card.visible, .step.visible {
      opacity: 1; transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 60);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card, .region-card, .audience-card, .step, .example-card, .lic-card')
    .forEach(el => obs.observe(el));
}

// ── Hero reveal (staggered fade-up) ──
(function() {
  const items = [
    '.hero-badge',
    '.hero h1',
    '.hero-sub',
    '.hero-ctas',
    '.trust-strip',
    '.hero-stats',
    '.hero-visual'
  ];
  const style = document.createElement('style');
  style.textContent = `
    .hero-reveal { opacity: 0; transform: translateY(28px); }
    .hero-reveal.in { opacity: 1; transform: translateY(0);
      transition: opacity .7s cubic-bezier(.23,1,.32,1),
                  transform .7s cubic-bezier(.23,1,.32,1); }
  `;
  document.head.appendChild(style);
  items.forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.classList.add('hero-reveal');
  });
  // Stagger on load
  const base = 80;
  items.forEach((sel, i) => {
    const el = document.querySelector(sel);
    if (el) setTimeout(() => el.classList.add('in'), base + i * 110);
  });
})();

// ── Hero particles ──
(function() {
  const canvas = document.getElementById('heroParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  const COLORS = ['rgba(79,110,247,', 'rgba(124,58,237,', 'rgba(167,139,250,'];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function init() {
    resize();
    particles = Array.from({ length: 38 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - .5) * .28,
      vy: (Math.random() - .5) * .28,
      a: Math.random() * .55 + .1,
      col: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col + p.a + ')';
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); init(); });
  init(); draw();
})();

// ── Stat count-up ──
(function() {
  const stats = document.querySelectorAll('.stat-num');
  const parse = t => {
    const m = t.match(/^([<]?)(\d+)([+]?)(.*)$/);
    return m ? { prefix: m[1], num: +m[2], suffix: m[3] + m[4] } : null;
  };
  const fmt = (prefix, n, suffix) => prefix + n + suffix;

  if (!('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const p = parse(el.textContent.trim());
      if (!p || p.num === 0) return;
      obs.unobserve(el);
      const dur = 900, steps = 40;
      let i = 0;
      const id = setInterval(() => {
        i++;
        const eased = 1 - Math.pow(1 - i / steps, 3);
        el.textContent = fmt(p.prefix, Math.round(p.num * eased), p.suffix);
        if (i >= steps) { clearInterval(id); el.textContent = fmt(p.prefix, p.num, p.suffix); }
      }, dur / steps);
    });
  }, { threshold: 0.6 });

  stats.forEach(el => obs.observe(el));
})();

// ── Hero mockup carousel ──
(function() {
  const TOTAL = 3;
  let current = 0;
  let timer;

  function show(idx) {
    for (let i = 0; i < TOTAL; i++) {
      const slide = document.getElementById('mslide-' + i);
      const dot   = document.getElementById('mpd-' + i);
      if (slide) slide.classList.toggle('active', i === idx);
      if (dot)   dot.classList.toggle('active', i === idx);
    }
    current = idx;
  }

  function next() { show((current + 1) % TOTAL); }

  function startTimer() { timer = setInterval(next, 4000); }
  function stopTimer()  { clearInterval(timer); }

  const card = document.getElementById('heroMockup');
  if (card) {
    card.addEventListener('mouseenter', stopTimer);
    card.addEventListener('mouseleave', startTimer);
    startTimer();
  }

  // tap through on mobile
  const dots = document.querySelectorAll('.mockup-prog-dot');
  dots.forEach((d, i) => {
    d.style.cursor = 'pointer';
    d.addEventListener('click', () => { stopTimer(); show(i); startTimer(); });
  });
})();
