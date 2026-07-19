
// ═════════════════════════════════════════════════════════════════════════════
// i18n DICTIONARY
// ═════════════════════════════════════════════════════════════════════════════
const LANG = {
  ru: {
    hdr_sub:'v2.0 · Casino Bonus Admin Spec Generator',
    pnl_title:'Параметры конфигурации',
    lbl_region:'Регион и бизнес-модель',
    reg_cis:'СНГ', reg_cis_sub:'RU · UA · KZ / Фиат',
    reg_eu:'EU / UK', reg_eu_sub:'EUR · GBP / Фиат',
    reg_crypto:'Global Crypto', reg_crypto_sub:'BTC · ETH · USDT',
    reg_sweep:'USA / Sweep', reg_sweep_sub:'SC · GC / Sweepcoins',
    reg_mn:'Монголия', reg_mn_sub:'MNT / Фиат',
    reg_latam:'LatAm', reg_latam_sub:'USD / Фиат',
    lbl_players:'Новых игроков / месяц',
    sl_min:'100', sl_max:'50 000+',
    lbl_sitecur:'Основная валюта сайта',
    lbl_avgdep:'Средний первый депозит',
    lbl_platform:'Платформа',
    lbl_license:'Лицензия / юрисдикция',
    lbl_rtp:'Средний RTP слотов',
    plat_both:'Desktop + Mobile', plat_mobile:'Mobile Only', plat_desk:'Desktop Only',
    lic_mga:'MGA', lic_ukgc:'UKGC', lic_dga:'DGA', lic_curacao:'Curaçao', lic_none:'Нет / Офшор',
    lbl_country:'Страна EU',
    hint_de:'типично для Германии', hint_fr:'типично для Франции', hint_es:'типично для Испании',
    hint_it:'типично для Италии', hint_nl:'типично для Нидерландов',
    hint_uk:'типично для Великобритании', hint_dk:'типично для Дании',
    eu_ctry_hint_de:'MGA · EUR · ср. деп. €50', eu_ctry_hint_fr:'MGA · EUR · ср. деп. €45',
    eu_ctry_hint_es:'MGA · EUR · ср. деп. €40', eu_ctry_hint_it:'MGA · EUR · ср. деп. €40',
    eu_ctry_hint_nl:'MGA · EUR · ср. деп. €55', eu_ctry_hint_uk:'UKGC · GBP · ср. деп. £45',
    eu_ctry_hint_dk:'DGA · DKK · ср. деп. 700 DKK',
    btn_gen:'⚡ Сгенерировать конфигурацию',
    ph_t:'Выберите регион и заполните параметры',
    ph_s:'Нажмите «Сгенерировать конфигурацию» — получите полный набор настроек для вашей админки',
    no_region:'Пожалуйста, выберите регион',
    // output
    out_title:'Конфигурация бонусной программы',
    players_mo:'игроков/мес', avg_dep:'Ср. депозит',
    btn_print:'🖨 Печать / PDF',
    reg_warn_title:'⚠️ Регуляторные требования —',
    sec_dep1:'Бонус 1-го депозита', sec_dep2:'Бонус 2-го депозита', sec_dep3:'Бонус 3-го депозита',
    sec_dep_pkg:'Депозитный пакет', dep_step:'Шаг',
    v_sc_purchase_bonus:'SC-бонус при покупке',
    p_dep_trigger:'Триггер', p_dep_wager:'Вейджер на бонус',
    v_2nd_purchase:'2-я покупка (любой пакет)', v_3rd_purchase:'3-я покупка (любой пакет)',
    mn_note_title:'ℹ️ Монголия — регуляторная справка',
    mn_note_text:'Азартные игры в Монголии официально запрещены (закон 2013 г.). Операция ведётся через офшорную лицензию Curaçao без регистрации в стране. Игроки получают доступ через VPN/зеркала.',
    latam_note_text:'Операция через офшорную лицензию Curaçao. Ключевые рынки: Бразилия, Мексика, Колумбия, Аргентина, Чили. Рекомендуемые способы оплаты: PIX, SPEI, PSE, Efecty, AstroPay.',
    // sections
    sec_welcome:'Welcome Bonus', sec_ndb:'No Deposit Bonus', sec_reload:'Reload Bonus',
    sec_fs:'Free Spins Spec', sec_sc_gc:'SC / GC Механика', sec_wager:'Условия вейджеринга',
    sec_cashback:'Кэшбек', sec_contrib:'Вклад игр в вейджер',
    sec_econ:'Юнит-экономика (расчётная)', sec_admin:'Admin Panel Config — полный конфиг',
    // param keys
    p_type:'Тип бонуса', p_size:'Размер', p_max_bonus:'Макс. сумма бонуса',
    p_min_dep:'Мин. депозит', p_fs_count:'Free Spins в пакете',
    p_validity:'Срок действия', p_days:' дней',
    p_trigger:'Trigger', p_promo:'Promo code', p_optin:'Opt-in',
    p_sc:'Sweepcoins (SC)', p_gc:'Gold Coins (GC)',
    p_daily_sc:'SC в день', p_daily_gc:'GC в день', p_limit:'Лимит',
    p_freq:'Периодичность', p_day:'День выдачи',
    p_spin_val:'Стоимость спина', p_fs_games:'Допустимые игры',
    p_fs_wager:'Вейджер на выигрыш', p_fs_maxw:'Макс. выплата с FS',
    p_fs_delivery:'Выдача',
    p_wager_welcome:'Welcome Bonus', p_wager_ndb:'No Deposit',
    p_wager_reload:'Reload Bonus', p_wager_fs:'Free Spins выигрыш',
    p_wager_basis:'База вейджера', p_max_bet:'Макс. ставка с бонусом',
    p_eligible:'Допустимые игры', p_wager_days:'Срок отыгрыша',
    p_wager_lock:'Тип wager lock',
    p_cb_model:'Модель', p_cb_period:'Период расчёта', p_cb_basis:'База',
    p_cb_max:'Макс. кэшбек', p_cb_wagering:'Вейджер на кэшбек',
    p_cb_payment:'Выплата', p_cb_pct:'Процент возврата',
    p_cb_min_loss:'Мин. потери для кэшбека', p_cb_currency:'Валюта выплаты',
    p_ct_game:'Тип игры', p_ct_contrib:'Вклад в вейджер',
    p_arpu:'ARPU / мес', p_ltv3:'LTV 3 месяца', p_cac:'CAC (бонус)',
    p_arpu_sub:'на активного игрока', p_ltv3_sub:'расчётный', p_cac_sub:'на привлечение',
    p_bonus_cost:'Bonus Cost % GGR', p_monthly_budget:'Мес. бонусный бюджет',
    p_cohort_ltv:'Суммарный LTV когорты за 3 мес', p_roi:'ROI региона (бенчмарк)', p_roi_campaign:'ROI кампании',
    rtip_roi_reg:'ROI рассчитан на основе среднего CAC по региону — это бенчмарк, не зависящий от конкретных параметров бонуса. Формула: (Cohort LTV − 3 × pl × cac) / (3 × pl × cac).',
    rtip_roi_camp:'ROI рассчитан от реальной стоимости этой кампании. Обновляется при изменении параметров бонуса. Формула: (Cohort LTV − 3 × campaign_cost_usd) / (3 × campaign_cost_usd).',
    p_breakeven:'Точка безубыточности', p_ggr_rate:'GGR ставка (типовая)',
    p_mo_on_player:' мес на игрока', p_ggr_val:'3–5% от ставок',
    sec_bonus_cost:'Анализ стоимости бонуса',
    p_bonus_size:'Размер бонуса (1 игрок)', p_mixed_rtp:'Смешанный RTP', p_mixed_wcr:'Смешанный WCR',
    p_scenario_p10:'Нижняя граница (P10)', p_scenario_p50:'Базовый сценарий (P50)', p_scenario_p90:'Верхняя граница (P90)',
    p_conv:'Конверсия', p_payout_per:'Выплата / игрок', p_turnover:'Оборот вейджера',
    p_total_cost:'Стоимость кампании', p_grand_total:'Общие затраты на кампанию', lbl_edit_wager:'Вейджер ✏', lbl_edit_maxb:'Макс. бонус ✏', p_cost_ratio:'Стоимость / депозиты', p_max_risk:'Макс. риск (потолок)',
    p_stress_test:'Стресс-тест +20% активаций',
    verdict_cheap:'💸 Оффер слабый (ratio < 10%) — низкий EV для игрока, конверсия будет падать. → Повысь match %, снизь вейджер или добавь FS в пакет',
    verdict_ok:'✅ Рабочий диапазон (10–20%) — баланс привлекательности и экономики. → Поддерживай параметры, следи за конверсией и чёрным',
    verdict_warn:'⚠️ Высокая нагрузка (20–35%) — риск убытка при всплеске активаций. → Повысь вейджер, снизь match % или ограничь max бонус',
    verdict_high:'🔴 Кампания убыточна (>35%) — затраты превышают допустимый порог. → Срочно повысь вейджер или снизь размер бонуса',
    // values
    v_match_dep:'Match Deposit', v_first_dep:'Первый депозит',
    v_required:'Обязателен до депозита', v_required_short:'Обязателен',
    v_no_wager:'Отсутствует', v_hard_lock:'Hard lock (смешение запрещено)',
    v_auto_start:'Автоматически в начале периода',
    v_flat:'Flat', v_tier:'Tier-Based',
    v_weekly:'Еженедельно', v_monthly:'Ежемесячно',
    v_net_losses:'Net losses за период', v_net_losses_monthly:'Net losses',
    v_slots_only:'Слоты (ср. RTP ',
    v_all_games:'Все игры (slots + live, 100%)',
    v_no_limit:'Без ограничения',
    v_bonus_only:'Только бонус', v_dep_bonus:'Депозит + бонус',
    v_sweep_type:'Sweepcoins Welcome', v_sweep_trigger:'Регистрация (бесплатно)',
    v_sweep_mech:'Free-play (без ставок)', v_sc_convert:'Конвертируются в реальные деньги',
    v_gc_no_redeem:'Только игровые монеты, без вывода',
    v_min_redeem_sc:'100 SC', v_max_redeem_sc:'$5 000 / месяц',
    v_daily_sc_type:'Ежедневный SC-бонус', v_daily_trigger:'Ежедневно (email / SMS)',
    v_immediate:'Сразу после активации Welcome',
    v_reg_verify:'Регистрация / Email verify',
    v_1_per_account:'1 на профиль / IP',
    v_day_mon:'Понедельник', v_day_tue:'Вторник', v_day_wed:'Среда', v_day_fri:'Пятница', v_day_sat:'Суббота',
    v_existing:'existing_players', v_new_only:'new_players_only',
    v_sweep_no_wager:'Вейджеринг отсутствует',
    v_sweep_freeplay:'Sweepcoins — free-play механика',
    v_1per_period:'1 раз в период',
    ukgc_note:'UKGC: денежный NDB запрещён. Только Free Spins.',
    copy_btn:'📋 Копировать', copy_hint:'Вставьте в настройки админ-панели казино или передайте разработчику',
    copied:'✓ Скопировано!',
    gen_admin_btn:'⚙️ Сгенерировать Admin Config', save_admin_btn:'💾 Сохранить .txt',
    admin_not_generated:'Конфиг не сгенерирован. Нажмите кнопку ниже для генерации.',
    // hint текст
    hint_cis:'типично для СНГ', hint_eu:'типично для EU',
    hint_crypto:'типично Crypto', hint_sweep:'ср. пакет USA', hint_mn:'типично для Монголии',
    hint_latam:'типично для LatAm',
    tip_region:'Определяет бизнес-модель, валюту, регуляторные ограничения и типовые вейджеры. Каждый регион генерирует свой набор бонусных параметров.',
    tip_players:'Число новых игроков, активирующих приветственный бонус в месяц. Используется для расчёта суммарного бюджета кампании и когортного LTV.',
    tip_sitecur:'Валюта, в которой работает сайт казино. Влияет на форматирование сумм в admin-конфиге и unit-экономике.',
    tip_avgdep:'Средний размер первого депозита по целевому сегменту. Определяет размер бонуса (% матча × депозит) и базу для расчёта cost ratio.',
    tip_platform:'Влияет на рекомендации по триггерам и отображению условий бонуса. Desktop и Mobile могут иметь разные UX-требования.',
    tip_license:'Задаёт регуляторные ограничения. UKGC: макс. ставка £2/spin, запрет денежного NDB. MGA: обязателен opt-in до депозита. Curaçao — мягкая юрисдикция.',
    tip_rtp:'Средний RTP слотов в игровой библиотеке. Используется в модели стоимости бонуса: чем выше RTP, тем медленнее игрок теряет деньги при вейджеринге и тем дороже бонус для оператора. Обычное значение для слотов: 95–97%.',
    rtip_wager:'Вейджер — сколько раз нужно прокрутить бонус до вывода. x30 при бонусе 1000 = поставить 30 000. Чем выше — тем сложнее отыграть.',
    rtip_match_pct:'Match % — какая доля депозита становится бонусом. 100% = на депозит 1000 игрок получает бонус 1000 (но не больше лимита). 50% = бонус 500.',
    rtip_max_bonus:'Максимальный бонус независимо от депозита. При матче 100% и лимите 5000 — на депозит 10 000 игрок получит только 5000 бонуса.',
    rtip_wager_basis:'База расчёта вейджера. «Только бонус» = wager × бонус. «Депозит + бонус» = wager × (депозит + бонус) — более жёсткое условие для игрока.',
    rtip_mixed_rtp:'Взвешенный RTP по game mix региона. Чем выше RTP — тем медленнее игрок теряет деньги во время вейджеринга, тем дороже бонус для оператора.',
    rtip_mixed_wcr:'Weighted Contribution Rate — средняя доля ставки, засчитываемая в вейджер. WCR 50% = ставка 100 даёт только 50 в счёт отыгрыша.',
    rtip_cost_ratio:'Стоимость бонусной кампании к сумме депозитов. < 0.10 — слишком дёшево. 0.10–0.20 — рабочий диапазон. 0.20–0.35 — риск. > 0.35 — нужно удешевить.',
    rtip_max_risk:'Потолок обязательств: если 100% игроков активируют бонус и никто не вейджерит. Это не ожидаемые затраты — это максимально возможный объём.',
    rtip_arpu:'Средняя выручка с активного игрока в месяц. Региональный бенчмарк в USD, не зависит от локальной валюты.',
    rtip_p10:'P10 — оптимистичный сценарий: только 10% исходов лучше. Мало игроков доходит до конца вейджера.',
    rtip_p50:'P50 — базовый сценарий (медиана). Используйте для бюджетного планирования.',
    rtip_p90:'P90 — пессимистичный сценарий: только 10% исходов хуже. Максимальный риск выплат.',
    rtip_breakeven_wager:'Вейджер, при котором ожидаемые выплаты равны размеру бонуса. Wager > breakeven = оператор в плюсе. Wager ≤ breakeven = повышенный риск.',
    rtip_ltv3:'Суммарная выручка с одного игрока за 3 месяца: LTV 3 мес = ARPU × 3. Показывает, сколько в среднем принесёт привлечённый игрок за первый квартал жизни в продукте. Используется для оценки окупаемости CAC и целесообразности бонусного бюджета.',
    rtip_cac:'Стоимость привлечения одного игрока через бонусный канал. Региональный бенчмарк в USD.',
    rtip_scenario:'E[max(0,X)], где X — банкролл игрока после отыгрыша. μ = B×(1 − W/BE) — ожидаемый остаток; σ = √(W×B/WCR) — дисперсия банкролла (ЦПТ). Стоимость кампании = E[payout]×conv×n. Ниже breakeven ≈ μ×conv×n; выше — плавно убывает к нулю без скачка.',
    // regulatory
    reg_ukgc_1:'Макс. ставка с активным бонусом: £2/spin или £2/round',
    reg_ukgc_2:'Запрет денежного NDB — только Free Spins на указанных слотах',
    reg_ukgc_3:'Условия вейджеринга обязательны для показа до акцепта бонуса',
    reg_ukgc_4:'Self-exclusion (GamStop): игроки под блокировкой не получают бонусы',
    reg_ukgc_5:'Маркировка: «Бонус с условиями отыгрыша» на каждом промо-материале',
    reg_ukgc_6:'Срок отыгрыша: не более 90 дней',
    reg_mga_1:'Wagering multiplier обязателен для отображения в UI при акцепте',
    reg_mga_2:'Автоматическая активация бонусов запрещена (требуется opt-in игрока)',
    reg_mga_3:'Обязательный раздел «Bonus Terms & Conditions» на сайте',
    reg_mga_4:'Cooldown между одинаковыми бонусами: минимум 24 часа',
    reg_mga_5:'Лимит ставки с бонусом: рекомендуется €5/spin',
    reg_sweep_1:'No Purchase Necessary — обязательна бесплатная альтернатива получения SC',
    reg_sweep_2:'Запрещено называть продукт «gambling» — это sweepstakes promotion',
    reg_sweep_3:'SC не являются деньгами: не регулируются как ставки',
    reg_sweep_4:'Юридический дисклеймер обязателен на каждой странице с бонусами',
    reg_sweep_5:'Проверка возраста: 18+ (в ряде штатов 21+); запрет в RI, AZ, SC, ID, MT, WA',
    // ── Макс. ставка (v_ ключи)
    v_eu_max_bet:'€5/spin (рекомендуемый лимит MGA)',
    v_ukgc_max_bet:'£2/spin (регуляторный лимит UKGC)',
    v_dga_max_bet:'Без спин-лимита (DGA; бонусный кэп 1 000 DKK)',
    v_standard_max_bet:'Стандартный лимит оператора',
    // ── DGA (Дания)
    reg_dga_1:'Жёсткий кэп: макс. бонус 1 000 DKK за одно предложение (закон)',
    reg_dga_2:'Мин. срок отыгрыша: 60 дней (законодательный минимум)',
    reg_dga_3:'ROFUS: проверка самоисключения обязательна до выдачи любого бонуса',
    reg_dga_4:'2025: T&C должны печататься тем же размером шрифта, что и заголовок промо',
    // ── Глобальные лицензии
    reg_curacao_1:'Нет законодательного кэпа на бонусы и вейджер; мягкая юрисдикция',
    reg_curacao_2:'KYC/AML обязательны; правила должны быть опубликованы на сайте',
    reg_betsbr_1:'Федеральный режим «Bets» (Закон 14.790): лицензия SPA обязательна',
    reg_betsbr_2:'KYC по CPF + распознавание лица; ограничения на бонусы игрокам',
    reg_betsbr_3:'Налог 12% с GGR; обязательные сообщения об ответственной игре',
    reg_segob_1:'Разрешение SEGOB обязательно; KYC и публикация правил',
    reg_segob_2:'Инструменты ответственной игры; T&C на сайте',
    reg_coljuegos_1:'Лицензия Coljuegos; временный НДС 19% на депозиты (2025)',
    reg_coljuegos_2:'KYC/AML обязательны; только лицензированные операторы',
    reg_mincetur_1:'Лицензия MINCETUR (Закон 31557); налог 0,3% ISI на депозиты',
    reg_mincetur_2:'KYC обязателен; меры ответственной игры',
    reg_anjouan_1:'Базовый KYC обязателен; рекомендуется дисклеймер ответственной игры',
    reg_kahnawake_1:'Обязателен механизм урегулирования споров игроков (KGC)',
    reg_gibraltar_1:'Справедливые условия вейджера; ответственная игра обязательна; надзор GRA',
    reg_iom_1:'Прозрачные T&C обязательны; требования ответственной игры; нет статутного кэпа',
    // cashback tiers
    ct_level:'Уровень', ct_losses:'Потери', ct_pct:'%',
    ct_bronze:'Bronze', ct_silver:'Silver', ct_gold:'Gold', ct_platinum:'Platinum',
    // package
    pkg_package:'Пакет', pkg_price:'Цена', pkg_sc:'SC',
    // ── Новые секции: CG-экономика, объяснение механики, AI-аудит
    sec_cg_econ:'Сценарии кампании', sec_mech_exp:'Объяснение механики', sec_cfg_audit:'AI-аудит соответствия',
    btn_run_cfg_audit:'⚡ Запустить аудит', cfg_audit_running:'Анализируем конфигурацию...',
    cfg_audit_pass:'✅ Пройдено', cfg_audit_fail:'❌ Нарушение', cfg_audit_warn:'⚠️ Предупреждение',
    cfg_audit_impact:'Влияние', cfg_audit_recs:'Рекомендации',
    cfg_audit_not_run:'Нажмите для запуска AI-аудита соответствия текущей конфигурации',
    cfg_audit_error:'Ошибка аудита: ',
    cfg_hint:'Выберите регион и нажмите «Сгенерировать» — получите полную спеку бонуса с моделью затрат P10/P50/P90 и прогнозом инкрементального дохода.',
    stale_banner:'Параметры изменились — нажмите «Сгенерировать» для обновления',
    stale_btn:'Сгенерировать ↻',
    cg_best:'Лучший случай', cg_expected:'Ожидаемый', cg_worst:'Худший случай',
    cg_cost_per_bonus:'Стоимость / игрок', cg_dep_load:'Нагрузка на деп.', cg_wager_compl:'Завершение вейджера',
    rtip_cg_cpb:'Средняя выплата на одного активировавшего игрока = бюджет кампании / (N × конверсия)',
    rtip_cg_dl:'Расходы как % от суммы депозитов. Целевой диапазон: 10–20%',
    rtip_cg_wc:'Доля игроков, успешно завершивших отыгрыш и получивших выплату',
    mech_exp_welcome:'Welcome Bonus', mech_exp_ndb:'No Deposit Bonus', mech_exp_reload:'Reload Bonus',
    mech_exp_below_be:'✅ Вейджер ниже breakeven — хороший профиль конверсии.',
    mech_exp_above_be:'⚠️ Вейджер выше breakeven — ожидается давление на конверсию.',
    // ── Сегмент + Incremental Revenue
    lbl_segment:'Сегмент игроков', tip_segment:'Сегмент влияет на прогноз incremental revenue: у новых игроков выше потенциал удержания бонусом, у VIP — ниже (они и так лояльны). Также задаёт контекст при интерпретации unit-экономики.',
    seg_new:'🆕 Новые', seg_mid:'👤 Средние', seg_vip:'👑 VIP',
    sec_incr_rev:'Прогноз Incremental Revenue',
    p_ret_lift:'Итоговый лифт', p_incr_players:'Доп. игроков (3 мес)', p_incr_rev:'Доп. выручка (3 мес)', p_camp_cost_3:'Затраты на бонусы: Welcome+NDB (3 мес)', p_incr_net:'Чистый прирост',
    rtip_ret_lift:'Совокупный прирост удержания с учётом всех факторов. Бенчмарк базы: Новые 15%, Средние 10%, VIP 8%. Затем корректируется пятью факторами ниже.',
    rtip_incr_rev:'Дополнительная выручка за 3 месяца от игроков, которых удержал бонус: incremental_players × LTV 3 мес. Региональный бенчмарк в USD.',
    rtip_incr_net:'Чистый доход от кампании: доп. выручка минус бонусные выплаты за 3 месяца (costRatio × игроков × ARPU). Положительное значение = кампания окупается.',
    incr_disclaimer:'Оценка на основе бенчмарков. Реальные результаты зависят от качества продукта, CRM и аудитории.',
    model_assumptions_show:'Допущения модели ▾', model_assumptions_hide:'Скрыть ▴',
    ma_base:'База: Новые 25% · Средние 18% · VIP 12%', ma_cap:'Потолок лифта: max 40%',
    ma_f1:'F1 Вейджер: score>1 когда beW<wagerX (player-friendly)',
    ma_f2:'F2 Щедрость: нейтрально при 50% match, +15% при 100%',
    ma_f3:'F3 Механики: +6% NDB, +8% Reload, +7% Cashback, +4% Dep2, +4% FS',
    ma_f4:'F4 RTP: диапазон 85%–99%, центр 92%', ma_f5:'F5 Платформа: Mobile +5%, Desktop −3%, Both 0%',
    ma_arpu:'ARPU бенчмарк (гео):',
    btn_ai_optimize:'🤖 Рекомендации AI', ai_opt_loading:'AI анализирует параметры…',
    ai_opt_title:'Рекомендации по оптимизации', ai_opt_impact_high:'Высокий', ai_opt_impact_med:'Средний', ai_opt_impact_low:'Низкий',
    ai_opt_err:'Не удалось получить рекомендации. Попробуйте ещё раз.',
    incr_base:'Базовый лифт (сегмент)', incr_f_wager:'F1 Вейджер', incr_f_gen:'F2 Щедрость бонуса',
    incr_f_mech:'F3 Ширина механик', incr_f_rtp:'F4 RTP опыт', incr_f_plat:'F5 Платформа',
    incr_lift_total:'Итоговый лифт',
    // Analytics
    sec_analytics:'Анализ кампании',
    an_actuals_title:'Реальные результаты', an_participants:'Участников', an_deposits:'Депозиты', an_wager_compl:'Вейджер выполнен',
    an_payout:'Выплата бонуса', an_incr_rev:'Доп. выручка (USD)', an_notes:'Примечания',
    an_forecast:'Прогноз (P50)', an_actual:'Реально', an_variance:'Отклонение', an_percentile:'Перцентиль',
    an_within_band:'В пределах диапазона', an_flag_worst:'Хуже худшего сценария', an_flag_best:'Лучше лучшего сценария',
    an_flag_abuse:'Подозрение на аборт', an_flag_incomplete:'Неполные данные',
    an_roi_actual:'Реальный ROI', an_net_actual:'Реальный доход',
    btn_save_actuals:'Сохранить результаты', btn_run_analysis:'Запустить анализ',
  },

  en: {
    hdr_sub:'v2.0 · Casino Bonus Admin Spec Generator',
    pnl_title:'Configuration Parameters',
    lbl_region:'Region & Business Model',
    reg_cis:'CIS', reg_cis_sub:'RU · UA · KZ / Fiat',
    reg_eu:'EU / UK', reg_eu_sub:'EUR · GBP / Fiat',
    reg_crypto:'Global Crypto', reg_crypto_sub:'BTC · ETH · USDT',
    reg_sweep:'USA / Sweep', reg_sweep_sub:'SC · GC / Sweepcoins',
    reg_mn:'Mongolia', reg_mn_sub:'MNT / Fiat',
    reg_latam:'LatAm', reg_latam_sub:'USD / Fiat',
    lbl_players:'New Players / Month',
    sl_min:'100', sl_max:'50 000+',
    lbl_sitecur:'Main Site Currency',
    lbl_avgdep:'Average First Deposit',
    lbl_platform:'Platform',
    lbl_license:'License / Jurisdiction',
    lbl_rtp:'Avg. Slot RTP',
    plat_both:'Desktop + Mobile', plat_mobile:'Mobile Only', plat_desk:'Desktop Only',
    lic_mga:'MGA', lic_ukgc:'UKGC', lic_dga:'DGA', lic_curacao:'Curaçao', lic_none:'Unlicensed / Offshore',
    lbl_country:'EU Country',
    hint_de:'typical for Germany', hint_fr:'typical for France', hint_es:'typical for Spain',
    hint_it:'typical for Italy', hint_nl:'typical for Netherlands',
    hint_uk:'typical for UK', hint_dk:'typical for Denmark',
    eu_ctry_hint_de:'MGA · EUR · avg dep €50', eu_ctry_hint_fr:'MGA · EUR · avg dep €45',
    eu_ctry_hint_es:'MGA · EUR · avg dep €40', eu_ctry_hint_it:'MGA · EUR · avg dep €40',
    eu_ctry_hint_nl:'MGA · EUR · avg dep €55', eu_ctry_hint_uk:'UKGC · GBP · avg dep £45',
    eu_ctry_hint_dk:'DGA · DKK · avg dep 700 DKK',
    btn_gen:'⚡ Generate Configuration',
    ph_t:'Select a region and fill in the parameters',
    ph_s:'Click «Generate Configuration» to get the full admin panel settings',
    no_region:'Please select a region',
    out_title:'Bonus Program Configuration',
    players_mo:'players/mo', avg_dep:'Avg. deposit',
    btn_print:'🖨 Print / PDF',
    reg_warn_title:'⚠️ Regulatory Requirements —',
    sec_dep1:'1st Deposit Bonus', sec_dep2:'2nd Deposit Bonus', sec_dep3:'3rd Deposit Bonus',
    sec_dep_pkg:'Deposit Package', dep_step:'Step',
    v_sc_purchase_bonus:'SC Purchase Bonus',
    p_dep_trigger:'Trigger', p_dep_wager:'Wager on Bonus',
    v_2nd_purchase:'2nd purchase (any package)', v_3rd_purchase:'3rd purchase (any package)',
    mn_note_title:'ℹ️ Mongolia — Regulatory Note',
    mn_note_text:'Gambling is officially prohibited in Mongolia (2013 law). Operations run via an offshore Curaçao license without in-country registration. Players access via VPN/mirrors.',
    latam_note_text:'Operations via offshore Curaçao license. Key markets: Brazil, Mexico, Colombia, Argentina, Chile. Recommended payment methods: PIX, SPEI, PSE, Efecty, AstroPay.',
    sec_welcome:'Welcome Bonus', sec_ndb:'No Deposit Bonus', sec_reload:'Reload Bonus',
    sec_fs:'Free Spins Spec', sec_sc_gc:'SC / GC Mechanics', sec_wager:'Wagering Conditions',
    sec_cashback:'Cashback', sec_contrib:'Game Contribution to Wagering',
    sec_econ:'Unit Economics (Estimated)', sec_admin:'Admin Panel Config — Full Config',
    p_type:'Bonus Type', p_size:'Size', p_max_bonus:'Max Bonus Amount',
    p_min_dep:'Min. Deposit', p_fs_count:'Free Spins in Package',
    p_validity:'Validity', p_days:' days',
    p_trigger:'Trigger', p_promo:'Promo Code', p_optin:'Opt-in',
    p_sc:'Sweepcoins (SC)', p_gc:'Gold Coins (GC)',
    p_daily_sc:'SC per Day', p_daily_gc:'GC per Day', p_limit:'Limit',
    p_freq:'Frequency', p_day:'Payout Day',
    p_spin_val:'Spin Value', p_fs_games:'Eligible Games',
    p_fs_wager:'Wager on Winnings', p_fs_maxw:'Max FS Withdrawal',
    p_fs_delivery:'Delivery',
    p_wager_welcome:'Welcome Bonus', p_wager_ndb:'No Deposit',
    p_wager_reload:'Reload Bonus', p_wager_fs:'Free Spins Winnings',
    p_wager_basis:'Wager Basis', p_max_bet:'Max Bet with Bonus',
    p_eligible:'Eligible Games', p_wager_days:'Wagering Period',
    p_wager_lock:'Lock Type',
    p_cb_model:'Model', p_cb_period:'Calculation Period', p_cb_basis:'Basis',
    p_cb_max:'Max Cashback', p_cb_wagering:'Cashback Wagering',
    p_cb_payment:'Payment', p_cb_pct:'Cashback Rate',
    p_cb_min_loss:'Min. Losses for Cashback', p_cb_currency:'Payout Currency',
    p_ct_game:'Game Type', p_ct_contrib:'Contribution',
    p_arpu:'ARPU / mo', p_ltv3:'LTV 3 Months', p_cac:'CAC (Bonus)',
    p_arpu_sub:'per active player', p_ltv3_sub:'estimated', p_cac_sub:'per acquisition',
    p_bonus_cost:'Bonus Cost % GGR', p_monthly_budget:'Monthly Bonus Budget',
    p_cohort_ltv:'Cohort LTV 3 Months', p_roi:'Regional ROI (benchmark)', p_roi_campaign:'Campaign ROI',
    rtip_roi_reg:'ROI based on the regional average CAC — a market benchmark independent of your specific bonus parameters. Formula: (Cohort LTV − 3 × pl × cac) / (3 × pl × cac).',
    rtip_roi_camp:'ROI based on the actual cost of this campaign. Updates when bonus parameters change. Formula: (Cohort LTV − 3 × campaign_cost_usd) / (3 × campaign_cost_usd).',
    p_breakeven:'Breakeven', p_ggr_rate:'GGR Rate (Typical)',
    p_mo_on_player:' mo per player', p_ggr_val:'3–5% of bets',
    sec_bonus_cost:'Bonus Cost Analysis',
    p_bonus_size:'Bonus Size (per player)', p_mixed_rtp:'Mixed RTP', p_mixed_wcr:'Mixed WCR',
    p_scenario_p10:'Lower Bound (P10)', p_scenario_p50:'Base Scenario (P50)', p_scenario_p90:'Upper Bound (P90)',
    p_conv:'Conversion', p_payout_per:'Payout / player', p_turnover:'Wager Turnover',
    p_total_cost:'Campaign Cost', p_grand_total:'Total Campaign Cost', lbl_edit_wager:'Wager ✏', lbl_edit_maxb:'Max Bonus ✏', p_cost_ratio:'Cost / Deposits', p_max_risk:'Max Risk (ceiling)',
    p_stress_test:'Stress Test +20% activations',
    verdict_cheap:'💸 Offer too weak (ratio < 10%) — low player EV, expect poor conversion. → Raise match %, lower wager or add FS to package',
    verdict_ok:'✅ Healthy range (10–20%) — good balance of appeal and economics. → Maintain parameters, monitor conversion and churn',
    verdict_warn:'⚠️ High load (20–35%) — risk of loss at activation spikes. → Raise wager, reduce match % or cap max bonus',
    verdict_high:'🔴 Campaign unprofitable (>35%) — cost exceeds acceptable threshold. → Urgently raise wager or reduce bonus size',
    v_match_dep:'Match Deposit', v_first_dep:'First Deposit',
    v_required:'Required before deposit', v_required_short:'Required',
    v_no_wager:'None', v_hard_lock:'Hard lock (mixing prohibited)',
    v_auto_start:'Automatically at start of period',
    v_flat:'Flat', v_tier:'Tier-Based',
    v_weekly:'Weekly', v_monthly:'Monthly',
    v_net_losses:'Net losses for period', v_net_losses_monthly:'Net losses',
    v_slots_only:'Slots (avg. RTP ',
    v_all_games:'All games (slots + live, 100%)',
    v_no_limit:'No restriction',
    v_bonus_only:'Bonus only', v_dep_bonus:'Deposit + Bonus',
    v_sweep_type:'Sweepcoins Welcome', v_sweep_trigger:'Registration (free)',
    v_sweep_mech:'Free-play (no wager)', v_sc_convert:'Redeemable for real money',
    v_gc_no_redeem:'Game coins only, no withdrawal',
    v_min_redeem_sc:'100 SC', v_max_redeem_sc:'$5,000 / month',
    v_daily_sc_type:'Daily SC Bonus', v_daily_trigger:'Daily (email / SMS)',
    v_immediate:'Immediately after Welcome activation',
    v_reg_verify:'Registration / Email verify',
    v_1_per_account:'1 per account / IP',
    v_day_mon:'Monday', v_day_tue:'Tuesday', v_day_wed:'Wednesday', v_day_fri:'Friday', v_day_sat:'Saturday',
    v_existing:'existing_players', v_new_only:'new_players_only',
    v_sweep_no_wager:'No wagering required',
    v_sweep_freeplay:'Sweepcoins — free-play model',
    v_1per_period:'1 per period',
    ukgc_note:'UKGC: cash NDB prohibited. Free Spins only.',
    copy_btn:'📋 Copy', copy_hint:'Paste into casino admin panel settings or send to developer',
    copied:'✓ Copied!',
    gen_admin_btn:'⚙️ Generate Admin Config', save_admin_btn:'💾 Save .txt',
    admin_not_generated:'Config not generated. Click the button below to generate.',
    hint_cis:'typical for CIS', hint_eu:'typical for EU',
    hint_crypto:'typical Crypto', hint_sweep:'avg. USA package', hint_mn:'typical for Mongolia',
    hint_latam:'typical for LatAm',
    tip_region:'Sets the business model, currency, regulatory limits, and wagering defaults. Each region generates a different set of bonus parameters.',
    tip_players:'Number of new players activating the welcome bonus per month. Used to calculate total campaign budget and cohort LTV.',
    tip_sitecur:'Currency the casino site operates in. Affects amount formatting in the admin config and unit economics.',
    tip_avgdep:'Average first deposit for the target segment. Determines bonus size (match% × deposit) and the baseline for cost ratio calculation.',
    tip_platform:'Affects bonus trigger and T&C display recommendations. Desktop and Mobile may have different UX requirements.',
    tip_license:'Sets regulatory constraints. UKGC: max bet £2/spin, cash NDB prohibited. MGA: opt-in required before deposit. Curaçao is a softer jurisdiction.',
    tip_rtp:'Average RTP of slots in the game library. Used in the bonus cost model: higher RTP = player loses money slower during wagering = more expensive bonus for the operator. Typical value for slots: 95–97%.',
    rtip_wager:'Wagering requirement — how many times the bonus must be turned over before withdrawal. x30 on 1000 bonus = 30,000 in bets required.',
    rtip_match_pct:'Match % — what share of the deposit the player receives as bonus. 100% = a 1000 deposit gives a 1000 bonus (up to the cap). 50% = 500 bonus.',
    rtip_max_bonus:'Bonus cap regardless of deposit size. With 100% match and a 5000 limit, a 10,000 deposit still only gives 5000 in bonus.',
    rtip_wager_basis:'"Bonus only" = wager × bonus amount. "Deposit + bonus" = wager × (deposit + bonus) — a stricter condition for the player.',
    rtip_mixed_rtp:'Weighted RTP across the regional game mix. Higher RTP = player loses slower during wagering = more expensive bonus for the operator.',
    rtip_mixed_wcr:'Weighted Contribution Rate — average share of each bet that counts toward clearing wagering. WCR 50% means a 100 bet counts only 50.',
    rtip_cost_ratio:'Bonus cost as a share of total deposits. <0.10 = too cheap. 0.10–0.20 = working range. 0.20–0.35 = risky. >0.35 = reduce the offer.',
    rtip_max_risk:'Max obligation if 100% of players activate and no one wagers. This is a ceiling exposure, not the expected actual cost.',
    rtip_arpu:'Average revenue per active player per month. Regional USD benchmark, independent of local currency.',
    rtip_p10:'P10 — optimistic scenario: only 10% of outcomes are better. Few players complete wagering.',
    rtip_p50:'P50 — base scenario (median). Use for budget planning.',
    rtip_p90:'P90 — pessimistic scenario: only 10% of outcomes are worse. Maximum payout risk.',
    rtip_breakeven_wager:'Wager at which expected payouts equal bonus size. Wager > breakeven = operator profitable. Wager ≤ breakeven = elevated risk.',
    rtip_ltv3:'Total revenue from one player over 3 months: LTV 3mo = ARPU × 3. Shows how much an acquired player brings on average during their first quarter. Used to assess CAC payback period and the viability of the bonus budget.',
    rtip_cac:'Cost to acquire one player through the bonus channel. Regional USD benchmark.',
    rtip_scenario:'E[max(0,X)] where X is the player bankroll after wagering. μ = B×(1 − W/BE) — expected balance; σ = √(W×B/WCR) — CLT bankroll volatility. Campaign cost = E[payout]×conv×n. Below breakeven ≈ μ×conv×n; above — decays smoothly to zero.',
    reg_ukgc_1:'Max bet with active bonus: £2/spin or £2/round',
    reg_ukgc_2:'Cash NDB prohibited — Free Spins only on specified slots',
    reg_ukgc_3:'Wagering conditions must be shown before bonus acceptance',
    reg_ukgc_4:'Self-exclusion (GamStop): blocked players must not receive bonuses',
    reg_ukgc_5:'Label: «Bonus with wagering requirements» on all promo materials',
    reg_ukgc_6:'Max wagering period: 90 days',
    reg_mga_1:'Wagering multiplier must be shown in UI at acceptance',
    reg_mga_2:'Automatic bonus activation prohibited (player opt-in required)',
    reg_mga_3:'Mandatory «Bonus Terms & Conditions» section on site',
    reg_mga_4:'Cooldown between identical bonuses: minimum 24 hours',
    reg_mga_5:'Recommended bet limit with bonus: €5/spin',
    reg_sweep_1:'No Purchase Necessary — free alternative to receive SC required',
    reg_sweep_2:'Product must not be called «gambling» — it is a sweepstakes promotion',
    reg_sweep_3:'SC are not money: not regulated as wagers',
    reg_sweep_4:'Legal disclaimer required on every page with bonuses',
    reg_sweep_5:'Age verification: 18+ (21+ in some states); prohibited in RI, AZ, SC, ID, MT, WA',
    // ── Max bet v_ keys
    v_eu_max_bet:'€5/spin (MGA recommended limit)',
    v_ukgc_max_bet:'£2/spin (UKGC regulatory cap)',
    v_dga_max_bet:'No spin cap (DGA; see 1,000 DKK bonus ceiling)',
    v_standard_max_bet:'Operator standard limit',
    // ── DGA (Denmark)
    reg_dga_1:'Hard cap: max bonus 1,000 DKK per offer (statutory)',
    reg_dga_2:'Min. wagering period: 60 days (statutory minimum)',
    reg_dga_3:'ROFUS: self-exclusion check mandatory before any bonus award',
    reg_dga_4:'2025: T&Cs must appear in same font size as the promotional headline',
    // ── Global licenses
    reg_curacao_1:'No statutory bonus or wagering cap; permissive framework',
    reg_curacao_2:'KYC/AML required; T&Cs must be published on site',
    reg_betsbr_1:'Federal "Bets" regime (Law 14.790): SPA license required',
    reg_betsbr_2:'KYC via CPF + facial recognition; player bonus restrictions',
    reg_betsbr_3:'12% GGR tax; mandatory responsible-gaming messaging',
    reg_segob_1:'SEGOB permit required; KYC and published T&Cs',
    reg_segob_2:'Responsible-gaming tools; T&Cs on site',
    reg_coljuegos_1:'Coljuegos license; temporary 19% VAT on deposits (2025)',
    reg_coljuegos_2:'KYC/AML mandatory; licensed operators only',
    reg_mincetur_1:'MINCETUR license (Law 31557); 0.3% ISI tax on deposits',
    reg_mincetur_2:'KYC mandatory; responsible-gaming measures',
    reg_anjouan_1:'Basic KYC required; responsible gambling disclaimer recommended',
    reg_kahnawake_1:'Player dispute resolution mechanism required by KGC',
    reg_gibraltar_1:'Fair wagering terms required; responsible gambling tools mandatory; GRA oversight',
    reg_iom_1:'Fair transparent T&Cs required; responsible gambling obligations apply; no statutory cap',
    ct_level:'Level', ct_losses:'Losses', ct_pct:'%',
    ct_bronze:'Bronze', ct_silver:'Silver', ct_gold:'Gold', ct_platinum:'Platinum',
    pkg_package:'Package', pkg_price:'Price', pkg_sc:'SC',
    // ── New sections: CG economics, mechanic explanation, AI audit
    sec_cg_econ:'Campaign Scenarios', sec_mech_exp:'Mechanic Explanation', sec_cfg_audit:'AI Compliance Audit',
    btn_run_cfg_audit:'⚡ Run Audit', cfg_audit_running:'Analyzing configuration...',
    cfg_audit_pass:'✅ Pass', cfg_audit_fail:'❌ Fail', cfg_audit_warn:'⚠️ Warning',
    cfg_audit_impact:'Impact', cfg_audit_recs:'Recommendations',
    cfg_audit_not_run:'Click to run an AI compliance audit on the current configuration',
    cfg_hint:'Choose a region and click Generate to get a full bonus spec with P10/P50/P90 cost model and incremental revenue forecast.',
    stale_banner:'Parameters changed — click Generate to update economics',
    stale_btn:'Generate ↻',
    cfg_audit_error:'Audit error: ',
    cg_best:'Best Case', cg_expected:'Expected', cg_worst:'Worst Case',
    cg_cost_per_bonus:'Cost / player', cg_dep_load:'Deposit load', cg_wager_compl:'Wager completion',
    rtip_cg_cpb:'Average payout per activated player = campaign total / (N × conversion)',
    rtip_cg_dl:'Cost as % of total deposits. Target range: 10–20%',
    rtip_cg_wc:'Share of players who complete wagering and receive a payout',
    mech_exp_welcome:'Welcome Bonus', mech_exp_ndb:'No Deposit Bonus', mech_exp_reload:'Reload Bonus',
    mech_exp_below_be:'✅ Wager is below breakeven — healthy conversion profile.',
    mech_exp_above_be:'⚠️ Wager exceeds breakeven — conversion pressure expected.',
    // ── Segment + Incremental Revenue
    lbl_segment:'Player Segment', tip_segment:'Segment affects the incremental revenue forecast: new players have higher bonus-driven retention potential; VIPs are already loyal. Also provides context for unit economics interpretation.',
    seg_new:'🆕 New', seg_mid:'👤 Mid', seg_vip:'👑 VIP',
    sec_incr_rev:'Incremental Revenue Forecast',
    p_ret_lift:'Total lift', p_incr_players:'Addl. players (3 mo)', p_incr_rev:'Addl. revenue (3 mo)', p_camp_cost_3:'Bonus cost: Welcome+NDB (3 mo)', p_incr_net:'Net incremental',
    rtip_ret_lift:'Combined retention lift across all five factors. Base benchmarks: New 15%, Mid 10%, VIP 8%, then adjusted by five multipliers below.',
    rtip_incr_rev:'Additional revenue over 3 months from players retained by the bonus: incremental_players × LTV 3 mo. Regional USD benchmark.',
    rtip_incr_net:'Net campaign return: additional revenue minus 3-month bonus payouts (costRatio × players × ARPU). Positive = campaign pays off.',
    incr_disclaimer:'Estimate based on industry benchmarks. Actual results depend on product quality, CRM execution, and audience profile.',
    model_assumptions_show:'Model assumptions ▾', model_assumptions_hide:'Collapse ▴',
    ma_base:'Base lift: New 25% · Mid 18% · VIP 12%', ma_cap:'Lift cap: max 40%',
    ma_f1:'F1 Wager: score>1 when beW<wagerX (player-friendly)',
    ma_f2:'F2 Generosity: neutral at 50% match, +15% at 100%',
    ma_f3:'F3 Mechanics: +6% NDB, +8% Reload, +7% Cashback, +4% Dep2, +4% FS',
    ma_f4:'F4 RTP: range 85%–99%, centred at 92%', ma_f5:'F5 Platform: Mobile +5%, Desktop −3%, Both 0%',
    ma_arpu:'ARPU benchmark (geo):',
    btn_ai_optimize:'🤖 AI Recommendations', ai_opt_loading:'AI is analysing parameters…',
    ai_opt_title:'Optimisation Recommendations', ai_opt_impact_high:'High', ai_opt_impact_med:'Medium', ai_opt_impact_low:'Low',
    ai_opt_err:'Could not get recommendations. Please try again.',
    incr_base:'Base lift (segment)', incr_f_wager:'F1 Wager achievability', incr_f_gen:'F2 Bonus generosity',
    incr_f_mech:'F3 Mechanics breadth', incr_f_rtp:'F4 RTP quality', incr_f_plat:'F5 Platform',
    incr_lift_total:'Total lift',
    // Analytics
    sec_analytics:'Campaign Analysis',
    an_actuals_title:'Actual Results', an_participants:'Participants', an_deposits:'Deposits', an_wager_compl:'Wager Completion',
    an_payout:'Bonus Payout', an_incr_rev:'Incr. Revenue (USD)', an_notes:'Notes',
    an_forecast:'Forecast (P50)', an_actual:'Actual', an_variance:'Variance', an_percentile:'Percentile',
    an_within_band:'Within Band', an_flag_worst:'Worse than worst case', an_flag_best:'Better than best case',
    an_flag_abuse:'Abuse suspected', an_flag_incomplete:'Incomplete data',
    an_roi_actual:'Actual ROI', an_net_actual:'Actual Net',
    btn_save_actuals:'Save Results', btn_run_analysis:'Run Analysis',
  },

  mn: {
    hdr_sub:'v2.0 · Casino Bonus Admin Spec Generator',
    pnl_title:'Тохиргооны параметрүүд',
    lbl_region:'Бүс нутаг, бизнес загвар',
    reg_cis:'ТУН', reg_cis_sub:'RU · UA · KZ / Фиат',
    reg_eu:'EU / UK', reg_eu_sub:'EUR · GBP / Фиат',
    reg_crypto:'Глобал Крипто', reg_crypto_sub:'BTC · ETH · USDT',
    reg_sweep:'АНУ / Sweep', reg_sweep_sub:'SC · GC / Sweepcoins',
    reg_mn:'Монгол', reg_mn_sub:'MNT / Фиат',
    reg_latam:'LatAm', reg_latam_sub:'USD / Фиат',
    lbl_players:'Шинэ тоглогч / сард',
    sl_min:'100', sl_max:'50 000+',
    lbl_sitecur:'Сайтын үндсэн валют',
    lbl_avgdep:'Дундаж эхний хадгаламж',
    lbl_platform:'Платформ',
    lbl_license:'Лиценз / харьяалал',
    lbl_rtp:'Слотын дунд. RTP',
    plat_both:'Десктоп + Мобайл', plat_mobile:'Зөвхөн мобайл', plat_desk:'Зөвхөн десктоп',
    lic_mga:'MGA', lic_ukgc:'UKGC', lic_dga:'DGA', lic_curacao:'Curaçao', lic_none:'Байхгүй / Офшор',
    lbl_country:'EU улс',
    hint_de:'Германид ердийн', hint_fr:'Францад ердийн', hint_es:'Испанид ердийн',
    hint_it:'Италид ердийн', hint_nl:'Нидерландад ердийн',
    hint_uk:'Их Британид ердийн', hint_dk:'Данид ердийн',
    eu_ctry_hint_de:'MGA · EUR · дунд. хадг. €50', eu_ctry_hint_fr:'MGA · EUR · дунд. хадг. €45',
    eu_ctry_hint_es:'MGA · EUR · дунд. хадг. €40', eu_ctry_hint_it:'MGA · EUR · дунд. хадг. €40',
    eu_ctry_hint_nl:'MGA · EUR · дунд. хадг. €55', eu_ctry_hint_uk:'UKGC · GBP · дунд. хадг. £45',
    eu_ctry_hint_dk:'DGA · DKK · дунд. хадг. 700 DKK',
    btn_gen:'⚡ Тохиргоо үүсгэх',
    ph_t:'Бүс нутгаа сонгоод параметрүүдийг бөглөнө үү',
    ph_s:'«Тохиргоо үүсгэх» товчийг дарж казиногийн бүх тохиргоог авна уу',
    no_region:'Бүс нутгаа сонгоно уу',
    out_title:'Бонусын хөтөлбөрийн тохиргоо',
    players_mo:'тоглогч/сард', avg_dep:'Дунд. хадгаламж',
    btn_print:'🖨 Хэвлэх / PDF',
    reg_warn_title:'⚠️ Зохицуулалтын шаардлага —',
    sec_dep1:'1-р хадгаламжийн бонус', sec_dep2:'2-р хадгаламжийн бонус', sec_dep3:'3-р хадгаламжийн бонус',
    sec_dep_pkg:'Хадгаламжийн багц', dep_step:'Алхам',
    v_sc_purchase_bonus:'SC худалдан авалтын бонус',
    p_dep_trigger:'Идэвхжүүлэгч', p_dep_wager:'Бонусын вейжер',
    v_2nd_purchase:'2-р худалдан авалт (ямар ч багц)', v_3rd_purchase:'3-р худалдан авалт (ямар ч багц)',
    mn_note_title:'ℹ️ Монгол — Зохицуулалтын мэдээлэл',
    mn_note_text:'2013 оны хуулиар Монголд мөрийтэй тоглоом хориглосон. Тоглоом нь Кюрасаогийн офшор лицензийн дор, улсдаа бүртгэлгүйгээр үйл ажиллагаа явуулдаг. Тоглогчид VPN/толь сайтаар нэвтэрдэг.',
    latam_note_text:'Кюрасаогийн офшор лицензийн дор үйл ажиллагаа. Гол зах зээл: Бразил, Мексик, Колумб, Аргентин, Чили. Санал болгосон төлбөрийн аргууд: PIX, SPEI, PSE, Efecty, AstroPay.',
    sec_welcome:'Тавтай морилсны бонус', sec_ndb:'Хадгаламжгүй бонус',
    sec_reload:'Дахин хадгаламжийн бонус',
    sec_fs:'Үнэгүй эргэлтийн тодорхойлолт', sec_sc_gc:'SC / GC Механик',
    sec_wager:'Вейжерийн нөхцөл', sec_cashback:'Кэшбэк',
    sec_contrib:'Тоглоомын вейжерт оролцох хувь',
    sec_econ:'Нэгж эдийн засаг (тооцоолол)', sec_admin:'Админ панелийн тохиргоо',
    p_type:'Бонусын төрөл', p_size:'Хэмжээ', p_max_bonus:'Макс. бонусын дүн',
    p_min_dep:'Мин. хадгаламж', p_fs_count:'Багцын үнэгүй эргэлт',
    p_validity:'Хүчинтэй хугацаа', p_days:' өдөр',
    p_trigger:'Идэвхжүүлэгч', p_promo:'Промо код', p_optin:'Зөвшөөрөл',
    p_sc:'Sweepcoins (SC)', p_gc:'Gold Coins (GC)',
    p_daily_sc:'Өдөрт SC', p_daily_gc:'Өдөрт GC', p_limit:'Хязгаар',
    p_freq:'Давтамж', p_day:'Олгох өдөр',
    p_spin_val:'Спиний үнэ', p_fs_games:'Зөвшөөрөгдсөн тоглоомууд',
    p_fs_wager:'Ялалтад вейжер', p_fs_maxw:'Макс. FS татан авалт',
    p_fs_delivery:'Хүргэлт',
    p_wager_welcome:'Тавтай морилсны бонус', p_wager_ndb:'Хадгаламжгүй бонус',
    p_wager_reload:'Дахин хадгаламжийн бонус', p_wager_fs:'Үнэгүй эргэлтийн ялалт',
    p_wager_basis:'Вейжерийн суурь', p_max_bet:'Бонустай макс. бооцоо',
    p_eligible:'Зөвшөөрөгдсөн тоглоомууд', p_wager_days:'Вейжерийн хугацаа',
    p_wager_lock:'Түгжээний төрөл',
    p_cb_model:'Загвар', p_cb_period:'Тооцооллын үе', p_cb_basis:'Суурь',
    p_cb_max:'Макс. кэшбэк', p_cb_wagering:'Кэшбэкт вейжер',
    p_cb_payment:'Төлбөр', p_cb_pct:'Буцаалтын хувь',
    p_cb_min_loss:'Кэшбэкт мин. алдагдал', p_cb_currency:'Төлбөрийн валют',
    p_ct_game:'Тоглоомын төрөл', p_ct_contrib:'Оролцоо',
    p_arpu:'ARPU / сард', p_ltv3:'LTV 3 сар', p_cac:'CAC (бонус)',
    p_arpu_sub:'идэвхтэй тоглогч тус бүрд', p_ltv3_sub:'тооцоолол', p_cac_sub:'элсэлт тус бүрд',
    p_bonus_cost:'Bonus Cost % GGR', p_monthly_budget:'Сарын бонусын төсөв',
    p_cohort_ltv:'Когортын нийт LTV 3 сар', p_roi:'Бүсийн ROI (бенчмарк)', p_roi_campaign:'Кампанийн ROI',
    rtip_roi_reg:'Бүсийн дундаж CAC дээр үндэслэсэн ROI — тодорхой бонусын параметрээс үл хамаарах зах зээлийн бенчмарк.',
    rtip_roi_camp:'Энэ кампанийн бодит зардал дээр үндэслэсэн ROI. Бонусын параметр өөрчлөгдөхөд шинэчлэгдэнэ.',
    p_breakeven:'Зардал нөхөх цэг', p_ggr_rate:'GGR түвшин (ердийн)',
    p_mo_on_player:' сар/тоглогч', p_ggr_val:'Бооцооны 3–5%',
    sec_bonus_cost:'Бонусын зардлын шинжилгээ',
    p_bonus_size:'Бонусын хэмжээ (1 тоглогч)', p_mixed_rtp:'Холимог RTP', p_mixed_wcr:'Холимог WCR',
    p_scenario_p10:'Доод хязгаар (P10)', p_scenario_p50:'Үндсэн хувилбар (P50)', p_scenario_p90:'Дээд хязгаар (P90)',
    p_conv:'Хөрвүүлэлт', p_payout_per:'Тоглогч тус бүрд олгох', p_turnover:'Вейжерийн эргэлт',
    p_total_cost:'Кампанийн зардал', p_grand_total:'Нийт кампанийн зардал', lbl_edit_wager:'Вейжер ✏', lbl_edit_maxb:'Макс. бонус ✏', p_cost_ratio:'Зардал / Хадгаламж', p_max_risk:'Макс. эрсдэл (дээд тал)',
    p_stress_test:'Стресс тест +20% идэвхжүүлэлт',
    verdict_cheap:'💸 Санал сул (ratio < 10%) — тоглогчийн EV бага, конверс буурна. → Match % нэмэх, вейжер бууруулах, FS нэмэх',
    verdict_ok:'✅ Ажлын хүрээнд (10–20%) — тэнцвэртэй параметр. → Конверс болон чёрнийг хянах',
    verdict_warn:'⚠️ Ачаалал өндөр (20–35%) — идэвхжилт огцом нэмэгдвэл алдагдал гарна. → Вейжер нэмэх, max бонус хязгаарлах',
    verdict_high:'🔴 Кампани алдагдалтай (>35%) — зардал хэтэрсэн. → Яаралтай вейжер нэмэх, бонусын хэмжээ бууруулах',
    v_match_dep:'Match Deposit', v_first_dep:'Эхний хадгаламж',
    v_required:'Хадгаламжаас өмнө шаардлагатай', v_required_short:'Шаардлагатай',
    v_no_wager:'Байхгүй', v_hard_lock:'Хатуу түгжээ (холилдохыг хориглоно)',
    v_auto_start:'Үе эхэлмэгц автоматаар',
    v_flat:'Тэгш', v_tier:'Шатлалт',
    v_weekly:'Долоо хоног тутам', v_monthly:'Сар тутам',
    v_net_losses:'Үеийн цэвэр алдагдал', v_net_losses_monthly:'Цэвэр алдагдал',
    v_slots_only:'Слот (дунд. RTP ',
    v_all_games:'Бүх тоглоомууд (slots + live, 100%)',
    v_no_limit:'Хязгаар байхгүй',
    v_bonus_only:'Зөвхөн бонус', v_dep_bonus:'Хадгаламж + Бонус',
    v_sweep_type:'Sweepcoins Тавтай морилно уу', v_sweep_trigger:'Бүртгэл (үнэгүй)',
    v_sweep_mech:'Үнэгүй тоглоом (вейжергүй)', v_sc_convert:'Бодит мөнгөнд хөрвүүлэх боломжтой',
    v_gc_no_redeem:'Зөвхөн тоглоомын зоос, татан авах боломжгүй',
    v_min_redeem_sc:'100 SC', v_max_redeem_sc:'$5,000 / сард',
    v_daily_sc_type:'Өдөр тутмын SC бонус', v_daily_trigger:'Өдөр тутам (имэйл / SMS)',
    v_immediate:'Welcome идэвхжүүлсний дараа шууд',
    v_reg_verify:'Бүртгэл / Имэйл баталгаажуулалт',
    v_1_per_account:'1 акаунт / IP-д',
    v_day_mon:'Даваа', v_day_tue:'Мягмар', v_day_wed:'Лхагва', v_day_fri:'Баасан', v_day_sat:'Бямба',
    v_existing:'existing_players', v_new_only:'new_players_only',
    v_sweep_no_wager:'Вейжер байхгүй',
    v_sweep_freeplay:'Sweepcoins — үнэгүй тоглоомын загвар',
    v_1per_period:'Үед 1 удаа',
    ukgc_note:'UKGC: мөнгөн NDB хориглоно. Зөвхөн Free Spins.',
    copy_btn:'📋 Хуулах', copy_hint:'Казиногийн админ панелийн тохиргоонд оруулах эсвэл хөгжүүлэгчид дамжуулах',
    copied:'✓ Хуулагдлаа!',
    gen_admin_btn:'⚙️ Admin Config үүсгэх', save_admin_btn:'💾 .txt хадгалах',
    admin_not_generated:'Тохиргоо үүсгэгдээгүй байна. Үүсгэхийн тулд товчийг дарна уу.',
    hint_cis:'ТУН-д ердийн', hint_eu:'EU-д ердийн',
    hint_crypto:'Крипто ердийн', hint_sweep:'АНУ дундаж', hint_mn:'Монголд ердийн',
    hint_latam:'LatAm-д ердийн',
    tip_region:'Бизнес загвар, валют, зохицуулалтын хязгаарлалт, вейжерийн анхдагч утгыг тогтооно. Бүс нутаг тус бүр өөр бонусын параметр үүсгэдэг.',
    tip_players:'Нэг сард welcome бонус идэвхжүүлэх шинэ тоглогчдын тоо. Кампанийн нийт төсөв болон когортын LTV тооцоолоход ашиглагдана.',
    tip_sitecur:'Казиногийн сайт ажиллах валют. Admin тохиргоо болон эдийн засгийн тооцоололд нөлөөлнө.',
    tip_avgdep:'Зорилтот сегментийн дундаж анхны хадгаламж. Бонусын хэмжээ болон cost ratio-г тодорхойлно.',
    tip_platform:'Бонусын триггер болон нөхцлийн харуулах зөвлөмжид нөлөөлнө. Desktop болон Mobile өөр өөр шаардлагатай байж болно.',
    tip_license:'Зохицуулалтын хязгаарлалтыг тогтооно. UKGC: макс. бооцоо £2/эргэлт, мөнгөн NDB хориотой. MGA: хадгаламжаас өмнө opt-in шаардлагатай.',
    tip_rtp:'Тоглоомын номын санд байгаа слотуудын дундаж RTP. Бонусын зардлын загварт ашиглагдана: RTP өндөр байх тусам тоглогч вейжерингийн үед удаан алдаж, оператор илүү их зардал гарна.',
    rtip_wager:'Вейжер — бонусыг хэдэн дахин эргүүлсний дараа татан авах боломжтой. x30 нь 1000 бонуст 30 000 бооцоо шаардана.',
    rtip_match_pct:'Match % — хадгаламжийн хэдэн хувийг тоглогч бонусоор авах вэ. 100% = 1000 хадгаламж = 1000 бонус (хязгаараас хэтрэхгүй). 50% = 500 бонус.',
    rtip_max_bonus:'Хадгаламжийн хэмжээнээс үл хамааран бонусын дээд хязгаар. 100% матч, 5000 хязгаартай үед 10 000 хадгаламж зөвхөн 5000 бонус авна.',
    rtip_wager_basis:'Вейжерийн суурь. «Зөвхөн бонус» = wager × бонус. «Хадгаламж + бонус» = wager × (хадгаламж + бонус) — илүү хатуу нөхцөл.',
    rtip_mixed_rtp:'Бүс нутгийн тоглоомын миксийн жигнэсэн RTP. RTP өндөр = тоглогч вейжерингийн үед удаан алдана = оператор илүү их зардал гарна.',
    rtip_mixed_wcr:'Жигнэсэн WCR — бооцооны дундаж хэдэн хувь нь вейжерт тооцогдоно. WCR 50% нь 100 бооцоог зөвхөн 50 болгон тооцно.',
    rtip_cost_ratio:'Нийт хадгаламжтай харьцуулсан бонусын зардал. <0.10 хэт хямд. 0.10–0.20 ажлын хүрээнд. 0.20–0.35 эрсдэлтэй. >0.35 бууруул.',
    rtip_max_risk:'100% тоглогч бонус идэвхжүүлвэл гарах дээд хэмжээ. Энэ нь хүлээгдэж буй бус, боломжит дээд зардал юм.',
    rtip_arpu:'Сард идэвхтэй тоглогч тус бүрийн дундаж орлого. Бүс нутгийн USD бенчмарк.',
    rtip_ltv3:'Нэг тоглогчийн 3 сарын нийт орлого: LTV 3 сар = ARPU × 3. Татагдсан тоглогч анхны улирлын туршид дунджаар хэдий орлого оруулахыг харуулна. CAC нөхөх хугацаа болон бонусын төсвийн доромжлогдох байдлыг үнэлэхэд ашиглагдана.',
    rtip_cac:'Бонусын суваг дахь нэг тоглогч татахад гарах зардал. Бүс нутгийн USD бенчмарк.',
    rtip_scenario:'E[max(0,X)], X — вейжерийн дараах банкролл. μ = B×(1 − W/BE) — хүлээгдэж буй үлдэгдэл; σ = √(W×B/WCR) — банкроллын дисперс (ЦТТ). Зардал = E[payout]×conv×n. Breakeven-ээс доош ≈ μ×conv×n; дээш — тасрахгүйгээр буурна.',
    reg_ukgc_1:'Бонустай идэвхтэй үед макс. бооцоо: £2/spin эсвэл £2/round',
    reg_ukgc_2:'Мөнгөн NDB хориглоно — зааврын дагуу зөвхөн Free Spins',
    reg_ukgc_3:'Вейжерийн нөхцөлийг бонус хүлээн авахаас өмнө харуулах шаардлагатай',
    reg_ukgc_4:'Self-exclusion (GamStop): хаагдсан тоглогчид бонус авч болохгүй',
    reg_ukgc_5:'Тэмдэглэгээ: «Вейжертэй бонус» бүх сурталчилгааны материалд',
    reg_ukgc_6:'Вейжерийн хамгийн урт хугацаа: 90 хоног',
    reg_mga_1:'Вейжерийн үржигч нь зөвшөөрөл өгөх үед UI-д харагдах ёстой',
    reg_mga_2:'Бонусыг автоматаар идэвхжүүлэхийг хориглоно (тоглогч opt-in шаардлагатай)',
    reg_mga_3:'Сайтад заавал «Bonus Terms & Conditions» хэсэг байх ёстой',
    reg_mga_4:'Ижил бонусуудын хоорондох хүлээлтийн хугацаа: хамгийн багадаа 24 цаг',
    reg_mga_5:'Бонустай бооцооны санал болгосон хязгаар: €5/spin',
    reg_sweep_1:'Худалдан авалт шаардлагагүй — SC авах үнэгүй өөр аргыг заавал гаргах',
    reg_sweep_2:'Бүтээгдэхүүнийг «мөрийтэй тоглоом» гэж нэрлэхийг хориглоно — энэ бол sweepstakes',
    reg_sweep_3:'SC нь мөнгө биш: бооцоо гэж зохицуулагддаггүй',
    reg_sweep_4:'Бонустай бүх хуудсанд хуулийн застереженье заавал байх ёстой',
    reg_sweep_5:'Насны баталгаажуулалт: 18+ (зарим мужид 21+); RI, AZ, SC, ID, MT, WA-д хориглоно',
    v_eu_max_bet:'€5/spin (MGA санал болгосон хязгаар)',
    v_ukgc_max_bet:'£2/spin (UKGC зохицуулалтын хязгаар)',
    v_dga_max_bet:'Спин хязгаар байхгүй (DGA; 1,000 DKK бонусын дээд хязгаар)',
    v_standard_max_bet:'Операторын стандарт хязгаар',
    reg_dga_1:'Хатуу дээд хязгаар: нэг санал дээр макс. бонус 1,000 DKK (хуулийн)',
    reg_dga_2:'Мин. вейжерийн хугацаа: 60 хоног (хуулийн доод хязгаар)',
    reg_dga_3:'ROFUS: ямар нэгэн бонус олгохоос өмнө өөрийг хасах шалгалт заавал',
    reg_dga_4:'2025: T&C нь промо гарчигтай ижил фонт хэмжээтэй байх ёстой',
    reg_curacao_1:'Бонус, вейжерт хуулийн хязгаар байхгүй; зөвшилцлийн орчин',
    reg_curacao_2:'KYC/AML шаардлагатай; дүрэм журмыг сайтад нийтлэх ёстой',
    reg_betsbr_1:'Холбооны "Bets" горим (Хууль 14.790): SPA лиценз шаардлагатай',
    reg_betsbr_2:'CPF-ээр KYC + царай таних; тоглогчийн бонусын хязгаарлалт',
    reg_betsbr_3:'GGR-ийн 12% татвар; хариуцлагатай тоглоомын мэдэгдэл заавал',
    reg_segob_1:'SEGOB зөвшөөрөл шаардлагатай; KYC ба дүрэм нийтлэх',
    reg_segob_2:'Хариуцлагатай тоглоомын хэрэгсэл; сайтад T&C',
    reg_coljuegos_1:'Coljuegos лиценз; орлогод түр 19% НӨАТ (2025)',
    reg_coljuegos_2:'KYC/AML заавал; зөвхөн лицензтэй операторууд',
    reg_mincetur_1:'MINCETUR лиценз (Хууль 31557); орлогод 0.3% ISI татвар',
    reg_mincetur_2:'KYC заавал; хариуцлагатай тоглоомын арга хэмжээ',
    reg_anjouan_1:'Үндсэн KYC шаардлагатай; хариуцлагатай тоглоомын мэдэгдэл зөвлөмжтэй',
    reg_kahnawake_1:'Тоглогчдын маргаан шийдвэрлэх механизм KGC-ийн шаардлага',
    reg_gibraltar_1:'Шударга вейжерийн нөхцөл; хариуцлагатай тоглоом заавал; GRA хяналт',
    reg_iom_1:'Ил тод T&C заавал; хариуцлагатай тоглоомын үүрэг; хуулийн кэп байхгүй',
    ct_level:'Түвшин', ct_losses:'Алдагдал', ct_pct:'%',
    ct_bronze:'Хүрэл', ct_silver:'Мөнгө', ct_gold:'Алт', ct_platinum:'Платин',
    pkg_package:'Багц', pkg_price:'Үнэ', pkg_sc:'SC',
    // ── Шинэ хэсгүүд: CG эдийн засаг, механикийн тайлбар, AI аудит
    sec_cg_econ:'Кампанийн хувилбарууд', sec_mech_exp:'Механикийн тайлбар', sec_cfg_audit:'AI дагаж мөрдөлтийн аудит',
    btn_run_cfg_audit:'⚡ Аудит ажиллуулах', cfg_audit_running:'Тохиргоог шинжилж байна...',
    cfg_audit_pass:'✅ Тэнцлээ', cfg_audit_fail:'❌ Зөрчил', cfg_audit_warn:'⚠️ Анхааруулга',
    cfg_audit_impact:'Нөлөө', cfg_audit_recs:'Зөвлөмжүүд',
    cfg_audit_not_run:'AI аудит ажиллуулахын тулд товчийг дарна уу',
    cfg_audit_error:'Аудитын алдаа: ',
    cg_best:'Хамгийн сайн тохиолдол', cg_expected:'Хүлээгдэж буй', cg_worst:'Хамгийн муу тохиолдол',
    cg_cost_per_bonus:'Зардал / тоглогч', cg_dep_load:'Хадгаламжийн ачаалал', cg_wager_compl:'Вейжерийн дуусгалт',
    rtip_cg_cpb:'Идэвхжүүлсэн тоглогч тус бүрийн дундаж олгохол = нийт / (N × конверс)',
    rtip_cg_dl:'Нийт хадгаламжийн %-ийн зардал. Зорилтот: 10–20%',
    rtip_cg_wc:'Вейжерийг амжилттай дуусгаж, олгохол авсан тоглогчдын хувь',
    mech_exp_welcome:'Тавтай морилсны бонус', mech_exp_ndb:'Хадгаламжгүй бонус', mech_exp_reload:'Дахин хадгаламжийн бонус',
    mech_exp_below_be:'✅ Вейжер breakeven-ээс доош — сайн конверсийн профиль.',
    mech_exp_above_be:'⚠️ Вейжер breakeven-ийг хэтэрсэн — конверст дарамт хүлээгдэж байна.',
    // ── Сегмент + Incremental Revenue
    lbl_segment:'Тоглогчийн сегмент', tip_segment:'Сегмент нь нэмэгдсэн орлогын урьдчилсан мэдээнд нөлөөлнө: шинэ тоглогчдод бонусоор тогтвортой байдлыг нэмэгдүүлэх боломж өндөр.',
    seg_new:'🆕 Шинэ', seg_mid:'👤 Дунд', seg_vip:'👑 VIP',
    sec_incr_rev:'Нэмэлт орлогын урьдчилсан мэдээ',
    p_ret_lift:'Нийт лифт', p_incr_players:'Нэмэлт тоглогч (3 сар)', p_incr_rev:'Нэмэлт орлого (3 сар)', p_camp_cost_3:'Бонусын зардал: Welcome+NDB (3 сар)', p_incr_net:'Цэвэр нэмэлт',
    rtip_ret_lift:'Таван хүчин зүйлийг харгалзан тооцсон нийт өсөлт. Бенчмарк: Шинэ 15%, Дунд 10%, VIP 8%.',
    rtip_incr_rev:'Бонусоор тогтворсон тоглогчдын 3 сарын нэмэлт орлого: нэмэлт тоглогч × LTV 3 сар.',
    rtip_incr_net:'Кампанийн цэвэр орлого: нэмэлт орлого − 3 сарын кампанийн зардал.',
    incr_disclaimer:'Салбарын бенчмаркт суурилсан тооцоо. Бодит үр дүн нь бүтээгдэхүүний чанар, CRM-ээс хамаарна.',
    btn_ai_optimize:'🤖 AI Зөвлөмж', ai_opt_loading:'AI параметрүүдийг шинжилж байна…',
    ai_opt_title:'Оновчлолын зөвлөмжүүд', ai_opt_impact_high:'Өндөр', ai_opt_impact_med:'Дунд', ai_opt_impact_low:'Бага',
    ai_opt_err:'Зөвлөмж авах боломжгүй байна. Дахин оролдоно уу.',
    incr_base:'Үндсэн лифт (сегмент)', incr_f_wager:'F1 Вейжер', incr_f_gen:'F2 Бонусын өгөмж',
    incr_f_mech:'F3 Механикийн өргөн', incr_f_rtp:'F4 RTP чанар', incr_f_plat:'F5 Платформ',
    incr_lift_total:'Нийт лифт',
    sec_analytics:'Кампанийн анализ',
    an_actuals_title:'Бодит үр дүн', an_participants:'Оролцогчид', an_deposits:'Депозит', an_wager_compl:'Вейжер гүйцэлтэй',
    an_payout:'Бонусын төлөлт', an_incr_rev:'Нэмэлт ашиг (USD)', an_notes:'Тайлбар',
    an_forecast:'Урьдчилсан мэдээлэл (P50)', an_actual:'Бодит', an_variance:'Зөрүү', an_percentile:'Процентиль',
    an_within_band:'Хүрээ дотор', an_flag_worst:'Хамгийн муу сценариос доош', an_flag_best:'Хамгийн сайн сценариос дээш',
    an_flag_abuse:'Хүчирхийлэл сэжимтэй', an_flag_incomplete:'Бүрэн бус өгөгдөл',
    an_roi_actual:'Бодит ROI', an_net_actual:'Бодит цэвэр',
    btn_save_actuals:'Үр дүнг хадгалах', btn_run_analysis:'Анализ эхлүүлэх',
  },

  es: {
    hdr_sub:'v2.0 · Generador de Spec para Panel de Admin',
    pnl_title:'Parámetros de configuración',
    lbl_region:'Región y modelo de negocio',
    reg_cis:'CEI', reg_cis_sub:'RU · UA · KZ / Fiat',
    reg_eu:'EU / UK', reg_eu_sub:'EUR · GBP / Fiat',
    reg_crypto:'Global Cripto', reg_crypto_sub:'BTC · ETH · USDT',
    reg_sweep:'EE.UU. / Sweep', reg_sweep_sub:'SC · GC / Sweepcoins',
    reg_mn:'Mongolia', reg_mn_sub:'MNT / Fiat',
    reg_latam:'LatAm', reg_latam_sub:'USD / Fiat',
    lbl_players:'Nuevos jugadores / mes',
    sl_min:'100', sl_max:'50 000+',
    lbl_sitecur:'Moneda principal del sitio',
    lbl_avgdep:'Depósito inicial promedio',
    lbl_platform:'Plataforma',
    lbl_license:'Licencia / jurisdicción',
    lbl_rtp:'RTP promedio de slots',
    plat_both:'Escritorio + Móvil', plat_mobile:'Solo móvil', plat_desk:'Solo escritorio',
    lic_mga:'MGA', lic_ukgc:'UKGC', lic_dga:'DGA', lic_curacao:'Curaçao', lic_none:'Sin licencia / Offshore',
    lbl_country:'País EU',
    hint_de:'típico para Alemania', hint_fr:'típico para Francia', hint_es:'típico para España',
    hint_it:'típico para Italia', hint_nl:'típico para Países Bajos',
    hint_uk:'típico para Reino Unido', hint_dk:'típico para Dinamarca',
    eu_ctry_hint_de:'MGA · EUR · dep. prom. €50', eu_ctry_hint_fr:'MGA · EUR · dep. prom. €45',
    eu_ctry_hint_es:'MGA · EUR · dep. prom. €40', eu_ctry_hint_it:'MGA · EUR · dep. prom. €40',
    eu_ctry_hint_nl:'MGA · EUR · dep. prom. €55', eu_ctry_hint_uk:'UKGC · GBP · dep. prom. £45',
    eu_ctry_hint_dk:'DGA · DKK · dep. prom. 700 DKK',
    btn_gen:'⚡ Generar configuración',
    ph_t:'Selecciona una región y completa los parámetros',
    ph_s:'Haz clic en «Generar configuración» para obtener todos los ajustes del panel de administración',
    no_region:'Por favor, selecciona una región',
    out_title:'Configuración del programa de bonos',
    players_mo:'jugadores/mes', avg_dep:'Dep. promedio',
    btn_print:'🖨 Imprimir / PDF',
    reg_warn_title:'⚠️ Requisitos regulatorios —',
    sec_dep1:'Bono 1er Depósito', sec_dep2:'Bono 2do Depósito', sec_dep3:'Bono 3er Depósito',
    sec_dep_pkg:'Paquete de Depósito', dep_step:'Paso',
    v_sc_purchase_bonus:'Bono SC por compra',
    p_dep_trigger:'Disparador', p_dep_wager:'Wagering sobre bono',
    v_2nd_purchase:'2da compra (cualquier paquete)', v_3rd_purchase:'3ra compra (cualquier paquete)',
    mn_note_title:'ℹ️ Mongolia — Nota regulatoria',
    mn_note_text:'El juego de azar está oficialmente prohibido en Mongolia (ley de 2013). Las operaciones se realizan mediante licencia offshore de Curaçao sin registro en el país. Los jugadores acceden vía VPN/espejos.',
    latam_note_text:'Operaciones mediante licencia offshore de Curaçao. Mercados clave: Brasil, México, Colombia, Argentina, Chile. Métodos de pago recomendados: PIX, SPEI, PSE, Efecty, AstroPay.',
    sec_welcome:'Bono de Bienvenida', sec_ndb:'Bono Sin Depósito', sec_reload:'Bono Recarga',
    sec_fs:'Especificación Free Spins', sec_sc_gc:'Mecánica SC / GC',
    sec_wager:'Condiciones de Wagering', sec_cashback:'Cashback',
    sec_contrib:'Contribución de juegos al wagering',
    sec_econ:'Economía Unitaria (estimada)', sec_admin:'Config. Panel Admin — configuración completa',
    p_type:'Tipo de bono', p_size:'Tamaño', p_max_bonus:'Bono máximo',
    p_min_dep:'Depósito mín.', p_fs_count:'Free Spins en el paquete',
    p_validity:'Validez', p_days:' días',
    p_trigger:'Disparador', p_promo:'Código promo', p_optin:'Opt-in',
    p_sc:'Sweepcoins (SC)', p_gc:'Gold Coins (GC)',
    p_daily_sc:'SC por día', p_daily_gc:'GC por día', p_limit:'Límite',
    p_freq:'Frecuencia', p_day:'Día de pago',
    p_spin_val:'Valor del giro', p_fs_games:'Juegos elegibles',
    p_fs_wager:'Wagering sobre ganancias', p_fs_maxw:'Retiro máx. FS',
    p_fs_delivery:'Entrega',
    p_wager_welcome:'Bono de Bienvenida', p_wager_ndb:'Sin Depósito',
    p_wager_reload:'Bono Recarga', p_wager_fs:'Ganancias Free Spins',
    p_wager_basis:'Base de wagering', p_max_bet:'Apuesta máx. con bono',
    p_eligible:'Juegos elegibles', p_wager_days:'Período de wagering',
    p_wager_lock:'Tipo de bloqueo',
    p_cb_model:'Modelo', p_cb_period:'Período de cálculo', p_cb_basis:'Base',
    p_cb_max:'Cashback máximo', p_cb_wagering:'Wagering sobre cashback',
    p_cb_payment:'Pago', p_cb_pct:'Tasa de cashback',
    p_cb_min_loss:'Pérdidas mín. para cashback', p_cb_currency:'Moneda de pago',
    p_ct_game:'Tipo de juego', p_ct_contrib:'Contribución',
    p_arpu:'ARPU / mes', p_ltv3:'LTV 3 meses', p_cac:'CAC (Bono)',
    p_arpu_sub:'por jugador activo', p_ltv3_sub:'estimado', p_cac_sub:'por adquisición',
    p_bonus_cost:'Costo de bonos % GGR', p_monthly_budget:'Presupuesto mensual de bonos',
    p_cohort_ltv:'LTV total de cohorte 3 meses', p_roi:'ROI regional (benchmark)', p_roi_campaign:'ROI de campaña',
    rtip_roi_reg:'ROI basado en el CAC promedio regional — un benchmark de mercado independiente de los parámetros del bono.',
    rtip_roi_camp:'ROI basado en el costo real de esta campaña. Se actualiza al cambiar los parámetros del bono.',
    p_breakeven:'Punto de equilibrio', p_ggr_rate:'Tasa GGR (típica)',
    p_mo_on_player:' mes por jugador', p_ggr_val:'3–5% de las apuestas',
    sec_bonus_cost:'Análisis de costo del bono',
    p_bonus_size:'Tamaño del bono (por jugador)', p_mixed_rtp:'RTP mixto', p_mixed_wcr:'WCR mixto',
    p_scenario_p10:'Límite inferior (P10)', p_scenario_p50:'Escenario base (P50)', p_scenario_p90:'Límite superior (P90)',
    p_conv:'Conversión', p_payout_per:'Pago / jugador', p_turnover:'Rotación de apuestas',
    p_total_cost:'Costo de campaña', p_grand_total:'Gasto total de campaña', lbl_edit_wager:'Apuesta ✏', lbl_edit_maxb:'Bono máx. ✏', p_cost_ratio:'Costo / Depósitos', p_max_risk:'Riesgo máx. (techo)',
    p_stress_test:'Prueba de estrés +20% activaciones',
    verdict_cheap:'💸 Oferta débil (ratio < 10%) — EV bajo para el jugador, baja conversión esperada. → Sube match %, baja wagering o añade FS al paquete',
    verdict_ok:'✅ Rango saludable (10–20%) — buen equilibrio entre atractivo y economía. → Mantén parámetros, monitorea conversión y churn',
    verdict_warn:'⚠️ Carga alta (20–35%) — riesgo de pérdida en pico de activaciones. → Sube wagering, reduce match % o limita el max bono',
    verdict_high:'🔴 Campaña no rentable (>35%) — costo supera umbral aceptable. → Urgente: sube wagering o reduce tamaño del bono',
    v_match_dep:'Match Deposit', v_first_dep:'Primer depósito',
    v_required:'Requerido antes del depósito', v_required_short:'Requerido',
    v_no_wager:'Ninguno', v_hard_lock:'Bloqueo duro (mezcla prohibida)',
    v_auto_start:'Automáticamente al inicio del período',
    v_flat:'Fijo', v_tier:'Por niveles',
    v_weekly:'Semanal', v_monthly:'Mensual',
    v_net_losses:'Pérdidas netas del período', v_net_losses_monthly:'Pérdidas netas',
    v_slots_only:'Slots (RTP prom. ',
    v_all_games:'Todos los juegos (slots + live, 100%)',
    v_no_limit:'Sin restricción',
    v_bonus_only:'Solo bono', v_dep_bonus:'Depósito + Bono',
    v_sweep_type:'Sweepcoins Bienvenida', v_sweep_trigger:'Registro (gratis)',
    v_sweep_mech:'Juego libre (sin wagering)', v_sc_convert:'Canjeables por dinero real',
    v_gc_no_redeem:'Solo monedas de juego, sin retiro',
    v_min_redeem_sc:'100 SC', v_max_redeem_sc:'$5,000 / mes',
    v_daily_sc_type:'Bono SC diario', v_daily_trigger:'Diario (email / SMS)',
    v_immediate:'Inmediatamente tras activar Bienvenida',
    v_reg_verify:'Registro / verificación de email',
    v_1_per_account:'1 por cuenta / IP',
    v_day_mon:'Lunes', v_day_tue:'Martes', v_day_wed:'Miércoles', v_day_fri:'Viernes', v_day_sat:'Sábado',
    v_existing:'existing_players', v_new_only:'new_players_only',
    v_sweep_no_wager:'Sin wagering requerido',
    v_sweep_freeplay:'Sweepcoins — modelo de juego libre',
    v_1per_period:'1 por período',
    ukgc_note:'UKGC: NDB en efectivo prohibido. Solo Free Spins.',
    copy_btn:'📋 Copiar', copy_hint:'Pega en la configuración del panel de administración del casino o envía al desarrollador',
    copied:'✓ ¡Copiado!',
    gen_admin_btn:'⚙️ Generar Admin Config', save_admin_btn:'💾 Guardar .txt',
    admin_not_generated:'Config no generado. Haz clic en el botón para generarlo.',
    hint_cis:'típico para CEI', hint_eu:'típico para EU',
    hint_crypto:'típico Cripto', hint_sweep:'paquete promedio EE.UU.', hint_mn:'típico para Mongolia',
    hint_latam:'típico para LatAm',
    tip_region:'Define el modelo de negocio, moneda, límites regulatorios y wagering por defecto. Cada región genera un conjunto distinto de parámetros de bono.',
    tip_players:'Número de nuevos jugadores que activan el bono de bienvenida por mes. Se usa para calcular el presupuesto total de campaña y el LTV de cohorte.',
    tip_sitecur:'Moneda en la que opera el sitio del casino. Afecta el formato de cantidades en el config admin y la economía unitaria.',
    tip_avgdep:'Depósito inicial promedio del segmento objetivo. Determina el tamaño del bono (match% × depósito) y la base para el cálculo del cost ratio.',
    tip_platform:'Afecta las recomendaciones sobre triggers y visualización de T&C del bono. Desktop y Mobile pueden tener requisitos UX diferentes.',
    tip_license:'Establece restricciones regulatorias. UKGC: apuesta máx. £2/spin, NDB en efectivo prohibido. MGA: opt-in obligatorio antes del depósito.',
    tip_rtp:'RTP promedio de los slots en la biblioteca de juegos. Se usa en el modelo de costo de bono: mayor RTP = el jugador pierde dinero más lento durante el wagering = bono más caro para el operador. Valor típico: 95–97%.',
    rtip_wager:'Requisito de apuesta — cuántas veces hay que apostar el bono antes de retirarlo. x30 sobre un bono de 1000 = requiere 30.000 en apuestas.',
    rtip_match_pct:'Match % — qué porcentaje del depósito recibe el jugador como bono. 100% = depósito 1000 → bono 1000 (hasta el límite). 50% = bono 500.',
    rtip_max_bonus:'Límite máximo del bono independientemente del depósito. Con match 100% y límite 5000, un depósito de 10.000 solo genera 5000 de bono.',
    rtip_wager_basis:'"Solo bono" = wagering × bono. "Depósito + bono" = wagering × (depósito + bono) — condición más estricta para el jugador.',
    rtip_mixed_rtp:'RTP ponderado según el game mix regional. Mayor RTP = el jugador pierde más lento durante el wagering = bono más caro para el operador.',
    rtip_mixed_wcr:'Tasa de contribución ponderada — qué porcentaje de cada apuesta cuenta para completar el wagering. WCR 50% = apuesta 100 cuenta solo 50.',
    rtip_cost_ratio:'Costo del bono como proporción de los depósitos totales. <0.10 = muy barato. 0.10–0.20 = rango operativo. 0.20–0.35 = riesgo. >0.35 = reducir.',
    rtip_max_risk:'Obligación máxima si el 100% activa el bono sin apostar nada. Es el techo de exposición, no el costo real esperado.',
    rtip_arpu:'Ingresos promedio por jugador activo al mes. Benchmark regional en USD, independiente de la moneda local.',
    rtip_ltv3:'Ingresos totales de un jugador en 3 meses: LTV 3 meses = ARPU × 3. Indica cuánto genera en promedio un jugador adquirido durante su primer trimestre. Se usa para evaluar el payback del CAC y la viabilidad del presupuesto de bonos.',
    rtip_cac:'Costo de adquirir un jugador a través del canal de bonos. Benchmark regional en USD.',
    rtip_scenario:'E[max(0,X)] donde X es el saldo del jugador tras el wagering. μ = B×(1 − W/BE) — saldo esperado; σ = √(W×B/WCR) — volatilidad CLT del bankroll. Costo = E[payout]×conv×n. Por debajo del breakeven ≈ μ×conv×n; por encima cae suavemente a cero.',
    reg_ukgc_1:'Apuesta máx. con bono activo: £2/giro o £2/ronda',
    reg_ukgc_2:'NDB en efectivo prohibido — solo Free Spins en slots especificados',
    reg_ukgc_3:'Las condiciones de wagering deben mostrarse antes de aceptar el bono',
    reg_ukgc_4:'Auto-exclusión (GamStop): jugadores bloqueados no reciben bonos',
    reg_ukgc_5:'Etiqueta: «Bono con requisitos de wagering» en todos los materiales promo',
    reg_ukgc_6:'Período máximo de wagering: 90 días',
    reg_mga_1:'El multiplicador de wagering debe mostrarse en la UI al aceptar',
    reg_mga_2:'Activación automática de bonos prohibida (se requiere opt-in del jugador)',
    reg_mga_3:'Sección obligatoria «Términos y Condiciones de Bonos» en el sitio',
    reg_mga_4:'Tiempo de espera entre bonos idénticos: mínimo 24 horas',
    reg_mga_5:'Límite de apuesta recomendado con bono: €5/giro',
    reg_sweep_1:'Sin compra necesaria — se requiere alternativa gratuita para recibir SC',
    reg_sweep_2:'El producto no debe llamarse «juego de azar» — es una promoción de sweepstakes',
    reg_sweep_3:'Los SC no son dinero: no se regulan como apuestas',
    reg_sweep_4:'Aviso legal obligatorio en cada página con bonos',
    reg_sweep_5:'Verificación de edad: 18+ (21+ en algunos estados); prohibido en RI, AZ, SC, ID, MT, WA',
    v_eu_max_bet:'€5/spin (límite recomendado MGA)',
    v_ukgc_max_bet:'£2/spin (límite regulatorio UKGC)',
    v_dga_max_bet:'Sin límite por spin (DGA; tope de 1.000 DKK por bono)',
    v_standard_max_bet:'Límite estándar del operador',
    reg_dga_1:'Tope máximo: bono máx. 1.000 DKK por oferta (estatutario)',
    reg_dga_2:'Período mínimo de wagering: 60 días (mínimo legal)',
    reg_dga_3:'ROFUS: verificación de autoexclusión obligatoria antes de otorgar cualquier bono',
    reg_dga_4:'2025: los T&C deben aparecer en el mismo tamaño de fuente que el titular de la promo',
    reg_curacao_1:'Sin tope legal de bonos o wagering; marco permisivo',
    reg_curacao_2:'KYC/AML obligatorios; T&Cs deben publicarse en el sitio',
    reg_betsbr_1:'Régimen federal "Bets" (Ley 14.790): licencia SPA obligatoria',
    reg_betsbr_2:'KYC vía CPF + reconocimiento facial; restricciones de bonos',
    reg_betsbr_3:'Impuesto 12% sobre GGR; mensajes de juego responsable obligatorios',
    reg_segob_1:'Permiso SEGOB obligatorio; KYC y T&Cs publicados',
    reg_segob_2:'Herramientas de juego responsable; T&Cs en el sitio',
    reg_coljuegos_1:'Licencia Coljuegos; IVA temporal del 19% sobre depósitos (2025)',
    reg_coljuegos_2:'KYC/AML obligatorios; solo operadores licenciados',
    reg_mincetur_1:'Licencia MINCETUR (Ley 31557); impuesto ISI 0,3% sobre depósitos',
    reg_mincetur_2:'KYC obligatorio; medidas de juego responsable',
    reg_anjouan_1:'KYC básico obligatorio; se recomienda aviso de juego responsable',
    reg_kahnawake_1:'Mecanismo de resolución de disputas de jugadores requerido por KGC',
    reg_gibraltar_1:'Términos de wagering justos; juego responsable obligatorio; supervisión GRA',
    reg_iom_1:'T&Cs transparentes obligatorios; obligaciones de juego responsable; sin tope legal',
    ct_level:'Nivel', ct_losses:'Pérdidas', ct_pct:'%',
    ct_bronze:'Bronce', ct_silver:'Plata', ct_gold:'Oro', ct_platinum:'Platino',
    pkg_package:'Paquete', pkg_price:'Precio', pkg_sc:'SC',
    // ── Nuevas secciones: economía CG, explicación mecánica, auditoría IA
    sec_cg_econ:'Escenarios de Campaña', sec_mech_exp:'Explicación de la Mecánica', sec_cfg_audit:'Auditoría de Cumplimiento IA',
    btn_run_cfg_audit:'⚡ Ejecutar Auditoría', cfg_audit_running:'Analizando configuración...',
    cfg_audit_pass:'✅ Aprobado', cfg_audit_fail:'❌ Incumplimiento', cfg_audit_warn:'⚠️ Advertencia',
    cfg_audit_impact:'Impacto', cfg_audit_recs:'Recomendaciones',
    cfg_audit_not_run:'Haga clic para ejecutar una auditoría de cumplimiento IA',
    cfg_audit_error:'Error de auditoría: ',
    cg_best:'Mejor caso', cg_expected:'Esperado', cg_worst:'Peor caso',
    cg_cost_per_bonus:'Costo / jugador', cg_dep_load:'Carga sobre depósito', cg_wager_compl:'Compl. wagering',
    rtip_cg_cpb:'Pago promedio por jugador activado = total campaña / (N × conversión)',
    rtip_cg_dl:'Costo como % del total de depósitos. Rango objetivo: 10–20%',
    rtip_cg_wc:'Proporción de jugadores que completan el wagering y reciben pago',
    mech_exp_welcome:'Bono de Bienvenida', mech_exp_ndb:'Bono Sin Depósito', mech_exp_reload:'Bono de Recarga',
    mech_exp_below_be:'✅ Wagering por debajo del breakeven — buen perfil de conversión.',
    mech_exp_above_be:'⚠️ Wagering supera el breakeven — presión en conversión esperada.',
    // ── Segmento + Incremental Revenue
    lbl_segment:'Segmento de Jugadores', tip_segment:'El segmento afecta la previsión de ingresos incrementales: los jugadores nuevos tienen mayor potencial de retención por bono; los VIP ya son leales.',
    seg_new:'🆕 Nuevos', seg_mid:'👤 Medios', seg_vip:'👑 VIP',
    sec_incr_rev:'Previsión de Ingresos Incrementales',
    p_ret_lift:'Lift total', p_incr_players:'Jugadores adic. (3 meses)', p_incr_rev:'Ingresos adic. (3 meses)', p_camp_cost_3:'Costo bonos: Welcome+NDB (3 meses)', p_incr_net:'Incremento neto',
    rtip_ret_lift:'Lift de retención combinado usando cinco factores. Benchmarks base: Nuevos 15%, Medios 10%, VIP 8%.',
    rtip_incr_rev:'Ingresos adicionales en 3 meses de jugadores retenidos por el bono: jugadores_incrementales × LTV 3 meses. Benchmark USD regional.',
    rtip_incr_net:'Retorno neto de la campaña: ingresos adicionales menos el costo de la campaña en 3 meses.',
    incr_disclaimer:'Estimación basada en benchmarks del sector. Los resultados reales dependen de la calidad del producto, CRM y perfil de audiencia.',
    btn_ai_optimize:'🤖 Recomendaciones AI', ai_opt_loading:'La IA analiza los parámetros…',
    ai_opt_title:'Recomendaciones de optimización', ai_opt_impact_high:'Alto', ai_opt_impact_med:'Medio', ai_opt_impact_low:'Bajo',
    ai_opt_err:'No se pudieron obtener recomendaciones. Inténtelo de nuevo.',
    incr_base:'Lift base (segmento)', incr_f_wager:'F1 Alcanzabilidad wager', incr_f_gen:'F2 Generosidad del bono',
    incr_f_mech:'F3 Amplitud mecánicas', incr_f_rtp:'F4 Calidad RTP', incr_f_plat:'F5 Plataforma',
    incr_lift_total:'Lift total',
    sec_analytics:'Análisis de campaña',
    an_actuals_title:'Resultados reales', an_participants:'Participantes', an_deposits:'Depósitos', an_wager_compl:'Wager completado',
    an_payout:'Pago de bono', an_incr_rev:'Ingresos incr. (USD)', an_notes:'Notas',
    an_forecast:'Pronóstico (P50)', an_actual:'Real', an_variance:'Varianza', an_percentile:'Percentil',
    an_within_band:'Dentro de banda', an_flag_worst:'Peor que el peor caso', an_flag_best:'Mejor que el mejor caso',
    an_flag_abuse:'Se sospecha abuso', an_flag_incomplete:'Datos incompletos',
    an_roi_actual:'ROI real', an_net_actual:'Ganancia real',
    btn_save_actuals:'Guardar resultados', btn_run_analysis:'Ejecutar análisis',
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// STATE & i18n
// ═════════════════════════════════════════════════════════════════════════════
let L = (() => { try { return localStorage.getItem('bonusLang') || 'ru'; } catch(e) { return 'ru'; } })();
const S = { region:null, players:5000, sitecur:'USD', depcur:'USD', avgdep:100, plat:'both', lic:'mga', rtp:96, segment:'mid' };

function t(k){ return (LANG[L] && LANG[L][k]) || (LANG.ru && LANG.ru[k]) || k; }

function setLang(lang){
  L = lang;
  try { localStorage.setItem('bonusLang', lang); } catch(e) {}
  document.documentElement.setAttribute('data-lang', lang);
  document.querySelectorAll('.lchip').forEach(c=>{
    c.classList.toggle('on', c.dataset.l===lang);
  });
  document.querySelectorAll('.lt-btn').forEach(b=>{ if(b) b.classList.toggle('active', b.id==='lt-'+lang); });
  relabel();
  // Re-render output if visible
  if(document.getElementById('out').style.display !== 'none' && S.region){
    generate();
  }
}

function relabel(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.dataset.i18n;
    const val = t(key);
    if(val && val !== key) el.textContent = val;
  });
  // Update dephint if region is set
  if(S.region){
    const hints = {cis:'hint_cis',eu:'hint_eu',crypto:'hint_crypto',sweep:'hint_sweep',mn:'hint_mn'};
    document.getElementById('dephint').textContent = '— ' + t(hints[S.region]);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ═════════════════════════════════════════════════════════════════════════════
// ── EU country config (country → lic, currencies, avgdep)
const EU_COUNTRY = {
  de: { lic:'mga',  sitecur:'EUR', depcur:'EUR', avgdep:50  },
  fr: { lic:'mga',  sitecur:'EUR', depcur:'EUR', avgdep:45  },
  es: { lic:'mga',  sitecur:'EUR', depcur:'EUR', avgdep:40  },
  it: { lic:'mga',  sitecur:'EUR', depcur:'EUR', avgdep:40  },
  nl: { lic:'mga',  sitecur:'EUR', depcur:'EUR', avgdep:55  },
  uk: { lic:'ukgc', sitecur:'GBP', depcur:'GBP', avgdep:45  },
  dk: { lic:'dga',  sitecur:'DKK', depcur:'DKK', avgdep:700 },
};

function pickCountry(el) {
  const code = typeof el === 'string' ? el : el.dataset.v;
  const cfg  = EU_COUNTRY[code];
  if (!cfg) return;

  // Highlight chip
  document.querySelectorAll('.chip[data-g="country"]').forEach(c => c.classList.remove('on'));
  const chip = typeof el === 'string'
    ? document.querySelector(`.chip[data-g="country"][data-v="${code}"]`)
    : el;
  if (chip) chip.classList.add('on');
  S.country = code;

  // Auto-set license
  setChip('lic', cfg.lic);

  // Auto-set currencies
  const sc = document.getElementById('sitecur');
  const dc = document.getElementById('depcur');
  if (sc) { sc.value = cfg.sitecur; S.sitecur = cfg.sitecur; }
  if (dc) { dc.value = cfg.depcur;  S.depcur  = cfg.depcur;  }

  // Auto-set avgdep
  const ad = document.getElementById('avgdep');
  if (ad) { ad.value = cfg.avgdep; S.avgdep = cfg.avgdep; }

  // Update hints
  const hintEl = document.getElementById('dephint');
  if (hintEl) hintEl.textContent = '— ' + t('hint_' + code);
  const euHint = document.getElementById('eu-country-hint');
  if (euHint) euHint.textContent = t('eu_ctry_hint_' + code);
  checkStale();
}

function pickRegion(r){
  S.region = r;
  S.country = null;
  document.querySelectorAll('.rcard').forEach(c=>c.classList.remove('active'));
  document.getElementById('rc-'+r).classList.add('active');
  const D = {
    cis:    {sitecur:'RUB',  depcur:'RUB',  avgdep:1500,  lic:'none'},
    eu:     {sitecur:'EUR',  depcur:'EUR',  avgdep:50,    lic:'mga'},
    crypto: {sitecur:'USDT', depcur:'USDT', avgdep:100,   lic:'curacao'},
    sweep:  {sitecur:'USD',  depcur:'USD',  avgdep:15,    lic:'none'},
    mn:     {sitecur:'MNT',  depcur:'MNT',  avgdep:15000, lic:'curacao'},
    latam:  {sitecur:'USD',  depcur:'USD',  avgdep:30,    lic:'curacao'},
  };
  const d = D[r];
  document.getElementById('sitecur').value = d.sitecur;
  document.getElementById('depcur').value  = d.depcur;
  document.getElementById('avgdep').value  = d.avgdep;
  S.sitecur = d.sitecur; S.depcur = d.depcur; S.avgdep = d.avgdep;
  setChip('lic', d.lic);
  // Hide license for CIS and Sweep (no licensed ops); show for others
  document.getElementById('lic-wrap').style.display =
    (r==='cis'||r==='sweep') ? 'none' : 'block';
  // Show EU country picker only for EU; reset chips
  const euWrap = document.getElementById('eu-country-wrap');
  if (euWrap) {
    euWrap.style.display = r === 'eu' ? 'block' : 'none';
    // Reset country chips selection
    document.querySelectorAll('.chip[data-g="country"]').forEach(c => c.classList.remove('on'));
    const euHint = document.getElementById('eu-country-hint');
    if (euHint) euHint.textContent = '';
  }
  const hintKey = {cis:'hint_cis',eu:'hint_eu',crypto:'hint_crypto',sweep:'hint_sweep',mn:'hint_mn',latam:'hint_latam'};
  document.getElementById('dephint').textContent = '— ' + t(hintKey[r]);
  document.getElementById('plbl').textContent = '';
}

function captureGenerateState(){
  return JSON.stringify({
    region: S.region, players: S.players, sitecur: S.sitecur,
    depcur: S.depcur, avgdep: S.avgdep, plat: S.plat,
    lic: S.lic, rtp: S.rtp, segment: S.segment,
  });
}
window._lastGenerateState = null;
function checkStale(){
  if(!window._lastCfg || !window._lastGenerateState) return;
  const banner = document.getElementById('stale-banner');
  if(banner) banner.style.display = captureGenerateState() !== window._lastGenerateState ? 'flex' : 'none';
}

function syncR(k){
  const v = parseInt(document.getElementById(k+'range').value);
  document.getElementById(k+'num').value = v;
  document.getElementById(k+'dsp').textContent = v.toLocaleString('ru');
  S[k==='p'?'players':k] = v;
  checkStale();
}
function syncN(k){
  const v = parseInt(document.getElementById(k+'num').value)||0;
  const rng = document.getElementById(k+'range');
  if(rng) rng.value = Math.min(v, parseInt(rng.max));
  document.getElementById(k+'dsp').textContent = v.toLocaleString('ru');
  S[k==='p'?'players':k] = v;
  checkStale();
}

function pickChip(el){
  const g = el.dataset.g;
  document.querySelectorAll(`.chip[data-g="${g}"]`).forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  S[g] = el.dataset.v;
  checkStale();
}
function setChip(g, v){
  document.querySelectorAll(`.chip[data-g="${g}"]`).forEach(c=>{
    c.classList.remove('on');
    if(c.dataset.v===v) c.classList.add('on');
  });
  S[g]=v;
}

// ═════════════════════════════════════════════════════════════════════════════
// FORMAT HELPERS
// ═════════════════════════════════════════════════════════════════════════════
function fmtC(n, cur, dec=0){
  if(cur==='BTC')  return n.toFixed(4)+' BTC';
  if(cur==='ETH')  return n.toFixed(3)+' ETH';
  if(cur==='USDT'||cur==='USD') return '$'+n.toLocaleString('en',{minimumFractionDigits:dec,maximumFractionDigits:dec});
  if(cur==='EUR')  return '€'+n.toLocaleString('en',{minimumFractionDigits:dec,maximumFractionDigits:dec});
  if(cur==='GBP')  return '£'+n.toLocaleString('en',{minimumFractionDigits:dec,maximumFractionDigits:dec});
  if(cur==='SC')   return n.toLocaleString('en')+' SC';
  if(cur==='GC')   return n.toLocaleString('en')+' GC';
  if(cur==='MNT')  return n.toLocaleString('ru')+'₮';
  return n.toLocaleString('ru')+' '+cur;
}
function fmtUSD(n){ return '$'+Math.round(n).toLocaleString('en'); }
function pr(k,v,cls='',vid=''){return `<div class="pr"><span class="pk">${k}</span><span class="pv ${cls}"${vid?` id="${vid}"`:''}>${v}</span></div>`;}
function prt(k,v,cls,tip,vid=''){return `<div class="pr"><span class="pk"><span class="tip-wrap" style="max-width:none">${k}<span class="tip-btn" onclick="toggleTip(this)">?</span><div class="tip-box" style="width:230px">${tip}</div></span></span><span class="pv ${cls||''}"${vid?` id="${vid}"`:''}>${v}</span></div>`;}
function pe(k,id,val,unit=''){return `<div class="pr ov-row"><span class="pk">${k}</span><span class="pv" style="display:flex;align-items:center;gap:4px"><input class="ov-inp" id="${id}" type="number" value="${+val}" min="1" max="9999" step="1" onchange="recalcEcon()"><span style="font-size:11px;color:var(--muted)">${unit}</span></span></div>`;}
function pc(k,id){return `<div class="pr cost-row"><span class="pk">💰 ${k}</span><span class="pv hi" id="${id}">—</span></div>`;}
function preTxt(k,id,val){return `<div class="pr"><span class="pk">${k}</span><span class="pv" style="display:flex;justify-content:flex-end"><input class="ov-inp" id="${id}" type="text" value="${val}" style="width:110px;text-align:right" onchange="recalcEcon()"></span></div>`;}
function pre(k,id,val,unit,tip='',step=1,min=1,max=9999){const inp=`<input class="ov-inp" id="${id}" type="number" value="${val}" min="${min}" max="${max}" step="${step}" onchange="recalcEcon()"><span style="font-size:11px;color:var(--muted)">${unit}</span>`;const lbl=tip?`<span class="tip-wrap" style="max-width:none">${k}<span class="tip-btn" onclick="toggleTip(this)">?</span><div class="tip-box" style="width:230px">${tip}</div></span>`:k;return `<div class="pr"><span class="pk">${lbl}</span><span class="pv" style="display:flex;align-items:center;gap:4px">${inp}</span></div>`;}

// ═════════════════════════════════════════════════════════════════════════════
// GENERATE & RENDER
// ═════════════════════════════════════════════════════════════════════════════
async function generate(){
  if(!S.region){ alert(t('no_region')); return; }
  const payload = {
    lang: L,
    region: S.region,
    players: S.players,
    sitecur: S.sitecur,
    depcur: S.depcur,
    avgdep: S.avgdep,
    plat: S.plat,
    lic: S.lic,
    rtp: S.rtp,
    segment: S.segment || 'mid',
  };

  let cfg;
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });
    if(!res.ok){ throw new Error(`${res.status} ${res.statusText}`); }
    const data = await res.json();
    cfg = data.cfg;
  } catch(err){
    console.error(err);
    alert('Ошибка API: ' + err.message);
    return;
  }

  document.getElementById('ph').style.display='none';
  document.getElementById('out').style.display='block';
  window._lastCfg = cfg;
  window._lastCfg._country = S.country || null;
  window._lastGenerateState = captureGenerateState();
  const staleBanner = document.getElementById('stale-banner');
  if (staleBanner) staleBanner.style.display = 'none';
  document.getElementById('out').innerHTML = render(cfg);
  recalcEcon();
  // On mobile: auto-scroll to results after generation
  if(window.innerWidth <= 768){
    setTimeout(()=>{
      document.getElementById('out').scrollIntoView({behavior:'smooth',block:'start'});
    }, 80);
  }
}

