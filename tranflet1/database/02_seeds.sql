-- TRANSFLET – Données initiales (seeds)
-- Mot de passe pour tous : "password123" (bcrypt hash)

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE tracking; TRUNCATE notifications; TRUNCATE maintenance_records;
TRUNCATE fuel_records; TRUNCATE trips; TRUNCATE drivers; TRUNCATE vehicles; TRUNCATE users;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (id,first_name,last_name,email,password_hash,role,phone,is_active) VALUES
(1,'Admin','TRANSIMEX','admin@transimex.cm','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin','+237 699 000 001',1),
(2,'Landry','Fouthe','manager@transimex.cm','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','manager','+237 699 000 002',1),
(3,'Jean-Baptiste','Nkomo','jbnkomo@transimex.cm','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','driver','+237 655 123 456',1),
(4,'Paul','Mbarga','pmbarga@transimex.cm','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','driver','+237 677 234 567',1),
(5,'Marie','Tchouaffi','mtchouaffi@transimex.cm','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','driver','+237 699 345 678',1),
(6,'Alain','Fouda','afouda@transimex.cm','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','driver','+237 650 456 789',1),
(7,'Ibrahim','Bello','ibello@transimex.cm','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','driver','+237 670 567 890',1);

-- mot de passe réel : "password123"
-- Le hash ci-dessus est le hash bcrypt de "password"
-- Pour "password123" lancez: node -e "require('bcryptjs').hash('password123',10).then(console.log)"
-- Puis remplacez le hash en production

INSERT INTO vehicles (id,plate,brand,model,year,color,vin,fuel_type,capacity,mileage,status,purchase_date,insurance_expiry,inspection_expiry,driver_id) VALUES
(1,'LT-1234-A','Toyota','Hilux',2021,'Blanc','JTFB3RFB1MD012345','diesel',5,87230,'available','2021-03-15','2026-12-31','2026-06-30',NULL),
(2,'LT-5678-B','Mercedes','Sprinter',2020,'Gris','WDB9066331S112233','diesel',12,134560,'in_use','2020-07-01','2026-09-30','2026-03-31',4),
(3,'LT-9012-C','Isuzu','D-Max',2022,'Noir','JACDM7200N7012978','diesel',5,45890,'maintenance','2022-01-20','2027-01-31','2027-01-31',NULL),
(4,'LT-3456-D','Ford','Transit',2019,'Blanc','WF0XXXTTGXJA56789','gasoline',9,201340,'available','2019-11-10','2026-11-30','2026-05-31',NULL),
(5,'LT-7890-E','Mitsubishi','L200',2023,'Gris','JMBLYDB3WGJ004512','diesel',5,12300,'in_use','2023-06-01','2027-06-30','2027-06-30',5),
(6,'LT-2468-F','Nissan','Patrol',2021,'Blanc','JN8BY3JY3JW089241','hybrid',7,67800,'available','2021-09-01','2026-09-30','2026-09-30',NULL);

INSERT INTO drivers (id,user_id,license_number,license_category,license_expiry,experience_years,avg_rating,total_trips,status,vehicle_id,emergency_contact,emergency_phone) VALUES
(1,3,'CMR-DL-2019-0045','B,C','2027-06-30',7,4.80,234,'available',NULL,'Epouse Nkomo','+237 677 111 222'),
(2,4,'CMR-DL-2018-0078','B,C,D','2026-09-30',8,4.60,189,'on_trip',2,'Frère Mbarga','+237 699 222 333'),
(3,5,'CMR-DL-2020-0112','B,C','2028-03-31',5,4.90,312,'on_trip',5,'Mère Tchouaffi','+237 650 333 444'),
(4,6,'CMR-DL-2017-0034','B,C,D','2025-12-31',9,4.40,156,'off_duty',NULL,'Père Fouda','+237 677 444 555'),
(5,7,'CMR-DL-2021-0089','B','2029-06-30',4,4.70,98,'available',NULL,'Femme Bello','+237 699 555 666');

