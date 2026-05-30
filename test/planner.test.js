import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudyPlan } from '../src/planner.js';

test('creates a calm plan when there is enough time', () => {
  const plan = createStudyPlan(
    {
      title: 'Доклад по истории',
      deadline: '2026-05-30',
      totalHours: 8,
      dailyLimit: 2,
    },
    new Date('2026-05-24T12:00:00'),
  );

  assert.equal(plan.availableDays, 7);
  assert.equal(plan.requiredPerDay, 1.2);
  assert.equal(plan.risk, 'low');
  assert.equal(plan.dailyPlan.length, 7);
});

test('marks a plan as risky when there is not enough capacity', () => {
  const plan = createStudyPlan(
    {
      title: 'Лабораторная работа',
      deadline: '2026-05-27',
      totalHours: 10,
      dailyLimit: 2,
    },
    new Date('2026-05-24T12:00:00'),
  );

  assert.equal(plan.availableDays, 4);
  assert.equal(plan.spareHours, -2);
  assert.equal(plan.risk, 'high');
});

test('rejects a deadline in the past', () => {
  assert.throws(
    () =>
      createStudyPlan(
        {
          title: 'Старое задание',
          deadline: '2026-05-20',
          totalHours: 3,
          dailyLimit: 1,
        },
        new Date('2026-05-24T12:00:00'),
      ),
    /Дедлайн уже прошел/,
  );
});

test('rejects empty titles', () => {
  assert.throws(
    () =>
      createStudyPlan(
        {
          title: '',
          deadline: '2026-05-30',
          totalHours: 3,
          dailyLimit: 1,
        },
        new Date('2026-05-24T12:00:00'),
      ),
    /Название задания/,
  );
});
