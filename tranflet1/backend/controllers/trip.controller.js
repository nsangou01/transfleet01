'use strict';
const { Op } = require('sequelize');
const { Trip, Vehicle, Driver, User } = require('../models');

const tripIncludes = [
  { model: Vehicle, as: 'vehicle', attributes: ['id','plate','brand','model'] },
  { model: Driver,  as: 'driver',  include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name'] }] },
];

exports.list = async (req, res, next) => {
  try {
    const { status, vehicle_id, driver_id, from_date, to_date, page=1, limit=50 } = req.query;
    const where = {};
    if (status)     where.status     = status;
    if (vehicle_id) where.vehicle_id = vehicle_id;
    if (driver_id)  where.driver_id  = driver_id;
    if (from_date || to_date) {
      where.scheduled_start = {};
      if (from_date) where.scheduled_start[Op.gte] = new Date(from_date);
      if (to_date)   where.scheduled_start[Op.lte] = new Date(to_date);
    }
    // Les conducteurs ne voient que leurs propres trajets
    if (req.user.role === 'driver') {
      const { Driver: D } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (d) where.driver_id = d.id;
    }
    const { count, rows } = await Trip.findAndCountAll({
      where, include: tripIncludes,
      order: [['scheduled_start','DESC']], limit: +limit, offset: (+page-1)* +limit,
    });
    res.json({ total: count, data: rows });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const t = await Trip.findByPk(req.params.id, { include: tripIncludes });
    if (!t) return res.status(404).json({ message: 'Trajet introuvable' });
    res.json(t);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const trip = await Trip.create({ ...req.body, created_by: req.user.id });
    // Mettre à jour statuts
    await Vehicle.update({ status: 'in_use' },  { where: { id: trip.vehicle_id } });
    await Driver.update(  { status: 'on_trip' }, { where: { id: trip.driver_id  } });
    const full = await Trip.findByPk(trip.id, { include: tripIncludes });
    res.status(201).json(full);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const t = await Trip.findByPk(req.params.id);
    if (!t) return res.status(404).json({ message: 'Trajet introuvable' });
    await t.update(req.body);
    const updated = await Trip.findByPk(t.id, { include: tripIncludes });
    res.json(updated);
  } catch (err) { next(err); }
};

exports.complete = async (req, res, next) => {
  try {
    const t = await Trip.findByPk(req.params.id);
    if (!t) return res.status(404).json({ message: 'Trajet introuvable' });
    const now = new Date();
    await t.update({ status:'completed', actual_end: now, ...req.body });
    await Vehicle.update({ status: 'available' }, { where: { id: t.vehicle_id } });
    await Driver.update(  { status: 'available', total_trips: require('sequelize').literal('total_trips + 1') },
      { where: { id: t.driver_id } });
    res.json(await Trip.findByPk(t.id, { include: tripIncludes }));
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const t = await Trip.findByPk(req.params.id);
    if (!t) return res.status(404).json({ message: 'Trajet introuvable' });
    await t.update({ status: 'cancelled', notes: req.body.reason || t.notes });
    await Vehicle.update({ status: 'available' }, { where: { id: t.vehicle_id } });
    await Driver.update(  { status: 'available' }, { where: { id: t.driver_id } });
    res.json(t);
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const trips = await Trip.findAll({ attributes: ['status','actual_distance','fuel_used'] });
    const byStatus = {};
    let totalDist = 0, totalFuel = 0;
    trips.forEach(t => {
      byStatus[t.status] = (byStatus[t.status]||0)+1;
      totalDist += parseFloat(t.actual_distance||0);
      totalFuel += parseFloat(t.fuel_used||0);
    });
    res.json({ total: trips.length, by_status: byStatus, total_distance: totalDist.toFixed(2), total_fuel_used: totalFuel.toFixed(2) });
  } catch (err) { next(err); }
};
