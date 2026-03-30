'use strict';
const { Op } = require('sequelize');
const { Maintenance, Vehicle, User } = require('../models');

const maintenanceIncludes = [
  { model: Vehicle, as: 'vehicle', attributes: ['id','plate','brand','model','status'] },
  { model: User,    as: 'creator', attributes: ['id','first_name','last_name'], foreignKey: 'created_by' },
];

exports.list = async (req, res, next) => {
  try {
    const { vehicle_id, type, status, from_date, to_date, page = 1, limit = 50 } = req.query;
    const where = {};

    if (vehicle_id) where.vehicle_id = vehicle_id;
    if (type)       where.type       = type;
    if (status)     where.status     = status;

    if (from_date || to_date) {
      where.scheduled_date = {};
      if (from_date) where.scheduled_date[Op.gte] = from_date;
      if (to_date)   where.scheduled_date[Op.lte] = to_date;
    }

    // Les conducteurs ne voient que la maintenance de leurs véhicules assignés
    if (req.user.role === 'driver') {
      const { Driver: D, Vehicle: V } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (d) {
        const assignedVehicles = await V.findAll({ where: { driver_id: d.id } });
        const vehicleIds = assignedVehicles.map(v => v.id);
        where.vehicle_id = { [Op.in]: vehicleIds };
      }
    }

    const { count, rows } = await Maintenance.findAndCountAll({
      where,
      include: maintenanceIncludes,
      order: [['scheduled_date', 'DESC'], ['created_at', 'DESC']],
      limit: +limit,
      offset: (+page - 1) * +limit,
    });

    res.json({ total: count, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.get = async (req, res, next) => {
  try {
    const maintenance = await Maintenance.findByPk(req.params.id, { include: maintenanceIncludes });
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance introuvable' });
    }

    // Vérifier les permissions pour les conducteurs
    if (req.user.role === 'driver') {
      const { Driver: D, Vehicle: V } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (d) {
        const vehicle = await V.findOne({ where: { id: maintenance.vehicle_id, driver_id: d.id } });
        if (!vehicle) {
          return res.status(403).json({ message: 'Accès non autorisé' });
        }
      }
    }

    res.json(maintenance);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    // Calculer le coût total estimé si pas fourni
    if (!req.body.estimated_cost && (req.body.labor_cost || req.body.parts_cost)) {
      const labor = parseFloat(req.body.labor_cost || 0);
      const parts = parseFloat(req.body.parts_cost || 0);
      req.body.estimated_cost = (labor + parts).toFixed(2);
    }

    const maintenance = await Maintenance.create({ ...req.body, created_by: req.user.id });

    // Si la maintenance est en cours, mettre à jour le statut du véhicule
    if (req.body.status === 'in_progress') {
      await Vehicle.update({ status: 'maintenance' }, { where: { id: maintenance.vehicle_id } });
    }

    const createdMaintenance = await Maintenance.findByPk(maintenance.id, { include: maintenanceIncludes });

    res.status(201).json(createdMaintenance);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const maintenance = await Maintenance.findByPk(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance introuvable' });
    }

    // Vérifier les permissions pour les conducteurs
    if (req.user.role === 'driver') {
      const { Driver: D, Vehicle: V } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (d) {
        const vehicle = await V.findOne({ where: { id: maintenance.vehicle_id, driver_id: d.id } });
        if (!vehicle) {
          return res.status(403).json({ message: 'Accès non autorisé' });
        }
      }
    }

    const oldStatus = maintenance.status;

    // Recalculer les coûts si nécessaire
    if ((req.body.labor_cost || req.body.parts_cost) && !req.body.estimated_cost) {
      const labor = parseFloat(req.body.labor_cost || maintenance.labor_cost || 0);
      const parts = parseFloat(req.body.parts_cost || maintenance.parts_cost || 0);
      req.body.estimated_cost = (labor + parts).toFixed(2);
    }

    if ((req.body.labor_cost || req.body.parts_cost) && !req.body.actual_cost) {
      const labor = parseFloat(req.body.labor_cost || maintenance.labor_cost || 0);
      const parts = parseFloat(req.body.parts_cost || maintenance.parts_cost || 0);
      req.body.actual_cost = (labor + parts).toFixed(2);
    }

    await maintenance.update(req.body);

    // Gérer les changements de statut du véhicule
    const newStatus = req.body.status || oldStatus;
    if (oldStatus !== 'in_progress' && newStatus === 'in_progress') {
      await Vehicle.update({ status: 'maintenance' }, { where: { id: maintenance.vehicle_id } });
    } else if (oldStatus === 'in_progress' && newStatus === 'completed') {
      // Remettre le véhicule à available quand la maintenance est terminée
      await Vehicle.update({ status: 'available' }, { where: { id: maintenance.vehicle_id } });
    }

    const updatedMaintenance = await Maintenance.findByPk(maintenance.id, { include: maintenanceIncludes });

    res.json(updatedMaintenance);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const maintenance = await Maintenance.findByPk(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance introuvable' });
    }

    // Vérifier les permissions pour les conducteurs
    if (req.user.role === 'driver') {
      const { Driver: D, Vehicle: V } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (d) {
        const vehicle = await V.findOne({ where: { id: maintenance.vehicle_id, driver_id: d.id } });
        if (!vehicle) {
          return res.status(403).json({ message: 'Accès non autorisé' });
        }
      }
    }

    // Remettre le véhicule à available si la maintenance était en cours
    if (maintenance.status === 'in_progress') {
      await Vehicle.update({ status: 'available' }, { where: { id: maintenance.vehicle_id } });
    }

    await maintenance.destroy();
    res.json({ message: 'Maintenance supprimée avec succès' });
  } catch (error) {
    next(error);
  }
};

exports.upcoming = async (req, res, next) => {
  try {
    const where = {
      status: { [Op.in]: ['scheduled', 'in_progress'] },
      scheduled_date: { [Op.gte]: new Date() }
    };

    // Les conducteurs ne voient que la maintenance de leurs véhicules assignés
    if (req.user.role === 'driver') {
      const { Driver: D, Vehicle: V } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (d) {
        const assignedVehicles = await V.findAll({ where: { driver_id: d.id } });
        const vehicleIds = assignedVehicles.map(v => v.id);
        where.vehicle_id = { [Op.in]: vehicleIds };
      }
    }

    const upcomingMaintenances = await Maintenance.findAll({
      where,
      include: maintenanceIncludes,
      order: [['scheduled_date', 'ASC']],
    });

    res.json({ data: upcomingMaintenances });
  } catch (error) {
    next(error);
  }
};