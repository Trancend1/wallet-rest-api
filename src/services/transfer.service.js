const crypto = require('node:crypto');
const { User, TransferJob } = require('../models');
const { ApiError } = require('../utils/api-error');
const { requireAmount, requireString } = require('../utils/validation');

function serializeJob(job) {
  return {
    transfer_id: job.transfer_id,
    target_user: job.target_user_id,
    amount: job.amount,
    remarks: job.remarks,
    status: job.status,
    error_message: job.error_message,
    created_date: job.created_at.toISOString(),
    processed_date: job.processed_at ? job.processed_at.toISOString() : null,
  };
}

async function enqueueTransfer(sourceUser, data) {
  const targetId = requireString(data.target_user, 'target_user');
  const amount = requireAmount(data.amount);
  const remarks = requireString(data.remarks, 'remarks');
  if (targetId === sourceUser.user_id) throw new ApiError(400, 'Cannot transfer to yourself');
  const target = await User.findByPk(targetId);
  if (!target) throw new ApiError(404, 'Target user not found');
  await sourceUser.reload();
  if (sourceUser.balance < amount) throw new ApiError(422, 'Balance is not enough');
  const job = await TransferJob.create({
    transfer_id: crypto.randomUUID(),
    source_user_id: sourceUser.user_id,
    target_user_id: targetId,
    amount,
    remarks,
  });
  return serializeJob(job);
}

async function getTransfer(userId, transferId) {
  const job = await TransferJob.findOne({ where: { transfer_id: transferId, source_user_id: userId } });
  if (!job) throw new ApiError(404, 'Transfer not found');
  return serializeJob(job);
}

module.exports = { enqueueTransfer, getTransfer, serializeJob };
