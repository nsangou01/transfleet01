'use strict';
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'monitrack_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host:    process.env.DB_HOST || '127.0.0.1',
    port:    parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    timezone: '+01:00',
    define: {
      underscored:   true,
      freezeTableName: true,
      timestamps:    true,
      createdAt:     'created_at',
      updatedAt:     'updated_at',
    },
  }
);

module.exports = sequelize;