// ── Live economics recalculation (debounced, delegates to /api/recalc) ────────
let _recalcTimer = null;
function recalcEcon(){
  const cfg = window._lastCfg;
  if(!cfg || cfg.r==='sweep') return;

  // ── Sync update: wager display values don't need API response
  // Keeps "Wager on Bonus" and "Wagering Conditions" in sync with override inputs
  // Sync update: keep Wagering Conditions summary in step with ov_w_wager override
  const readNum = (id, def) => { const v = parseFloat(document.getElementById(id)?.value); return (isNaN(v) || v <= 0) ? def : v; };
  const wWDisp = readNum('ov_w_wager', cfg.econ.wagerX);
  const elWW = document.getElementById('wg_display_wW'); if (elWW) elWW.textContent = wWDisp + '× bonus';

  clearTimeout(_recalcTimer);
  _recalcTimer = setTimeout(async () => {
    const E = cfg.econ;
    const gv = (id, def) => {
      const el = document.getElementById(id);
      const v = el ? parseFloat(el.value) : NaN;
      return (isNaN(v) || v <= 0) ? def : v;
    };
    const overrides = {
      w_pct:     gv('ov_w_pct',    cfg.welcome.pct || 100),
      w_wager:   gv('ov_w_wager',  E.wagerX),
      w_maxB:    gv('ov_w_maxB',   cfg.welcome.maxB),
      w_fs:      gv('ov_w_fs',     cfg.welcome.fs || 0),
      ndb_wager: gv('ov_ndb_wager',cfg.ndb.wager || 50),
      ndb_fs:    gv('ov_ndb_fs',   cfg.ndb.fs || 0),
      ndb_amt:   gv('ov_ndb_amt',  cfg.ndb.amt || 0),
      rl_pct:    gv('ov_rl_pct',   cfg.reload.pct || 50),
      rl_wager:  gv('ov_rl_wager', cfg.wager.wR || 35),
      rl_maxB:   gv('ov_rl_maxB',  cfg.reload.maxB || 0),
      rl_fs:     gv('ov_rl_fs',    cfg.reload.fs || 0),
      d2_pct:    gv('ov_d2_pct',   cfg.dep2.pct || 75),
      d2_wager:  gv('ov_d2_wager', cfg.dep2.wager || E.wagerX),
      d2_maxB:   gv('ov_d2_maxB',  cfg.dep2.maxB || 0),
      d2_fs:     gv('ov_d2_fs',    cfg.dep2.fs || 0),
      d3_pct:    gv('ov_d3_pct',   cfg.dep3.pct || 50),
      d3_wager:  gv('ov_d3_wager', cfg.dep3.wager || E.wagerX),
      d3_maxB:   gv('ov_d3_maxB',  cfg.dep3.maxB || 0),
      d3_fs:     gv('ov_d3_fs',    cfg.dep3.fs || 0),
      fs_wager:  gv('ov_fs_wager', cfg.fsSpec ? cfg.fsSpec.wager : 30),
      fs_count:  gv('ov_fs_count', cfg.fsSpec ? cfg.fsSpec.count : 0),
    };
    let data;
    try {
      const res = await fetch('/api/recalc', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ cfg, overrides }),
      });
      if(!res.ok) return;
      data = await res.json();
    } catch(e) { return; }

    const fBC = v => fmtC(v, cfg.cur);
    const upd = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=fBC(v); };
    upd('cost_w',         data.costs.w_p50);
    upd('cost_ndb',       data.costs.ndb);
    upd('cost_rl',        data.costs.rl);
    upd('cost_d2',        data.costs.d2);
    upd('cost_d3',        data.costs.d3);
    upd('cost_fs',        data.costs.fs);
    upd('cost_total_all', data.costs.total);
    upd('econ_cost_p10',  data.costs.w_p10);
    upd('econ_cost_p50',  data.costs.w_p50);
    upd('econ_cost_p90',  data.costs.w_p90);
    const elCR = document.getElementById('econ_cost_ratio');
    if(elCR) elCR.textContent = (data.ratio*100).toFixed(1)+'% ('+data.ratio.toFixed(3)+')';
    const elMR = document.getElementById('econ_max_risk');
    if(elMR) elMR.textContent = fBC(data.maxRisk);

    // ── Update stress test (P90 cost)
    const elST = document.getElementById('econ_stress_test');
    if(elST) elST.textContent = fBC(data.costs.w_p90);

    // ── Update model label (breakeven indicator) with current wager override
    const newWager  = gv('ov_w_wager', E.wagerX);
    const overBe    = newWager > E.breakeven_wager;
    const elML = document.getElementById('econ_model_label');
    if (elML) {
      elML.style.color      = overBe ? '#F59E0B' : '#10b981';
      elML.style.background = overBe ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';
      elML.textContent      = overBe
        ? `⚠️ Wager ${newWager}× > breakeven ${E.breakeven_wager}× — Truncated Normal (variance tail, decaying)`
        : `✅ Wager ${newWager}× ≤ breakeven ${E.breakeven_wager}× — Truncated Normal (linear mean + variance)`;
    }

    // ── Update CG card sub-metrics (cost per bonus, deposit load %)
    const base = E.costRatio > 0 ? E.sP50.cost / E.costRatio : (E.pl > 0 ? E.pl * 100 : 1);
    const scenCosts = { p10: data.costs.w_p10, p50: data.costs.w_p50, p90: data.costs.w_p90 };
    const scenConvs = { p10: E.sP10.conv, p50: E.sP50.conv, p90: E.sP90.conv };
    for (const k of ['p10','p50','p90']) {
      const cost  = scenCosts[k];
      const conv  = scenConvs[k];
      const cpb   = (E.pl > 0 && conv > 0) ? Math.round(cost / (E.pl * conv)) : 0;
      const dl    = base > 0 ? cost / base : 0;
      const dlCls = dl > 0.35 ? 'rd' : dl > 0.20 ? 'yw' : 'gn';
      const elCpb = document.getElementById(`econ_cpb_${k}`);
      const elDl  = document.getElementById(`econ_dl_${k}`);
      if (elCpb) elCpb.textContent = fBC(cpb);
      if (elDl)  { elDl.textContent = (dl * 100).toFixed(1) + '%'; elDl.className = `pv ${dlCls}`; }
    }

    // ── Campaign ROI: scale regional CAC by (new_ratio / initial_ratio) → USD-comparable
    // campaign_cac_usd = cac × (data.ratio / initial_costRatio)
    // campaign_roi     = round((totLTV − 3×pl×campaign_cac_usd) / (3×pl×campaign_cac_usd) × 100)
    const elCampROI = document.getElementById('econ_campaign_roi');
    if (elCampROI && E.costRatio > 0) {
      const campCacUsd   = E.cac * (data.ratio / E.costRatio);
      const campBudget3  = 3 * E.pl * campCacUsd;
      const campROI      = campBudget3 > 0 ? Math.round((E.totLTV - campBudget3) / campBudget3 * 100) : 0;
      const campCls      = campROI > 50 ? 'gn' : campROI > 0 ? 'gd' : 'rd';
      elCampROI.textContent = campROI + '%';
      elCampROI.className   = `pv ${campCls}`;
    }

    // ── Incremental Revenue v2: recalc all wager-sensitive factors
    {
      const overrideWager = gv('ov_w_wager', E.wagerX);
      const v = _calcRetentionV2(cfg, overrideWager);
      // Use acqCostRatio (welcome+NDB only) — reload is ongoing loyalty cost, not acquisition
      const campCost3 = Math.round(3 * (data.ratio || (E.acqCostRatio ?? E.costRatio)) * E.pl * E.arpu);
      const incrPl  = Math.round(E.pl * v.lift);
      const incrRev = Math.round(incrPl * (E.ltv3 || 0));
      const netIncr = incrRev - campCost3;
      const netCls  = netIncr > 0 ? 'gn' : netIncr < 0 ? 'rd' : 'gd';
      const fmtU    = n => '$' + Math.abs(n).toLocaleString('ru') + ' ~USD';
      const factClr = f => f > 1.015 ? '#10b981' : f < 0.985 ? '#EF4444' : '#8892a4';

      // Wager factor note (updates since wager changed)
      const wagNote = v.wagFactor > 1.01
        ? `be ${v.beW}× > w ${overrideWager}× ▲`
        : `be ${v.beW}× ≤ w ${overrideWager}× ▼`;

      const elFW = document.getElementById('incr_fw_val');
      const elRL = document.getElementById('incr_ret_lift');
      const elIP = document.getElementById('incr_players');
      const elIR = document.getElementById('incr_rev');
      const elCC = document.getElementById('incr_camp_cost3');
      const elIN = document.getElementById('incr_net');

      if (elFW) { elFW.textContent = '×' + v.wagFactor.toFixed(2); elFW.style.color = factClr(v.wagFactor); }
      if (elRL) elRL.textContent = (v.lift * 100).toFixed(1) + '%';
      if (elIP) elIP.textContent = '+' + incrPl.toLocaleString('ru') + ' ' + t('players_mo').replace('/мес','').replace('/mo','').trim();
      if (elIR) elIR.textContent = fmtU(incrRev);
      if (elCC) elCC.textContent = fmtU(campCost3);
      if (elIN) { elIN.textContent = (netIncr >= 0 ? '+' : '−') + fmtU(netIncr); elIN.className = `pv ${netCls}`; }
    }

    // ── Update range bar labels and gradient position
    const mn = data.costs.w_p10, md = data.costs.w_p50, mx = data.costs.w_p90;
    const rng = mx > mn ? mx - mn : 1;
    const pct = (((md - mn) / rng) * 100).toFixed(1);
    const elMn = document.getElementById('econ_range_mn');
    const elMd = document.getElementById('econ_range_md');
    const elMx = document.getElementById('econ_range_mx');
    if(elMn) elMn.textContent = fBC(mn);
    if(elMd) elMd.textContent = fBC(md);
    if(elMx) elMx.textContent = fBC(mx);
  }, 300);
}

