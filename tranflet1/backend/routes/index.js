'use strict';
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

// Imports des contrôleurs
const auth = require('../controllers/auth.controller');
const trip = require('../controllers/trip.controller');
const track = require('../controllers/tracking.controller');
const vehicle = require('../controllers/vehicle.controller');
const driver = require('../controllers/driver.controller');
const maintenance = require('../controllers/maintenance.controller');
const report = require('../controllers/report.controller'); 

const any = [authenticate];

// --- AUTHENTIFICATION ---
router.post('/auth/login', auth.login);

// --- DASHBOARD (Rétabli pour Aminata Diallo) ---
router.get('/reports/dashboard', ...any, report.dashboard);

// --- VÉHICULES ---
router.get('/vehicles', ...any, vehicle.list);
router.post('/vehicles', ...any, vehicle.create);
router.get('/vehicles/:id', ...any, vehicle.get);

// --- CHAUFFEURS ---
router.get('/drivers', ...any, driver.list);
router.post('/drivers', ...any, driver.create);

// --- TRAJETS (TRIPS) ---
router.get('/trips', ...any, trip.list);
router.post('/trips', ...any, trip.create);
router.post('/trips/:id/start', ...any, trip.start);

// --- TRACKING (Lecture seule pour éviter les crashs) ---
router.get('/tracking', ...any, track.latest);

// --- MAINTENANCE ---
router.get('/maintenance', ...any, maintenance.list);
router.post('/maintenance', ...any, maintenance.create);
router.get('/maintenance/:id', ...any, maintenance.get);

// --- ÉVITER LES ERREURS 404 DANS LA CONSOLE ---
router.get('/notifications', ...any, (req, res) => res.json({ data: [] }));

module.exports = router;