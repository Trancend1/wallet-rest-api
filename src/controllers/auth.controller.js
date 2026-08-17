const authService = require('../services/auth.service');
const { success, publicUser } = require('../utils/responses');

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(success(publicUser(user)));
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try { res.json(success(await authService.login(req.body))); } catch (error) { next(error); }
}

async function refresh(req, res, next) {
  try { res.json(success(await authService.refresh(req.body.refresh_token))); } catch (error) { next(error); }
}

module.exports = { register, login, refresh };
