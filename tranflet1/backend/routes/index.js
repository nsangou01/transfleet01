'use strict';
const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const auth    = require('../controllers/auth.controller');
const user    = require('../controllers/user.controller');
const vehicle = require('../controllers/vehicle.controller');
const driver  = require('../controllers/driver.controller');
const trip    = require('../controllers/trip.controller');
const fuel    = require('../controllers/fuel.controller');
const maint   = require('../controllers/maintenance.controller');
const notif   = require('../controllers/notification.controller');
const track   = require('../controllers/tracking.controller');
const report  = require('../controllers/report.controller');

const mgr = [authenticate, requireRole('manager','admin')];
const any = [authenticate];

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/login',            auth.login);
router.get( '/auth/me',        ...any, auth.me);
router.put( '/auth/password',  ...any, auth.changePassword);
router.put( '/auth/profile',   ...any, auth.updateProfile);

// ── Vehicles ──────────────────────────────────────────────────────────────────
router.get(   '/vehicles',         ...mgr, vehicle.list);
router.post(  '/vehicles',         ...mgr, vehicle.create);
router.get(   '/vehicles/stats',   ...mgr, vehicle.stats);
router.get(   '/vehicles/:id',     ...mgr, vehicle.get);
router.put(   '/vehicles/:id',     ...mgr, vehicle.update);
router.delete('/vehicles/:id',     ...mgr, vehicle.remove);
router.patch( '/vehicles/:id/assign', ...mgr, vehicle.assign);

// ── Drivers ───────────────────────────────────────────────────────────────────
router.get(   '/drivers',          ...mgr, driver.list);
router.post(  '/drivers',          ...mgr, driver.create);
router.get(   '/drivers/stats',    ...mgr, driver.stats);
router.get(   '/drivers/available',...mgr, driver.available);
router.get(   '/drivers/:id',      ...mgr, driver.get);
router.put(   '/drivers/:id',      ...mgr, driver.update);
router.delete('/drivers/:id',      ...mgr, driver.remove);

// ── Trips ─────────────────────────────────────────────────────────────────────
router.get(   '/trips',              ...any, trip.list);
router.post(  '/trips',              ...mgr, trip.create);
router.get(   '/trips/stats',        ...mgr, trip.stats);
router.get(   '/trips/:id',          ...any, trip.get);
router.put(   '/trips/:id',          ...mgr, trip.update);
router.post(  '/trips/:id/complete', ...mgr, trip.complete);
router.post(  '/trips/:id/cancel',   ...mgr, trip.cancel);

// ── Fuel ──────────────────────────────────────────────────────────────────────
router.get(   '/fuel',       ...mgr, fuel.list);
router.post(  '/fuel',       ...mgr, fuel.create);
router.get(   '/fuel/stats', ...mgr, fuel.stats);
router.get(   '/fuel/:id',   ...mgr, fuel.get);
router.put(   '/fuel/:id',   ...mgr, fuel.update);
router.delete('/fuel/:id',   ...mgr, fuel.remove);

// ── Maintenance ───────────────────────────────────────────────────────────────
router.get(   '/maintenance',          ...mgr, maint.list);
router.post(  '/maintenance',          ...mgr, maint.create);
router.get(   '/maintenance/upcoming', ...mgr, maint.upcoming);
router.get(   '/maintenance/:id',      ...mgr, maint.get);
router.put(   '/maintenance/:id',      ...mgr, maint.update);
router.delete('/maintenance/:id',      ...mgr, maint.remove);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get(  '/notifications',              ...any, notif.list);
router.post( '/notifications',              ...mgr, notif.create);
router.get(  '/notifications/unread-count', ...any, notif.unreadCount);
router.patch('/notifications/read-all',     ...any, notif.markAllRead);
router.patch('/notifications/:id/read',     ...any, notif.markRead);
router.delete('/notifications/:id',         ...mgr, notif.remove);

// ── Tracking ──────────────────────────────────────────────────────────────────
router.get( '/tracking',                  ...mgr, track.latest);
router.post('/tracking',                  ...any, track.create);
router.get( '/tracking/:vehicleId/history',...mgr, track.history);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports/dashboard', ...mgr, report.dashboard);
router.get('/reports/vehicles',  ...mgr, report.vehicles);
router.get('/reports/drivers',   ...mgr, report.drivers);
router.get('/reports/costs',     ...mgr, report.costs);

// ── Users ─────────────────────────────────────────────────────────────────────
const admin = [authenticate, requireRole('admin')];
const adminOrManager = [authenticate, requireRole('admin', 'manager')];
router.get(   '/users',           ...admin, user.list);
router.post(  '/users/managers',  ...admin, user.createManager);
router.post(  '/users/drivers',   ...mgr,   user.createDriver);
router.patch( '/users/:id/toggle',...admin, user.toggleActive);
router.delete('/users/:id',       ...admin, user.remove);
router.post(  '/users/:id/reset-password', ...adminOrManager, user.resetPassword);

module.exports = router;
