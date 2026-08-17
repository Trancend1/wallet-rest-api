const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const controller = require('../controllers/wallet.controller');

const router = express.Router();
router.post('/topup', authenticate, controller.topUp);
router.post('/pay', authenticate, controller.pay);

module.exports = { walletRouter: router };
