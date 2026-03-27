import { Job, Notice } from '../models/index.js';

console.log('🔎 Running storage smoke test...');

const jobs = await Job.findAll();
const notices = await Notice.findAll();

console.log(`✅ Storage OK. Jobs: ${jobs.length}, Notices: ${notices.length}`);
