const express = require('express');
const { authRouter } = require('./auth.routes');
const { profileRouter } = require('./profile.routes');
const { walletRouter } = require('./wallet.routes');
const { transactionRouter } = require('./transaction.routes');
const { transferRouter } = require('./transfer.routes');

const router = express.Router();
router.use(authRouter);
router.use(profileRouter);
router.use(walletRouter);
router.use(transactionRouter);
router.use(transferRouter);

module.exports = { router };
