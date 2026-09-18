PRODUCTS.championship = {
  id:'championship',
  tag:'04',
  name:'Кейс-чемпионаты Changellenge >>',
  cardDesc:'Участие в чемпионате как канал найма, R&D-краудсорсинга, доступа к базе HiPo-контактов и маркетингового охвата.',
  tagline:'Кейс-чемпионаты',
  intro:'Оцените ценность участия компании в кейс-чемпионате не только как маркетингового размещения.',
  effectCards:[
    {title:'Найм участников', text:'Возможность нанять сильных участников чемпионата напрямую, минуя платный подбор.'},
    {title:'R&D / краудсорсинг', text:'Участники работают над реальным бизнес-кейсом компании.'},
    {title:'База HiPo-контактов', text:'Партнёр получает доступ к контактам участников чемпионата.'},
    {title:'Маркетинговый охват', text:'Дополнительный контакт бренда с целевой аудиторией.'}
  ],
  hasROI:false,
  inputs:[
    {id:'hireableCount', label:'Потенциально нанятых участников чемпионата', unit:'чел.', def:10, group:'main', step:1},
    {id:'internSalaryMonthly', label:'Средняя зарплата нанятого стажёра', unit:'₽/мес', def:70000, group:'main', step:1000},
    {id:'rdParticipantsCount', label:'Участников, работающих над кейсом', unit:'чел.', def:120, group:'main', step:1},
    {id:'contactsCount', label:'Доступных контактов из базы чемпионата', unit:'шт.', def:3000, group:'main', step:100},
    {id:'championshipParticipants', label:'Участников чемпионата', unit:'чел.', def:750, group:'main', step:10},

    {id:'rdHoursPerPerson', label:'Часов работы над кейсом на участника', unit:'ч.', def:40, group:'advanced', step:1},
    {id:'hourlyMarketRate', label:'Стоимость часа аналогичной работы на рынке', unit:'₽', def:1500, group:'advanced', step:100},
    {id:'contactMarketCost', label:'Стоимость одного контакта на рынке', unit:'₽', def:1200, group:'advanced', step:100},
    {id:'adContactCost', label:'Стоимость рекламного контакта на рынке', unit:'₽', def:7, group:'advanced', step:1}
  ],
  compute(v){
    const AGENCY=0.18, CONTACT_DISCOUNT=0.25, REACH_MULT=50;

    const internAnnual = v.internSalaryMonthly*12;
    const e1 = v.hireableCount*AGENCY*internAnnual;

    const e2 = v.rdParticipantsCount*v.rdHoursPerPerson*v.hourlyMarketRate;

    const e3 = v.contactsCount*v.contactMarketCost*CONTACT_DISCOUNT;

    const reach = v.championshipParticipants*REACH_MULT;
    const e4 = reach*v.adContactCost;

    const total = e1+e2+e3+e4;

    return {
      total, cost:null, roi:null,
      effects:[
        {id:'e1', label:'Найм участников', amount:e1,
          logic:'Компания получает возможность нанять сильных участников чемпионата напрямую, минуя платный подбор на открытом рынке.',
          data:[
            {k:'Потенциально нанято', v:fmtNum(v.hireableCount)+' чел.'},
            {k:'Годовая зарплата стажёра', v:fmtMoneyFull(internAnnual)},
            {k:'Альтернативная стоимость найма (агентство, 18%)', v:fmtPercent(AGENCY,0)}
          ],
          result:'Эффект = '+fmtMoneyFull(e1),
          source:'Стоимость найма через рекрутинговое агентство — рыночный показатель (15–20%). Наняв несколько человек через чемпионат, компания полностью окупает расходы на участие.'
        },
        {id:'e2', label:'R&D / краудсорсинг', amount:e2,
          logic:'Участники чемпионата работают над реальным бизнес-кейсом компании. Модель оценивает эту работу по рыночной стоимости аналогичного объёма интеллектуального труда.',
          data:[
            {k:'Участников, работающих над кейсом', v:fmtNum(v.rdParticipantsCount)+' чел.'},
            {k:'Часов работы на участника', v:fmtNum(v.rdHoursPerPerson)+' ч.'},
            {k:'Стоимость часа на рынке', v:fmtMoneyFull(v.hourlyMarketRate)}
          ],
          result:'Эффект = '+fmtMoneyFull(e2),
          source:'Средняя рыночная стоимость аналогичной работы на аутсорсе — 2 500–3 000 ₽/час; модель использует более консервативную ставку.'
        },
        {id:'e3', label:'Доступ к базе HiPo-контактов', amount:e3,
          logic:'Партнёр получает доступ к контактам участников чемпионата — готовой базе кандидатов, ценность которой оценивается через стоимость аналогичного лида на рынке.',
          data:[
            {k:'Контактов доступно', v:fmtNum(v.contactsCount)+' шт.'},
            {k:'Стоимость контакта на рынке', v:fmtMoneyFull(v.contactMarketCost)},
            {k:'Понижающий коэффициент (доступ у нескольких партнёров)', v:fmtPercent(CONTACT_DISCOUNT,0)}
          ],
          result:'Эффект = '+fmtMoneyFull(e3),
          source:'Рыночная стоимость контакта HiPo-аудитории; понижающий коэффициент учитывает, что доступ к базе одновременно получают несколько партнёров чемпионата.'
        },
        {id:'e4', label:'Маркетинговый охват', amount:e4,
          logic:'Участие в чемпионате создаёт дополнительный контакт бренда компании с целевой аудиторией — эффект оценивается через стоимость аналогичного рекламного контакта.',
          data:[
            {k:'Участников чемпионата', v:fmtNum(v.championshipParticipants)+' чел.'},
            {k:'Маркетинговый охват', v:fmtNum(reach)+' контактов'},
            {k:'Стоимость рекламного контакта на рынке', v:fmtMoneyFull(v.adContactCost)}
          ],
          result:'Эффект = '+fmtMoneyFull(e4),
          source:'Рыночная стоимость рекламного контакта в среднем по рынку.'
        }
      ]
    };
  }
};
