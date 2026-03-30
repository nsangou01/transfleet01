'use strict';
require('dotenv').config({ path: require('path').join(__dirname,'../.env') });
const bcrypt = require('bcryptjs');
const { sequelize, User, Vehicle, Driver, Trip, Fuel, Maintenance, Notification } = require('../models');

async function seed() {
  await sequelize.authenticate();
  console.log('Connexion OK');

  const hash = await bcrypt.hash('password123', 10);

  // Users
  const [admin]   = await User.upsert({ id:1, first_name:'Admin',        last_name:'TRANSIMEX', email:'admin@transimex.cm',     password_hash:hash, role:'admin',   phone:'+237 699 000 001', is_active:1 });
  const [manager] = await User.upsert({ id:2, first_name:'Landry',       last_name:'Fouthe',    email:'manager@transimex.cm',   password_hash:hash, role:'manager', phone:'+237 699 000 002', is_active:1 });
  const [u3]      = await User.upsert({ id:3, first_name:'Jean-Baptiste', last_name:'Nkomo',     email:'jbnkomo@transimex.cm',   password_hash:hash, role:'driver',  phone:'+237 655 123 456', is_active:1 });
  const [u4]      = await User.upsert({ id:4, first_name:'Paul',          last_name:'Mbarga',    email:'pmbarga@transimex.cm',   password_hash:hash, role:'driver',  phone:'+237 677 234 567', is_active:1 });
  const [u5]      = await User.upsert({ id:5, first_name:'Marie',         last_name:'Tchouaffi', email:'mtchouaffi@transimex.cm',password_hash:hash, role:'driver',  phone:'+237 699 345 678', is_active:1 });
  const [u6]      = await User.upsert({ id:6, first_name:'Alain',         last_name:'Fouda',     email:'afouda@transimex.cm',    password_hash:hash, role:'driver',  phone:'+237 650 456 789', is_active:1 });
  const [u7]      = await User.upsert({ id:7, first_name:'Ibrahim',       last_name:'Bello',     email:'ibello@transimex.cm',    password_hash:hash, role:'driver',  phone:'+237 670 567 890', is_active:1 });

  // Vehicles
  await Vehicle.upsert({ id:1, plate:'LT-1234-A', brand:'Toyota',    model:'Hilux',    year:2021, fuel_type:'diesel',   capacity:5,  mileage:87230,  status:'available',   color:'Blanc', vin:'JTFB3RFB1MD012345' });
  await Vehicle.upsert({ id:2, plate:'LT-5678-B', brand:'Mercedes',  model:'Sprinter', year:2020, fuel_type:'diesel',   capacity:12, mileage:134560, status:'in_use',      color:'Gris',  vin:'WDB9066331S112233', driver_id:4 });
  await Vehicle.upsert({ id:3, plate:'LT-9012-C', brand:'Isuzu',     model:'D-Max',    year:2022, fuel_type:'diesel',   capacity:5,  mileage:45890,  status:'maintenance', color:'Noir',  vin:'JACDM7200N7012978' });
  await Vehicle.upsert({ id:4, plate:'LT-3456-D', brand:'Ford',      model:'Transit',  year:2019, fuel_type:'gasoline', capacity:9,  mileage:201340, status:'available',   color:'Blanc', vin:'WF0XXXTTGXJA56789' });
  await Vehicle.upsert({ id:5, plate:'LT-7890-E', brand:'Mitsubishi',model:'L200',     year:2023, fuel_type:'diesel',   capacity:5,  mileage:12300,  status:'in_use',      color:'Gris',  vin:'JMBLYDB3WGJ004512', driver_id:5 });
  await Vehicle.upsert({ id:6, plate:'LT-2468-F', brand:'Nissan',    model:'Patrol',   year:2021, fuel_type:'hybrid',   capacity:7,  mileage:67800,  status:'available',   color:'Blanc', vin:'JN8BY3JY3JW089241' });

  // Drivers
  await Driver.upsert({ id:1, user_id:3, license_number:'CMR-DL-2019-0045', license_category:'B,C', license_expiry:'2027-06-30', experience_years:7, avg_rating:4.80, total_trips:234, status:'available' });
  await Driver.upsert({ id:2, user_id:4, license_number:'CMR-DL-2018-0078', license_category:'B,C,D', license_expiry:'2026-09-30', experience_years:8, avg_rating:4.60, total_trips:189, status:'on_trip', vehicle_id:2 });
  await Driver.upsert({ id:3, user_id:5, license_number:'CMR-DL-2020-0112', license_category:'B,C', license_expiry:'2028-03-31', experience_years:5, avg_rating:4.90, total_trips:312, status:'on_trip', vehicle_id:5 });
  await Driver.upsert({ id:4, user_id:6, license_number:'CMR-DL-2017-0034', license_category:'B,C,D', license_expiry:'2025-12-31', experience_years:9, avg_rating:4.40, total_trips:156, status:'off_duty' });
  await Driver.upsert({ id:5, user_id:7, license_number:'CMR-DL-2021-0089', license_category:'B', license_expiry:'2029-06-30', experience_years:4, avg_rating:4.70, total_trips:98, status:'available' });

  // Trips
  await Trip.upsert({ id:1, vehicle_id:2, driver_id:2, from_location:'Port de Douala, Zone UDEAC', to_location:'Yaoundé Centre-Ville', estimated_distance:252, actual_distance:249, status:'completed', purpose:'Livraison marchandises', fuel_used:31.5, scheduled_start:'2026-03-20 06:00:00', actual_start:'2026-03-20 06:12:00', actual_end:'2026-03-20 10:20:00', created_by:2 });
  await Trip.upsert({ id:2, vehicle_id:5, driver_id:3, from_location:'Douala Akwa', to_location:'Bafoussam, Marché B', estimated_distance:324, status:'in_progress', purpose:'Transport de fret', scheduled_start:'2026-03-21 07:00:00', actual_start:'2026-03-21 07:15:00', created_by:2 });
  await Trip.upsert({ id:3, vehicle_id:1, driver_id:1, from_location:'Zone Industrielle UDEAC', to_location:'Limbé Port', estimated_distance:72, status:'planned', purpose:'Inspection terrain', scheduled_start:'2026-03-22 08:00:00', created_by:2 });
  await Trip.upsert({ id:4, vehicle_id:4, driver_id:4, from_location:'Douala Ndogbong', to_location:'Bertoua Marché Central', estimated_distance:487, actual_distance:492, status:'completed', purpose:'Livraison fret logistique', fuel_used:68.0, scheduled_start:'2026-03-18 05:00:00', actual_start:'2026-03-18 05:20:00', actual_end:'2026-03-18 14:05:00', created_by:2 });
  await Trip.upsert({ id:5, vehicle_id:6, driver_id:5, from_location:'Zone Industrielle Douala', to_location:'Ngaoundéré Gare', estimated_distance:690, status:'cancelled', purpose:'Transport fret interurbain', scheduled_start:'2026-03-19 04:00:00', created_by:2 });
  await Trip.upsert({ id:6, vehicle_id:1, driver_id:1, from_location:'Douala Akwa', to_location:'Kribi Port de Pêche', estimated_distance:155, actual_distance:158, status:'completed', purpose:'Livraison client direct', fuel_used:22.0, scheduled_start:'2026-03-17 09:00:00', actual_start:'2026-03-17 09:05:00', actual_end:'2026-03-17 12:15:00', created_by:2 });

  // Fuel
  await Fuel.upsert({ id:1, vehicle_id:1, driver_id:1, date:'2026-03-19', quantity:65, price_per_litre:750, total_cost:48750, fuel_type:'diesel', station_name:'Total Akwa',        station_city:'Douala', mileage_at_fill:87180,  created_by:2 });
  await Fuel.upsert({ id:2, vehicle_id:2, driver_id:2, date:'2026-03-20', quantity:80, price_per_litre:750, total_cost:60000, fuel_type:'diesel', station_name:'Tradex Bassa',       station_city:'Douala', mileage_at_fill:134490, created_by:2 });
  await Fuel.upsert({ id:3, vehicle_id:5, driver_id:3, date:'2026-03-21', quantity:55, price_per_litre:750, total_cost:41250, fuel_type:'diesel', station_name:'Shell Bonamoussadi', station_city:'Douala', mileage_at_fill:12250,  created_by:2 });
  await Fuel.upsert({ id:4, vehicle_id:4, driver_id:4, date:'2026-03-18', quantity:70, price_per_litre:720, total_cost:50400, fuel_type:'gasoline',station_name:'Total Yaoundé',     station_city:'Yaoundé',mileage_at_fill:201270, created_by:2 });
  await Fuel.upsert({ id:5, vehicle_id:6, driver_id:5, date:'2026-03-17', quantity:45, price_per_litre:750, total_cost:33750, fuel_type:'hybrid',  station_name:'Tradex Bépanda',    station_city:'Douala', mileage_at_fill:67750,  created_by:2 });
  await Fuel.upsert({ id:6, vehicle_id:1, driver_id:1, date:'2026-03-15', quantity:58, price_per_litre:750, total_cost:43500, fuel_type:'diesel',  station_name:'Total Akwa',        station_city:'Douala', mileage_at_fill:87100,  created_by:2 });

  // Maintenance
  await Maintenance.upsert({ id:1, vehicle_id:3, type:'inspection', description:'Révision complète 50 000 km', scheduled_date:'2026-03-20', status:'in_progress', estimated_cost:185000, provider:'Isuzu Garage Douala', provider_phone:'+237 699 800 001', created_by:2 });
  await Maintenance.upsert({ id:2, vehicle_id:1, type:'routine',    description:'Vidange huile + filtres',     scheduled_date:'2026-04-05', status:'scheduled',   estimated_cost:45000,  created_by:2 });
  await Maintenance.upsert({ id:3, vehicle_id:4, type:'repair',     description:'Remplacement plaquettes frein',scheduled_date:'2026-03-15', completed_date:'2026-03-15', status:'completed', estimated_cost:92000, actual_cost:88500, provider:'AutoCentre Akwa', provider_phone:'+237 677 800 002', created_by:2 });
  await Maintenance.upsert({ id:4, vehicle_id:2, type:'routine',    description:'Contrôle pneus + équilibrage',scheduled_date:'2026-04-12', status:'scheduled',   estimated_cost:15000,  created_by:2 });
  await Maintenance.upsert({ id:5, vehicle_id:5, type:'inspection', description:'Contrôle technique APAVE',    scheduled_date:'2026-03-25', status:'scheduled',   estimated_cost:30000,  provider:'APAVE Cameroun', provider_phone:'+237 699 800 003', created_by:2 });

  // Notifications
  await Notification.upsert({ id:1, sender_id:2, type:'alert',   title:'Maintenance urgente – LT-9012-C',  message:'Le véhicule Isuzu D-Max est en révision. Retour estimé dans 48h.',              is_read:false, target_role:'manager' });
  await Notification.upsert({ id:2, sender_id:2, type:'info',    title:'Trajet en cours – Paul Mbarga',     message:'Mission Douala → Bafoussam en cours depuis 07h15.',                             is_read:false, target_role:'all' });
  await Notification.upsert({ id:3, sender_id:2, type:'success', title:'Livraison confirmée – LT-1234-A',  message:'La livraison Douala → Kribi a été complétée avec succès.',                       is_read:true,  target_role:'all' });
  await Notification.upsert({ id:4, sender_id:2, type:'warning', title:'Kilométrage élevé – LT-3456-D',   message:'Le Ford Transit a dépassé 200 000 km. Inspection recommandée.',                   is_read:true,  target_role:'manager' });
  await Notification.upsert({ id:5, sender_id:2, type:'info',    title:'Nouveau conducteur enregistré',    message:'Ibrahim Bello a été ajouté comme conducteur disponible.',                         is_read:true,  target_role:'manager' });

  console.log('✅ Seeds insérés avec succès');
  await sequelize.close();
}

seed().catch(e => { console.error('❌ Erreur seed:', e); process.exit(1); });
