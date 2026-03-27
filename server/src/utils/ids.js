import crypto from 'crypto';

export function normalizeDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function createItemId({ title, link, posted_date }) {
  const base = `${title || ''}|${link || ''}|${normalizeDate(posted_date) || ''}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

export default { createItemId, normalizeDate };
