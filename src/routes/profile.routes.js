const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const controller = require('../controllers/profile.controller');

const router = express.Router();
router.put('/profile', authenticate, controller.update);

module.exports = { profileRouter: router };