INSERT INTO trips (id,vehicle_id,driver_id,from_location,to_location,estimated_distance,actual_distance,estimated_duration,actual_duration,status,purpose,passengers,fuel_used,scheduled_start,actual_start,actual_end,created_by) VALUES
(1,2,2,'Port de Douala, Zone UDEAC','Yaoundé Centre-Ville',252,249,'4h15','4h08','completed','Livraison marchandises',0,31.5,'2026-03-20 06:00:00','2026-03-20 06:12:00','2026-03-20 10:20:00',2),
(2,5,3,'Douala Akwa','Bafoussam, Marché B',324,NULL,'6h00',NULL,'in_progress','Transport de fret',0,NULL,'2026-03-21 07:00:00','2026-03-21 07:15:00',NULL,2),
(3,1,1,'Zone Industrielle UDEAC','Limbé Port',72,NULL,'1h30',NULL,'planned','Inspection terrain',2,NULL,'2026-03-22 08:00:00',NULL,NULL,2),
(4,4,4,'Douala Ndogbong','Bertoua Marché Central',487,492,'8h20','8h45','completed','Livraison fret logistique',0,68.0,'2026-03-18 05:00:00','2026-03-18 05:20:00','2026-03-18 14:05:00',2),
(5,6,5,'Zone Industrielle Douala','Ngaoundéré Gare',690,NULL,'12h00',NULL,'cancelled','Transport fret interurbain',0,NULL,'2026-03-19 04:00:00',NULL,NULL,2),
(6,1,1,'Douala Akwa','Kribi Port de Pêche',155,158,'3h00','3h10','completed','Livraison client direct',1,22.0,'2026-03-17 09:00:00','2026-03-17 09:05:00','2026-03-17 12:15:00',2);

INSERT INTO fuel_records (id,vehicle_id,driver_id,date,quantity,price_per_litre,total_cost,fuel_type,station_name,station_city,mileage_at_fill,created_by) VALUES
(1,1,1,'2026-03-19',65,750,48750,'diesel','Total Akwa','Douala',87180,2),
(2,2,2,'2026-03-20',80,750,60000,'diesel','Tradex Bassa','Douala',134490,2),
(3,5,3,'2026-03-21',55,750,41250,'diesel','Shell Bonamoussadi','Douala',12250,2),
(4,4,4,'2026-03-18',70,720,50400,'gasoline','Total Yaoundé','Yaoundé',201270,2),
(5,6,5,'2026-03-17',45,750,33750,'hybrid','Tradex Bépanda','Douala',67750,2),
(6,1,1,'2026-03-15',58,750,43500,'diesel','Total Akwa','Douala',87100,2);

INSERT INTO maintenance_records (id,vehicle_id,type,description,scheduled_date,completed_date,status,estimated_cost,actual_cost,provider,provider_phone,created_by) VALUES
(1,3,'inspection','Révision complète 50 000 km – contrôle moteur, boîte, freins','2026-03-20',NULL,'in_progress',185000,NULL,'Isuzu Garage Douala','+237 699 800 001',2),
(2,1,'routine','Vidange huile moteur + remplacement filtres air et huile','2026-04-05',NULL,'scheduled',45000,NULL,NULL,NULL,2),
(3,4,'repair','Remplacement plaquettes de frein avant et arrière + disques AV','2026-03-15','2026-03-15','completed',92000,88500,'AutoCentre Akwa','+237 677 800 002',2),
(4,2,'routine','Contrôle pression pneus + équilibrage + rotation','2026-04-12',NULL,'scheduled',15000,NULL,NULL,NULL,2),
(5,5,'inspection','Contrôle technique périodique APAVE – visite annuelle','2026-03-25',NULL,'scheduled',30000,NULL,'APAVE Cameroun','+237 699 800 003',2);

INSERT INTO notifications (id,sender_id,recipient_id,type,title,message,is_read,target_role) VALUES
(1,2,NULL,'alert','Maintenance urgente – LT-9012-C','Le véhicule Isuzu D-Max est en révision. Retour estimé dans 48h.',0,'manager'),
(2,2,NULL,'info','Trajet en cours – Paul Mbarga','Mission Douala → Bafoussam en cours depuis 07h15.',0,'all'),
(3,2,NULL,'success','Livraison confirmée – LT-1234-A','La livraison Douala → Kribi (trajet #6) a été complétée avec succès.',1,'all'),
(4,2,NULL,'warning','Kilométrage élevé – LT-3456-D','Le Ford Transit a dépassé 200 000 km. Inspection recommandée.',1,'manager'),
(5,2,NULL,'info','Nouveau conducteur enregistré','Ibrahim Bello a été ajouté comme conducteur disponible dans le système.',1,'manager');

INSERT INTO tracking (vehicle_id,latitude,longitude,speed,engine_status,mileage,recorded_at) VALUES
(1, 4.0511, 9.7679, 0,    'off', 87230, NOW()),
(2, 4.5833, 8.3478, 78.5, 'on',  134560,NOW()),
(3, 4.0485, 9.7255, 0,    'off', 45890, NOW()),
(4, 4.0499, 9.7683, 0,    'off', 201340,NOW()),
(5, 5.4767, 10.4193,52.0, 'on',  12300, NOW()),
(6, 4.0520, 9.7700, 0,    'off', 67800, NOW());
