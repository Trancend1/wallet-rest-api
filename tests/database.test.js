const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('migration creates wallet tables and unique phone numbers', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wallet-db-'));
  process.env.DATABASE_PATH = path.join(tempDir, 'test.sqlite');

  const { sequelize, User } = require('../src/models');
  const { runMigrations } = require('../scripts/migrate');

  await runMigrations();

  const [tables] = await sequelize.query(
    "SELECT name FROM sqlite_master WHERE type = 'table'"
  );
  const names = tables.map((table) => table.name);

  assert.ok(names.includes('users'));
  assert.ok(names.includes('transactions'));
  assert.ok(names.includes('transfer_jobs'));
  assert.ok(names.includes('refresh_tokens'));

  const userData = {
    user_id: 'd031b269-6f64-4dd2-8832-14b8adadb28f',
    first_name: 'Test',
    last_name: 'User',
    phone_number: '081234567890',
    address: 'Jakarta',
    pin_hash: 'hashed-pin',
  };
  await User.create(userData);
  await assert.rejects(
    User.create({ ...userData, user_id: 'cf727103-b49f-4412-a526-d740419f0a42' })
  );

  await sequelize.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});
