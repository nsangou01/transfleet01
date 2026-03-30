'use strict';
const { Op } = require('sequelize');
const { Tracking, Vehicle, Trip, Driver, User } = require('../models');

const trackingIncludes = [
  { model: Vehicle, as: 'vehicle', attributes: ['id','plate','brand','model','status'] },
  { model: Trip,    as: 'trip',    attributes: ['id','from_location','to_location','status'] },
];

exports.latest = async (req, res, next) => {
  try {
    let vehicleIds = [];

    // Pour les conducteurs, seulement leurs véhicules
    if (req.user.role === 'driver') {
      const d = await Driver.findOne({ where: { user_id: req.user.id } });
      if (d) {
        const assignedVehicles = await Vehicle.findAll({ where: { driver_id: d.id } });
        vehicleIds = assignedVehicles.map(v => v.id);
      }
    }

    // Obtenir le dernier point de tracking pour chaque véhicule
    const latestTracking = [];

    if (vehicleIds.length > 0) {
      // Pour les conducteurs - seulement leurs véhicules
      for (const vehicleId of vehicleIds) {
        const latest = await Tracking.findOne({
          where: { vehicle_id: vehicleId },
          include: trackingIncludes,
          order: [['recorded_at', 'DESC']],
        });
        if (latest) {
          latestTracking.push(latest);
        }
      }
    } else {
      // Pour admins/managers - tous les véhicules
      const vehicles = await Vehicle.findAll({ attributes: ['id'] });
      for (const vehicle of vehicles) {
        const latest = await Tracking.findOne({
          where: { vehicle_id: vehicle.id },
          include: trackingIncludes,
          order: [['recorded_at', 'DESC']],
        });
        if (latest) {
          latestTracking.push(latest);
        }
      }
    }

    res.json({ data: latestTracking });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    // Pour la création de tracking, on pourrait permettre aux conducteurs de leurs véhicules
    // ou aux admins/managers, ou même à un système automatisé
    if (req.user.role === 'driver') {
      const d = await Driver.findOne({ where: { user_id: req.user.id } });
      if (d) {
        const vehicle = await Vehicle.findOne({ where: { id: req.body.vehicle_id, driver_id: d.id } });
        if (!vehicle) {
          return res.status(403).json({ message: 'Vous ne pouvez créer du tracking que pour vos véhicules assignés' });
        }
      }
    }

    const tracking = await Tracking.create(req.body);
    const createdTracking = await Tracking.findByPk(tracking.id, { include: trackingIncludes });

    res.status(201).json(createdTracking);
  } catch (error) {
    next(error);
  }
};

exports.history = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { from_date, to_date, limit = 1000 } = req.query;

    // Vérifier que l'utilisateur a accès à ce véhicule
    if (req.user.role === 'driver') {
      const d = await Driver.findOne({ where: { user_id: req.user.id } });
      if (d) {
        const vehicle = await Vehicle.findOne({ where: { id: vehicleId, driver_id: d.id } });
        if (!vehicle) {
          return res.status(403).json({ message: 'Accès non autorisé à ce véhicule' });
        }
      }
    }

    const where = { vehicle_id: vehicleId };
    if (from_date || to_date) {
      where.recorded_at = {};
      if (from_date) where.recorded_at[Op.gte] = new Date(from_date);
      if (to_date)   where.recorded_at[Op.lte] = new Date(to_date);
    }

    const trackingData = await Tracking.findAll({
      where,
      include: trackingIncludes,
      order: [['recorded_at', 'ASC']], // ASC pour tracer une route chronologique
      limit: +limit,
    });

    res.json({ vehicle_id: vehicleId, data: trackingData });
  } catch (error) {
    next(error);
  }
};