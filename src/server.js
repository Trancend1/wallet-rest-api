const { app } = require('./app');
const { env } = require('./config/env');
const { runMigrations } = require('../scripts/migrate');

runMigrations()
  .then(() => {
    app.listen(env.port, () => console.log(`Wallet API listening on port ${env.port}`));
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
