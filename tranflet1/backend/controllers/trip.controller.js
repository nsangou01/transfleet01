'use strict';
const { Trip, Vehicle, Driver, User, TrackingPoint } = require('../models');

// Positions de démo à Douala
const demoPositions = [
  { lat: 4.0485, lng: 9.7125 }, { lat: 4.0520, lng: 9.7001 },
  { lat: 4.0610, lng: 9.7310 }, { lat: 4.0390, lng: 9.7200 }
];

const tripIncludes = [
  { model: Vehicle, as: 'vehicle', attributes: ['id', 'plate', 'brand', 'model'] },
  { model: Driver, as: 'driver', include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }] }
];

exports.list = async (req, res, next) => {
  try {
    const trips = await Trip.findAll({ include: tripIncludes, order: [['createdAt', 'DESC']] });
    res.json({ data: trips });
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const trip = await Trip.create({ ...req.body, status: 'scheduled' });
    res.status(201).json(trip);
  } catch (error) { next(error); }
};

exports.start = async (req, res, next) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Non trouvé' });

    await trip.update({ status: 'in_progress', actual_start: new Date() });

    const pos = demoPositions[Math.floor(Math.random() * demoPositions.length)];
    await TrackingPoint.create({
      vehicle_id: trip.vehicle_id,
      trip_id: trip.id,
      latitude: pos.lat,
      longitude: pos.lng,
      speed: 50,
      recorded_at: new Date()
    });

    res.json({ message: "Trajet démarré avec succès" });
  } catch (error) { next(error); }
};