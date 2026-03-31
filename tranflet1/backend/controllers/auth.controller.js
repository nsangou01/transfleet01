'use strict';
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User, Driver } = require('../models');

const sign = (user) => {
  const secret = process.env.JWT_SECRET || 'transflet_super_secret_key_2026';
  return jwt.sign(
    { id: user.id, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

exports.login = async (req, res, next) => {
  console.log("==> Tentative de login pour :", req.body.email);
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email?.toLowerCase().trim() } });

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Identifiants invalides' });

    await user.update({ last_login_at: new Date() });

    let driver = null;
    if (user.role === 'driver') {
      driver = await Driver.findOne({ where: { user_id: user.id } });
    }

    const token = sign(user);
    res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        driver_id: driver?.id || null
      }
    });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => { /* votre code me ... */ };
exports.changePassword = async (req, res, next) => { /* votre code changePassword ... */ };
exports.updateProfile = async (req, res, next) => { /* votre code updateProfile ... */ };