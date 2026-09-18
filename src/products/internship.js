PRODUCTS.internship = {
  id:'internship',
  tag:'01',
  name:'Стажировки',
  cardDesc:'Корпоративная программа стажировок: экономия на ФОТ, конверсия в штат и укрепление бренда работодателя.',
  tagline:'Стажировки',
  intro:'Оцените экономический эффект корпоративной программы стажировок — от прямой экономии на ФОТ до найма и укрепления бренда работодателя.',
  effectCards:[
    {title:'Экономия на ФОТ', text:'Стажёры выполняют часть задач специалистов при более низкой стоимости для компании.'},
    {title:'Экономия на найме', text:'Компания получает сотрудников, которых уже знает и которым требуется меньше времени на адаптацию.'},
    {title:'Employer Brand', text:'Сильная стажёрская программа снижает стоимость дальнейшего привлечения кандидатов.'}
  ],
  hasROI:true,
  workbookRange:'A3:C39',
  modelNote:'Затраты на команду включают ФОТ менеджера, специалиста по стажёрской программе и рекрутера, налоги, работу наставников и обучение.',
  inputs:[
    {id:'internsPerYear', label:'Стажёров за год (все волны)', unit:'чел.', def:200, group:'main', step:1},
    {id:'internshipMonths', label:'Длительность стажировки', unit:'мес.', def:6, group:'main', step:1},
    {id:'specialistSalary', label:'Средняя зарплата специалиста', unit:'₽/мес', def:150000, group:'main', step:1000,
      help:'Специалист, часть задач которого выполняют стажёры. Это же значение используется для расчёта стоимости найма и адаптации при переходе стажёров в штат'},
    {id:'internSalary', label:'Средняя зарплата стажёра', unit:'₽/мес', def:70000, group:'main', step:1000},
    {id:'companyHeadcount', label:'Количество сотрудников компании', unit:'чел.', def:112000, group:'main', step:100},
    {id:'programCost', label:'Стоимость программы стажировки Changellenge >>', unit:'₽', def:20000000, group:'main', step:100000}
  ],
  compute(v){
    const TAX=1.6, INTERN_EFF=0.37, AGENCY=0.18, ADAPT_M=6, CONV=0.3, EB_RED=0.143, HIRE_SHARE=0.05, TEAM_COST=5664000;

    const costSpecialist = v.specialistSalary*TAX;
    const costIntern = v.internSalary*TAX;
    const e1 = (costSpecialist-costIntern)*v.internsPerYear*v.internshipMonths*INTERN_EFF;

    const hireLeaderCost = v.specialistSalary*12*AGENCY;
    const adaptLoss = v.specialistSalary*ADAPT_M;
    const converted = v.internsPerYear*CONV;
    const e2 = (hireLeaderCost+adaptLoss)*converted;

    const specialistAnnual = v.specialistSalary*12;
    const hireCostAnnual = specialistAnnual*AGENCY;
    const ebReduction = hireCostAnnual*EB_RED;
    const annualHires = v.companyHeadcount*HIRE_SHARE;
    const e3 = ebReduction*annualHires;

    const total = e1+e2+e3;
    const cost = v.programCost+TEAM_COST;
    const roi = cost > 0 ? (total-cost)/cost : null;

    return {
      total, cost, roi,
      effects:[
        {id:'e1', label:'Экономия на ФОТ во время стажировки', amount:e1,
          logic:'Стажёры выполняют часть задач специалистов, но обходятся компании дешевле. Разница в стоимости специалиста и стажёра, умноженная на объём и длительность программы, формирует прямую экономию на ФОТ.',
          data:[
            {k:'Стажёров за год', v:fmtNum(v.internsPerYear)+' чел.'},
            {k:'Длительность стажировки', v:fmtNum(v.internshipMonths)+' мес.'},
            {k:'Стоимость специалиста с учётом налогов', v:fmtMoneyFull(costSpecialist)+'/мес (зарплата × 1,6)'},
            {k:'Стоимость стажёра с учётом налогов', v:fmtMoneyFull(costIntern)+'/мес (зарплата × 1,6)'},
            {k:'Коэффициент эффективности стажёра', v:fmtPercent(INTERN_EFF,0)}
          ],
          result:'Экономия на ФОТ = '+fmtMoneyFull(e1),
          source:'Согласно исследованию Mühlemann, S. «The costs and benefits of work-based learning», стажёры справляются с задачами в среднем на 50% менее эффективно, чем специалисты. Похожие исследования в разных странах дают среднее значение 37% — этот коэффициент используется в модели. Надбавка ×1,6 к зарплате — налоги и соц. взносы (13% НДФЛ, 30% соц. взносы, отпуск, праздники, больничные).'
        },
        {id:'e2', label:'Эффект от перехода стажёров в штат', amount:e2,
          logic:'Часть стажёров компания нанимает в штат по итогам программы. Экономия возникает за счёт того, что не нужно оплачивать внешний подбор такого числа сотрудников и нести те же потери на адаптации специалиста с рынка.',
          data:[
            {k:'Стоимость найма специалиста с рынка (18% годовой ЗП)', v:fmtMoneyFull(hireLeaderCost)},
            {k:'Потери на адаптации специалиста с рынка (6 мес. ЗП)', v:fmtMoneyFull(adaptLoss)},
            {k:'Стажёров, переходящих в штат (30% от потока)', v:fmtNum(converted,1)+' чел.'}
          ],
          result:'Эффект от конверсии = '+fmtMoneyFull(e2),
          source:'Среднее значение конверсии стажёров в штат — около 60% по опыту проведения стажировок для крупных компаний; для консервативной оценки модель использует 30%. Стоимость найма — рыночный показатель через рекрутинговое агентство (15–20%). Потери на адаптации — не менее 6 месяцев до полной эффективности, по данным Всероссийского исследования корпоративных программ адаптации.'
        },
        {id:'e3', label:'Экономия на привлечении кандидатов (Employer Brand)', amount:e3,
          logic:'Сильная стажёрская программа укрепляет бренд работодателя и снижает стоимость привлечения новых кандидатов на открытом рынке труда.',
          data:[
            {k:'Стоимость найма одного специалиста в год', v:fmtMoneyFull(hireCostAnnual)},
            {k:'Снижение стоимости привлечения после стажировки', v:fmtPercent(EB_RED,1)+' → '+fmtMoneyFull(ebReduction)},
            {k:'Объём найма специалистов в год (5% от численности)', v:fmtNum(annualHires)+' чел.'}
          ],
          result:'Экономия на привлечении = '+fmtMoneyFull(e3),
          source:'По данным LinkedIn, компании с более сильным брендом работодателя экономят на поиске и привлечении кандидатов до 43%; для консервативного сценария модель снижает эту цифру в 3 раза (до 14,3%). Доля годового найма от численности компании — по данным NACE Job Outlook (5%).'
        }
      ],
      costBreakdown:[
        {k:'Стоимость программы Changellenge >>', v:fmtMoneyFull(v.programCost)},
        {k:'Стоимость работы команды партнёра (фикс.)', v:fmtMoneyFull(TEAM_COST)}
      ]
    };
  }
};
