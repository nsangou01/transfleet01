'use strict';
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// Liste des utilisateurs (admin peut voir tous, manager seulement drivers)
exports.list = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'manager') {
      where.role = 'driver'; // Manager ne voit que les chauffeurs
    }
    // Admin voit tout (managers, drivers, etc.)

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']]
    });

    res.json(users);
  } catch (err) { next(err); }
};

// Créer un manager (admin uniquement)
exports.createManager = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, password } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ message: 'Prénom, nom, email et mot de passe sont requis' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères' });
    }

    // Vérifier si l'email existe déjà
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Hasher le mot de passe
    const password_hash = await bcrypt.hash(password, 10);

    // Créer le manager
    const user = await User.create({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      password_hash,
      role: 'manager',
      is_active: true
    });

    res.status(201).json({
      message: 'Manager créé avec succès',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at
      }
    });
  } catch (err) { next(err); }
};

// Créer un chauffeur (manager ou admin)
exports.createDriver = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, password, license_number, license_category, license_expiry } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !password || !license_number) {
      return res.status(400).json({ message: 'Prénom, nom, email, mot de passe et numéro de licence sont requis' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères' });
    }

    // Vérifier si l'email existe déjà
    const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Hasher le mot de passe
    const password_hash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur chauffeur
    const user = await User.create({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      password_hash,
      role: 'driver',
      is_active: true
    });

    // Créer le profil driver associé
    const { Driver } = require('../models');
    const driver = await Driver.create({
      user_id: user.id,
      license_number: license_number.trim(),
      license_category: license_category?.trim() || 'B',
      license_expiry: license_expiry || null,
      status: 'available'
    });

    res.status(201).json({
      message: 'Chauffeur créé avec succès',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        driver_id: driver.id,
        license_number: driver.license_number,
        is_active: user.is_active,
        created_at: user.created_at
      }
    });
  } catch (err) { next(err); }
};

// Désactiver/réactiver un utilisateur (admin uniquement)
exports.toggleActive = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Ne pas permettre de se désactiver soi-même
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas désactiver votre propre compte' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher de modifier un admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de modifier le statut d\'un administrateur' });
    }

    await user.update({ is_active: !user.is_active });

    res.json({
      message: `Utilisateur ${user.is_active ? 'activé' : 'désactivé'} avec succès`,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      }
    });
  } catch (err) { next(err); }
};

// Supprimer un utilisateur (admin uniquement)
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Ne pas permettre de se supprimer soi-même
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher de supprimer un admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de supprimer un administrateur' });
    }

    await user.destroy();

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) { next(err); }
};

// Réinitialiser le mot de passe d'un chauffeur (manager ou admin)
exports.resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    // Seul un manager ou admin peut réinitialiser un mot de passe
    if (!['manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé — permissions insuffisantes' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Un manager ne peut réinitialiser que les mots de passe des chauffeurs
    if (req.user.role === 'manager' && user.role !== 'driver') {
      return res.status(403).json({ message: 'Vous ne pouvez réinitialiser que les mots de passe des chauffeurs' });
    }

    // Empêcher de réinitialiser le mot de passe d'un admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de réinitialiser le mot de passe d\'un administrateur' });
    }

    // Validation du nouveau mot de passe
    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères' });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    await user.update({ password_hash, password_is_default: true });

    res.json({
      message: 'Mot de passe réinitialisé avec succès',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) { next(err); }
};
