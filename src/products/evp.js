PRODUCTS.evp = {
  id:'evp',
  tag:'03',
  name:'EVP (активация)',
  cardDesc:'Активация ценностного предложения работодателя: снижение переплаты новым сотрудникам, снижение текучести, стоимости привлечения кандидатов и ROI проекта.',
  tagline:'Активация EVP',
  intro:'Оцените финансовую ценность активации EVP / бренда работодателя — с учётом стоимости проекта и ROI.',
  effectCards:[
    {title:'Меньше переплаты новым сотрудникам', text:'Слабый бренд работодателя вынуждает переплачивать при найме — сильный EVP это снижает.'},
    {title:'Снижение текучести', text:'Сильный EVP снижает текучесть — компании нужно меньше замещающих наймов.'},
    {title:'Дешевле привлечение кандидатов', text:'Более сильный бренд работодателя снижает стоимость привлечения кандидатов.'}
  ],
  hasROI:true,
  inputs:[
    {id:'headcount', label:'Количество сотрудников компании', unit:'чел.', def:10000, group:'main', step:100},
    {id:'avgSalaryNet', label:'Средняя зарплата (после вычета налогов)', unit:'₽/мес', def:110000, group:'main', step:1000},
    {id:'turnoverRate', label:'Текущая годовая текучесть', unit:'%', def:20, group:'main', step:1, percent:true},
    {id:'programCost', label:'Стоимость проекта Changellenge >>', unit:'₽', def:7000000, group:'main', step:100000},
    {id:'activationCost', label:'Примерные затраты на активацию EVP', unit:'₽', def:20000000, group:'main', step:100000,
      help:'Ориентировочные внутренние затраты компании на активацию EVP (команда, коммуникации, мероприятия и т.д.)'},

    {id:'authenticityIndex', label:'Индекс аутентичности', unit:'%', def:30, group:'advanced', step:1, percent:true,
      help:'Понижающий коэффициент, который делает расчёт экономического эффекта более консервативным и реалистичным'}
  ],
  compute(v){
    const OVERPAY=0.03, EXTRA=0.52, TURNOVER_RED_SHARE=0.23, HIRE_RATE=0.22, EB_RED=0.43/3, HIRE_SHARE=0.10;
    const turnover = v.turnoverRate/100;
    const authIdx = v.authenticityIndex/100;

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
    const total = rawTotal*authIdx;
    const cost = v.programCost+v.activationCost;
    const roi = (total-cost)/cost;

    return {
      total, cost, roi,
      rawTotal, authIdx,
      effects:[
        {id:'e1', label:'Экономия на переплате новым сотрудникам', amount:e1*authIdx, rawAmount:e1,
          logic:'Слабый бренд работодателя вынуждает переплачивать при найме новых сотрудников. Развитие EVP снижает эту переплату.',
          data:[
            {k:'Новых сотрудников в год (текучесть × численность)', v:fmtNum(newHires)+' чел.'},
            {k:'ФОТ новых сотрудников в год', v:fmtMoneyFull(payrollNewHires)},
            {k:'Переплата из-за слабого бренда (3%)', v:fmtMoneyFull(overpay)}
          ],
          result:'До индекса аутентичности: '+fmtMoneyFull(e1),
          source:'Wade Burgess, Harvard Business Review: компании со слабым брендом работодателя переплачивают сотрудникам примерно 10% заработной платы. Модель использует консервативную оценку — в 3 раза меньше (3%).'
        },
        {id:'e2', label:'Эффект от снижения текучести', amount:e2*authIdx, rawAmount:e2,
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
        {id:'e3', label:'Экономия на привлечении кандидатов', amount:e3*authIdx, rawAmount:e3,
          logic:'Более сильный бренд работодателя снижает стоимость привлечения кандидатов на открытом рынке труда.',
          data:[
            {k:'Стоимость найма одного сотрудника в год', v:fmtMoneyFull(hireCostAnnual)},
            {k:'Снижение стоимости привлечения после EVP', v:fmtPercent(EB_RED,1)+' → '+fmtMoneyFull(ebReduction)},
            {k:'Объём найма специалистов в год (10% от численности)', v:fmtNum(annualHires)+' чел.'}
          ],
          result:'До индекса аутентичности: '+fmtMoneyFull(e3),
          source:'Согласно LinkedIn, компании с сильным брендом работодателя экономят на поиске и привлечении кандидатов до 43%. Модель использует консервативную оценку — в 3 раза меньше (14,3%).'
        }
      ],
      costBreakdown:[
        {k:'Стоимость проекта Changellenge >>', v:fmtMoneyFull(v.programCost)},
        {k:'Примерные затраты на активацию EVP', v:fmtMoneyFull(v.activationCost)}
      ]
    };
  }
};
