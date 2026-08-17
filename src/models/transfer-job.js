module.exports = (sequelize, DataTypes) => sequelize.define('TransferJob', {
  transfer_id: { type: DataTypes.UUID, primaryKey: true },
  source_user_id: { type: DataTypes.UUID, allowNull: false },
  target_user_id: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.INTEGER, allowNull: false },
  remarks: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'), allowNull: false, defaultValue: 'PENDING' },
  error_message: { type: DataTypes.STRING, allowNull: true },
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  processed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'transfer_jobs',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ fields: ['status', 'created_at'] }],
});
