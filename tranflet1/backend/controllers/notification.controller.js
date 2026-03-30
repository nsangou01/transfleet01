'use strict';
const { Op } = require('sequelize');
const { Notification, User } = require('../models');

const notificationIncludes = [
  { model: User, as: 'sender',   attributes: ['id','first_name','last_name','role'] },
  { model: User, as: 'recipient', attributes: ['id','first_name','last_name','role'] },
];

exports.list = async (req, res, next) => {
  try {
    const { is_read, type, from_date, to_date, page = 1, limit = 50 } = req.query;
    const where = { recipient_id: req.user.id }; // Les utilisateurs ne voient que leurs notifications

    if (is_read !== undefined) where.is_read = is_read === 'true';
    if (type) where.type = type;

    if (from_date || to_date) {
      where.created_at = {};
      if (from_date) where.created_at[Op.gte] = new Date(from_date);
      if (to_date)   where.created_at[Op.lte] = new Date(to_date);
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      include: notificationIncludes,
      order: [['created_at', 'DESC']],
      limit: +limit,
      offset: (+page - 1) * +limit,
    });

    res.json({ total: count, data: rows });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    // Vérifier les permissions - seuls admins et managers peuvent créer des notifications
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Seuls les administrateurs et gestionnaires peuvent créer des notifications' });
    }

    const notificationData = {
      ...req.body,
      sender_id: req.user.id,
    };

    // Si target_role est spécifié et pas de recipient_id, créer des notifications pour tous les utilisateurs du rôle
    if (notificationData.target_role && !notificationData.recipient_id) {
      const { User: U } = require('../models');
      const recipients = await U.findAll({
        where: notificationData.target_role === 'all' ? {} : { role: notificationData.target_role },
        attributes: ['id']
      });

      const notifications = [];
      for (const recipient of recipients) {
        const notif = await Notification.create({
          ...notificationData,
          recipient_id: recipient.id
        });
        notifications.push(notif);
      }

      res.status(201).json({
        message: `${notifications.length} notifications créées avec succès`,
        count: notifications.length
      });
    } else {
      // Notification individuelle
      const notification = await Notification.create(notificationData);
      const createdNotification = await Notification.findByPk(notification.id, { include: notificationIncludes });

      res.status(201).json(createdNotification);
    }
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification introuvable' });
    }

    // Vérifier que l'utilisateur est le destinataire
    if (notification.recipient_id !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    await notification.update({
      is_read: true,
      read_at: new Date()
    });

    const updatedNotification = await Notification.findByPk(notification.id, { include: notificationIncludes });
    res.json(updatedNotification);
  } catch (error) {
    next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const [affectedCount] = await Notification.update(
      {
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          recipient_id: req.user.id,
          is_read: false
        }
      }
    );

    res.json({
      message: `${affectedCount} notification(s) marquée(s) comme lue(s)`,
      count: affectedCount
    });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification introuvable' });
    }

    // Seuls les admins peuvent supprimer des notifications
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent supprimer des notifications' });
    }

    await notification.destroy();
    res.json({ message: 'Notification supprimée avec succès' });
  } catch (error) {
    next(error);
  }
};

exports.unreadCount = async (req, res, next) => {
  try {
    const count = await Notification.count({
      where: {
        recipient_id: req.user.id,
        is_read: false
      }
    });

    res.json({ unread_count: count });
  } catch (error) {
    next(error);
  }
};