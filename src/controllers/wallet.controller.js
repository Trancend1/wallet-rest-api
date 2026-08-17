const walletService = require('../services/wallet.service');
const { success } = require('../utils/responses');

async function topUp(req, res, next) {
  try { res.status(201).json(success(await walletService.topUp(req.user.user_id, req.body.amount))); }
  catch (error) { next(error); }
}

async function pay(req, res, next) {
  try { res.status(201).json(success(await walletService.pay(req.user.user_id, req.body.amount, req.body.remarks))); }
  catch (error) { next(error); }
}

module.exports = { topUp, pay };
