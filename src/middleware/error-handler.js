const { ApiError } = require('../utils/api-error');

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof ApiError) {
    const body = { message: error.message };
    if (error.details) body.details = error.details;
    return res.status(error.status).json(body);
  }
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({ message: 'Malformed JSON' });
  }
  if (process.env.NODE_ENV !== 'test') console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = { errorHandler };
