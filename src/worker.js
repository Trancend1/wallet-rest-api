const { env } = require('./config/env');
const { sequelize, TransferJob } = require('./models');
const { runMigrations } = require('../scripts/migrate');
const { processNextTransfer } = require('./workers/transfer-worker');

let running = true;
let timer;

async function poll() {
  if (!running) return;
  try {
    let processed;
    do { processed = await processNextTransfer(); } while (processed && running);
  } catch (error) {
    console.error('Transfer worker error:', error.message);
  }
  if (running) timer = setTimeout(poll, env.workerPollIntervalMs);
}

async function shutdown() {
  running = false;
  if (timer) clearTimeout(timer);
  await sequelize.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

runMigrations()
  .then(async () => {
    await TransferJob.update({ status: 'PENDING' }, { where: { status: 'PROCESSING' } });
    console.log('Transfer worker started.');
    await poll();
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
