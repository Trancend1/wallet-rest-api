const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const controller = require('../controllers/transaction.controller');

const router = express.Router();
router.get('/transactions', authenticate, controller.list);

module.exports = { transactionRouter: router };
