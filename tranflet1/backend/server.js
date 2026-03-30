'use strict';
require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion MySQL établie');
    // sync only in development (en production utiliser migrations)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
    }
    app.listen(PORT, () => {
      console.log(`🚀 TRANSFLET API démarrée sur le port ${PORT}`);
      console.log(`   Mode : ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Impossible de démarrer le serveur :', err.message);
    process.exit(1);
  }
})();
