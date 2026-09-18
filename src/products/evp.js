PRODUCTS.evp = {
  id:'evp',
  tag:'03',
  name:'EVP (разработка и активация)',
  cardDesc:'Активация ценностного предложения работодателя: снижение переплаты новым сотрудникам, снижение текучести, стоимости привлечения кандидатов и ROI проекта.',
  tagline:'Разработка и активация EVP',
  intro:'Оцените эффекты разработки и активации EVP: экономию при найме, снижение текучести и кадровых ошибок.',
  effectCards:[
    {title:'Меньше переплаты новым сотрудникам', text:'Слабый бренд работодателя вынуждает переплачивать при найме — сильный EVP это снижает.'},
    {title:'Снижение текучести', text:'Сильный EVP снижает текучесть — компании нужно меньше замещающих наймов.'},
    {title:'Дешевле привлечение кандидатов', text:'Более сильный бренд работодателя снижает стоимость привлечения кандидатов.'},
    {title:'Эффект разработки EVP', text:'Исследование ожиданий аудитории помогает снизить вероятность кадровых ошибок.'}
  ],
  hasROI:true,
  workbookRange:'A89:D136',
  modelNote:'Индекс аутентичности 25% означает снижение эффектов активации на 25%. Стоимость кадровой ошибки для разработки рассчитана от месячной зарплаты × 1,6, как в формуле файла.',
  inputs:[
    {id:'headcount', label:'Количество сотрудников компании', unit:'чел.', def:3000, group:'main', step:100},
    {id:'avgSalaryNet', label:'Средняя зарплата (после вычета налогов)', unit:'₽/мес', def:150000, group:'main', step:1000},
    {id:'turnoverRate', label:'Текущая годовая текучесть', unit:'%', def:20, group:'main', step:1, percent:true},
    {id:'programCost', label:'Стоимость проекта Changellenge >>', unit:'₽', def:7000000, group:'main', step:100000},
    {id:'activationCost', label:'Примерные затраты на активацию EVP', unit:'₽', def:15000000, group:'main', step:100000,
      help:'Ориентировочные внутренние затраты компании на активацию EVP (команда, коммуникации, мероприятия и т.д.)'},

    {id:'authenticityIndex', label:'Индекс аутентичности: снижение эффектов активации', unit:'%', def:25, group:'advanced', step:1, percent:true,
      help:'Из суммы трёх эффектов активации вычитается 25%, то есть учитывается 75%. Эффект разработки EVP добавляется отдельно и не уменьшается.'}
  ],
  compute(v){
    const OVERPAY=0.03, EXTRA=0.52, TURNOVER_RED_SHARE=0.23, HIRE_RATE=0.22, EB_RED=0.43/3, HIRE_SHARE=0.10;
    const turnover = v.turnoverRate/100;
    const authIdx = v.authenticityIndex/100;
    const activationFactor = 1-authIdx;

    const newHires = v.headcount*turnover;
    const annualSalary = v.avgSalaryNet*12;
    const payrollNewHires = newHires*annualSalary;
    const overpay = payrollNewHires*OVERPAY;
    const e1 = overpay*(1+EXTRA);

    const reducedTurnover = turnover*(1-TURNOVER_RED_SHARE);
    const fewerHires = v.headcount*(turnover-reducedTurnover);
    const hireCost = v.avgSalaryNet*12*HIRE_RATE;
    const e2 = fewerHires*hireCost;

    const hireCostAnnual = annualSalary*HIRE_RATE;
    const ebReduction = hireCostAnnual*EB_RED;
    const annualHires = v.headcount*HIRE_SHARE;
    const e3 = ebReduction*annualHires;

    const rawTotal = e1+e2+e3;
    // B123, B127, B129: monthly salary × 1.6 × 30%, without annualization.
    const errorCost = v.avgSalaryNet*1.6*0.3;
    const developmentEffect = newHires*errorCost*0.1;
    const total = rawTotal*activationFactor+developmentEffect;
    const cost = v.programCost+v.activationCost;
    const roi = cost > 0 ? (total-cost)/cost : null;

    return {
      total, cost, roi,
      rawTotal, authIdx, activationFactor, developmentEffect,
      effects:[
        {id:'e1', label:'Экономия на переплате новым сотрудникам', amount:e1*activationFactor, rawAmount:e1,
          logic:'Слабый бренд работодателя вынуждает переплачивать при найме новых сотрудников. Развитие EVP снижает эту переплату.',
          data:[
            {k:'Новых сотрудников в год (текучесть × численность)', v:fmtNum(newHires)+' чел.'},
            {k:'ФОТ новых сотрудников в год', v:fmtMoneyFull(payrollNewHires)},
            {k:'Переплата из-за слабого бренда (3%)', v:fmtMoneyFull(overpay)},
            {k:'Дополнительные расходы на сотрудника', v:fmtPercent(EXTRA,0)}
          ],
          result:'До индекса аутентичности: '+fmtMoneyFull(e1),
          source:'Wade Burgess, Harvard Business Review: компании со слабым брендом работодателя переплачивают сотрудникам примерно 10% заработной платы. Модель использует консервативную оценку — в 3 раза меньше (3%).'
        },
        {id:'e2', label:'Эффект от снижения текучести', amount:e2*activationFactor, rawAmount:e2,
          logic:'Сильный EVP снижает текучесть персонала — компании требуется меньше замещающих наймов.',
          data:[
            {k:'Текучесть до проекта', v:fmtPercent(turnover,1)},
            {k:'Текучесть после (снижение на 23%)', v:fmtPercent(reducedTurnover,1)},
            {k:'Предотвращено наймов на замену', v:fmtNum(fewerHires)+' чел.'},
            {k:'Стоимость найма одного сотрудника', v:fmtMoneyFull(hireCost)}
          ],
          result:'До индекса аутентичности: '+fmtMoneyFull(e2),
          source:'По данным Gartner, компании с сильным EVP снижают годовую текучесть более чем на 69%. Модель использует консервативную оценку — в 3 раза меньше (23%).'
        },
        {id:'e3', label:'Экономия на привлечении кандидатов', amount:e3*activationFactor, rawAmount:e3,
          logic:'Более сильный бренд работодателя снижает стоимость привлечения кандидатов на открытом рынке труда.',
          data:[
            {k:'Стоимость найма одного сотрудника в год', v:fmtMoneyFull(hireCostAnnual)},
            {k:'Снижение стоимости привлечения после EVP', v:fmtPercent(EB_RED,1)+' → '+fmtMoneyFull(ebReduction)},
            {k:'Объём найма специалистов в год (10% от численности)', v:fmtNum(annualHires)+' чел.'}
          ],
          result:'До индекса аутентичности: '+fmtMoneyFull(e3),
          source:'Согласно LinkedIn, компании с сильным брендом работодателя экономят на поиске и привлечении кандидатов до 43%. Модель использует консервативную оценку — в 3 раза меньше (14,3%).'
        },
        {id:'e4', label:'Эффект от разработки EVP', amount:developmentEffect,
          logic:'Исследование целевой аудитории помогает точнее принимать кадровые решения. Этот эффект добавляется к эффектам активации без снижения на индекс аутентичности.',
          data:[
            {k:'Кадровых решений о найме в год', v:fmtNum(newHires)+' чел.'},
            {k:'Месячная стоимость сотрудника (зарплата × 1,6)', v:fmtMoneyFull(v.avgSalaryNet*1.6)},
            {k:'Стоимость кадровой ошибки (30% месячной стоимости)', v:fmtMoneyFull(errorCost)},
            {k:'Снижение вероятности ошибки (допущение модели)', v:'10%'}
          ],
          result:'Эффект разработки = '+fmtMoneyFull(developmentEffect),
          source:'В Excel: оценка стоимости ошибки 30% со ссылкой на SHRM / BLS и CertifiedSource (2026); снижение вероятности на 10% — экспертное допущение со ссылкой на исследования fit и Gallup. Формула использует месячную стоимость × 1,6, хотя комментарий описывает годовую × 1,52. Здесь сохранена формула файла.'
        }
      ],
      costBreakdown:[
        {k:'Стоимость проекта Changellenge >>', v:fmtMoneyFull(v.programCost)},
        {k:'Примерные затраты на активацию EVP', v:fmtMoneyFull(v.activationCost)}
      ]
    };
  }
};