// ═════════════════════════════════════════════════════════════════════════════
// INCREMENTAL REVENUE — V2 MULTI-FACTOR MODEL
// ═════════════════════════════════════════════════════════════════════════════
function _calcRetentionV2(cfg, overrideWager) {
  const E  = cfg.econ     || {};
  const W  = cfg.welcome  || {};
  const N  = cfg.ndb      || {};
  const RL = cfg.reload   || {};
  const D2 = cfg.dep2     || {};
  const FS = cfg.fsSpec   || null;
  const CB = cfg.cashback || {};
  const seg  = S.segment || 'mid';
  const plat = S.plat    || 'both';

  const SEG_LIFT = { new: 0.25, mid: 0.18, vip: 0.12 };
  const base = SEG_LIFT[seg] || 0.10;

  // F1: Wager achievability — ratio of breakeven to actual wager
  // wagScore > 1 → player-friendly (below breakeven); < 1 → above breakeven (costly)
  const wagerX    = (overrideWager > 0 ? overrideWager : null) || E.wagerX || 30;
  const beW       = E.breakeven_wager || wagerX;
  const wagScore  = Math.min(2.0, Math.max(0.3, beW / Math.max(wagerX, 1)));
  const wagFactor = Math.min(1.35, Math.max(0.65, 0.7 + 0.3 * wagScore));

  // F2: Bonus generosity — match %, neutral at ~50%, max at 100%
  const matchPct  = W.pct || 100;
  const genFactor = Math.min(1.15, Math.max(0.85, 0.85 + 0.30 * Math.min(matchPct / 100, 1.0)));

  // F3: Mechanics breadth — each ongoing retention mechanic adds lift
  const hasNDB    = (N.amt > 0) || (N.fs > 0);
  const hasReload = (RL.pct || 0) > 0;
  const hasDep2   = (D2.pct || 0) > 0;
  const hasFS     = FS && (FS.count || 0) > 20;
  const hasCB     = (CB.pct >= 5) || CB.model === 'tier';
  const mechFactor = 1.0
    + (hasNDB    ? 0.06 : 0)   // acquisition hook
    + (hasReload ? 0.08 : 0)   // strongest return trigger
    + (hasDep2   ? 0.04 : 0)   // retention chain
    + (hasFS     ? 0.04 : 0)   // immediate engagement (>20 FS)
    + (hasCB     ? 0.07 : 0);  // ongoing VIP retention

  // F4: RTP quality — higher RTP = wagering feels better = more likely to return
  const rtp       = E.mixedRTP || 0.96;
  const rtpFactor = Math.min(1.06, Math.max(0.94, 0.94 + 0.12 * ((rtp - 0.85) / 0.14)));

  // F5: Platform — mobile users are impulse-driven, stronger short-term retention
  const platFactor = { mobile: 1.05, desk: 0.97, both: 1.0 }[plat] || 1.0;

  const lift = Math.min(0.40, base * wagFactor * genFactor * mechFactor * rtpFactor * platFactor);

  return { base, wagFactor, genFactor, mechFactor, rtpFactor, platFactor, lift,
           wagerX, beW, matchPct, hasNDB, hasReload, hasDep2, hasFS, hasCB, rtp, plat,
           seg };
}

