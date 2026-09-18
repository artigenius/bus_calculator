PRODUCTS.growth = {
  id:'growth',
  tag:'02',
  name:'Кейс-чемпионат для сотрудников',
  cardDesc:'L&D-проект: рост эффективности участников, R&D/краудсорсинг реальных задач, поиск внутренних лидеров и рост эффективности от ИИ.',
  tagline:'Кейс-чемпионат для сотрудников',
  intro:'Внутренний образовательный проект создаёт ценность не только за счёт обучения — оцените эффект по всем направлениям.',
  effectCards:[
    {title:'Рост эффективности участников', text:'Стоимость рабочего времени участников переводится в денежный эквивалент роста продуктивности.'},
    {title:'R&D / краудсорсинг', text:'Участники решают реальные бизнес-задачи компании — часть идей внедряется.'},
    {title:'Поиск внутренних лидеров', text:'Проект помогает найти перспективных сотрудников без внешнего найма руководителей.'},
    {title:'Эффективность ИИ', text:'Часть участников начинает эффективнее использовать AI-инструменты в работе.'}
  ],
  hasROI:true,
  workbookRange:'A43:C85',
  periodNote:'Эффекты продуктивности и ИИ рассчитаны за один месяц; итог объединяет эффекты разных периодов.',
  modelNote:'Среднее время участия сотрудника в проекте — 20 часов при 168 рабочих часах в месяц. В затраты на команду входят работа менеджера, специалиста по проекту, эксперта по кейсу и пяти членов жюри с учётом подготовки.',
  inputs:[
    {id:'participantsCount', label:'Количество участников проекта', unit:'чел.', def:200, group:'main', step:1},
    {id:'participantSalary', label:'Средняя зарплата участника', unit:'₽/мес', def:150000, group:'main', step:1000},
    {id:'programCost', label:'Стоимость проекта Changellenge >> в затратах', unit:'₽', def:6000000, group:'main', step:100000},

    {id:'rdProjectCost', label:'Стоимость проекта для оценки R&D', unit:'₽', def:16000000, group:'advanced', step:100000,
      help:'В исходной модели оценка R&D использует 16 млн ₽, а затраты для ROI — 6 млн ₽. Эти значения настраиваются отдельно.'},
    {id:'implementedIdeasCount', label:'Реализовано идей по итогам проекта', unit:'шт.', def:2, group:'advanced', step:1},
    {id:'leaderSalary', label:'Средняя зарплата руководителя', unit:'₽/мес', def:300000, group:'advanced', step:1000},
    {id:'leadersFoundCount', label:'Найдено внутренних лидеров', unit:'чел.', def:3, group:'advanced', step:1}
  ],
  compute(v){
    const TAX=1.6, AGENCY=0.18, ADAPT_M=6, HOURS_MONTH=168, RD_HOURS=20, RD_MULT=1.25, TEAM_COST=1232000, AI_SHARE=0.42, AI_SAVE=0.0645;
    const EFF_GAIN=0.166;
    const effGain = EFF_GAIN;

    const fotMonth = v.participantSalary*TAX*v.participantsCount;
    const e1 = fotMonth*effGain;

    const rdParticipantsCount = v.participantsCount*0.3;
    const rdFot = v.participantSalary*TAX*rdParticipantsCount;
    const rdHoursCost = rdFot*RD_HOURS/HOURS_MONTH;
    const rdTotalCost = rdHoursCost+v.rdProjectCost+TEAM_COST;
    const valuePerIdea = rdTotalCost*RD_MULT;
    const e2 = v.implementedIdeasCount*valuePerIdea;

    const hireLeaderCost = v.leaderSalary*12*AGENCY;
    const adaptLoss = v.leaderSalary*ADAPT_M;
    const e3 = (hireLeaderCost+adaptLoss)*v.leadersFoundCount;

    const aiFot = v.participantSalary*TAX*v.participantsCount;
    const e4 = aiFot*AI_SAVE*AI_SHARE;

    const total = e1+e2+e3+e4;
    const cost = rdHoursCost+v.programCost+TEAM_COST;
    const roi = cost > 0 ? (total-cost)/cost : null;

    return {
      total, cost, roi,
      effects:[
        {id:'e1', label:'Рост эффективности участников', amount:e1,
          logic:'Проект повышает продуктивность участников. Модель переводит рост эффективности в денежный эквивалент через стоимость их рабочего времени.',
          data:[
            {k:'Расход на ФОТ участников в месяц (с налогами)', v:fmtMoneyFull(fotMonth)},
            {k:'Рост эффективности по итогам проекта (за один месяц)', v:fmtPercent(effGain,1)}
          ],
          result:'Эффект = '+fmtMoneyFull(e1),
          source:'По данным Stanford University, команды с высоким уровнем вовлечения работают на 50% продуктивнее. Модель использует консервативную оценку — в 3 раза меньше (16,6%) с поправкой на российский рынок.'
        },
        {id:'e2', label:'Эффект от R&D / краудсорсинга', amount:e2,
          logic:'Во время проекта сотрудники решают реальные бизнес-задачи компании. Стоимость их времени, стоимость проекта и работы команды формируют инвестицию в R&D — внедрённые идеи возвращают её с доходностью.',
          data:[
            {k:'Работают над кейсом (30% участников)', v:fmtNum(rdParticipantsCount,1)+' чел.'},
            {k:'Стоимость 20 часов работы участников', v:fmtMoneyFull(rdHoursCost)},
            {k:'Стоимость проекта для оценки R&D', v:fmtMoneyFull(v.rdProjectCost)},
            {k:'ФОТ команды реализации, 3 мес. (фикс.)', v:fmtMoneyFull(TEAM_COST)},
            {k:'Реализовано идей', v:fmtNum(v.implementedIdeasCount)+' шт.'}
          ],
          result:'Эффект = '+fmtMoneyFull(valuePerIdea)+' на идею × '+fmtNum(v.implementedIdeasCount)+' = '+fmtMoneyFull(e2),
          source:'Hall, Mairesse, Mohnen — «Measuring the Returns to R&D»: медианная частная ставка возврата на R&D около 25%, медианная социальная ставка — около 56%. Модель использует консервативный множитель 1,25 к объёму инвестиций в R&D.'
        },
        {id:'e3', label:'Эффект от поиска внутренних лидеров', amount:e3,
          logic:'Проект помогает выявить перспективных сотрудников внутри компании — альтернатива поиску руководителя на внешнем рынке.',
          data:[
            {k:'Стоимость найма руководителя с рынка (18% годовой ЗП)', v:fmtMoneyFull(hireLeaderCost)},
            {k:'Потери на адаптации руководителя с рынка (6 мес. ЗП)', v:fmtMoneyFull(adaptLoss)},
            {k:'Найдено внутренних лидеров', v:fmtNum(v.leadersFoundCount)+' чел.'}
          ],
          result:'Эффект = '+fmtMoneyFull(e3),
          source:'Стоимость найма — рыночный показатель через рекрутинговое агентство (15–20%). Потери на адаптации — не менее 6 месяцев до полной эффективности, по данным Всероссийского исследования корпоративных программ адаптации.'
        },
        {id:'e4', label:'Эффект от роста эффективности использования ИИ', amount:e4,
          logic:'Часть участников начинает эффективнее использовать AI-инструменты в работе, что экономит их рабочее время.',
          data:[
            {k:'Участников проекта (база расчёта ИИ)', v:fmtNum(v.participantsCount)+' чел.'},
            {k:'Расход на ФОТ всех участников (месяц)', v:fmtMoneyFull(aiFot)},
            {k:'Доля сотрудников, повышающих эффективность', v:fmtPercent(AI_SHARE,0)},
            {k:'Экономия времени в пересчёте на процент от рабочих дней', v:fmtPercent(AI_SAVE,2)}
          ],
          result:'Эффект = '+fmtMoneyFull(e4),
          source:'BCG workforce benchmark: 42% регулярных пользователей ИИ отмечают экономию целого рабочего дня в неделю и более. Модель использует консервативную оценку — 1 день в 3 недели (4 дня за 3 месяца), что даёт ≈6,45% прироста эффективности.'
        }
      ],
      costBreakdown:[
        {k:'Стоимость 20 часов работы сотрудников', v:fmtMoneyFull(rdHoursCost)},
        {k:'Стоимость проекта Changellenge >>', v:fmtMoneyFull(v.programCost)},
        {k:'ФОТ команды реализации (фикс.)', v:fmtMoneyFull(TEAM_COST)}
      ]
    };
  }
};
