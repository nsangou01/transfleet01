'use strict';
const { Op, Sequelize, fn, col, literal } = require('sequelize');
const { Vehicle, Driver, Trip, Fuel, Maintenance, User, Tracking } = require('../models');

exports.dashboard = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    const dateFilter = {};

    if (from_date || to_date) {
      dateFilter.created_at = {};
      if (from_date) dateFilter.created_at[Op.gte] = new Date(from_date);
      if (to_date) dateFilter.created_at[Op.lte] = new Date(to_date);
    }

    // Statistiques générales
    const [vehicleStats] = await Vehicle.findAll({
      attributes: [
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', literal('CASE WHEN status = "available" THEN 1 ELSE 0 END')), 'available'],
        [fn('SUM', literal('CASE WHEN status = "in_use" THEN 1 ELSE 0 END')), 'in_use'],
        [fn('SUM', literal('CASE WHEN status = "maintenance" THEN 1 ELSE 0 END')), 'maintenance'],
        [fn('SUM', literal('CASE WHEN status = "out_of_service" THEN 1 ELSE 0 END')), 'out_of_service'],
      ],
      raw: true,
    });

    const [driverStats] = await Driver.findAll({
      attributes: [
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', literal('CASE WHEN status = "available" THEN 1 ELSE 0 END')), 'available'],
        [fn('SUM', literal('CASE WHEN status = "on_trip" THEN 1 ELSE 0 END')), 'on_trip'],
        [fn('SUM', literal('CASE WHEN status = "off_duty" THEN 1 ELSE 0 END')), 'off_duty'],
        [fn('SUM', literal('CASE WHEN status = "suspended" THEN 1 ELSE 0 END')), 'suspended'],
      ],
      raw: true,
    });

    const [tripStats] = await Trip.findAll({
      where: dateFilter,
      attributes: [
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', literal('CASE WHEN status = "completed" THEN 1 ELSE 0 END')), 'completed'],
        [fn('SUM', literal('CASE WHEN status = "in_progress" THEN 1 ELSE 0 END')), 'in_progress'],
        [fn('SUM', literal('CASE WHEN status = "planned" THEN 1 ELSE 0 END')), 'planned'],
        [fn('SUM', literal('CASE WHEN status = "cancelled" THEN 1 ELSE 0 END')), 'cancelled'],
        [fn('SUM', col('actual_distance')), 'total_distance'],
        [fn('SUM', col('fuel_used')), 'total_fuel_used'],
      ],
      raw: true,
    });

    const [fuelStats] = await Fuel.findAll({
      where: dateFilter,
      attributes: [
        [fn('SUM', col('quantity')), 'total_quantity'],
        [fn('SUM', col('total_cost')), 'total_cost'],
        [fn('AVG', col('price_per_litre')), 'avg_price_per_litre'],
      ],
      raw: true,
    });

    const [maintenanceStats] = await Maintenance.findAll({
      where: dateFilter,
      attributes: [
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', literal('CASE WHEN status = "completed" THEN 1 ELSE 0 END')), 'completed'],
        [fn('SUM', literal('CASE WHEN status = "in_progress" THEN 1 ELSE 0 END')), 'in_progress'],
        [fn('SUM', literal('CASE WHEN status = "scheduled" THEN 1 ELSE 0 END')), 'scheduled'],
        [fn('SUM', col('actual_cost')), 'total_cost'],
      ],
      raw: true,
    });

    res.json({
      vehicles: vehicleStats,
      drivers: driverStats,
      trips: tripStats,
      fuel: fuelStats,
      maintenance: maintenanceStats,
    });
  } catch (error) {
    next(error);
  }
};

