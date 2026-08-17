const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UniqueConstraintError } = require('sequelize');
const { User, RefreshToken } = require('../models');
const { env } = require('../config/env');
const { ApiError } = require('../utils/api-error');
const { requireString, requirePin } = require('../utils/validation');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function accessToken(userId) {
  return jwt.sign({ sub: userId, type: 'access' }, env.accessSecret, {
    expiresIn: env.accessTtl,
    jwtid: crypto.randomUUID(),
  });
}

async function issueTokens(userId) {
  const access = accessToken(userId);
  const tokenId = crypto.randomUUID();
  const refresh = jwt.sign({ sub: userId, type: 'refresh' }, env.refreshSecret, {
    expiresIn: env.refreshTtl,
    jwtid: tokenId,
  });
  const payload = jwt.decode(refresh);
  await RefreshToken.create({
    token_id: tokenId,
    user_id: userId,
    token_hash: hashToken(refresh),
    expires_at: new Date(payload.exp * 1000),
  });
  return { access_token: access, refresh_token: refresh };
}

async function register(data) {
  const values = {
    user_id: crypto.randomUUID(),
    first_name: requireString(data.first_name, 'first_name'),
    last_name: requireString(data.last_name, 'last_name'),
    phone_number: requireString(data.phone_number, 'phone_number'),
    address: requireString(data.address, 'address'),
    pin_hash: await bcrypt.hash(requirePin(data.pin), 10),
  };
  try {
    return await User.create(values);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ApiError(409, 'Phone Number already registered');
    }
    throw error;
  }
}

async function login(data) {
  const phone = requireString(data.phone_number, 'phone_number');
  const pin = requirePin(data.pin);
  const user = await User.findOne({ where: { phone_number: phone } });
  if (!user || !(await bcrypt.compare(pin, user.pin_hash))) {
    throw new ApiError(401, "Phone number and pin doesn't match.");
  }
  return issueTokens(user.user_id);
}

async function refresh(refreshToken) {
  if (typeof refreshToken !== 'string') throw new ApiError(401, 'Invalid refresh token');
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.refreshSecret, { algorithms: ['HS256'] });
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }
  if (payload.type !== 'refresh') throw new ApiError(401, 'Invalid refresh token');
  const stored = await RefreshToken.findOne({
    where: { token_id: payload.jti, token_hash: hashToken(refreshToken), revoked_at: null },
  });
  if (!stored || stored.expires_at <= new Date()) throw new ApiError(401, 'Invalid refresh token');
  return { access_token: accessToken(payload.sub) };
}

module.exports = { register, login, refresh, hashToken };
