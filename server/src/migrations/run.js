import runMigrations from './init.js';

async function main() {
  try {
    await runMigrations();
    process.exit(0);
  } catch (err) {
    console.error('Failed to run migrations:', err);
    process.exit(1);
  }
}

main();
