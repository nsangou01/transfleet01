'use strict';
const { Op } = require('sequelize');
const { Fuel, Vehicle, Driver, User } = require('../models');

const fuelIncludes = [
  { model: Vehicle, as: 'vehicle', attributes: ['id','plate','brand','model','fuel_type'] },
  { model: Driver,  as: 'driver',  include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name'] }] },
];

exports.list = async (req, res, next) => {
  try {
    const { vehicle_id, driver_id, fuel_type, from_date, to_date, page = 1, limit = 50 } = req.query;
    const where = {};

    if (vehicle_id) where.vehicle_id = vehicle_id;
    if (driver_id)  where.driver_id  = driver_id;
    if (fuel_type)  where.fuel_type  = fuel_type;

    if (from_date || to_date) {
      where.date = {};
      if (from_date) where.date[Op.gte] = from_date;
      if (to_date)   where.date[Op.lte] = to_date;
    }

    // Les conducteurs ne voient que leurs propres enregistrements de carburant
    if (req.user.role === 'driver') {
      const { Driver: D } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (d) where.driver_id = d.id;
    }

    const { count, rows } = await Fuel.findAndCountAll({
      where,
      include: fuelIncludes,
      order: [['date', 'DESC'], ['created_at', 'DESC']],
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
    const fuel = await Fuel.findByPk(req.params.id, { include: fuelIncludes });
    if (!fuel) {
      return res.status(404).json({ message: 'Enregistrement de carburant introuvable' });
    }

    // Vérifier les permissions pour les conducteurs
    if (req.user.role === 'driver') {
      const { Driver: D } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (!d || fuel.driver_id !== d.id) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
    }

    res.json(fuel);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    // Calculer le coût total si pas fourni
    if (!req.body.total_cost && req.body.quantity && req.body.price_per_litre) {
      req.body.total_cost = (parseFloat(req.body.quantity) * parseFloat(req.body.price_per_litre)).toFixed(2);
    }

    const fuel = await Fuel.create({ ...req.body, created_by: req.user.id });
    const createdFuel = await Fuel.findByPk(fuel.id, { include: fuelIncludes });

    res.status(201).json(createdFuel);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const fuel = await Fuel.findByPk(req.params.id);
    if (!fuel) {
      return res.status(404).json({ message: 'Enregistrement de carburant introuvable' });
    }

    // Vérifier les permissions pour les conducteurs
    if (req.user.role === 'driver') {
      const { Driver: D } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (!d || fuel.driver_id !== d.id) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
    }

    // Recalculer le coût total si quantité ou prix modifié
    if ((req.body.quantity || req.body.price_per_litre) && !req.body.total_cost) {
      const quantity = req.body.quantity || fuel.quantity;
      const price = req.body.price_per_litre || fuel.price_per_litre;
      req.body.total_cost = (parseFloat(quantity) * parseFloat(price)).toFixed(2);
    }

    await fuel.update(req.body);
    const updatedFuel = await Fuel.findByPk(fuel.id, { include: fuelIncludes });

    res.json(updatedFuel);
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const fuel = await Fuel.findByPk(req.params.id);
    if (!fuel) {
      return res.status(404).json({ message: 'Enregistrement de carburant introuvable' });
    }

    // Vérifier les permissions pour les conducteurs
    if (req.user.role === 'driver') {
      const { Driver: D } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (!d || fuel.driver_id !== d.id) {
        return res.status(403).json({ message: 'Accès non autorisé' });
      }
    }

    await fuel.destroy();
    res.json({ message: 'Enregistrement de carburant supprimé avec succès' });
  } catch (error) {
    next(error);
  }
};

exports.stats = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    const where = {};

    if (from_date || to_date) {
      where.date = {};
      if (from_date) where.date[Op.gte] = from_date;
      if (to_date)   where.date[Op.lte] = to_date;
    }

    // Les conducteurs ne voient que leurs propres statistiques
    if (req.user.role === 'driver') {
      const { Driver: D } = require('../models');
      const d = await D.findOne({ where: { user_id: req.user.id } });
      if (d) where.driver_id = d.id;
    }

    const fuels = await Fuel.findAll({ where, attributes: ['quantity', 'total_cost', 'fuel_type'] });

    const totalQuantity = fuels.reduce((sum, f) => sum + parseFloat(f.quantity), 0);
    const totalCost = fuels.reduce((sum, f) => sum + parseFloat(f.total_cost), 0);
    const byFuelType = {};

    fuels.forEach(f => {
      byFuelType[f.fuel_type] = (byFuelType[f.fuel_type] || 0) + parseFloat(f.total_cost);
    });

    res.json({
      total_records: fuels.length,
      total_quantity: totalQuantity.toFixed(2),
      total_cost: totalCost.toFixed(2),
      by_fuel_type: byFuelType
    });
  } catch (error) {
    next(error);
  }
};