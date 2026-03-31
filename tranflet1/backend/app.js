'use strict';
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const path       = require('path');
const routes     = require('./routes'); // Importe votre index.js des routes
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Configuration de la sécurité et des accès
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Lecture des données JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Dossier public pour les images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Chargement des routes API
app.use('/api', routes);

// Santé de l'API
app.get('/health', (_req, res) => res.json({ status:'ok', service:'TRANSFLET API', ts: new Date() }));

// Gestion des erreurs
app.use((_req, res) => res.status(404).json({ message: 'Route introuvable' }));
app.use(errorHandler);

module.exports = app; // INDISPENSABLE pour server.js