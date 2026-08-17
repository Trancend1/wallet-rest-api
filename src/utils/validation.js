const { ApiError } = require('./api-error');

function requireString(value, field, maximumLength = 255) {
  if (typeof value !== 'string' || value.trim() === '' || value.trim().length > maximumLength) {
    throw new ApiError(400, 'Validation failed', [{ field, message: 'Must be a non-empty string' }]);
  }
  return value.trim();
}

function requirePin(value) {
  if (typeof value !== 'string' || value.length !== 6) {
    throw new ApiError(400, 'Validation failed', [{ field: 'pin', message: 'Must contain exactly 6 digits' }]);
  }
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] < '0' || value[index] > '9') {
      throw new ApiError(400, 'Validation failed', [{ field: 'pin', message: 'Must contain exactly 6 digits' }]);
    }
  }
  return value;
}

function requireAmount(value) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ApiError(400, 'Validation failed', [{ field: 'amount', message: 'Must be a positive integer' }]);
  }
  return value;
}

module.exports = { requireString, requirePin, requireAmount };
