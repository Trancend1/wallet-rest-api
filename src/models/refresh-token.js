module.exports = (sequelize, DataTypes) => sequelize.define('RefreshToken', {
  token_id: { type: DataTypes.UUID, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  token_hash: { type: DataTypes.STRING, allowNull: false, unique: true },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  revoked_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'refresh_tokens',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
});
