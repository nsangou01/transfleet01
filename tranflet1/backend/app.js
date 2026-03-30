'use strict';
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const routes     = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 10,
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' } }));
app.use('/api', rateLimit({ windowMs: 60*1000, max: 300 }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', routes);
app.get('/health', (_req, res) => res.json({ status:'ok', service:'TRANSFLET API', ts: new Date() }));
app.use((_req, res) => res.status(404).json({ message: 'Route introuvable' }));
app.use(errorHandler);

module.exports = app;
