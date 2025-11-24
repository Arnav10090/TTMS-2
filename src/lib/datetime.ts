export const toStorageTimestamp = (d: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const formatDateTimeDisplay = (value?: string | Date | null): string => {
  if (!value) return '';
  let d: Date;
  if (typeof value === 'string') {
    // accept both "YYYY-MM-DD HH:MM:SS" and ISO strings
    d = new Date(value.replace(' ', 'T'));
  } else {
    d = new Date(value);
  }

  if (isNaN(d.getTime())) return String(value);

  const timeStr = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const dateStr = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `${timeStr}, ${dateStr}`;
};
