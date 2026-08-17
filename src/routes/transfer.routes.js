const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const controller = require('../controllers/transfer.controller');

const router = express.Router();
router.post('/transfer', authenticate, controller.create);
router.get('/transfers/:transfer_id', authenticate, controller.get);

module.exports = { transferRouter: router };
