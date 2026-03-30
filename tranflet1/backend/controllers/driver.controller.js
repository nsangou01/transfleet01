'use strict';
const { Op } = require('sequelize');
const { Driver, User, Vehicle, Trip } = require('../models');

const driverIncludes = [
  { model: User,    as: 'user',    attributes: ['id','first_name','last_name','email','phone'] },
  { model: Vehicle, as: 'vehicle', attributes: ['id','plate','brand','model','status'] },
];

exports.list = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      const users = await User.findAll({
        where: {[Op.or]:[{first_name:{[Op.like]:`%${search}%`}},{last_name:{[Op.like]:`%${search}%`}}]},
        attributes:['id'],
      });
      where.user_id = { [Op.in]: users.map(u=>u.id) };
    }
    const { count, rows } = await Driver.findAndCountAll({
      where, include: driverIncludes,
      order: [['created_at','DESC']], limit: +limit, offset: (+page-1)* +limit,
    });
    res.json({ total: count, data: rows });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const d = await Driver.findByPk(req.params.id, { include: driverIncludes });
    if (!d) return res.status(404).json({ message: 'Conducteur introuvable' });
    res.json(d);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { email, first_name, last_name, phone, password, ...driverData } = req.body;
    const bcrypt = require('bcryptjs');
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email déjà utilisé' });
    const hash = await bcrypt.hash(password || 'Transflet2024!', 10);
    const user = await User.create({ first_name, last_name, email, phone, password_hash: hash, role: 'driver' });
    const driver = await Driver.create({ ...driverData, user_id: user.id });
    const full = await Driver.findByPk(driver.id, { include: driverIncludes });
    res.status(201).json(full);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const d = await Driver.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
    if (!d) return res.status(404).json({ message: 'Conducteur introuvable' });
    const { first_name, last_name, phone, ...driverData } = req.body;
    if (first_name || last_name || phone) await d.user.update({ first_name, last_name, phone });
    await d.update(driverData);
    const updated = await Driver.findByPk(d.id, { include: driverIncludes });
    res.json(updated);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const d = await Driver.findByPk(req.params.id);
    if (!d) return res.status(404).json({ message: 'Conducteur introuvable' });
    const active = await Trip.count({ where: { driver_id: d.id, status: 'in_progress' } });
    if (active) return res.status(409).json({ message: 'Conducteur en trajet actif' });
    await d.destroy();
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const drivers = await Driver.findAll({ attributes: ['status','avg_rating'] });
    const byStatus = {};
    let totalRating = 0;
    drivers.forEach(d => {
      byStatus[d.status] = (byStatus[d.status]||0)+1;
      totalRating += parseFloat(d.avg_rating||0);
    });
    res.json({
      total: drivers.length,
      by_status: byStatus,
      avg_rating: drivers.length ? (totalRating/drivers.length).toFixed(2) : '0.00',
    });
  } catch (err) { next(err); }
};

exports.available = async (req, res, next) => {
  try {
    const data = await Driver.findAll({
      where: { status: 'available' },
      include: [{ model: User, as: 'user', attributes: ['id','first_name','last_name'] }],
    });
    res.json(data);
  } catch (err) { next(err); }
};
