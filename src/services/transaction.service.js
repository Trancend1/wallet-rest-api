const { WalletTransaction } = require('../models');

async function listTransactions(userId) {
  const rows = await WalletTransaction.findAll({ where: { user_id: userId }, order: [['created_at', 'DESC']] });
  return rows.map((row) => ({
    transaction_id: row.reference_id,
    status: row.status,
    user_id: row.user_id,
    transaction_type: row.transaction_type,
    activity_type: row.activity_type,
    amount: row.amount,
    remarks: row.remarks,
    balance_before: row.balance_before,
    balance_after: row.balance_after,
    created_date: row.created_at.toISOString(),
  }));
}

module.exports = { listTransactions };
