'use strict';
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User, Driver } = require('../models');

const sign = (user) => jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
);

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email et mot de passe requis' });

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.is_active)
      return res.status(401).json({ message: 'Identifiants invalides' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: 'Identifiants invalides' });

    await user.update({ last_login_at: new Date() });

    // Si conducteur, récupérer son profil driver
    let driver = null;
    if (user.role === 'driver') {
      driver = await Driver.findOne({ where: { user_id: user.id } });
    }

    const token = sign(user);
    res.json({
      token,
      user: {
        id:         user.id,
        first_name: user.first_name,
        last_name:  user.last_name,
        email:      user.email,
        role:       user.role,
        phone:      user.phone,
        driver_id:  driver?.id || null,
        password_is_default: user.password_is_default,
      },
    });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
    });
    let driver = null;
    if (user.role === 'driver') {
      driver = await Driver.findOne({ where: { user_id: user.id } });
    }
    res.json({ ...user.toJSON(), driver_id: driver?.id || null });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ message: 'Champs requis manquants' });
    if (new_password.length < 8)
      return res.status(400).json({ message: 'Le nouveau mot de passe doit faire au moins 8 caractères' });

    const user = await User.findByPk(req.user.id);
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid)
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });

    const hash = await bcrypt.hash(new_password, 10);
    await user.update({ password_hash: hash, password_is_default: false });
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const user = await User.findByPk(req.user.id);
    await user.update({ first_name, last_name, phone });
    res.json({ message: 'Profil mis à jour', user: { first_name: user.first_name, last_name: user.last_name, phone: user.phone } });
  } catch (err) { next(err); }
};
