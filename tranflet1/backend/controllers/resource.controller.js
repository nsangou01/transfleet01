'use strict';
const { Op } = require('sequelize');
const { FuelRecord, Maintenance, Notification, Tracking, Vehicle, Driver, User, Trip, sequelize } = require('../models');

// ─────────────────────── FUEL ──────────────────────────────────────────────
exports.fuelList = async (req, res, next) => {
  try {
    const { vehicle_id, page = 1, limit = 50 } = req.query;
    const where = {};
    if (vehicle_id) where.vehicle_id = vehicle_id;
    if (req.user.role === 'driver') {
      const d = await Driver.findOne({ where: { user_id: req.user.id } });
      if (d) where.driver_id = d.id;
    }
    const { count, rows } = await FuelRecord.findAndCountAll({
      where,
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['id','plate','brand','model'] },
        { model: Driver,  as: 'driver',  include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name'] }] },
      ],
      order: [['date','DESC']],
      limit: +limit, offset: (+page-1)* +limit,
    });
    res.json({ total: count, page: +page, data: rows });
  } catch (err) { next(err); }
};

exports.fuelCreate = async (req, res, next) => {
  try {
    const record = await FuelRecord.create({ ...req.body, created_by: req.user.id });
    res.status(201).json(record);
  } catch (err) { next(err); }
};

exports.fuelUpdate = async (req, res, next) => {
  try {
    const f = await FuelRecord.findByPk(req.params.id);
    if (!f) return res.status(404).json({ message: 'Enregistrement introuvable' });
    await f.update(req.body);
    res.json(f);
  } catch (err) { next(err); }
};

