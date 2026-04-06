'use strict';
const { Tracking, Trip, Vehicle } = require('../models');

exports.latest = async (req, res, next) => {
  try {
    const activeTrips = await Trip.findAll({
      where: { status: 'in_progress' },
      include: [{ model: Vehicle, as: 'vehicle' }]
    });

    const dataWithPositions = await Promise.all(activeTrips.map(async (trip) => {
      const lastPos = await Tracking.findOne({
        where: { vehicle_id: trip.vehicle_id },
        order: [['recorded_at', 'DESC']]
      });

      return {
        id: trip.id,
        status: trip.status,
        vehicle: trip.vehicle,
        lastPosition: lastPos ? [lastPos] : [] 
      };
    }));

    res.json({ data: dataWithPositions });
  } catch (error) {
    res.json({ data: [] }); // Retourne une liste vide au lieu de crash
  }
};

exports.create = async (req, res) => res.json({ message: "OK" });