const form = document.querySelector('#planner-form');
const emptyState = document.querySelector('#empty-state');
const resultCard = document.querySelector('#result-card');
const errorMessage = document.querySelector('#error-message');
const resultTitle = document.querySelector('#result-title');
const resultMessage = document.querySelector('#result-message');
const riskLabel = document.querySelector('#risk-label');
const daysCount = document.querySelector('#days-count');
const hoursPerDay = document.querySelector('#hours-per-day');
const spareHours = document.querySelector('#spare-hours');
const dailyList = document.querySelector('#daily-list');

const riskNames = {
  low: 'спокойный план',
  medium: 'плотный план',
  high: 'риск не успеть',
};

function setError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  resultCard.classList.add('hidden');
  emptyState.classList.remove('hidden');
}

function renderPlan(plan) {
  const maxHours = Math.max(...plan.dailyPlan.map((day) => day.hours), plan.dailyLimit);

  resultTitle.textContent = plan.title;
  resultMessage.textContent = plan.message;
  riskLabel.textContent = riskNames[plan.risk] || 'план';
  riskLabel.className = `result-label ${plan.risk}`;
  daysCount.textContent = plan.availableDays;
  hoursPerDay.textContent = plan.requiredPerDay;
  spareHours.textContent = plan.spareHours;
  dailyList.replaceChildren(
    ...plan.dailyPlan.map((day) => {
      const row = document.createElement('div');
      const title = document.createElement('strong');
      const bar = document.createElement('span');
      const hours = document.createElement('span');

      row.className = 'day-row';
      title.textContent = `День ${day.day}`;
      bar.className = 'day-bar';
      bar.style.setProperty('--fill', `${Math.min((day.hours / maxHours) * 100, 100)}%`);
      hours.textContent = `${day.hours} ч`;

      row.append(title, bar, hours);
      return row;
    }),
  );

  emptyState.classList.add('hidden');
  errorMessage.classList.add('hidden');
  resultCard.classList.remove('hidden');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    title: formData.get('title'),
    deadline: formData.get('deadline'),
    totalHours: formData.get('totalHours'),
    dailyLimit: formData.get('dailyLimit'),
  };

  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Не получилось рассчитать план.');
    }

    renderPlan(data.plan);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Не получилось рассчитать план.');
  }
});
