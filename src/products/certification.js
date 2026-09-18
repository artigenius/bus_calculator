PRODUCTS.certification = {
  id:'certification',
  tag:'04',
  name:'Сертификация',
  cardDesc:'Оценка эффектов сертификации работодателя: привлечение кандидатов, кадровые решения, бенефиты и удержание сотрудников.',
  tagline:'Сертификация',
  intro:'Оцените экономический эффект сертификации работодателя с учётом стоимости пакета и внутренних расходов компании.',
  effectCards:[
    {title:'Привлечение кандидатов', text:'Бейдж сертификации повышает конверсию просмотров в отклики.'},
    {title:'Кадровые решения', text:'Модель оценивает снижение кадровых ошибок; обоснование этого эффекта в файле требует уточнения.'},
    {title:'Снижение текучести', text:'Удержание сотрудников сокращает расходы на замещающий найм.'},
    {title:'Использование бенефитов', text:'Знание ожиданий сотрудников помогает эффективнее расходовать бюджет на бенефиты.'}
  ],
  hasROI:true,
  workbookRange:'A140:C181',
  periodNote:'В итог включён месячный эффект бенефитов и годовые эффекты найма, как в Excel.',
  modelNote:'Стоимость кадровой ошибки рассчитана от месячной зарплаты. Связь снижения кадровых ошибок с сертификацией оспаривается в комментарии файла. Месячный эффект бенефитов не умножается на 12. Внутренние расходы не масштабируются автоматически.',
  inputs:[
    {id:'headcount', label:'Количество сотрудников компании', unit:'чел.', def:112000, group:'main', step:100},
    {id:'specialistSalary', label:'Зарплата специалиста для расчёта найма', unit:'₽/мес', def:150000, group:'main', step:1000},
    {id:'turnoverRate', label:'Текущая годовая текучесть', unit:'%', def:15, group:'main', step:1, percent:true},
    {id:'programCost', label:'Стоимость сертификации (оптимальный пакет)', unit:'₽', def:1400000, group:'main', step:100000},
    {id:'benefitsSalary', label:'Средняя зарплата для бюджета бенефитов', unit:'₽/мес', def:170000, group:'advanced', step:1000,
      help:'В файле для бенефитов используется отдельная зарплата — 170 000 ₽, для найма — 150 000 ₽.'},
    {id:'internalCost', label:'Внутренние расходы клиента', unit:'₽', def:948000, group:'advanced', step:10000,
      help:'Время команды и участников опроса. Исходная оценка — 948 000 ₽; при изменении масштаба проекта её можно скорректировать отдельно.'}
  ],
  compute(v){
    // Workbook B142:B181. Preserve monthly bases and rounded coefficients.
    const hireCost = v.specialistSalary*12*0.18;
    const annualHires = v.headcount*0.05;
    const e1 = hireCost*0.067*annualHires;
    const turnover = v.turnoverRate/100;
    const hiringDecisions = v.headcount*turnover;
    const errorCost = v.specialistSalary*0.3;
    const e2 = hiringDecisions*errorCost*0.1;
    const reducedTurnover = turnover*(1-0.13);
    const fewerHires = v.headcount*(turnover-reducedTurnover);
    const e3 = fewerHires*hireCost;
    const monthlyPayroll = v.benefitsSalary*v.headcount*1.6;
    const benefitsBudget = monthlyPayroll*0.1;
    const e4 = benefitsBudget*0.033;
    const total = e1+e2+e3+e4;
    const cost = v.programCost+v.internalCost;
    return {
      total, cost, roi:cost > 0 ? (total-cost)/cost : null,
      effects:[
        {id:'e1', label:'Экономия на привлечении кандидатов', amount:e1,
          logic:'Сертификационный бейдж увеличивает конверсию просмотров в отклики. Модель оценивает эффект как долю расходов на годовой найм.',
          data:[
            {k:'Стоимость найма (18% годовой зарплаты)', v:fmtMoneyFull(hireCost)},
            {k:'Прирост конверсии от бейджа', v:'6,7%'},
            {k:'Годовой найм (5% от численности)', v:fmtNum(annualHires)+' чел.'}
          ],
          result:'Эффект = '+fmtMoneyFull(e1),
          source:'В Excel: Great Place to Work — рост откликов на 20%, консервативный коэффициент модели 6,7%; NACE Job Outlook — годовой найм 5%. Стоимость найма 18% годовой зарплаты — рыночное допущение.'
        },
        {id:'e2', label:'Эффект от снижения кадровых ошибок', amount:e2,
          logic:'Модель предполагает, что исследование целевой аудитории снижает вероятность кадровой ошибки на 10%. В комментарии к исходному файлу связь этого эффекта с сертификацией поставлена под вопрос; эффект сохранён в расчёте Excel.',
          data:[
            {k:'Кадровых решений о найме в год', v:fmtNum(hiringDecisions)+' чел.'},
            {k:'Стоимость ошибки (30% месячной зарплаты)', v:fmtMoneyFull(errorCost)},
            {k:'Снижение вероятности ошибки (допущение)', v:'10%'}
          ],
          result:'Эффект = '+fmtMoneyFull(e2),
          source:'В Excel: оценка 30% со ссылкой на SHRM / BLS и CertifiedSource (2026). Описание говорит о годовой стоимости ошибки, но формула использует месячную зарплату без дополнительных расходов. Сохранена формула; причинная связь и коэффициент 10% требуют подтверждения.'
        },
        {id:'e3', label:'Экономия от снижения текучести', amount:e3,
          logic:'Снижение годовой текучести уменьшает число замещающих наймов и расходы на подбор.',
          data:[
            {k:'Текучесть до сертификации', v:fmtPercent(turnover,2)},
            {k:'Текучесть после (относительное снижение на 13%)', v:fmtPercent(reducedTurnover,2)},
            {k:'Предотвращено наймов', v:fmtNum(fewerHires,1)+' чел.'},
            {k:'Стоимость одного найма', v:fmtMoneyFull(hireCost)}
          ],
          result:'Эффект = '+fmtMoneyFull(e3),
          source:'В Excel: по статистике Great Place to Work уровень увольнений в сертифицированных компаниях ниже на 39%. В модели этот показатель разделён на 3 — до 13%.'
        },
        {id:'e4', label:'Эффективность бюджета на бенефиты', amount:e4,
          logic:'Исследование ожиданий сотрудников помогает выбирать более востребованные бенефиты. Формула оценивает эффект от месячного бюджета, без умножения на 12.',
          data:[
            {k:'Месячный ФОТ с дополнительными расходами (× 1,6)', v:fmtMoneyFull(monthlyPayroll)},
            {k:'Бюджет бенефитов (10% ФОТ)', v:fmtMoneyFull(benefitsBudget)},
            {k:'Повышение эффективности бюджета', v:'3,3%'}
          ],
          result:'Эффект за один месяц = '+fmtMoneyFull(e4),
          source:'В Excel: экспертная оценка Europlast в статье «Привычная награда», Коммерсантъ СПб, 17.12.2019 — бенефиты около 10% ФОТ. Показатель GPTW 10% снижен в модели до 3,3%. Перенос оценки эффективности бренда на бенефиты является допущением модели.'
        }
      ],
      costBreakdown:[
        {k:'Стоимость сертификации Changellenge >>', v:fmtMoneyFull(v.programCost)},
        {k:'Внутренние расходы клиента', v:fmtMoneyFull(v.internalCost)}
      ]
    };
  }
};
