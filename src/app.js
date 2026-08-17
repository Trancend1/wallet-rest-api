const express = require('express');
const { router } = require('./routes');
const { notFound } = require('./middleware/not-found');
const { errorHandler } = require('./middleware/error-handler');

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(express.json({ limit: '32kb' }));
app.get('/health', (req, res) => res.json({ status: 'SUCCESS' }));
app.use(router);
app.use(notFound);
app.use(errorHandler);

module.exports = { app };