async function _runOptimize(btn) {
  const resultEl = document.getElementById('incr_ai_result');
  if (!resultEl || !_lastCfg) return;

  const v   = _calcRetentionV2(_lastCfg);
  const E   = _lastCfg.econ || {};
  const incrPl    = Math.round(E.pl * v.lift);
  const incrRev   = Math.round(incrPl * (E.ltv3 || 0));
  const campCost3 = Math.round(3 * (E.acqCostRatio ?? E.costRatio ?? 0) * E.pl * E.arpu);
  const net       = incrRev - campCost3;

  btn.disabled = true;
  btn.textContent = t('ai_opt_loading');
  resultEl.innerHTML = '';

  try {
    const resp = await fetch('/api/campaign/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        geo:      _lastCfg.r,
        segment:  S.segment || 'mid',
        lift: {
          wagFactor:  v.wagFactor,  wagerX:    v.wagerX,   beW:      v.beW,
          genFactor:  v.genFactor,  matchPct:  v.matchPct,
          mechFactor: v.mechFactor,
          hasNDB:     v.hasNDB,     hasReload: v.hasReload, hasDep2: v.hasDep2,
          hasFS:      v.hasFS,      hasCB:     v.hasCB,
          rtpFactor:  v.rtpFactor,  rtp:       v.rtp,
          platFactor: v.platFactor, plat:      v.plat,
          base:       v.base,       lift:      v.lift,
        },
        economics: { net, campCost3, incrRev, incrPl, pl: E.pl },
        uiLang: L,
      }),
    });

    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();

    const impactClr = { high: '#10b981', med: '#f59e0b', low: '#8892a4' };
    const impactLbl = { high: t('ai_opt_impact_high'), med: t('ai_opt_impact_med'), low: t('ai_opt_impact_low') };
    const isRuLang = L === 'ru';
    const factorLbl = isRuLang
      ? { F1:'Вейджер', F2:'Матч-бонус', F3:'Механики', F4:'RTP игр', F5:'Платформа' }
      : { F1:'Wagering', F2:'Match Bonus', F3:'Mechanics', F4:'Game RTP', F5:'Platform' };
    const paramLbl = isRuLang
      ? { wager:'Размер вейджера', matchPct:'Процент матча', addNDB:'Добавить НДБ',
          addReload:'Добавить Reload', addCashback:'Добавить кэшбэк',
          addDep2:'Бонус 2-го депозита', addFS:'Добавить фриспины',
          rtp:'RTP слотов', plat:'Устройство' }
      : { wager:'Wager multiplier', matchPct:'Match %', addNDB:'Add No-Dep Bonus',
          addReload:'Add Reload', addCashback:'Add Cashback',
          addDep2:'2nd Deposit Bonus', addFS:'Add Free Spins',
          rtp:'Slots RTP', plat:'Platform' };

    const cards = (data.recommendations || []).map(rec => `
      <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:8px;padding:8px 10px;margin-top:6px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:11px;font-weight:700;color:#a5b4fc">${factorLbl[rec.factor]||rec.factor} · ${paramLbl[rec.param]||rec.param}</span>
          <span style="font-size:10px;font-weight:600;color:${impactClr[rec.impact] || '#8892a4'}">${impactLbl[rec.impact] || rec.impact}</span>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:3px">${rec.current} → <strong style="color:var(--fg)">${rec.target}</strong></div>
        <div style="font-size:11px;color:var(--fg)">${rec.reason}</div>
      </div>`).join('');

    resultEl.innerHTML = `
      <div style="font-size:11px;font-weight:700;color:#a5b4fc;margin-top:10px;margin-bottom:2px">${t('ai_opt_title')}</div>
      ${cards}`;

    btn.textContent = t('btn_ai_optimize');
    btn.disabled = false;

  } catch (e) {
    resultEl.innerHTML = `<div style="color:#EF4444;font-size:11px;margin-top:6px">${t('ai_opt_err')}</div>`;
    btn.textContent = t('btn_ai_optimize');
    btn.disabled = false;
  }
}