exports.vehicles = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { from_date, to_date } = req.query;

    // Vérifier l'accès au véhicule
    if (req.user.role === 'driver') {
      const { Driver: D, Vehicle: V } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (d) {
        const vehicle = await V.findOne({ where: { id: vehicleId, driver_id: d.id } });
        if (!vehicle) {
          return res.status(403).json({ message: 'Accès non autorisé à ce véhicule' });
        }
      }
    }

    const dateFilter = { vehicle_id: vehicleId };
    if (from_date || to_date) {
      dateFilter.created_at = {};
      if (from_date) dateFilter.created_at[Op.gte] = new Date(from_date);
      if (to_date) dateFilter.created_at[Op.lte] = new Date(to_date);
    }

    // Informations du véhicule
    const vehicle = await Vehicle.findByPk(vehicleId, {
      include: [
        { model: User, as: 'assignedDriver', attributes: ['id','first_name','last_name','email'] }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Véhicule introuvable' });
    }

    // Statistiques des trajets
    const [tripStats] = await Trip.findAll({
      where: dateFilter,
      attributes: [
        [fn('COUNT', col('id')), 'total_trips'],
        [fn('SUM', col('actual_distance')), 'total_distance'],
        [fn('SUM', col('fuel_used')), 'total_fuel_used'],
        [fn('AVG', col('actual_distance')), 'avg_distance_per_trip'],
      ],
      raw: true,
    });

    // Statistiques du carburant
    const [fuelStats] = await Fuel.findAll({
      where: { vehicle_id: vehicleId, ...dateFilter },
      attributes: [
        [fn('COUNT', col('id')), 'total_fillups'],
        [fn('SUM', col('quantity')), 'total_quantity'],
        [fn('SUM', col('total_cost')), 'total_cost'],
        [fn('AVG', col('price_per_litre')), 'avg_price_per_litre'],
      ],
      raw: true,
    });

    // Statistiques de maintenance
    const [maintenanceStats] = await Maintenance.findAll({
      where: { vehicle_id: vehicleId, ...dateFilter },
      attributes: [
        [fn('COUNT', col('id')), 'total_maintenance'],
        [fn('SUM', literal('CASE WHEN status = "completed" THEN 1 ELSE 0 END')), 'completed_maintenance'],
        [fn('SUM', col('actual_cost')), 'total_maintenance_cost'],
      ],
      raw: true,
    });

    res.json({
      vehicle,
      period: { from_date, to_date },
      trips: tripStats,
      fuel: fuelStats,
      maintenance: maintenanceStats,
    });
  } catch (error) {
    next(error);
  }
};

