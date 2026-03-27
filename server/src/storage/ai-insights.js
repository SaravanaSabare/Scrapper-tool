import fs from 'fs/promises';
import path from 'path';
import { ensureDir } from './excel-store.js';

const emptyInsights = {
  jobs: {},
  notices: {}
};

export async function readInsights(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);
    return {
      ...emptyInsights,
      ...data,
      jobs: { ...emptyInsights.jobs, ...(data.jobs || {}) },
      notices: { ...emptyInsights.notices, ...(data.notices || {}) }
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { ...emptyInsights };
    }
    throw err;
  }
}

export async function writeInsights(filePath, data) {
  ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function upsertInsight(filePath, type, itemId, insight) {
  const data = await readInsights(filePath);
  if (!data[type]) {
    data[type] = {};
  }
  data[type][itemId] = insight;
  await writeInsights(filePath, data);
  return data;
}

export default { readInsights, writeInsights, upsertInsight };
