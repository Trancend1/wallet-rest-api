const fs = require('node:fs');
const path = require('node:path');
const { Sequelize } = require('sequelize');
const { env } = require('./env');

const databaseDirectory = path.dirname(env.databasePath);
fs.mkdirSync(databaseDirectory, { recursive: true });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: env.databasePath,
  logging: false,
  retry: { max: 5 },
});

module.exports = { sequelize };
