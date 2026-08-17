const transferService = require('../services/transfer.service');
const { success } = require('../utils/responses');

async function create(req, res, next) {
  try { res.status(202).json(success(await transferService.enqueueTransfer(req.user, req.body))); }
  catch (error) { next(error); }
}

async function get(req, res, next) {
  try { res.json(success(await transferService.getTransfer(req.user.user_id, req.params.transfer_id))); }
  catch (error) { next(error); }
}

module.exports = { create, get };
