const crypto = require('node:crypto');
const { Transaction } = require('sequelize');
const { sequelize, User, WalletTransaction } = require('../models');
const { ApiError } = require('../utils/api-error');
const { requireAmount, requireString } = require('../utils/validation');

async function topUp(userId, rawAmount) {
  const amount = requireAmount(rawAmount);
  return sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async (dbTransaction) => {
    const user = await User.findByPk(userId, { transaction: dbTransaction });
    const before = user.balance;
    const after = before + amount;
    if (!Number.isSafeInteger(after)) throw new ApiError(422, 'Balance limit exceeded');
    await user.update({ balance: after }, { transaction: dbTransaction });
    const id = crypto.randomUUID();
    await WalletTransaction.create({
      transaction_id: crypto.randomUUID(), user_id: userId, reference_id: id,
      transaction_type: 'CREDIT', activity_type: 'TOP_UP', amount,
      remarks: 'Top Up', balance_before: before, balance_after: after,
    }, { transaction: dbTransaction });
    return { top_up_id: id, amount_top_up: amount, balance_before: before, balance_after: after, created_date: new Date().toISOString() };
  });
}

async function pay(userId, rawAmount, rawRemarks) {
  const amount = requireAmount(rawAmount);
  const remarks = requireString(rawRemarks, 'remarks');
  return sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async (dbTransaction) => {
    const user = await User.findByPk(userId, { transaction: dbTransaction });
    const before = user.balance;
    if (before < amount) throw new ApiError(422, 'Balance is not enough');
    const after = before - amount;
    await user.update({ balance: after }, { transaction: dbTransaction });
    const id = crypto.randomUUID();
    await WalletTransaction.create({
      transaction_id: crypto.randomUUID(), user_id: userId, reference_id: id,
      transaction_type: 'DEBIT', activity_type: 'PAYMENT', amount, remarks,
      balance_before: before, balance_after: after,
    }, { transaction: dbTransaction });
    return { payment_id: id, amount, remarks, balance_before: before, balance_after: after, created_date: new Date().toISOString() };
  });
}

module.exports = { topUp, pay };
