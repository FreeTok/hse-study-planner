const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDeadline(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Укажите дату дедлайна.');
  }

  const deadline = new Date(`${value}T00:00:00`);

  if (Number.isNaN(deadline.getTime())) {
    throw new Error('Дата дедлайна указана в неправильном формате.');
  }

  return deadline;
}

function parsePositiveNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${fieldName} должно быть больше нуля.`);
  }

  return number;
}

export function createStudyPlan(input, now = new Date()) {
  const title = typeof input?.title === 'string' ? input.title.trim() : '';

  if (title.length < 2) {
    throw new Error('Название задания должно быть не короче двух символов.');
  }

  if (title.length > 80) {
    throw new Error('Название задания слишком длинное.');
  }

  const deadline = parseDeadline(input.deadline);
  const totalHours = parsePositiveNumber(input.totalHours, 'Количество часов');
  const dailyLimit = parsePositiveNumber(input.dailyLimit, 'Лимит часов в день');
  const today = startOfLocalDay(now);
  const deadlineDay = startOfLocalDay(deadline);
  const daysUntilDeadline = Math.floor((deadlineDay.getTime() - today.getTime()) / DAY_MS);

  if (daysUntilDeadline < 0) {
    throw new Error('Дедлайн уже прошел. Выберите сегодняшнюю или будущую дату.');
  }

  const availableDays = daysUntilDeadline + 1;
  const requiredPerDay = totalHours / availableDays;
  const capacity = dailyLimit * availableDays;
  const spareHours = capacity - totalHours;
  const roundedRequired = Math.ceil(requiredPerDay * 10) / 10;
  const roundedSpare = Math.round(spareHours * 10) / 10;
  const risk = spareHours < 0 ? 'high' : requiredPerDay > dailyLimit * 0.8 ? 'medium' : 'low';
  const dailyPlan = Array.from({ length: availableDays }, (_, index) => ({
    day: index + 1,
    hours: roundedRequired,
  }));

  let message = 'План выглядит спокойно: времени достаточно, можно работать без аврала.';

  if (risk === 'medium') {
    message = 'План плотный: лучше начинать сегодня и не пропускать дни.';
  }

  if (risk === 'high') {
    message = 'Есть риск не успеть: доступного времени меньше, чем нужно.';
  }

  return {
    title,
    deadline: input.deadline,
    totalHours,
    dailyLimit,
    availableDays,
    requiredPerDay: roundedRequired,
    capacity,
    spareHours: roundedSpare,
    risk,
    message,
    dailyPlan,
  };
}
