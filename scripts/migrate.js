const { sequelize } = require('../src/models');
const initialSchema = require('../migrations/001-initial-schema');

async function runMigrations() {
  await sequelize.authenticate();
  await sequelize.query('PRAGMA journal_mode = WAL');
  await sequelize.query('PRAGMA busy_timeout = 5000');
  await sequelize.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(255) PRIMARY KEY, applied_at DATETIME NOT NULL)'
  );
  const [rows] = await sequelize.query(
    'SELECT name FROM schema_migrations WHERE name = :name',
    { replacements: { name: initialSchema.name } }
  );

  if (rows.length === 0) {
    await initialSchema.up({ sequelize });
    await sequelize.query(
      'INSERT INTO schema_migrations (name, applied_at) VALUES (:name, :appliedAt)',
      { replacements: { name: initialSchema.name, appliedAt: new Date().toISOString() } }
    );
  }
}

if (require.main === module) {
  runMigrations()
    .then(async () => {
      console.log('Migrations completed.');
      await sequelize.close();
    })
    .catch(async (error) => {
      console.error(error.message);
      await sequelize.close();
      process.exitCode = 1;
    });
}

module.exports = { runMigrations };
