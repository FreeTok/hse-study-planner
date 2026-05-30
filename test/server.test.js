import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../src/server.js';

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        reject(new Error('Не удалось получить адрес тестового сервера.'));
        return;
      }

      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function futureDeadline(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

test('POST /api/plan returns a study plan', async () => {
  const server = createAppServer();
  const baseUrl = await listen(server);

  try {
    const response = await fetch(`${baseUrl}/api/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Курсовой проект',
        deadline: futureDeadline(7),
        totalHours: 12,
        dailyLimit: 2,
      }),
    });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.plan.title, 'Курсовой проект');
    assert.equal(data.plan.availableDays > 0, true);
  } finally {
    await close(server);
  }
});

test('POST /api/plan returns validation errors', async () => {
  const server = createAppServer();
  const baseUrl = await listen(server);

  try {
    const response = await fetch(`${baseUrl}/api/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '',
        deadline: futureDeadline(7),
        totalHours: 12,
        dailyLimit: 2,
      }),
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.match(data.error, /Название задания/);
  } finally {
    await close(server);
  }
});
