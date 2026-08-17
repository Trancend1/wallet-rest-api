const crypto = require('node:crypto');
const { Transaction } = require('sequelize');
const { sequelize, User, WalletTransaction, TransferJob } = require('../models');

async function claimNextJob() {
  return sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async (dbTransaction) => {
    const job = await TransferJob.findOne({
      where: { status: 'PENDING' },
      order: [['created_at', 'ASC']],
      transaction: dbTransaction,
    });
    if (!job) return null;
    await job.update({ status: 'PROCESSING', attempts: job.attempts + 1 }, { transaction: dbTransaction });
    return job.transfer_id;
  });
}

async function processClaimedJob(transferId) {
  return sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async (dbTransaction) => {
    const job = await TransferJob.findByPk(transferId, { transaction: dbTransaction });
    const source = await User.findByPk(job.source_user_id, { transaction: dbTransaction });
    const target = await User.findByPk(job.target_user_id, { transaction: dbTransaction });

    if (!source || !target || source.balance < job.amount) {
      const reason = !source || !target ? 'User not found' : 'Balance is not enough';
      await job.update({ status: 'FAILED', error_message: reason, processed_at: new Date() }, { transaction: dbTransaction });
      return job;
    }

    const sourceBefore = source.balance;
    const sourceAfter = sourceBefore - job.amount;
    const targetBefore = target.balance;
    const targetAfter = targetBefore + job.amount;
    if (!Number.isSafeInteger(targetAfter)) {
      await job.update({ status: 'FAILED', error_message: 'Balance limit exceeded', processed_at: new Date() }, { transaction: dbTransaction });
      return job;
    }

    await source.update({ balance: sourceAfter }, { transaction: dbTransaction });
    await target.update({ balance: targetAfter }, { transaction: dbTransaction });
    await WalletTransaction.bulkCreate([
      {
        transaction_id: crypto.randomUUID(), user_id: source.user_id, reference_id: job.transfer_id,
        transaction_type: 'DEBIT', activity_type: 'TRANSFER_OUT', amount: job.amount,
        remarks: job.remarks, balance_before: sourceBefore, balance_after: sourceAfter,
      },
      {
        transaction_id: crypto.randomUUID(), user_id: target.user_id, reference_id: job.transfer_id,
        transaction_type: 'CREDIT', activity_type: 'TRANSFER_IN', amount: job.amount,
        remarks: job.remarks, balance_before: targetBefore, balance_after: targetAfter,
      },
    ], { transaction: dbTransaction });
    await job.update({ status: 'SUCCESS', error_message: null, processed_at: new Date() }, { transaction: dbTransaction });
    return job;
  });
}

async function processNextTransfer() {
  const transferId = await claimNextJob();
  if (!transferId) return null;
  return processClaimedJob(transferId);
}

module.exports = { processNextTransfer, claimNextJob, processClaimedJob };