function _buildIncrRevBody(cfg, v) {
  const E   = cfg.econ || {};
  const segLbl  = { new: t('seg_new'), mid: t('seg_mid'), vip: t('seg_vip') }[v.seg] || v.seg;

  const incrPl    = Math.round(E.pl * v.lift);
  const incrRev   = Math.round(incrPl * (E.ltv3 || 0));
  const campCost3 = Math.round(3 * (E.acqCostRatio ?? E.costRatio ?? 0) * E.pl * E.arpu);
  const netIncr   = incrRev - campCost3;
  const netCls    = netIncr > 0 ? 'gn' : netIncr < 0 ? 'rd' : 'gd';
  const fmtU      = n => '$' + Math.abs(n).toLocaleString('ru') + ' ~USD';
  const fmtFact   = f => '×' + f.toFixed(2);
  const factClr   = f => f > 1.015 ? '#10b981' : f < 0.985 ? '#EF4444' : '#8892a4';

  // Wager factor note
  const wagNote = v.wagFactor > 1.01
    ? (L==='ru' ? `be ${v.beW}× > w ${v.wagerX}× ▲` : `be ${v.beW}× > w ${v.wagerX}× ▲`)
    : (L==='ru' ? `be ${v.beW}× ≤ w ${v.wagerX}× ▼` : `be ${v.beW}× ≤ w ${v.wagerX}× ▼`);

  // Mechanics note: list active ones
  const mechParts = [
    v.hasNDB    && 'NDB',
    v.hasReload && 'Reload',
    v.hasDep2   && (L==='ru' ? '2й деп' : '2nd dep'),
    v.hasFS     && 'FS>20',
    v.hasCB     && (L==='ru' ? 'Кэшбэк' : 'Cashback'),
  ].filter(Boolean);
  const mechNote = mechParts.length ? '+' + mechParts.join(' +') : (L==='ru' ? 'только Welcome' : 'Welcome only');

  const platNote = { mobile: 'mobile ▲', desk: 'desktop ▼', both: '' }[v.plat] || '';
  const rtpNote  = `${(v.rtp*100).toFixed(0)}% ${v.rtp >= 0.96 ? '▲' : v.rtp <= 0.92 ? '▼' : ''}`;

  // Factor breakdown row
  const fRow = (label, valStr, valColor, note, id) => `
    <div style="display:flex;align-items:baseline;gap:4px;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.035);font-size:10.5px">
      <span style="color:var(--muted);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${label}</span>
      <span style="font-family:monospace;font-weight:700;color:${valColor};white-space:nowrap"${id?` id="${id}"`:''}>${valStr}</span>
      ${note ? `<span style="color:var(--muted);font-size:9px;white-space:nowrap;min-width:90px;text-align:right">${note}</span>` : '<span style="min-width:90px"></span>'}
    </div>`;

  const incrExpert = localStorage.getItem('cfg_incr_expert') === '1';
  const incrToggleLbl = incrExpert
    ? (L==='ru' ? 'Скрыть факторы ▴' : 'Hide factors ▴')
    : (L==='ru' ? 'Показать разбивку факторов ▾' : 'Show factor breakdown ▾');

  return `
    <div style="font-size:10px;color:var(--muted);margin-bottom:6px;font-style:italic;display:flex;align-items:center;gap:6px">
      📈 ${t('sec_incr_rev')}
      <span style="padding:1px 7px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(79,110,247,0.15);color:#a0b0ff">${segLbl}</span>
      <button onclick="(function(){var e=document.getElementById('cfg-incr-detail');if(!e)return;var open=e.style.display!=='none';e.style.display=open?'none':'';localStorage.setItem('cfg_incr_expert',open?'0':'1');this.textContent=open?'${L==='ru'?'Показать разбивку факторов ▾':'Show factor breakdown ▾'}':'${L==='ru'?'Скрыть факторы ▴':'Hide factors ▴'}';}).call(this)"
        style="margin-left:auto;font-size:9px;color:var(--accent);background:none;border:none;cursor:pointer;padding:1px 5px;border-radius:4px;white-space:nowrap">
        ${incrToggleLbl}
      </button>
    </div>
    <div id="cfg-incr-detail" style="display:${incrExpert?'':'none'}">
    <div style="background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);border-radius:7px;padding:7px 9px;margin-bottom:8px">
      ${fRow(t('incr_base'), (v.base*100).toFixed(0)+'%', '#a0b0ff', '', '')}
      ${fRow(t('incr_f_wager'), fmtFact(v.wagFactor), factClr(v.wagFactor), wagNote, 'incr_fw_val')}
      ${fRow(t('incr_f_gen'), fmtFact(v.genFactor), factClr(v.genFactor), v.matchPct+'% match', '')}
      ${fRow(t('incr_f_mech'), fmtFact(v.mechFactor), factClr(v.mechFactor), mechNote, '')}
      ${fRow(t('incr_f_rtp'), fmtFact(v.rtpFactor), factClr(v.rtpFactor), rtpNote, '')}
      ${v.plat !== 'both' ? fRow(t('incr_f_plat'), fmtFact(v.platFactor), factClr(v.platFactor), platNote, '') : ''}
      <div style="border-top:1px solid rgba(255,255,255,.1);margin-top:3px;padding-top:5px;display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-size:11px;color:var(--muted);font-weight:600">${t('incr_lift_total')}</span>
        <span id="incr_ret_lift" style="font-size:14px;font-weight:800;color:#10b981">${(v.lift*100).toFixed(1)}%</span>
      </div>
    </div>
    </div>
    ${pr(t('p_incr_players'), '+'+incrPl.toLocaleString('ru')+' '+t('players_mo').replace('/мес','').replace('/mo','').trim(), 'gn', 'incr_players')}
    ${prt(t('p_incr_rev'), fmtU(incrRev), 'gn', t('rtip_incr_rev'), 'incr_rev')}
    ${pr(t('p_camp_cost_3'), fmtU(campCost3), 'gd', 'incr_camp_cost3')}
    ${prt(t('p_incr_net'), (netIncr>=0?'+':'−')+fmtU(netIncr), netCls, t('rtip_incr_net'), 'incr_net')}
    <div style="font-size:9.5px;color:var(--muted);margin-top:5px;font-style:italic">* ${t('incr_disclaimer')}</div>
    <div style="margin-top:8px">
      <button onclick="(function(b){var d=document.getElementById('model-assumptions-cfg');if(!d)return;var open=d.style.display!=='none';d.style.display=open?'none':'';b.textContent=open?'ℹ '+t('model_assumptions_show'):'ℹ '+t('model_assumptions_hide');}).call(this)"
        style="font-size:9px;color:var(--muted);background:none;border:none;cursor:pointer;padding:0;font-family:inherit">
        ℹ ${t('model_assumptions_show')}
      </button>
      <div id="model-assumptions-cfg" style="display:none;margin-top:6px;font-size:9px;color:var(--muted);background:rgba(255,255,255,.03);border-radius:6px;padding:7px 9px;line-height:1.7">
        ${t('ma_base')}<br>
        ${t('ma_cap')}<br>
        ${t('ma_f1')}<br>
        ${t('ma_f2')}<br>
        ${t('ma_f3')}<br>
        ${t('ma_f4')}<br>
        ${t('ma_f5')}<br>
        ${t('ma_arpu')} ${E.arpu} USD/mo
      </div>
    </div>
    ${netIncr < 0 ? `
    <div id="incr_ai_btn_wrap" style="margin-top:10px">
      <button onclick="_runOptimize(this)"
        style="width:100%;padding:7px 12px;background:rgba(99,102,241,.18);border:1px solid rgba(99,102,241,.45);
               border-radius:8px;color:#a5b4fc;font-size:12px;cursor:pointer;font-weight:600;transition:background .2s"
        onmouseover="this.style.background='rgba(99,102,241,.32)'" onmouseout="this.style.background='rgba(99,102,241,.18)'">
        ${t('btn_ai_optimize')}
      </button>
    </div>
    <div id="incr_ai_result"></div>` : ''}
  `;
}