exports.fuelDelete = async (req, res, next) => {
  try {
    const f = await FuelRecord.findByPk(req.params.id);
    if (!f) return res.status(404).json({ message: 'Enregistrement introuvable' });
    await f.destroy();
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.fuelStats = async (req, res, next) => {
  try {
    const { vehicle_id, start, end } = req.query;
    const where = {};
    if (vehicle_id) where.vehicle_id = vehicle_id;
    if (start && end) where.date = { [Op.between]: [start, end] };

    const records = await FuelRecord.findAll({ where, attributes: ['quantity','total_cost','fuel_type','vehicle_id'] });
    let totalQty = 0, totalCost = 0;
    const byFuelType = {}, byVehicle = {};
    records.forEach(r => {
      totalQty  += parseFloat(r.quantity);
      totalCost += parseFloat(r.total_cost);
      byFuelType[r.fuel_type] = (byFuelType[r.fuel_type] || 0) + parseFloat(r.total_cost);
      byVehicle[r.vehicle_id] = (byVehicle[r.vehicle_id] || 0) + parseFloat(r.total_cost);
    });
    res.json({ totalQuantity: totalQty.toFixed(1), totalCost: totalCost.toFixed(2), byFuelType, byVehicle });
  } catch (err) { next(err); }
};

// ───────────────────── MAINTENANCE ─────────────────────────────────────────
exports.maintList = async (req, res, next) => {
  try {
    const { status, vehicle_id, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status)     where.status     = status;
    if (vehicle_id) where.vehicle_id = vehicle_id;
    const { count, rows } = await Maintenance.findAndCountAll({
      where,
      include: [{ model: Vehicle, as: 'vehicle', attributes: ['id','plate','brand','model'] }],
      order: [['scheduled_date','DESC']],
      limit: +limit, offset: (+page-1)* +limit,
    });
    res.json({ total: count, page: +page, data: rows });
  } catch (err) { next(err); }
};

exports.maintCreate = async (req, res, next) => {
  try {
    const m = await Maintenance.create({ ...req.body, created_by: req.user.id });
    if (req.body.status === 'in_progress') {
      await Vehicle.update({ status: 'maintenance' }, { where: { id: req.body.vehicle_id } });
    }
    res.status(201).json(m);
  } catch (err) { next(err); }
};

exports.maintUpdate = async (req, res, next) => {
  try {
    const m = await Maintenance.findByPk(req.params.id);
    if (!m) return res.status(404).json({ message: 'Maintenance introuvable' });
    const prev = m.status;
    await m.update(req.body);
    if (req.body.status === 'in_progress' && prev !== 'in_progress') {
      await Vehicle.update({ status: 'maintenance' }, { where: { id: m.vehicle_id } });
    }
    if (req.body.status === 'completed' && prev !== 'completed') {
      await Vehicle.update({ status: 'available' }, { where: { id: m.vehicle_id } });
    }
    res.json(m);
  } catch (err) { next(err); }
};

exports.maintDelete = async (req, res, next) => {
  try {
    const m = await Maintenance.findByPk(req.params.id);
    if (!m) return res.status(404).json({ message: 'Maintenance introuvable' });
    await m.destroy();
    res.status(204).send();
  } catch (err) { next(err); }
};

// ─────────────────── NOTIFICATIONS ─────────────────────────────────────────
exports.notifList = async (req, res, next) => {
  try {
    const { is_read, page = 1, limit = 50 } = req.query;
    const where = {
      [Op.or]: [
        { recipient_id: req.user.id },
        { recipient_id: null, target_role: { [Op.in]: ['all', req.user.role] } },
      ],
    };
    if (is_read !== undefined) where.is_read = is_read === 'true';
    const { count, rows } = await Notification.findAndCountAll({
      where, order: [['created_at','DESC']],
      limit: +limit, offset: (+page-1)* +limit,
    });
    const unread = await Notification.count({ where: { ...where, is_read: false } });
    res.json({ total: count, unread, page: +page, data: rows });
  } catch (err) { next(err); }
};

exports.notifCreate = async (req, res, next) => {
  try {
    const n = await Notification.create({ ...req.body, sender_id: req.user.id });
    res.status(201).json(n);
  } catch (err) { next(err); }
};

exports.notifMarkRead = async (req, res, next) => {
  try {
    await Notification.update({ is_read: true, read_at: new Date() }, { where: { id: req.params.id } });
    res.json({ message: 'Marqué comme lu' });
  } catch (err) { next(err); }
};

exports.notifMarkAllRead = async (req, res, next) => {
  try {
    const where = {
      [Op.or]: [
        { recipient_id: req.user.id },
        { recipient_id: null, target_role: { [Op.in]: ['all', req.user.role] } },
      ],
      is_read: false,
    };
    await Notification.update({ is_read: true, read_at: new Date() }, { where });
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (err) { next(err); }
};

exports.notifDelete = async (req, res, next) => {
  try {
    await Notification.destroy({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
};

// ──────────────────────── TRACKING ─────────────────────────────────────────
exports.trackingLatest = async (req, res, next) => {
  try {
    // Dernière position de chaque véhicule
    const vehicles = await Vehicle.findAll({ attributes: ['id','plate','brand','model','status','driver_id'] });
    const results = await Promise.all(vehicles.map(async v => {
      const last = await Tracking.findOne({ where: { vehicle_id: v.id }, order: [['recorded_at','DESC']] });
      return { vehicle: v, lastPosition: last || null };
    }));
    res.json(results);
  } catch (err) { next(err); }
};

exports.trackingCreate = async (req, res, next) => {
  try {
    const point = await Tracking.create(req.body);
    // Mettre à jour le kilométrage du véhicule si fourni
    if (req.body.mileage) {
      await Vehicle.update({ mileage: req.body.mileage }, { where: { id: req.body.vehicle_id } });
    }
    res.status(201).json(point);
  } catch (err) { next(err); }
};

exports.trackingHistory = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const where = { vehicle_id: req.params.vehicleId };
    if (start && end) where.recorded_at = { [Op.between]: [new Date(start), new Date(end)] };
    const data = await Tracking.findAll({ where, order: [['recorded_at','ASC']], limit: 1000 });
    res.json(data);
  } catch (err) { next(err); }
};

// ──────────────────────── REPORTS ──────────────────────────────────────────
exports.dashboard = async (req, res, next) => {
  try {
    const [vehicles, drivers, trips, fuel, maintenance] = await Promise.all([
      Vehicle.findAll({ attributes: ['status'] }),
      Driver.findAll({ attributes: ['status'] }),
      Trip.findAll({ attributes: ['status'] }),
      FuelRecord.findAll({ attributes: ['total_cost','date'] }),
      Maintenance.findAll({ where: { status: { [Op.in]: ['scheduled','in_progress'] } }, attributes: ['id','scheduled_date','status'] }),
    ]);

    const vByStatus = {}, dByStatus = {}, tByStatus = {};
    vehicles.forEach(v  => { vByStatus[v.status]  = (vByStatus[v.status]  || 0) + 1; });
    drivers.forEach(d   => { dByStatus[d.status]   = (dByStatus[d.status]   || 0) + 1; });
    trips.forEach(t     => { tByStatus[t.status]   = (tByStatus[t.status]   || 0) + 1; });

    const today     = new Date().toISOString().split('T')[0];
    const todayCost = fuel.filter(f => f.date === today).reduce((s,f) => s + parseFloat(f.total_cost), 0);
    const monthCost = fuel.reduce((s,f) => s + parseFloat(f.total_cost), 0);

    res.json({
      vehicles:    { total: vehicles.length, ...vByStatus },
      drivers:     { total: drivers.length,  ...dByStatus },
      trips:       { total: trips.length,    ...tByStatus },
      fuel:        { todayCost, monthCost },
      maintenance: { pending: maintenance.length, records: maintenance.slice(0,5) },
    });
  } catch (err) { next(err); }
};

exports.fuelReport = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const where = {};
    if (start && end) where.date = { [Op.between]: [start, end] };

    const records = await FuelRecord.findAll({
      where,
      include: [{ model: Vehicle, as: 'vehicle', attributes: ['id','plate','brand','model'] }],
      order: [['date','DESC']],
    });

    const byVehicle = {};
    let total = 0;
    records.forEach(r => {
      const key = r.vehicle_id;
      if (!byVehicle[key]) byVehicle[key] = { vehicle: r.vehicle, qty: 0, cost: 0, count: 0 };
      byVehicle[key].qty   += parseFloat(r.quantity);
      byVehicle[key].cost  += parseFloat(r.total_cost);
      byVehicle[key].count += 1;
      total += parseFloat(r.total_cost);
    });
    res.json({ totalCost: total.toFixed(2), byVehicle: Object.values(byVehicle), records });
  } catch (err) { next(err); }
};
