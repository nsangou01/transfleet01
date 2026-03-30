'use strict';
const { Op } = require('sequelize');
const { Vehicle, Driver, User, Trip, Fuel, Maintenance } = require('../models');

const vehicleIncludes = [
  { model: User,   as: 'assignedDriver', attributes: ['id','first_name','last_name','email','phone'] },
];

exports.list = async (req, res, next) => {
  try {
    const { status, brand, search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (brand)  where.brand  = brand;
    if (search) where[Op.or] = [
      { plate: { [Op.like]: `%${search}%` } },
      { brand: { [Op.like]: `%${search}%` } },
      { model: { [Op.like]: `%${search}%` } },
    ];
    const { count, rows } = await Vehicle.findAndCountAll({
      where, include: vehicleIncludes,
      order: [['created_at','DESC']], limit: +limit, offset: (+page-1)* +limit,
    });
    res.json({ total: count, data: rows });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const v = await Vehicle.findByPk(req.params.id, { include: vehicleIncludes });
    if (!v) return res.status(404).json({ message: 'Véhicule introuvable' });
    res.json(v);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const v = await Vehicle.create({ ...req.body, created_by: req.user.id });
    res.status(201).json(v);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const v = await Vehicle.findByPk(req.params.id);
    if (!v) return res.status(404).json({ message: 'Véhicule introuvable' });
    await v.update(req.body);
    const updated = await Vehicle.findByPk(v.id, { include: vehicleIncludes });
    res.json(updated);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const v = await Vehicle.findByPk(req.params.id);
    if (!v) return res.status(404).json({ message: 'Véhicule introuvable' });
    const hasTrips = await Trip.count({ where: { vehicle_id: v.id, status: 'in_progress' } });
    if (hasTrips) return res.status(409).json({ message: 'Impossible de supprimer : trajet en cours' });
    await v.destroy();
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.assign = async (req, res, next) => {
  try {
    const v = await Vehicle.findByPk(req.params.id);
    if (!v) return res.status(404).json({ message: 'Véhicule introuvable' });
    await v.update({ driver_id: req.body.driver_id || null, status: req.body.driver_id ? 'in_use' : 'available' });
    if (req.body.driver_id) {
      await Driver.update({ vehicle_id: v.id, status: 'on_trip' }, { where: { user_id: req.body.driver_id } });
    }
    res.json(v);
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.findAll({ attributes: ['status', 'fuel_type'] });
    const byStatus   = {};
    const byFuelType = {};
    vehicles.forEach(v => {
      byStatus[v.status]     = (byStatus[v.status]   || 0) + 1;
      byFuelType[v.fuel_type]= (byFuelType[v.fuel_type]||0) + 1;
    });
    res.json({ total: vehicles.length, by_status: byStatus, by_fuel_type: byFuelType });
  } catch (err) { next(err); }
};
