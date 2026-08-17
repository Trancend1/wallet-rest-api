module.exports = (sequelize, DataTypes) => sequelize.define('WalletTransaction', {
  transaction_id: { type: DataTypes.UUID, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  reference_id: { type: DataTypes.UUID, allowNull: false },
  transaction_type: { type: DataTypes.ENUM('CREDIT', 'DEBIT'), allowNull: false },
  activity_type: { type: DataTypes.ENUM('TOP_UP', 'PAYMENT', 'TRANSFER_OUT', 'TRANSFER_IN'), allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  remarks: { type: DataTypes.STRING, allowNull: false },
  balance_before: { type: DataTypes.INTEGER, allowNull: false },
  balance_after: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('SUCCESS', 'FAILED'), allowNull: false, defaultValue: 'SUCCESS' },
}, {
  tableName: 'transactions',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [{ fields: ['user_id', 'created_at'] }],
});