function render(c){
  const {welcome:W,dep2:D2,dep3:D3,ndb:N,reload:RL,wager:WG,cashback:CB,contrib:CT,fsSpec:FS,econ:E,reg:RG,r,cur,dep,pl,lic} = c;
  const RN = {cis:t('reg_cis'),eu:t('reg_eu'),crypto:t('reg_crypto'),sweep:t('reg_sweep'),mn:t('reg_mn'),latam:t('reg_latam')};
  const RC = {cis:'#7C3AED',eu:'#2563EB',crypto:'#0D9488',sweep:'#059669',mn:'#D97706',latam:'#BE185D'};
  const col= RC[r];
  let h = '';

  // ── Output header
  h += `<div class="oh">
    <div>
      <div class="ot">${t('out_title')}</div>
      <div class="om">
        <span class="obadge" style="background:${col}18;color:${col}">${RN[r]}</span>
        <span>${pl.toLocaleString('ru')} ${t('players_mo')}</span>
        <span>·</span>
        <span>${t('avg_dep')}: ${dep.toLocaleString()} ${c.depcur}</span>
        ${lic&&lic!=='none'?`<span>·</span><span class="obadge" style="background:#1e2740;color:#8892a4">${lic.toUpperCase()}</span>`:''}
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <button class="btn-back-mob" onclick="document.querySelector('.left').scrollIntoView({behavior:'smooth'})" title="Back to config">← ${t('btn_back_config')||'Настройки'}</button>
      <button class="btn-print" onclick="window.print()">${t('btn_print')}</button>
    </div>
  </div>`;

  // Mongolia / LatAm info note
  if(r==='mn'){
    h += `<div class="mn-note"><div class="mn-note-t">${t('mn_note_title')}</div><p>${t('mn_note_text')}</p></div>`;
  }
  if(r==='latam'){
    h += `<div class="mn-note"><div class="mn-note-t">ℹ️ ${t('reg_latam')} — ${t('lbl_license')}</div><p>${t('latam_note_text')||'Операция через офшорную лицензию Curaçao. Основные рынки: Бразилия, Мексика, Колумбия, Аргентина, Чили. Рекомендуемые платёжные методы: PIX, SPEI, PSE, Efecty, Astropay.'}</p></div>`;
  }

  // Regulatory warning
  if(RG) h += `<div class="rw"><div class="rw-t">${t('reg_warn_title')} ${lic?lic.toUpperCase():''}</div><ul>${RG.map(x=>`<li>${t(x)}</li>`).join('')}</ul></div>`;

  // ── Row 1: Welcome + NDB + Reload
  h += `<div class="grid3">`;

  // Welcome
  let wBody='';
  if(r==='sweep'){
    wBody=pr(t('p_type'),t('v_sweep_type'))
         +pr(t('p_sc'),W.sc+' SC','hi')
         +pr(t('p_gc'),W.gc.toLocaleString()+' GC','gd')
         +pr(t('p_trigger'),t(W.trigger))
         +pr(t('p_validity'),W.validity+t('p_days'))
         +pr(t('p_wager_welcome'),t('v_no_wager'),'gn')
         +pr('Promo code','—');
  } else {
    wBody=pr(t('p_type'),t('v_match_dep'),'hi')
         +pre(t('p_size'),'ov_w_pct',W.pct,'%',t('rtip_match_pct'),1,1,500)
         +pre(t('p_max_bonus'),'ov_w_maxB',W.maxB,W.cur,t('rtip_max_bonus'))
         +pre(t('p_min_dep'),'ov_w_mind',W.minD,W.cur,'',1,0,99999)
         +pre(t('p_fs_count'),'ov_w_fs',W.fs,'FS','',1,0,999)
         +pre(t('p_validity'),'ov_w_days',W.days,t('p_days').trim(),'',1,1,365)
         +pr(t('p_trigger'),t('v_first_dep'))
         +preTxt(t('p_promo'),'ov_w_promo',W.code)
         +pr(t('p_optin'),t('v_required'))
         +'<div class="ov-sep"></div>'
         +pe(t('lbl_edit_wager'),'ov_w_wager',WG.wW,'×')
         +pc(t('p_total_cost')+' (P50)','cost_w');
  }
  h += sec(col,'🥇',t('sec_dep1'), r==='sweep'?W.sc+'SC+'+W.gc+'GC' : W.pct+'%'+(W.fs?' + '+W.fs+'FS':''), wBody);

  // NDB
  let nBody='';
  if(r==='sweep'){
    nBody=pr(t('p_type'),t('v_daily_sc_type'))
         +pr(t('p_daily_sc'),N.sc+' SC','hi')
         +pr(t('p_daily_gc'),N.gc+' GC','gd')
         +pr(t('p_trigger'),t(N.trigger))
         +pr(t('p_limit'),t(N.limit))
         +pr(t('p_wager_ndb'),t('v_no_wager'),'gn');
  } else if(N.type==='fs_restricted'){
    nBody=`<div style="font-size:11px;color:#F59E0B;background:rgba(245,158,11,0.12);padding:8px 10px;border-radius:6px;margin-bottom:8px">⚠️ ${N.note}</div>`
         +pre(t('p_fs_count'),'ov_ndb_fs',N.fs,'FS','',1,1,999)
         +pr(t('p_fs_maxw'),N.maxW_x+'× '+t('p_spin_val').toLowerCase())
         +pr(t('p_validity'),N.days+t('p_days'))
         +pr(t('p_limit'),'1 / account / IP')
         +pr(t('p_optin'),t('v_required_short'))
         +'<div class="ov-sep"></div>'
         +pe(t('lbl_edit_wager'),'ov_ndb_wager',N.wager,'×')
         +pc(t('p_total_cost')+' (P50)','cost_ndb');
  } else if(N.type==='combined'){
    nBody=pr(t('p_type'),'Cash + Free Spins','hi')
         +pre(t('p_cash_amt')||'Cash','ov_ndb_amt',N.amt,N.ndCur,'',1,0,99999)
         +pre(t('p_fs_count'),'ov_ndb_fs',N.fs,'FS','',1,0,999)
         +pr(t('p_fs_maxw'),N.maxW_x+'× bonus')
         +pr(t('p_validity'),N.days+t('p_days'))
         +pr(t('p_trigger'),t('v_reg_verify'))
         +pr(t('p_limit'),t(N.limit))
         +pr(t('p_optin'),t('v_required_short'))
         +'<div class="ov-sep"></div>'
         +pe(t('lbl_edit_wager'),'ov_ndb_wager',N.wager,'×')
         +pc(t('p_total_cost')+' (P50)','cost_ndb');
  } else {
    nBody=pr(t('p_type'),N.type==='crypto'?'Crypto Bonus':'Free Spins')
         +pre(t('p_size'),'ov_ndb_amt',N.amt,N.ndCur,'',1,1,99999)
         +pr(t('p_fs_maxw'),N.maxW_x+'× bonus')
         +pr(t('p_validity'),N.days+t('p_days'))
         +pr(t('p_trigger'),t('v_reg_verify'))
         +pr(t('p_limit'),t(N.limit))
         +pr(t('p_optin'),t('v_required_short'))
         +'<div class="ov-sep"></div>'
         +pe(t('lbl_edit_wager'),'ov_ndb_wager',N.wager,'×')
         +pc(t('p_total_cost')+' (P50)','cost_ndb');
  }
  const ndbBadge = r==='sweep'?'Daily' : N.type==='combined'?(N.amt+' '+N.ndCur+' + '+N.fs+'FS') : 'NDB';
  h += sec('#0D9488','🆓',t('sec_ndb'), ndbBadge, nBody);

  // Reload
  let rlBody='';
  if(r==='sweep'){
    rlBody=`<table class="ptab"><tr><th>${t('pkg_package')}</th><th>${t('pkg_price')}</th><th>${t('pkg_sc')}</th></tr>`
      +RL.pkgs.map(p=>`<tr><td style="font-weight:700">${p.price}</td><td>${p.price}</td><td style="color:var(--green);font-weight:700">${p.sc} SC</td></tr>`).join('')
      +`</table>`;
  } else {
    rlBody=pr(t('p_type'),t('v_match_dep'))
          +pre(t('p_size'),'ov_rl_pct',RL.pct,'%','',1,1,500)
          +pre(t('p_max_bonus'),'ov_rl_maxB',RL.maxB,RL.cur)
          +pre(t('p_fs_count'),'ov_rl_fs',RL.fs||0,'FS','',1,0,999)
          +pr(t('p_min_dep'),fmtC(RL.minD,RL.cur))
          +pr(t('p_freq'),t(RL.freq))
          +pr(t('p_day'),t(RL.day))
          +pr(t('p_limit'),t(RL.limit))
          +pr(t('p_promo'),RL.code)
          +pr(t('p_optin'),t('v_required_short'))
          +'<div class="ov-sep"></div>'
          +pe(t('lbl_edit_wager'),'ov_rl_wager',WG.wR,'×')
          +pc(t('p_total_cost')+' (P50)','cost_rl');
  }
  const rlBadge = r==='sweep'?'Packages' : (RL.pct+'%'+(RL.fs?' + '+RL.fs+'FS':''));
  h += sec('#2563EB','🔁',t('sec_reload'), rlBadge, rlBody);
  h += `</div>`;

  // ── Row 1b: 2nd + 3rd Deposit Bonuses
  h += `<div class="grid2">`;

  // 2nd deposit
  let d2Body='';
  if(r==='sweep'){
    d2Body=pr(t('p_type'),t('v_sc_purchase_bonus'),'hi')
          +pr(t('p_size'),'+'+D2.pct+'% SC','hi')
          +pr(t('p_dep_trigger'),t(D2.trigger))
          +pr(t('p_optin'),t('v_required_short'))
          +pr(t('p_wager_welcome'),t('v_no_wager'),'gn')
          +`<div style="font-size:10.5px;color:var(--muted);padding-top:6px">${D2.note}</div>`;
  } else {
    d2Body=pr(t('p_type'),t('v_match_dep'))
          +pre(t('p_size'),'ov_d2_pct',D2.pct,'%','',1,1,500)
          +pre(t('p_max_bonus'),'ov_d2_maxB',D2.maxB,D2.cur)
          +pr(t('p_min_dep'),fmtC(D2.minD,D2.cur))
          +pre(t('p_fs_count'),'ov_d2_fs',D2.fs||0,'FS','',1,0,999)
          +pr(t('p_validity'),D2.days+t('p_days'))
          +pr(t('p_dep_trigger'),t('sec_dep2'))
          +pr(t('p_promo'),D2.code)
          +pr(t('p_optin'),t('v_required_short'))
          +'<div class="ov-sep"></div>'
          +pe(t('lbl_edit_wager'),'ov_d2_wager',D2.wager,'×')
          +pc(t('p_total_cost')+' (P50)','cost_d2');
  }
  const d2Badge = r==='sweep'?'+'+D2.pct+'% SC' : (D2.pct+'%'+(D2.fs?' + '+D2.fs+'FS':''));
  h += sec('#7C3AED','🥈',t('sec_dep2'), d2Badge, d2Body);

  // 3rd deposit
  let d3Body='';
  if(r==='sweep'){
    d3Body=pr(t('p_type'),t('v_sc_purchase_bonus'),'hi')
          +pr(t('p_size'),'+'+D3.pct+'% SC','hi')
          +pr(t('p_dep_trigger'),t(D3.trigger))
          +pr(t('p_optin'),t('v_required_short'))
          +pr(t('p_wager_welcome'),t('v_no_wager'),'gn')
          +`<div style="font-size:10.5px;color:var(--muted);padding-top:6px">${D3.note}</div>`;
  } else {
    d3Body=pr(t('p_type'),t('v_match_dep'))
          +pre(t('p_size'),'ov_d3_pct',D3.pct,'%','',1,1,500)
          +pre(t('p_max_bonus'),'ov_d3_maxB',D3.maxB,D3.cur)
          +pr(t('p_min_dep'),fmtC(D3.minD,D3.cur))
          +pre(t('p_fs_count'),'ov_d3_fs',D3.fs||0,'FS','',1,0,999)
          +pr(t('p_validity'),D3.days+t('p_days'))
          +pr(t('p_dep_trigger'),t(D3.trigger))
          +pr(t('p_promo'),D3.code)
          +pr(t('p_optin'),t('v_required_short'))
          +'<div class="ov-sep"></div>'
          +pe(t('lbl_edit_wager'),'ov_d3_wager',D3.wager,'×')
          +pc(t('p_total_cost')+' (P50)','cost_d3');
  }
  const d3Badge = r==='sweep'?'+'+D3.pct+'% SC' : (D3.pct+'%'+(D3.fs?' + '+D3.fs+'FS':''));
  h += sec('#0D9488','🥉',t('sec_dep3'), d3Badge, d3Body);

  h += `</div>`;

  // ── Row 2: Free Spins + Wagering
  h += `<div class="grid2">`;

  if(FS){
    const fsBody=pre(t('p_fs_count'),'ov_fs_count',FS.count,'FS','',1,1,999)
                +pr(t('p_spin_val'),FS.val+' '+FS.cur)
                +pr(t('p_fs_games'),FS.games)
                +pr(t('p_fs_wager'),FS.wager+'×','gd')
                +pr(t('p_fs_maxw'),FS.maxW)
                +pr(t('p_validity'),FS.days+t('p_days'))
                +pr(t('p_fs_delivery'),t('v_immediate'))
                +'<div class="ov-sep"></div>'
                +pe(t('lbl_edit_wager'),'ov_fs_wager',FS.wager,'×')
                +pc(t('p_total_cost')+' (P50)','cost_fs');
    h += sec('#F59E0B','🎰',t('sec_fs'),FS.count+' FS', fsBody);
  } else {
    const swBody=pr('Mechanics',t('v_sweep_mech'))
                +pr('SC',t('v_sc_convert'))
                +pr('GC',t('v_gc_no_redeem'))
                +pr(t('p_wager_welcome'),t('v_no_wager'),'gn')
                +pr('Min SC redeem',t('v_min_redeem_sc'))
                +pr('Max SC redeem',t('v_max_redeem_sc'));
    h += sec('#F59E0B','🪙',t('sec_sc_gc'),'Free-play', swBody);
  }

  // Wagering
  let wgBody='';
  if(r==='sweep'){
    wgBody=`<div style="padding:16px;text-align:center;font-size:14px;font-weight:700;color:var(--green)">${t('v_sweep_no_wager')}<br><span style="font-size:11px;font-weight:400;color:var(--muted)">${t('v_sweep_freeplay')}</span></div>`;
  } else {
    wgBody=prt(t('p_wager_welcome'),WG.wW+'× bonus','hi',t('rtip_wager'),'wg_display_wW')
          +pr(t('p_wager_ndb'),WG.wN+'× bonus')
          +pr(t('p_wager_reload'),WG.wR+'× bonus')
          +pr(t('p_wager_fs'),WG.wF+'× winnings')
          +prt(t('p_wager_basis'),t(WG.basis),'',t('rtip_wager_basis'))
          +pr(t('p_max_bet'),t(WG.mb), WG.mb==='v_no_limit'?'gn':'rd')
          +pr(t('p_eligible'),WG.games=== 'v_slots_only' ? t(WG.games) + ' (' + WG.gameRtp + '%)' : t(WG.games))
          +pr(t('p_wager_days'),WG.days+t('p_days'))
          +pr(t('p_wager_lock'),t('v_hard_lock'));
  }
  h += sec('#EF4444','⚖️',t('sec_wager'), r==='sweep'?t('v_no_wager'):WG.wW+'× / '+WG.wN+'×', wgBody);
  h += `</div>`;

  // ── Row 3: Cashback + Game Contributions
  h += `<div class="grid2">`;

  let cbBody='';
  if(CB.model==='tier'){
    cbBody=pr(t('p_cb_model'),t('v_tier'),'hi')
          +pr(t('p_cb_period'),CB.period)
          +pr(t('p_cb_basis'),CB.basis)
          +pr(t('p_cb_max'),CB.maxAmt)
          +pr(t('p_cb_wagering'),t('v_no_wager'),'gn')
          +pr(t('p_cb_payment'),t('v_auto_start'));
    cbBody+=`<div style="margin-top:8px"><table class="tt"><tr><th>${t('ct_level')}</th><th>${t('ct_losses')}</th><th>${t('ct_pct')}</th></tr>`;
    CB.tiers.forEach(tier=>{ cbBody+=`<tr><td><span class="tbadge" style="background:${tier.color}20;color:${tier.color}">${tier.name}</span></td><td style="font-size:11px">${tier.from} – ${tier.to}</td><td style="font-weight:700;color:${tier.color}">${tier.pct}</td></tr>`; });
    cbBody+=`</table></div>`;
  } else {
    cbBody=pr(t('p_cb_model'),t('v_flat')+' '+CB.pct+'%','hi')
          +pr(t('p_cb_pct'),CB.pct+'%','gd')
          +pr(t('p_cb_period'),CB.period)
          +pr(t('p_cb_min_loss'),CB.minLoss)
          +pr(t('p_cb_max'),CB.maxAmt)
          +pr(t('p_cb_basis'),CB.basis||t('v_net_losses'))
          +pr(t('p_cb_wagering'),t('v_no_wager'),'gn')
          +pr(t('p_cb_currency'),CB.cur)
          +pr(t('p_cb_payment'),t('v_auto_start'));
  }
  h += sec('#059669','💰',t('sec_cashback'), CB.model==='tier'?'Tier 5–20%':CB.pct+'%', cbBody);

  let ctBody=`<table class="ctab"><tr><th>${t('p_ct_game')}</th><th>${t('p_ct_contrib')}</th></tr>`;
  CT.forEach(g=>{
    const clr = g.pct===100?'var(--green)':g.pct===0?'var(--red)':'var(--gold)';
    ctBody+=`<tr><td>${g.game}</td><td><strong style="color:${clr}">${g.pct}%</strong><div class="pct-bar"><div class="pct-fill" style="width:${g.pct}%;background:${clr}"></div></div></td></tr>`;
  });
  ctBody+=`</table>`;
  h += sec('#94A3B8','📋',t('sec_contrib'),'Contrib', ctBody);
  h += `</div>`;

  // ── Unit Economics (Bonus Cost Analysis + Portfolio)
  const fmtRatio = v => (v*100).toFixed(1)+'%';
  // fmtBonusCur: форматирует суммы в валюте бонуса (cur) — MNT, RUB, EUR, USDT, USD, SC
  const fmtBonusCur = v => r==='sweep' ? v+' SC' : fmtC(v, cur);

  // Scenario card helper (все суммы в валюте депозита)
  function scenCard(label, sc, col, cid=''){
    return `<div class="ei" style="border:1px solid ${col}30;border-radius:8px;padding:8px 10px;background:${col}08">
      <div class="el" style="color:${col};font-weight:700">
        <span class="tip-wrap" style="max-width:none">${label}<span class="tip-btn" onclick="toggleTip(this)" style="background:${col}22;color:${col}">?</span><div class="tip-box" style="width:250px">${t('rtip_scenario')}</div></span>
      </div>
      <div class="ev" style="color:${col};font-size:18px"${cid?` id="${cid}"`:''}>${fmtBonusCur(sc.cost)}</div>
      <div class="es">${t('p_conv')}: ${(sc.conv*100).toFixed(0)}% · ${t('p_payout_per')}: ${fmtBonusCur(sc.payout)}</div>
    </div>`;
  }

  let econBody=``;

  // ── Bonus model header (суммы в валюте депозита)
  econBody += `<div style="padding:10px 14px 6px;border-bottom:1px solid var(--border)">
    ${pr(t('p_bonus_size'), fmtBonusCur(E.bonusSize), 'hi')}
    ${prt(t('p_mixed_rtp'), fmtRatio(E.mixedRTP), '', t('rtip_mixed_rtp'))}
    ${prt(t('p_mixed_wcr'), fmtRatio(E.mixedWCR), '', t('rtip_mixed_wcr'))}
    ${prt(t('p_breakeven'), E.breakeven_wager+'× (admin: '+E.wagerX+'×)', E.over_breakeven?'rd':'gn', t('rtip_breakeven_wager'))}
  </div>`;

  // Метка модели: Truncated Normal (единая модель) + авто-подбор вейджера
  const modelLabel = E.over_breakeven
    ? `<div id="econ_model_label" style="font-size:10px;padding:4px 14px 2px;color:#F59E0B;background:rgba(245,158,11,0.12)">⚠️ Wager ${E.wagerX}× > breakeven ${E.breakeven_wager}× — Truncated Normal (variance tail, decaying)</div>`
    : `<div id="econ_model_label" style="font-size:10px;padding:4px 14px 2px;color:#10b981;background:rgba(16,185,129,0.12)">✅ Wager ${E.wagerX}× ≤ breakeven ${E.breakeven_wager}× — Truncated Normal (linear mean + variance)</div>`;
  const autoWagerLabel = ``; // removed: wager now uses market-standard regional defaults

  // ── Model label (breakeven indicator, no scenario cards here — moved to CG section below)
  econBody += modelLabel;

  // ── Verdict + cost ratio
  econBody += `<div style="border-top:1px solid var(--border);padding:10px 14px">
    <div style="font-size:12px;padding:7px 10px;border-radius:6px;margin-bottom:6px;font-weight:600;color:${{gn:'#10b981',gd:'#F59E0B',yw:'#F59E0B',rd:'#EF4444'}[E.verdictCls]||'#8892a4'};background:${{gn:'rgba(16,185,129,0.15)',gd:'rgba(245,158,11,0.15)',yw:'rgba(245,158,11,0.2)',rd:'rgba(239,68,68,0.15)'}[E.verdictCls]||'#1e2740'}">${t(E.verdictKey)}</div>
    ${prt(t('p_cost_ratio'), fmtRatio(E.costRatio)+' ('+E.costRatio.toFixed(3)+')', E.verdictCls, t('rtip_cost_ratio'), 'econ_cost_ratio')}
    ${prt(t('p_max_risk'), fmtBonusCur(E.maxRisk), 'rd', t('rtip_max_risk'), 'econ_max_risk')}
    ${pr(t('p_stress_test'), fmtBonusCur(E.stressTest), E.sP50.cost<E.stressTest?'yw':'gn', 'econ_stress_test')}
    ${pr(t('p_grand_total'), '—', 'hi', 'cost_total_all')}
  </div>`;

  // ── Portfolio benchmarks (USD-оценки — региональные бенчмарки в USD)
  econBody += `<div style="border-top:1px solid var(--border);padding:10px 14px">
    <div style="font-size:10px;color:var(--muted);margin-bottom:6px;font-style:italic">* ${t('p_arpu_sub')} — regional USD benchmarks</div>
    <div class="eg" style="margin-bottom:6px">
      <div class="ei"><div class="el"><span class="tip-wrap" style="max-width:none">${t('p_arpu')}<span class="tip-btn" onclick="toggleTip(this)">?</span><div class="tip-box" style="width:230px">${t('rtip_arpu')}</div></span></div><div class="ev" style="color:var(--purple)">${fmtUSD(E.arpu)}</div><div class="es">~USD / mo</div></div>
      <div class="ei"><div class="el"><span class="tip-wrap" style="max-width:none">${t('p_ltv3')}<span class="tip-btn" onclick="toggleTip(this)">?</span><div class="tip-box" style="width:250px">${t('rtip_ltv3')}</div></span></div><div class="ev" style="color:var(--teal)">${fmtUSD(E.ltv3)}</div><div class="es">~USD, 3 mo</div></div>
      <div class="ei"><div class="el"><span class="tip-wrap" style="max-width:none">${t('p_cac')}<span class="tip-btn" onclick="toggleTip(this)">?</span><div class="tip-box" style="width:230px">${t('rtip_cac')}</div></span></div><div class="ev" style="color:var(--gold)">${fmtUSD(E.cac)}</div><div class="es">~USD / acq.</div></div>
    </div>
    ${pr(t('p_monthly_budget')+' (×'+E.pl.toLocaleString('ru')+')', fmtUSD(E.mBudget)+' ~USD / mo','hi')}
    ${pr(t('p_cohort_ltv'), fmtUSD(E.totLTV)+' ~USD','gn')}
    ${prt(t('p_roi'), E.roi3+'%', E.roi3>50?'gn':E.roi3>0?'gd':'rd', t('rtip_roi_reg'))}
    ${pr(t('p_breakeven'),E.be+t('p_mo_on_player'), E.be<=2?'gn':'gd')}
  </div>
  <div style="border-top:1px solid var(--border);padding:10px 14px;background:rgba(79,110,247,0.04)">
    <div style="font-size:10px;color:var(--muted);margin-bottom:6px;font-style:italic">⚡ ${L==='ru'?'Кампанийный ROI — обновляется при изменении параметров':'Campaign ROI — updates with parameter changes'}</div>
    ${prt(t('p_roi_campaign'), E.roi3+'%', E.roi3>50?'gn':E.roi3>0?'gd':'rd', t('rtip_roi_camp'), 'econ_campaign_roi')}
  </div>
  <div style="border-top:1px solid var(--border);padding:10px 14px;background:rgba(16,185,129,0.03)">
    ${_buildIncrRevBody(c, _calcRetentionV2(c))}
  </div>`;

  h += `<div class="sec fw">${shdr('#1E1B4B','📊',t('sec_econ'),E.pl.toLocaleString('ru')+' '+t('players_mo'))}<div>${econBody}</div></div>`;

  // ── Campaign Generator-style P10/P50/P90 cards with tooltip metrics
  if (r !== 'sweep') {
    h += renderCGEconCards(E, cur, r);
  }

  // ── Mechanic Explanation (static, no AI)
  h += buildMechanicExpSection(c);

  // ── AI Compliance Audit
  h += `<div class="sec fw" id="cfg-audit-sec">
    ${shdr('#0F4C81','🔍',t('sec_cfg_audit'),'')}
    <div class="pl" style="padding:10px 14px">
      <button class="cfg-btn gen" id="cfg-audit-btn" onclick="runConfiguratorAudit(this)" style="margin-bottom:10px">${t('btn_run_cfg_audit')}</button>
      <div id="cfg-audit-result" style="font-size:12px;color:var(--muted)">${t('cfg_audit_not_run')}</div>
    </div>
  </div>`;

  // ── Admin Config Summary (collapsed by default, generated on demand)
  h += `<div class="sec fw" id="admin-sec">
    <div class="sh clickable" onclick="toggleAdminSec()">
      <div class="si" style="background:#1E1B4B18">🗂️</div>
      <div class="st">${t('sec_admin')}</div>
      <span class="sb" style="background:#1E1B4B18;color:#1E1B4B;margin-left:auto">Full Config</span>
      <span class="sh-toggle" id="admin-chevron" style="margin-left:8px">▼</span>
    </div>
    <div class="sec-body collapsed" id="admin-body">
      <div class="admin-ph" id="admin-ph">
        <div class="admin-ph-txt">${t('admin_not_generated')}</div>
        <button class="cfg-btn gen" onclick="generateAdminCfg(event)">${t('gen_admin_btn')}</button>
      </div>
      <pre class="cfg-pre" id="cfg-pre" style="display:none"></pre>
      <div class="cfg-actions" id="admin-actions" style="display:none">
        <button class="cfg-btn copy" id="copy-btn" onclick="copyCfg()">${t('copy_btn')}</button>
        <button class="cfg-btn save" onclick="saveAdminCfg()">${t('save_admin_btn')}</button>
        <span style="font-size:11px;color:var(--muted);align-self:center">${t('copy_hint')}</span>
      </div>
    </div>
  </div>`;

  return h;
}

