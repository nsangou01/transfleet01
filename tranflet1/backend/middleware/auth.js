'use strict';
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = header.slice(7);
    
    // ON UTILISE LA MÊME CLÉ DE SECOURS QUE DANS LE CONTROLLER
    const secret = process.env.JWT_SECRET || 'transflet_super_secret_key_2026';
    
    const payload = jwt.verify(token, secret);
    
    // On récupère l'utilisateur en s'assurant que le champ 'role' est bien inclus
    const user = await User.findByPk(payload.id, { 
      attributes: { exclude: ['password_hash'] } 
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Utilisateur introuvable ou désactivé' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Erreur Auth Middleware:", err.message);
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ message: 'Token expiré' });
    return res.status(401).json({ message: 'Token invalide' });
  }
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  
  // LOG DE SÉCURITÉ : Vérifie ce qui s'affiche dans ton terminal
  console.log(`Vérification rôle : Utilisateur=${req.user.role}, Autorisés=${roles}`);

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé — permissions insuffisantes' });
  }
  next();
};