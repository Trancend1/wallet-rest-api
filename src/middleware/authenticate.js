const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { env } = require('../config/env');
const { ApiError } = require('../utils/api-error');

async function authenticate(req, res, next) {
  const header = req.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) return next(new ApiError(401, 'Unauthenticated'));
  try {
    const payload = jwt.verify(header.slice(7), env.accessSecret, { algorithms: ['HS256'] });
    if (payload.type !== 'access') throw new Error('Wrong token type');
    const user = await User.findByPk(payload.sub);
    if (!user) throw new Error('User missing');
    req.user = user;
    return next();
  } catch {
    return next(new ApiError(401, 'Unauthenticated'));
  }
}

module.exports = { authenticate };