// ═════════════════════════════════════════════════════════════════════════════
// CAMPAIGN GENERATOR-STYLE ECON CARDS (P10/P50/P90 with tooltip metrics)
// ═════════════════════════════════════════════════════════════════════════════
function renderCGEconCards(E, cur, r) {
  const fmtBCur = v => fmtC(v, cur);
  const fmtPct  = v => (v * 100).toFixed(1) + '%';
  const pl   = E.pl;
  const base = E.costRatio > 0 ? E.sP50.cost / E.costRatio : (pl > 0 ? pl * 100 : 1);

  // costId: retain econ_cost_p10/p50/p90 IDs so recalcEcon() can update them
  // suf: p10 / p50 / p90 — used for sub-metric IDs (econ_cpb_p10, econ_dl_p10, etc.)
  function cgCard(label, sP, col, costId, suf) {
    const cpb   = (pl > 0 && sP.conv > 0) ? Math.round(sP.cost / (pl * sP.conv)) : 0;
    const ratio = base > 0 ? sP.cost / base : 0;
    const rCol  = ratio > 0.35 ? 'rd' : ratio > 0.20 ? 'yw' : 'gn';
    return `<div class="ei" style="border:1px solid ${col}40;border-radius:10px;padding:10px 12px;background:${col}0a;flex:1;min-width:0">
      <div style="font-size:10px;font-weight:700;color:${col};text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">${label}</div>
      <div style="font-size:19px;font-weight:800;color:${col};margin-bottom:8px;line-height:1.1" id="${costId}">${fmtBCur(sP.cost)}</div>
      ${prt(t('cg_cost_per_bonus'), fmtBCur(cpb), '', t('rtip_cg_cpb'), `econ_cpb_${suf}`)}
      ${prt(t('cg_dep_load'), fmtPct(ratio), rCol, t('rtip_cg_dl'), `econ_dl_${suf}`)}
      ${prt(t('cg_wager_compl'), (sP.conv * 100).toFixed(0) + '%', '', t('rtip_cg_wc'))}
    </div>`;
  }

  const cards = `<div class="eg" style="padding:10px 14px 8px;gap:8px;align-items:stretch">
    ${cgCard(`<span class="tip" data-tip="${t('rtip_p10')}">${t('cg_best')}</span>`,     E.sP10, '#64748B', 'econ_cost_p10', 'p10')}
    ${cgCard(`<span class="tip" data-tip="${t('rtip_p50')}">${t('cg_expected')}</span>`, E.sP50, '#2563EB', 'econ_cost_p50', 'p50')}
    ${cgCard(`<span class="tip" data-tip="${t('rtip_p90')}">${t('cg_worst')}</span>`,    E.sP90, '#DC2626', 'econ_cost_p90', 'p90')}
  </div>`;

  const mn = E.sP10.cost, mx = E.sP90.cost, md = E.sP50.cost;
  const rng = mx > mn ? mx - mn : 1;
  const pct = (((md - mn) / rng) * 100).toFixed(1);
  const rangeBar = `<div style="padding:0 14px 10px">
    <div style="height:4px;border-radius:2px;background:linear-gradient(90deg,#64748B 0%,#2563EB ${pct}%,#DC2626 100%);position:relative">
      <div style="position:absolute;top:-3px;left:${pct}%;transform:translateX(-50%);width:10px;height:10px;border-radius:50%;background:#2563EB;border:2px solid var(--bg)"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--muted);margin-top:3px">
      <span id="econ_range_mn">${fmtBCur(mn)}</span><span id="econ_range_md" style="color:#2563EB">${fmtBCur(md)}</span><span id="econ_range_mx">${fmtBCur(mx)}</span>
    </div>
  </div>`;

  return `<div class="sec fw">${shdr('#1565C0','📈',t('sec_cg_econ'),'P10 / P50 / P90')}<div>${cards}${rangeBar}</div></div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// MECHANIC EXPLANATION SECTION (static, derived from config)
// ═════════════════════════════════════════════════════════════════════════════
function buildMechanicExpSection(cfg) {
  const W  = cfg.welcome || {};
  const N  = cfg.ndb     || {};
  const RL = cfg.reload  || {};
  const E  = cfg.econ    || {};
  const cur = cfg.cur, r = cfg.r, lic = (cfg.lic || 'none').toLowerCase();

  const fmtB   = v => (v == null || v === Infinity || v > 9999999) ? '∞' : fmtC(v, cur);
  const wagerX = E.wagerX || 0;
  const beNote = E.over_breakeven ? t('mech_exp_above_be') : t('mech_exp_below_be');

  let body = '';

  if (r === 'sweep') {
    body += `<div style="padding:10px 14px">
      <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:6px">🎰 Sweepcoins Welcome</div>
      <div style="font-size:12px;color:var(--muted);line-height:1.6">
        <strong style="color:var(--text)">${W.sc || 0} SC + ${W.gc || 0} GC</strong> on registration.
        No wagering requirement — free-play model under US sweepstakes law.
        SC redeemable for cash prizes (min 100 SC · max $5,000/mo). GC are non-redeemable game coins.
        Validity: <strong style="color:var(--text)">${W.validity || 30} days</strong>.
      </div>
    </div>`;
  } else {
    // Welcome bonus
    const wFs = W.fs || 0;
    const turnover = wagerX > 0 && E.mixedWCR > 0 ? Math.round((W.maxB || 0) * wagerX / E.mixedWCR) : 0;
    body += `<div style="padding:10px 14px;border-bottom:1px solid var(--border)">
      <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:5px">🎁 ${t('mech_exp_welcome')}</div>
      <div style="font-size:12px;color:var(--muted);line-height:1.65">
        <strong style="color:var(--text)">${W.pct || 100}%</strong> match up to
        <strong style="color:var(--text)">${fmtB(W.maxB)}</strong>,
        min deposit <strong style="color:var(--text)">${fmtB(W.minD)}</strong>${wFs > 0 ? ` + <strong style="color:var(--text)">${wFs} FS</strong>` : ''}.
        Wagering: <strong style="color:var(--text)">${wagerX}×</strong>
        (breakeven: <strong style="color:var(--text)">${E.breakeven_wager || '—'}×</strong>).
        Validity: <strong style="color:var(--text)">${W.days || 30} days</strong>.
        ${turnover > 0 ? `<br>Effective turnover on max bonus: <strong style="color:var(--text)">${fmtC(turnover, cur)}</strong>.` : ''}
        <br><span style="color:${E.over_breakeven ? '#F59E0B' : '#10b981'}">${beNote}</span>
      </div>
    </div>`;

    // NDB (if configured with a non-zero amount or FS)
    const ndbAmt = N.amt || 0, ndbFs = N.fs || 0;
    if (ndbAmt > 0 || ndbFs > 0) {
      const ukgcNote = (lic === 'ukgc' && ndbAmt > 0) ? ' <span style="color:#F59E0B">⚠️ UKGC: cash NDB prohibited — FS only.</span>' : '';
      body += `<div style="padding:8px 14px;border-bottom:1px solid var(--border)">
        <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">🎁 ${t('mech_exp_ndb')}</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.6">
          ${ndbAmt > 0 ? `<strong style="color:var(--text)">${fmtB(ndbAmt)}</strong> no-deposit bonus` : ''}
          ${ndbFs  > 0 ? `${ndbAmt > 0 ? ' + ' : ''}<strong style="color:var(--text)">${ndbFs} free spins</strong>` : ''}.
          Wagering: <strong style="color:var(--text)">${N.wager || 50}×</strong>.
          Validity: <strong style="color:var(--text)">${N.days || 7} days</strong>.${ukgcNote}
        </div>
      </div>`;
    }

    // Reload bonus (only if configured with a real cap)
    const rlMaxB = (RL.maxB == null || RL.maxB === Infinity || RL.maxB > 9999999) ? null : RL.maxB;
    if ((RL.pct || 0) > 0 && rlMaxB !== null) {
      body += `<div style="padding:8px 14px">
        <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">🔄 ${t('mech_exp_reload')}</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.6">
          <strong style="color:var(--text)">${RL.pct}%</strong> reload up to
          <strong style="color:var(--text)">${fmtB(rlMaxB)}</strong>.
          Validity: <strong style="color:var(--text)">${RL.validity || 7} days</strong>.
        </div>
      </div>`;
    } else if ((RL.pct || 0) > 0 && RL.maxBMulti) {
      // CIS: maxBMax = Infinity, cap enforced via maxBMulti (avgdep multiplier)
      body += `<div style="padding:8px 14px">
        <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">🔄 ${t('mech_exp_reload')}</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.6">
          <strong style="color:var(--text)">${RL.pct}%</strong> reload,
          cap: <strong style="color:var(--text)">${RL.maxBMulti}× avg. deposit</strong>.
          Validity: <strong style="color:var(--text)">${RL.validity || 7} days</strong>.
        </div>
      </div>`;
    }
  }

  return `<div class="sec fw">${shdr('#065F46','💡',t('sec_mech_exp'),'')}<div>${body}</div></div>`;
}

function sec(c,ico,title,badge,body){
  return `<div class="sec">${shdr(c,ico,title,badge)}<div class="pl">${body}</div></div>`;
}
function shdr(c,ico,title,badge){
  return `<div class="sh"><div class="si" style="background:${c}18">${ico}</div><div class="st">${title}</div>${badge?`<span class="sb" style="background:${c}18;color:${c}">${badge}</span>`:''}</div>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN TEXT EXPORT
// ═════════════════════════════════════════════════════════════════════════════
function buildAdminText(c){
  const {welcome:W,dep2:D2,dep3:D3,ndb:N,reload:RL,wager:WG,cashback:CB,contrib:CT,fsSpec:FS,econ:E,r,cur,dep,pl,lic,rtp} = c;
  const ts = new Date().toLocaleDateString('ru');
  const A = [];
  A.push('╔══════════════════════════════════════════════════════════════╗');
  A.push('║        RETOMAT — ADMIN PANEL CONFIGURATION             ║');
  A.push('╚══════════════════════════════════════════════════════════════╝');
  A.push(`Generated : ${ts}   |   Language: ${L.toUpperCase()}`);
  A.push(`Region    : ${r.toUpperCase()}   |   License: ${(lic||'none').toUpperCase()}`);
  A.push(`Currency  : ${cur}   |   Avg Deposit: ${dep} ${c.depcur}   |   Players/mo: ${pl.toLocaleString()}`);
  A.push('');

  if(r==='sweep'){
    A.push('━━━ WELCOME BONUS (SWEEPCOINS) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    A.push(`welcome_type          : sweepcoins_registration`);
    A.push(`welcome_sc_amount     : ${W.sc} SC`);
    A.push(`welcome_gc_amount     : ${W.gc} GC`);
    A.push(`welcome_trigger       : registration`);
    A.push(`welcome_validity_days : ${W.validity}`);
    A.push(`welcome_wagering      : none`);
    A.push('');
    A.push('━━━ DAILY FREE BONUS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    A.push(`daily_bonus_sc        : ${N.sc} SC`);
    A.push(`daily_bonus_gc        : ${N.gc} GC`);
    A.push(`daily_bonus_trigger   : email_or_sms`);
    A.push(`daily_bonus_limit     : 1_per_day_per_account`);
    A.push('');
    A.push('━━━ PURCHASE PACKAGES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    RL.pkgs.forEach(p=>A.push(`package               : ${p.price.padEnd(8)} → ${p.sc} SC`));
    A.push('');
    A.push('━━━ SC / GC MECHANICS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    A.push(`sc_model              : sweepstakes_promotion`);
    A.push(`sc_wagering           : none`);
    A.push(`sc_min_redeem         : 100 SC`);
    A.push(`sc_max_redeem_monthly : $5000`);
    A.push(`gc_redeemable         : false`);
    A.push('');
  } else {
    A.push('━━━ WELCOME BONUS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    A.push(`bonus_type            : match_deposit`);
    A.push(`bonus_percent         : ${W.pct}`);
    A.push(`bonus_max_amount      : ${W.maxB} ${W.cur}`);
    A.push(`bonus_min_deposit     : ${W.minD} ${W.cur}`);
    A.push(`bonus_free_spins      : ${W.fs}`);
    A.push(`bonus_validity_days   : ${W.days}`);
    A.push(`bonus_trigger         : first_deposit`);
    A.push(`bonus_promo_code      : ${W.code}`);
    A.push(`bonus_opt_in          : required_before_deposit`);
    A.push(`bonus_player_group    : new_players_only`);
    A.push('');
    if(r==='sweep'){
      A.push('━━━ 2ND PURCHASE BONUS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      A.push(`dep2_type             : sc_purchase_bonus`);
      A.push(`dep2_bonus_sc_pct     : +${D2.pct}% on purchase`);
      A.push(`dep2_trigger          : 2nd_purchase`);
      A.push(`dep2_wagering         : none`);
      A.push(`dep2_opt_in           : required`);
      A.push('');
      A.push('━━━ 3RD PURCHASE BONUS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      A.push(`dep3_type             : sc_purchase_bonus`);
      A.push(`dep3_bonus_sc_pct     : +${D3.pct}% on purchase`);
      A.push(`dep3_trigger          : 3rd_purchase`);
      A.push(`dep3_wagering         : none`);
      A.push(`dep3_opt_in           : required`);
      A.push('');
    } else {
      A.push('━━━ 2ND DEPOSIT BONUS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      A.push(`dep2_type             : match_deposit`);
      A.push(`dep2_percent          : ${D2.pct}`);
      A.push(`dep2_max_amount       : ${D2.maxB} ${D2.cur}`);
      A.push(`dep2_min_deposit      : ${D2.minD} ${D2.cur}`);
      A.push(`dep2_free_spins       : ${D2.fs}`);
      A.push(`dep2_validity_days    : ${D2.days}`);
      A.push(`dep2_trigger          : second_deposit`);
      A.push(`dep2_wagering         : ${D2.wager}x_bonus`);
      A.push(`dep2_promo_code       : ${D2.code}`);
      A.push(`dep2_opt_in           : required`);
      A.push(`dep2_player_group     : registered_players`);
      A.push('');
      A.push('━━━ 3RD DEPOSIT BONUS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      A.push(`dep3_type             : match_deposit`);
      A.push(`dep3_percent          : ${D3.pct}`);
      A.push(`dep3_max_amount       : ${D3.maxB} ${D3.cur}`);
      A.push(`dep3_min_deposit      : ${D3.minD} ${D3.cur}`);
      A.push(`dep3_free_spins       : ${D3.fs}`);
      A.push(`dep3_validity_days    : ${D3.days}`);
      A.push(`dep3_trigger          : third_deposit`);
      A.push(`dep3_wagering         : ${D3.wager}x_bonus`);
      A.push(`dep3_promo_code       : ${D3.code}`);
      A.push(`dep3_opt_in           : required`);
      A.push(`dep3_player_group     : registered_players`);
      A.push('');
    }
    A.push('━━━ NO DEPOSIT BONUS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if(N.type==='fs_restricted'){
      A.push(`ndb_type              : free_spins_only  [UKGC restricted]`);
      A.push(`ndb_fs_count          : ${N.fs}`);
      A.push(`ndb_wagering          : ${N.wager}x_winnings`);
      A.push(`ndb_max_withdrawal    : ${N.maxW_x}x_winnings`);
    } else {
      A.push(`ndb_type              : ${N.type==='crypto'?'crypto_bonus':'free_spins'}`);
      A.push(`ndb_amount            : ${N.amt} ${N.ndCur}`);
      A.push(`ndb_wagering          : ${N.wager}x_bonus`);
      A.push(`ndb_max_withdrawal    : ${N.maxW_x}x_bonus`);
    }
    A.push(`ndb_validity_days     : ${N.days}`);
    A.push(`ndb_trigger           : registration`);
    A.push(`ndb_limit             : 1_per_account_ip`);
    A.push(`ndb_opt_in            : required`);
    A.push('');
    A.push('━━━ RELOAD BONUS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    A.push(`reload_type           : match_deposit`);
    A.push(`reload_percent        : ${RL.pct}`);
    A.push(`reload_max_amount     : ${RL.maxB} ${RL.cur}`);
    A.push(`reload_min_deposit    : ${RL.minD} ${RL.cur}`);
    A.push(`reload_frequency      : weekly`);
    A.push(`reload_day            : ${r==='mn'?'saturday':r==='latam'?'wednesday':r==='cis'?'friday':r==='eu'?'tuesday':'monday'}`);
    A.push(`reload_limit          : 1_per_period`);
    A.push(`reload_promo_code     : ${RL.code}`);
    A.push(`reload_opt_in         : required`);
    A.push(`reload_player_group   : existing_players`);
    A.push('');
    if(FS){
      A.push('━━━ FREE SPINS SPECIFICATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      A.push(`fs_count              : ${FS.count}`);
      A.push(`fs_value_per_spin     : ${FS.val} ${FS.cur}`);
      A.push(`fs_eligible_games     : slots_avg_rtp_${rtp}pct`);
      A.push(`fs_wagering           : ${FS.wager}x_winnings`);
      A.push(`fs_max_withdrawal     : 5x_spin_value`);
      A.push(`fs_validity_days      : ${FS.days}`);
      A.push(`fs_delivery           : immediate_after_welcome_activation`);
      A.push('');
    }
    A.push('━━━ WAGERING CONDITIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    A.push(`wager_welcome         : ${WG.wW}x_bonus`);
    A.push(`wager_ndb             : ${WG.wN}x_bonus`);
    A.push(`wager_reload          : ${WG.wR}x_bonus`);
    A.push(`wager_free_spins      : ${WG.wF}x_winnings`);
    A.push(`wager_basis           : ${r==='crypto'?'deposit_plus_bonus':'bonus_only'}`);
    A.push(`wager_max_bet         : ${r==='mn'?'no_restriction':r==='eu'&&lic==='ukgc'?'GBP_2_per_spin':r==='eu'?'EUR_5_per_spin':'no_restriction'}`);
    A.push(`wager_eligible_games  : ${r==='crypto'?'all_games':'slots_avg_rtp_'+rtp+'pct'}`);
    A.push(`wager_validity_days   : ${WG.days}`);
    A.push(`wager_lock_type       : hard_lock`);
    A.push('');
    A.push('━━━ GAME CONTRIBUTION TABLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    CT.forEach(g=>A.push(`contrib_${g.game.toLowerCase().replace(/[^a-z0-9]/gi,'_').slice(0,22).padEnd(22)}: ${g.pct}%`));
    A.push('');
    A.push('━━━ CASHBACK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    A.push(`cashback_model        : ${CB.model}`);
    if(CB.model==='tier'){
      A.push(`cashback_period       : monthly`);
      CB.tiers.forEach(tier=>A.push(`cashback_${tier.name.toLowerCase().padEnd(14)}: ${tier.pct} on net_losses ${tier.from}–${tier.to}`));
    } else {
      A.push(`cashback_percent      : ${CB.pct}`);
      A.push(`cashback_period       : weekly`);
      A.push(`cashback_min_losses   : ${CB.minLoss}`);
      A.push(`cashback_max_amount   : ${CB.maxAmt}`);
    }
    A.push(`cashback_wagering     : none`);
    A.push(`cashback_currency     : ${CB.cur||cur}`);
    A.push(`cashback_payment      : automatic_start_of_period`);
    A.push('');
    if(r==='mn'){
      A.push('━━━ MONGOLIA — REGULATORY NOTE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      A.push(`mn_gambling_status    : prohibited_since_2013`);
      A.push(`mn_operation_model    : offshore_curacao_license`);
      A.push(`mn_player_access      : via_vpn_or_mirror_sites`);
      A.push(`mn_payment_methods    : crypto_ewallet_local_cards`);
      A.push('');
    }
    if(r==='latam'){
      A.push('━━━ LATAM — MARKET NOTE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      A.push(`latam_license         : curacao_offshore`);
      A.push(`latam_key_markets     : brazil_mexico_colombia_argentina_chile`);
      A.push(`latam_payment_methods : PIX_SPEI_PSE_Efecty_AstroPay`);
      A.push(`latam_currency_note   : USD_primary_local_currencies_optional`);
      A.push('');
    }
  }

  // Helper: форматирует в валюте депозита (не хардкод $)
  const fmtE = v => r==='sweep' ? v+' SC' : fmtC(v, cur);

  A.push('━━━ BONUS COST ANALYSIS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A.push(`currency              : ${r==='sweep'?'SC':cur}`);
  A.push(`bonus_size_per_player : ${fmtE(E.bonusSize)}`);
  A.push(`mixed_rtp             : ${(E.mixedRTP*100).toFixed(2)}%`);
  A.push(`mixed_wcr             : ${(E.mixedWCR*100).toFixed(2)}%`);
  A.push('');
  A.push(`scenario_P10_cost     : ${fmtE(E.sP10.cost)} (conv=${(E.sP10.conv*100).toFixed(0)}%, payout/player=${fmtE(E.sP10.payout)})`);
  A.push(`scenario_P50_cost     : ${fmtE(E.sP50.cost)} (conv=${(E.sP50.conv*100).toFixed(0)}%, payout/player=${fmtE(E.sP50.payout)})`);
  A.push(`scenario_P90_cost     : ${fmtE(E.sP90.cost)} (conv=${(E.sP90.conv*100).toFixed(0)}%, payout/player=${fmtE(E.sP90.payout)})`);
  A.push('');
  A.push(`cost_to_deposits      : ${(E.costRatio*100).toFixed(1)}% [${E.costRatio.toFixed(3)}]`);
  A.push(`max_risk_ceiling      : ${fmtE(E.maxRisk)}`);
  A.push(`stress_test_p20       : ${fmtE(E.stressTest)} (+20% activations)`);
  A.push(`verdict               : ${E.verdictKey}`);
  A.push('');
  A.push('━━━ UNIT ECONOMICS BENCHMARKS (~USD estimates) ━━━━━━━━━━━━━━━');
  A.push(`arpu_usd_monthly      : ~$${E.arpu} / active player`);
  A.push(`bonus_cost_pct_ggr    : ${E.bpct}%`);
  A.push(`cac_bonus_usd         : ~$${E.cac} / acquired player`);
  A.push(`ltv_3mo_usd           : ~$${E.ltv3} / player`);
  A.push(`monthly_bonus_budget  : ~$${E.mBudget.toLocaleString()} (${E.pl.toLocaleString()} players × ~$${E.cac})`);
  A.push(`cohort_ltv_3mo        : ~$${E.totLTV.toLocaleString()}`);
  A.push(`roi_3mo               : ${E.roi3}%`);
  A.push(`breakeven             : ${E.be} month(s) per player`);

  return A.join('\n');
}

// ── ADMIN CONFIG SECTION ──────────────────────────────────────────────────
function toggleAdminSec(){
  const body    = document.getElementById('admin-body');
  const chevron = document.getElementById('admin-chevron');
  const collapsed = body.classList.toggle('collapsed');
  chevron.classList.toggle('open', !collapsed);
}

function generateAdminCfg(e){
  if(e) e.stopPropagation();
  const cfg = window._lastCfg;
  if(!cfg){ return; }
  const text = buildAdminText(cfg);
  // Populate pre, hide placeholder, show actions
  const pre     = document.getElementById('cfg-pre');
  const ph      = document.getElementById('admin-ph');
  const actions = document.getElementById('admin-actions');
  pre.textContent = text;
  pre.style.display    = 'block';
  ph.style.display     = 'none';
  actions.style.display = 'flex';
  // Make sure section is expanded
  const body    = document.getElementById('admin-body');
  const chevron = document.getElementById('admin-chevron');
  body.classList.remove('collapsed');
  chevron.classList.add('open');
}

function saveAdminCfg(){
  const text = document.getElementById('cfg-pre').textContent;
  if(!text.trim()) return;
  const cfg  = window._lastCfg;
  const region = cfg ? cfg.r : 'config';
  const date = new Date().toISOString().slice(0,10);
  const filename = `admin-config_${region}_${date}.txt`;
  const blob = new Blob([text], {type:'text/plain;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function copyCfg(){
  const text = document.getElementById('cfg-pre').textContent;
  navigator.clipboard.writeText(text).then(()=>{
    const b = document.getElementById('copy-btn');
    b.textContent = t('copied');
    setTimeout(()=>{ b.textContent = t('copy_btn'); }, 2000);
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// AI COMPLIANCE AUDIT (Configurator)
// ═════════════════════════════════════════════════════════════════════════════
async function runConfiguratorAudit(btn) {
  const cfg = window._lastCfg;
  if (!cfg) return;
  const resultEl = document.getElementById('cfg-audit-result');
  if (!resultEl) return;

  if (btn) { btn.disabled = true; btn.textContent = t('cfg_audit_running'); }
  resultEl.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:6px 0">${t('cfg_audit_running')}</div>`;

  // Map region → representative country code (audit prompt uses geo for context)
  // Use specific EU country if selected (e.g. dk for DGA, uk for UKGC), otherwise fall back to region default
  const geoMap = { eu:'de', cis:'ru', crypto:'us', sweep:'us', mn:'mn', latam:'mx' };
  const geo = (cfg._country && cfg._country.length === 2) ? cfg._country : (geoMap[cfg.r] || cfg.r);
  const lic = (cfg.lic || 'mga').toUpperCase();

  const payload = {
    scenario: { id: 'configurator', lbl: 'Manual Config' },
    mechanic: cfg.welcome || null,
    mechanicType: 'welcome',
    params: {
      geo,
      lic: lic.toLowerCase(),
      segment: 'mid',
      tone: 'professional',
      lang: L,
      bonusTypes: ['welcome'],
      agg: 'moderate',
      games: ['slots'],
      risk: 'mid'
    },
    uiLang: L
  };

  try {
    const res = await fetch('/api/campaign/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || errBody.error || `${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    renderConfiguratorAuditResult(resultEl, data);
  } catch (ex) {
    resultEl.innerHTML = `<div style="color:#EF4444;font-size:12px;padding:6px 0">⚠️ ${t('cfg_audit_error')} ${ex?.message || ex}</div>`;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('btn_run_cfg_audit'); }
  }
}

function renderConfiguratorAuditResult(el, data) {
  // API returns status: 'ok' | 'warn' (from AuditCheckSchema)
  const statusColor = { ok: '#10b981', warn: '#F59E0B' };
  const statusLabel = { ok: t('cfg_audit_pass'), warn: t('cfg_audit_warn') };

  let html = `<div>`;

  // ── Compliance checks
  if (data.checks && data.checks.length) {
    html += `<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px">`;
    data.checks.forEach(ch => {
      const col = statusColor[ch.status] || '#8892a4';
      const lbl = statusLabel[ch.status] || ch.status;
      html += `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 8px;border-radius:6px;background:${col}12;border:1px solid ${col}30">
        <span style="font-size:10px;font-weight:700;color:${col};white-space:nowrap;padding-top:1px">${lbl}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;color:var(--text)">${ch.label}</div>
          ${ch.note ? `<div style="font-size:11px;color:var(--muted);margin-top:1px">${ch.note}</div>` : ''}
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // ── Recommendations
  if (data.recommendations && data.recommendations.length) {
    html += `<div style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${t('cfg_audit_recs')}</div>`;
    data.recommendations.forEach(rec => {
      html += `<div style="padding:6px 8px;border-radius:6px;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.20);margin-bottom:4px">
        <div style="font-size:12px;color:var(--text)">💡 ${rec.text}</div>
        ${rec.impact ? `<div style="font-size:10px;color:var(--muted);margin-top:2px">${t('cfg_audit_impact')}: ${rec.impact}</div>` : ''}
      </div>`;
    });
  }

  html += `</div>`;
  el.innerHTML = html;
}

// ── TOOLTIPS ──────────────────────────────────────────────────────────────
function toggleTip(btn){
  const box = btn.nextElementSibling;
  const isOpen = box.classList.contains('open');
  // закрыть все открытые тултипы
  document.querySelectorAll('.tip-box.open').forEach(b => b.classList.remove('open'));
  if(!isOpen) box.classList.add('open');
}
document.addEventListener('click', function(e){
  if(!e.target.closest('.tip-wrap')){
    document.querySelectorAll('.tip-box.open').forEach(b => b.classList.remove('open'));
  }
});
function initAppPage() {
  const params = new URLSearchParams(location.search);
  const saved = params.get('lang') || (() => { try { return localStorage.getItem('bonusLang'); } catch(e) { return null; } })();
  const valid = ['ru','en','mn','es'];
  if (saved && valid.includes(saved) && saved !== L) setLang(saved);
  else relabel();
  initFromCampaignURL();
  const hint = document.getElementById('cfg-hint');
  if (hint && !localStorage.getItem('cfg_hint_dismissed')) hint.style.display = 'flex';
  if (typeof updateAllBadges === 'function') updateAllBadges();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppPage);
} else {
  initAppPage();
}

// ═════════════════════════════════════════════════════════════════════════════
// CAMPAIGN → CONFIGURATOR: Pre-fill form from URL params
// ═════════════════════════════════════════════════════════════════════════════
// URL format (generated by the campaign detail view "Open in Configurator" button):
// /configurator?region=eu&players=1000&avgdep=50&lic=mga&rtp=96&plat=both
//               &wager=35&name=Weekend+Reload+DE&cid=abc123&autogen=1
//
// All params are optional — only provided ones override the defaults.
// If ?cid is present, a "back to campaign" banner is shown at the top of the page.
// If ?autogen=1, generate() is called automatically after pre-fill.

function initFromCampaignURL() {
  const p = new URLSearchParams(location.search);

  // Check if we came from a campaign (cid = campaign id)
  const cid      = p.get('cid');
  const camName  = p.get('name') ? decodeURIComponent(p.get('name')) : null;
  const region   = p.get('region');
  const players  = p.get('players')  ? parseInt(p.get('players'))  : null;
  const avgdep   = p.get('avgdep')   ? parseFloat(p.get('avgdep')) : null;
  const sitecur  = p.get('sitecur');
  const depcur   = p.get('depcur');
  const lic      = p.get('lic');
  const plat     = p.get('plat');
  const rtp      = p.get('rtp')      ? parseFloat(p.get('rtp'))    : null;
  const wager    = p.get('wager')    ? parseFloat(p.get('wager'))  : null;
  const autogen  = p.get('autogen') === '1';

  // Nothing to do if no campaign params
  if (!cid && !region && !avgdep) return;

  // 1. Region — must go first (sets currency defaults)
  if (region && ['cis','eu','crypto','sweep','mn','latam'].includes(region)) {
    pickRegion(region);
  }

  // 2. Override individual fields (after pickRegion set its defaults)
  if (avgdep !== null) {
    const el = document.getElementById('avgdep');
    if (el) { el.value = avgdep; S.avgdep = avgdep; }
  }
  if (sitecur) {
    const el = document.getElementById('sitecur');
    if (el) { el.value = sitecur; S.sitecur = sitecur; }
  }
  if (depcur) {
    const el = document.getElementById('depcur');
    if (el) { el.value = depcur; S.depcur = depcur; }
  }
  if (players !== null) {
    const rng = document.getElementById('prange');
    const num = document.getElementById('pnum');
    const dsp = document.getElementById('pdsp');
    if (rng) rng.value = Math.min(players, parseInt(rng.max || 50000));
    if (num) num.value = players;
    if (dsp) dsp.textContent = players.toLocaleString('ru');
    S.players = players;
  }
  if (lic)  setChip('lic',  lic);
  if (plat) setChip('plat', plat);
  if (rtp !== null) {
    const rng = document.getElementById('rtprange');
    const num = document.getElementById('rtpnum');
    const dsp = document.getElementById('rtpdsp');
    if (rng) rng.value = rtp;
    if (num) num.value = rtp;
    if (dsp) dsp.textContent = rtp.toFixed(1) + '%';
    S.rtp = rtp;
  }
  // wager stored for recalcEcon override injection (used by ov_w_wager field)
  if (wager !== null) {
    S._campaignWager = wager;   // saved for post-generate injection
  }

  // 3. Show "back to campaign" banner if cid present
  if (cid) {
    _showCampaignBanner(cid, camName, wager);
  }

  // 4. Auto-generate if all required params are present
  if (autogen && S.region) {
    // Small delay so DOM finishes painting before the async API call
    setTimeout(() => generate().then(() => {
      // After generate, inject wager override into the rendered input if present
      if (wager !== null) {
        const ovw = document.getElementById('ov_w_wager');
        if (ovw) { ovw.value = wager; recalcEcon(); }
      }
    }), 120);
  }
}

// Campaign context banner — shown at top of page when opened from campaign detail view
function _showCampaignBanner(cid, name, wager) {
  // Build back URL: campaign generator page with the campaign id highlighted
  const backUrl = `./campaign-generator.html?open=${encodeURIComponent(cid)}`;

  const banner = document.createElement('div');
  banner.id = 'campaign-banner';
  banner.innerHTML = `
    <div style="
      position:fixed; top:0; left:0; right:0; z-index:200;
      background:linear-gradient(135deg,rgba(79,110,247,.95),rgba(124,58,237,.95));
      backdrop-filter:blur(8px);
      border-bottom:1px solid rgba(255,255,255,.15);
      padding:10px 24px;
      display:flex; align-items:center; justify-content:space-between;
      gap:16px; flex-wrap:wrap;
      font-family:'Inter',-apple-system,sans-serif; font-size:13px; color:#fff;
    ">
      <div style="display:flex;align-items:center;gap:12px;">
        <a href="${backUrl}" style="
          display:inline-flex;align-items:center;gap:6px;
          background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
          border-radius:8px; padding:5px 12px; color:#fff; text-decoration:none;
          font-weight:600; font-size:12px; transition:background .2s;
        " onmouseover="this.style.background='rgba(255,255,255,.25)'"
           onmouseout="this.style.background='rgba(255,255,255,.15)'">
          ← ${L === 'ru' ? 'К кампании' : 'Back to Campaign'}
        </a>
        <span style="opacity:.7">${L === 'ru' ? 'Редактирование параметров:' : 'Editing parameters for:'}</span>
        <strong>${name ? _esc(name) : (L === 'ru' ? 'Кампания' : 'Campaign')}</strong>
        ${wager !== null ? `<span style="
          background:rgba(245,158,11,.25); border:1px solid rgba(245,158,11,.4);
          border-radius:6px; padding:2px 8px; font-size:11px; font-weight:700; color:#fcd34d;
        ">${L === 'ru' ? 'Вейджер' : 'Wager'} x${wager}</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:8px;opacity:.75;font-size:12px;">
        <span>💡 ${L === 'ru'
          ? 'Изменения здесь не сохраняются в кампанию автоматически'
          : 'Changes here are not auto-saved to the campaign'
        }</span>
        <button onclick="document.getElementById('campaign-banner').remove()" style="
          background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2);
          border-radius:6px; padding:3px 8px; color:#fff; cursor:pointer; font-size:12px;
        ">✕</button>
      </div>
    </div>
  `;

  document.body.insertBefore(banner, document.body.firstChild);

  // Push page content down so banner doesn't overlap the nav
  const offset = banner.firstElementChild.offsetHeight || 44;
  document.body.style.paddingTop = (offset + 4) + 'px';
}

// Build the URL for "Open in Configurator" button (call from campaign generator)
// campaignParams: { region, players, avgdep, sitecur, depcur, lic, plat, rtp, wager, name, id }
function buildConfiguratorURL(campaignParams, autoGenerate = true) {
  const base = './public/index.html';   // adjust to your deployment path
  const q = new URLSearchParams();

  const {
    region, players, avgdep, sitecur, depcur,
    lic, plat, rtp, wager, name, id
  } = campaignParams;

  if (id)      q.set('cid',     id);
  if (name)    q.set('name',    name);
  if (region)  q.set('region',  region);
  if (players) q.set('players', players);
  if (avgdep)  q.set('avgdep',  avgdep);
  if (sitecur) q.set('sitecur', sitecur);
  if (depcur)  q.set('depcur',  depcur);
  if (lic)     q.set('lic',     lic);
  if (plat)    q.set('plat',    plat);
  if (rtp)     q.set('rtp',     rtp);
  if (wager)   q.set('wager',   wager);
  if (autoGenerate) q.set('autogen', '1');

  return `${base}?${q.toString()}`;
}

function _esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═════════════════════════════════════════════════════════════════════════════
// CSV PARSER & ANALYTICS
// ═════════════════════════════════════════════════════════════════════════════

// Parse a single CSV row with RFC 4180 quoted-field support
function parseCSVRow(line) {
  const fields = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }  // escaped quote
      else if (ch === '"') { inQuote = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQuote = true; }
      else if (ch === ',') { fields.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
  }
  fields.push(cur.trim());
  return fields;
}

// Parse CSV file into campaign actuals
// Expected columns: campaignId, participants, totalDeposits, wagerCompleted, bonusPayout[, incrRevenue][, notes]
function parseCSVActuals(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV must have header + at least 1 data row');

  const header = parseCSVRow(lines[0]).map(h => h.toLowerCase());
  const colCount = header.length;
  const headerMap = {
    campaignid: 'campaignId', id: 'campaignId',
    participants: 'participants',
    totaldeposits: 'totalDeposits',
    wagercompleted: 'wagerCompleted',
    bonuspayout: 'bonusPayout',
    incrrevenue: 'incrRevenue',
    notes: 'notes',
  };

  const colIndices = {};
  for (const [i, h] of header.entries()) {
    const mapped = headerMap[h];
    if (mapped) colIndices[mapped] = i;
  }

  const requiredCols = ['campaignId', 'participants', 'totalDeposits', 'wagerCompleted', 'bonusPayout'];
  for (const col of requiredCols) {
    if (!(col in colIndices)) throw new Error(`Missing required column: ${col}`);
  }

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVRow(lines[i]);
    if (parts.length !== colCount) throw new Error(`Row ${i + 1}: expected ${colCount} columns, got ${parts.length}`);
    const rec = {
      campaignId:    parts[colIndices.campaignId],
      source:        'csv',
      enteredAt:     new Date().toISOString(),
      participants:  parseInt(parts[colIndices.participants], 10),
      totalDeposits: parseFloat(parts[colIndices.totalDeposits]),
      wagerCompleted: parseFloat(parts[colIndices.wagerCompleted]),
      bonusPayout:   parseFloat(parts[colIndices.bonusPayout]),
      incrRevenue:   colIndices.incrRevenue !== undefined ? parseFloat(parts[colIndices.incrRevenue]) : undefined,
      notes:         colIndices.notes !== undefined ? parts[colIndices.notes] || undefined : undefined,
    };
    if (!isNaN(rec.participants) && !isNaN(rec.totalDeposits)) records.push(rec);
  }

  return records;
}

// Build portfolio dashboard artifact
// Takes array of campaign analyses with forecast + actual, returns HTML summary
function buildPortfolioDashboard(analyses) {
  if (!analyses || analyses.length === 0) {
    return `<div style="padding:20px;color:#999;">No campaign analyses yet</div>`;
  }

  const withinBandCount = analyses.filter(a => a.withinBand).length;
  const flaggedCount = analyses.filter(a => a.flags.length > 0).length;
  const avgCostRatio = (analyses.reduce((s, a) => s + a.actualRatio, 0) / analyses.length).toFixed(3);
  const totalNetUSD = analyses.reduce((s, a) => s + a.actualNet, 0).toFixed(0);

  let html = `<div style="padding:20px;">
    <h3>${L === 'ru' ? 'Портфель кампаний' : 'Campaign Portfolio'}</h3>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:16px 0;">
      <div style="background:#f5f5f5;padding:12px;border-radius:6px;">
        <div style="font-size:12px;color:#666;">${L === 'ru' ? 'Точность' : 'Accuracy'}</div>
        <div style="font-size:24px;font-weight:bold;">${withinBandCount}/${analyses.length}</div>
        <div style="font-size:11px;color:#999;">${L === 'ru' ? 'в диапазоне' : 'within band'}</div>
      </div>
      <div style="background:#f5f5f5;padding:12px;border-radius:6px;">
        <div style="font-size:12px;color:#666;">${L === 'ru' ? 'Флаги' : 'Flags'}</div>
        <div style="font-size:24px;font-weight:bold;color:#e74c3c;">${flaggedCount}</div>
        <div style="font-size:11px;color:#999;">${L === 'ru' ? 'кампаний' : 'campaigns'}</div>
      </div>
      <div style="background:#f5f5f5;padding:12px;border-radius:6px;">
        <div style="font-size:12px;color:#666;">${L === 'ru' ? 'Сред. ratio' : 'Avg ratio'}</div>
        <div style="font-size:24px;font-weight:bold;">${avgCostRatio}</div>
        <div style="font-size:11px;color:#999;">cost/dep</div>
      </div>
      <div style="background:#f5f5f5;padding:12px;border-radius:6px;">
        <div style="font-size:12px;color:#666;">${L === 'ru' ? 'Итого net' : 'Total net'}</div>
        <div style="font-size:24px;font-weight:bold;">${totalNetUSD}</div>
        <div style="font-size:11px;color:#999;">USD</div>
      </div>
    </div>
    <h4 style="margin-top:24px;">${L === 'ru' ? 'Отклонения' : 'Divergences'}</h4>
    <div style="max-height:300px;overflow-y:auto;">
  `;

  for (const a of analyses) {
    if (a.flags.length > 0) {
      const risk = a.flags.map(f => {
        const key = `an_flag_${f}`;
        return window._i18n?.[L]?.[key] || f;
      }).join(', ');
      html += `<div style="padding:12px;margin-bottom:8px;background:#fff3cd;border-left:4px solid #ffc107;border-radius:4px;">
        <div style="font-weight:bold;margin-bottom:4px;">${a.campaignId || 'Unknown'}</div>
        <div style="font-size:12px;color:#666;">${L === 'ru' ? 'Флаги' : 'Flags'}: ${risk}</div>
        <div style="font-size:12px;color:#666;">${L === 'ru' ? 'Отклон.' : 'Variance'}: ${a.costVariancePct.toFixed(1)}% cost, ${a.convVariancePct.toFixed(1)}% wager</div>
      </div>`;
    }
  }

  html += `</div></div>`;
  return html;
}
