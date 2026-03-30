'use strict';
const { ValidationError, UniqueConstraintError } = require('sequelize');

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof ValidationError || err instanceof UniqueConstraintError) {
    const messages = err.errors.map(e => e.message);
    return res.status(422).json({ message: 'Données invalides', errors: messages });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Erreur interne du serveur';

  if (status >= 500) {
    console.error('[ERROR]', err.stack || err.message);
  }

  res.status(status).json({ message });
};
