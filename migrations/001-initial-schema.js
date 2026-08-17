const name = '001-initial-schema';

async function up({ sequelize }) {
  await sequelize.sync();
}

module.exports = { name, up };
