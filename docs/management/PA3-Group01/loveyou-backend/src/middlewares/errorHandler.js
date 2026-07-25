function errorHandler(err, req, res, next) { // eslint-disable-line
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';
  res.status(status).json({ success: false, error: { message, code } });
}

module.exports = errorHandler;
