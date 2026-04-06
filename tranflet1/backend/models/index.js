'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ── USER ─────────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id:            { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  first_name:    { type: DataTypes.STRING(100), allowNull: false },
  last_name:     { type: DataTypes.STRING(100), allowNull: false },
  email:         { type: DataTypes.STRING(191), allowNull: false, unique: true,
                   validate: { isEmail: true } },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role:          { type: DataTypes.ENUM('admin','manager','driver'), defaultValue: 'driver' },
  phone:         { type: DataTypes.STRING(25) },
  is_active:     { type: DataTypes.BOOLEAN, defaultValue: true },
  last_login_at: { type: DataTypes.DATE },
  password_is_default: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'users' });

// ── VEHICLE ───────────────────────────────────────────────────────────────────
const Vehicle = sequelize.define('Vehicle', {
  id:                { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  plate:             { type: DataTypes.STRING(20), allowNull: false, unique: true },
  brand:             { type: DataTypes.STRING(100), allowNull: false },
  model:             { type: DataTypes.STRING(100), allowNull: false },
  year:              { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
  color:             { type: DataTypes.STRING(50) },
  vin:               { type: DataTypes.STRING(17), unique: true },
  fuel_type:         { type: DataTypes.ENUM('diesel','gasoline','hybrid','electric'), defaultValue: 'diesel' },
  capacity:          { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 5 },
  mileage:           { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  status:            { type: DataTypes.ENUM('available','in_use','maintenance','out_of_service'), defaultValue: 'available' },
  purchase_date:     { type: DataTypes.DATEONLY },
  purchase_price:    { type: DataTypes.DECIMAL(14,2) },
  insurance_expiry:  { type: DataTypes.DATEONLY },
  inspection_expiry: { type: DataTypes.DATEONLY },
  driver_id:         { type: DataTypes.INTEGER.UNSIGNED },
  notes:             { type: DataTypes.TEXT },
}, { tableName: 'vehicles' });

// ── DRIVER ────────────────────────────────────────────────────────────────────
const Driver = sequelize.define('Driver', {
  id:               { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  license_number:   { type: DataTypes.STRING(50), allowNull: false, unique: true },
  license_category: { type: DataTypes.STRING(10), defaultValue: 'B' },
  license_expiry:   { type: DataTypes.DATEONLY, allowNull: false },
  experience_years: { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 1 },
  avg_rating:       { type: DataTypes.DECIMAL(3,2), defaultValue: 4.00 },
  total_trips:      { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  status:           { type: DataTypes.ENUM('available','on_trip','off_duty','suspended'), defaultValue: 'available' },
  vehicle_id:       { type: DataTypes.INTEGER.UNSIGNED },
  emergency_contact:{ type: DataTypes.STRING(100) },
  emergency_phone:  { type: DataTypes.STRING(25) },
}, { tableName: 'drivers' });

// ── TRIP ──────────────────────────────────────────────────────────────────────
const Trip = sequelize.define('Trip', {
  id:                 { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  vehicle_id:         { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  driver_id:          { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  from_location:      { type: DataTypes.STRING(255), allowNull: false },
  to_location:        { type: DataTypes.STRING(255), allowNull: false },
  estimated_distance: { type: DataTypes.DECIMAL(10,2) },
  actual_distance:    { type: DataTypes.DECIMAL(10,2) },
  estimated_duration: { type: DataTypes.STRING(20) },
  actual_duration:    { type: DataTypes.STRING(20) },
  status:             { type: DataTypes.ENUM('planned','in_progress','completed','cancelled'), defaultValue: 'planned' },
  purpose:            { type: DataTypes.STRING(255) },
  passengers:         { type: DataTypes.TINYINT.UNSIGNED, defaultValue: 0 },
  fuel_used:          { type: DataTypes.DECIMAL(8,2) },
  notes:              { type: DataTypes.TEXT },
  scheduled_start:    { type: DataTypes.DATE },
  actual_start:       { type: DataTypes.DATE },
  actual_end:         { type: DataTypes.DATE },
  created_by:         { type: DataTypes.INTEGER.UNSIGNED },
}, { tableName: 'trips' });

// ── FUEL ──────────────────────────────────────────────────────────────────────
const Fuel = sequelize.define('Fuel', {
  id:              { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  vehicle_id:      { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  driver_id:       { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  date:            { type: DataTypes.DATEONLY, allowNull: false },
  quantity:        { type: DataTypes.DECIMAL(8,2), allowNull: false },
  price_per_litre: { type: DataTypes.DECIMAL(8,2), allowNull: false },
  total_cost:      { type: DataTypes.DECIMAL(12,2), allowNull: false },
  fuel_type:       { type: DataTypes.ENUM('diesel','gasoline','hybrid','electric'), defaultValue: 'diesel' },
  station_name:    { type: DataTypes.STRING(255) },
  station_city:    { type: DataTypes.STRING(100) },
  mileage_at_fill: { type: DataTypes.INTEGER.UNSIGNED },
  notes:           { type: DataTypes.TEXT },
  created_by:      { type: DataTypes.INTEGER.UNSIGNED },
}, { tableName: 'fuel_records' });

// ── MAINTENANCE ───────────────────────────────────────────────────────────────
const Maintenance = sequelize.define('Maintenance', {
  id:             { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  vehicle_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  type:           { type: DataTypes.ENUM('routine','repair','inspection','emergency'), allowNull: false },
  description:    { type: DataTypes.TEXT, allowNull: false },
  scheduled_date: { type: DataTypes.DATEONLY, allowNull: false },
  completed_date: { type: DataTypes.DATEONLY },
  status:         { type: DataTypes.ENUM('scheduled','in_progress','completed','cancelled'), defaultValue: 'scheduled' },
  estimated_cost: { type: DataTypes.DECIMAL(12,2) },
  actual_cost:    { type: DataTypes.DECIMAL(12,2) },
  provider:       { type: DataTypes.STRING(255) },
  provider_phone: { type: DataTypes.STRING(25) },
  labor_cost:     { type: DataTypes.DECIMAL(12,2) },
  parts_cost:     { type: DataTypes.DECIMAL(12,2) },
  notes:          { type: DataTypes.TEXT },
  created_by:     { type: DataTypes.INTEGER.UNSIGNED },
}, { tableName: 'maintenance_records' });

// ── NOTIFICATION ──────────────────────────────────────────────────────────────
const Notification = sequelize.define('Notification', {
  id:           { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  sender_id:    { type: DataTypes.INTEGER.UNSIGNED },
  recipient_id: { type: DataTypes.INTEGER.UNSIGNED },
  type:         { type: DataTypes.ENUM('alert','info','success','warning'), defaultValue: 'info' },
  title:        { type: DataTypes.STRING(255), allowNull: false },
  message:      { type: DataTypes.TEXT, allowNull: false },
  is_read:      { type: DataTypes.BOOLEAN, defaultValue: false },
  read_at:      { type: DataTypes.DATE },
  target_role:  { type: DataTypes.ENUM('all','manager','driver'), defaultValue: 'all' },
  action_url:   { type: DataTypes.STRING(500) },
}, { tableName: 'notifications', updatedAt: false });

// ── TRACKING ──────────────────────────────────────────────────────────────────
const Tracking = sequelize.define('Tracking', {
  id:            { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  vehicle_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  trip_id:       { type: DataTypes.INTEGER.UNSIGNED },
  latitude:      { type: DataTypes.DECIMAL(10,7), allowNull: false },
  longitude:     { type: DataTypes.DECIMAL(10,7), allowNull: false },
  altitude:      { type: DataTypes.DECIMAL(8,2) },
  speed:         { type: DataTypes.DECIMAL(6,2), defaultValue: 0 },
  heading:       { type: DataTypes.DECIMAL(5,2) },
  engine_status: { type: DataTypes.ENUM('on','off','unknown'), defaultValue: 'unknown' },
  mileage:       { type: DataTypes.INTEGER.UNSIGNED },
  recorded_at:   { type: DataTypes.DATE(3), defaultValue: DataTypes.NOW },
}, { tableName: 'tracking', timestamps: false });

// ── ASSOCIATIONS ──────────────────────────────────────────────────────────────
Vehicle.belongsTo(User,   { foreignKey: 'driver_id', as: 'assignedDriver' });
Driver.belongsTo(User,    { foreignKey: 'user_id',   as: 'user' });
Driver.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

Trip.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
Trip.belongsTo(Driver,  { foreignKey: 'driver_id',  as: 'driver' });

Fuel.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
Fuel.belongsTo(Driver,  { foreignKey: 'driver_id',  as: 'driver' });

Maintenance.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });

Notification.belongsTo(User, { foreignKey: 'sender_id',    as: 'sender' });
Notification.belongsTo(User, { foreignKey: 'recipient_id', as: 'recipient' });

Tracking.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
Tracking.belongsTo(Trip,    { foreignKey: 'trip_id',    as: 'trip' });

module.exports = { sequelize, User, Vehicle, Driver, Trip, Fuel, Maintenance, Notification, Tracking };