exports.getFuelReport = async (req, res, next) => {
  try {
    const { from_date, to_date, vehicle_id, driver_id, fuel_type } = req.query;
    const where = {};

    if (vehicle_id) where.vehicle_id = vehicle_id;
    if (driver_id)  where.driver_id  = driver_id;
    if (fuel_type)  where.fuel_type  = fuel_type;

    if (from_date || to_date) {
      where.date = {};
      if (from_date) where.date[Op.gte] = from_date;
      if (to_date)   where.date[Op.lte] = to_date;
    }

    // Filtrage par permissions
    if (req.user.role === 'driver') {
      const { Driver: D } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (d) where.driver_id = d.id;
    }

    const fuelData = await Fuel.findAll({
      where,
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['id','plate','brand','model'] },
        { model: Driver,  as: 'driver',  include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name'] }] },
      ],
      order: [['date', 'DESC']],
    });

    // Calculs agrégés
    const stats = {
      total_fillups: fuelData.length,
      total_quantity: fuelData.reduce((sum, f) => sum + parseFloat(f.quantity), 0),
      total_cost: fuelData.reduce((sum, f) => sum + parseFloat(f.total_cost), 0),
      avg_price_per_litre: fuelData.length > 0 ?
        fuelData.reduce((sum, f) => sum + parseFloat(f.price_per_litre), 0) / fuelData.length : 0,
    };

    res.json({
      period: { from_date, to_date },
      stats,
      data: fuelData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMaintenanceReport = async (req, res, next) => {
  try {
    const { from_date, to_date, vehicle_id, type, status } = req.query;
    const where = {};

    if (vehicle_id) where.vehicle_id = vehicle_id;
    if (type)       where.type       = type;
    if (status)     where.status     = status;

    if (from_date || to_date) {
      where.scheduled_date = {};
      if (from_date) where.scheduled_date[Op.gte] = from_date;
      if (to_date)   where.scheduled_date[Op.lte] = to_date;
    }

    // Filtrage par permissions
    if (req.user.role === 'driver') {
      const { Driver: D, Vehicle: V } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (d) {
        const assignedVehicles = await V.findAll({ where: { driver_id: d.id } });
        const vehicleIds = assignedVehicles.map(v => v.id);
        where.vehicle_id = { [Op.in]: vehicleIds };
      }
    }

    const maintenanceData = await Maintenance.findAll({
      where,
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['id','plate','brand','model'] },
        { model: User,    as: 'creator', attributes: ['id','first_name','last_name'] },
      ],
      order: [['scheduled_date', 'DESC']],
    });

    // Calculs agrégés
    const stats = {
      total_maintenance: maintenanceData.length,
      completed: maintenanceData.filter(m => m.status === 'completed').length,
      in_progress: maintenanceData.filter(m => m.status === 'in_progress').length,
      scheduled: maintenanceData.filter(m => m.status === 'scheduled').length,
      total_cost: maintenanceData.reduce((sum, m) => sum + parseFloat(m.actual_cost || 0), 0),
    };

    res.json({
      period: { from_date, to_date },
      stats,
      data: maintenanceData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTripReport = async (req, res, next) => {
  try {
    const { from_date, to_date, vehicle_id, driver_id, status } = req.query;
    const where = {};

    if (vehicle_id) where.vehicle_id = vehicle_id;
    if (driver_id)  where.driver_id  = driver_id;
    if (status)     where.status     = status;

    if (from_date || to_date) {
      where.scheduled_start = {};
      if (from_date) where.scheduled_start[Op.gte] = new Date(from_date);
      if (to_date)   where.scheduled_start[Op.lte] = new Date(to_date);
    }

    // Filtrage par permissions
    if (req.user.role === 'driver') {
      const { Driver: D } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (d) where.driver_id = d.id;
    }

    const tripData = await Trip.findAll({
      where,
      include: [
        { model: Vehicle, as: 'vehicle', attributes: ['id','plate','brand','model'] },
        { model: Driver,  as: 'driver',  include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name'] }] },
      ],
      order: [['scheduled_start', 'DESC']],
    });

    // Calculs agrégés
    const stats = {
      total_trips: tripData.length,
      completed: tripData.filter(t => t.status === 'completed').length,
      in_progress: tripData.filter(t => t.status === 'in_progress').length,
      planned: tripData.filter(t => t.status === 'planned').length,
      cancelled: tripData.filter(t => t.status === 'cancelled').length,
      total_distance: tripData.reduce((sum, t) => sum + parseFloat(t.actual_distance || 0), 0),
      total_fuel_used: tripData.reduce((sum, t) => sum + parseFloat(t.fuel_used || 0), 0),
    };

    res.json({
      period: { from_date, to_date },
      stats,
      data: tripData,
    });
  } catch (error) {
    next(error);
  }
};

exports.drivers = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const { from_date, to_date } = req.query;

    // Vérifier l'accès au conducteur
    if (req.user.role === 'driver' && req.user.id !== parseInt(driverId)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const dateFilter = {};
    if (from_date || to_date) {
      dateFilter.created_at = {};
      if (from_date) dateFilter.created_at[Op.gte] = new Date(from_date);
      if (to_date) dateFilter.created_at[Op.lte] = new Date(to_date);
    }

    // Informations du conducteur
    const driver = await Driver.findByPk(driverId, {
      include: [
        { model: User, as: 'user', attributes: ['id','first_name','last_name','email','phone'] },
        { model: Vehicle, as: 'vehicle', attributes: ['id','plate','brand','model'] },
      ]
    });

    if (!driver) {
      return res.status(404).json({ message: 'Conducteur introuvable' });
    }

    // Statistiques des trajets
    const [tripStats] = await Trip.findAll({
      where: { driver_id: driverId, ...dateFilter },
      attributes: [
        [fn('COUNT', col('id')), 'total_trips'],
        [fn('SUM', col('actual_distance')), 'total_distance'],
        [fn('SUM', col('fuel_used')), 'total_fuel_used'],
        [fn('AVG', col('actual_distance')), 'avg_distance_per_trip'],
      ],
      raw: true,
    });

    // Statistiques du carburant
    const [fuelStats] = await Fuel.findAll({
      where: { driver_id: driverId, ...dateFilter },
      attributes: [
        [fn('COUNT', col('id')), 'total_fillups'],
        [fn('SUM', col('quantity')), 'total_quantity'],
        [fn('SUM', col('total_cost')), 'total_cost'],
      ],
      raw: true,
    });

    res.json({
      driver,
      period: { from_date, to_date },
      trips: tripStats,
      fuel: fuelStats,
    });
  } catch (error) {
    next(error);
  }
};

exports.costs = async (req, res, next) => {
  try {
    const { from_date, to_date, group_by = 'month' } = req.query;

    let dateFormat = '%Y-%m';
    if (group_by === 'day') dateFormat = '%Y-%m-%d';
    if (group_by === 'week') dateFormat = '%Y-%u';
    if (group_by === 'year') dateFormat = '%Y';

    const where = {};
    if (from_date || to_date) {
      where.date = {};
      if (from_date) where.date[Op.gte] = new Date(from_date);
      if (to_date) where.date[Op.lte] = new Date(to_date);
    }

    // Coûts de carburant groupés par période
    const fuelCosts = await Fuel.findAll({
      where,
      attributes: [
        [fn('DATE_FORMAT', col('date'), dateFormat), 'period'],
        [fn('SUM', col('total_cost')), 'fuel_cost'],
        [fn('SUM', col('quantity')), 'fuel_quantity']
      ],
      group: [fn('DATE_FORMAT', col('date'), dateFormat)],
      order: [[fn('DATE_FORMAT', col('date'), dateFormat), 'ASC']],
      raw: true
    });

    // Coûts de maintenance groupés par période
    const maintenanceWhere = {};
    if (from_date || to_date) {
      maintenanceWhere.completed_date = {};
      if (from_date) maintenanceWhere.completed_date[Op.gte] = new Date(from_date);
      if (to_date) maintenanceWhere.completed_date[Op.lte] = new Date(to_date);
    }

    const maintenanceCosts = await Maintenance.findAll({
      where: { ...maintenanceWhere, status: 'completed' },
      attributes: [
        [fn('DATE_FORMAT', col('completed_date'), dateFormat), 'period'],
        [fn('SUM', col('actual_cost')), 'maintenance_cost']
      ],
      group: [fn('DATE_FORMAT', col('completed_date'), dateFormat)],
      order: [[fn('DATE_FORMAT', col('completed_date'), dateFormat), 'ASC']],
      raw: true
    });

    // Fusionner les données par période
    const costReport = {};
    fuelCosts.forEach(item => {
      const period = item.period;
      if (!costReport[period]) costReport[period] = { period, fuel_cost: 0, maintenance_cost: 0, total_cost: 0 };
      costReport[period].fuel_cost = parseFloat(item.fuel_cost || 0);
    });

    maintenanceCosts.forEach(item => {
      const period = item.period;
      if (!costReport[period]) costReport[period] = { period, fuel_cost: 0, maintenance_cost: 0, total_cost: 0 };
      costReport[period].maintenance_cost = parseFloat(item.maintenance_cost || 0);
    });

    // Calculer les totaux
    Object.values(costReport).forEach(item => {
      item.total_cost = item.fuel_cost + item.maintenance_cost;
    });

    res.json({
      group_by,
      data: Object.values(costReport).sort((a, b) => a.period.localeCompare(b.period))
    });
  } catch (error) {
    next(error);
  }
};