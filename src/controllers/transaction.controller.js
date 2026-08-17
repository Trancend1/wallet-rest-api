const { listTransactions } = require('../services/transaction.service');
const { success } = require('../utils/responses');

async function list(req, res, next) {
  try { res.json(success(await listTransactions(req.user.user_id))); } catch (error) { next(error); }
}

module.exports = { list };
