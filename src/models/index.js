const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = require('./user')(sequelize, DataTypes);
const WalletTransaction = require('./transaction')(sequelize, DataTypes);
const TransferJob = require('./transfer-job')(sequelize, DataTypes);
const RefreshToken = require('./refresh-token')(sequelize, DataTypes);

User.hasMany(WalletTransaction, { foreignKey: 'user_id' });
WalletTransaction.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { sequelize, User, WalletTransaction, TransferJob, RefreshToken };
