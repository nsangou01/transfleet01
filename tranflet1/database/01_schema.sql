-- TRANSFLET – Schéma MySQL 8.x
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS tracking, notifications, maintenance_records,
  fuel_records, trips, drivers, vehicles, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','manager','driver') NOT NULL DEFAULT 'driver',
  phone         VARCHAR(25),
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at DATETIME,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vehicles (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plate             VARCHAR(20)  NOT NULL UNIQUE,
  brand             VARCHAR(100) NOT NULL,
  model             VARCHAR(100) NOT NULL,
  year              SMALLINT UNSIGNED NOT NULL,
  color             VARCHAR(50),
  vin               VARCHAR(17) UNIQUE,
  fuel_type         ENUM('diesel','gasoline','hybrid','electric') NOT NULL DEFAULT 'diesel',
  capacity          TINYINT UNSIGNED NOT NULL DEFAULT 5,
  mileage           INT UNSIGNED NOT NULL DEFAULT 0,
  status            ENUM('available','in_use','maintenance','out_of_service') NOT NULL DEFAULT 'available',
  purchase_date     DATE,
  purchase_price    DECIMAL(14,2),
  insurance_expiry  DATE,
  inspection_expiry DATE,
  driver_id         INT UNSIGNED,
  notes             TEXT,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE drivers (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          INT UNSIGNED NOT NULL UNIQUE,
  license_number   VARCHAR(50)  NOT NULL UNIQUE,
  license_category VARCHAR(10)  NOT NULL DEFAULT 'B',
  license_expiry   DATE         NOT NULL,
  experience_years TINYINT UNSIGNED DEFAULT 1,
  avg_rating       DECIMAL(3,2) DEFAULT 4.00,
  total_trips      INT UNSIGNED DEFAULT 0,
  status           ENUM('available','on_trip','off_duty','suspended') NOT NULL DEFAULT 'available',
  vehicle_id       INT UNSIGNED,
  emergency_contact VARCHAR(100),
  emergency_phone  VARCHAR(25),
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE trips (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id         INT UNSIGNED NOT NULL,
  driver_id          INT UNSIGNED NOT NULL,
  from_location      VARCHAR(255) NOT NULL,
  to_location        VARCHAR(255) NOT NULL,
  estimated_distance DECIMAL(10,2),
  actual_distance    DECIMAL(10,2),
  estimated_duration VARCHAR(20),
  actual_duration    VARCHAR(20),
  status             ENUM('planned','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
  purpose            VARCHAR(255),
  passengers         TINYINT UNSIGNED DEFAULT 0,
  fuel_used          DECIMAL(8,2),
  notes              TEXT,
  scheduled_start    DATETIME,
  actual_start       DATETIME,
  actual_end         DATETIME,
  created_by         INT UNSIGNED,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (driver_id)  REFERENCES drivers(id),
  INDEX idx_status  (status),
  INDEX idx_vehicle (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fuel_records (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id      INT UNSIGNED NOT NULL,
  driver_id       INT UNSIGNED NOT NULL,
  date            DATE         NOT NULL,
  quantity        DECIMAL(8,2) NOT NULL,
  price_per_litre DECIMAL(8,2) NOT NULL,
  total_cost      DECIMAL(12,2) NOT NULL,
  fuel_type       ENUM('diesel','gasoline','hybrid','electric') NOT NULL DEFAULT 'diesel',
  station_name    VARCHAR(255),
  station_city    VARCHAR(100),
  mileage_at_fill INT UNSIGNED,
  notes           TEXT,
  created_by      INT UNSIGNED,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (driver_id)  REFERENCES drivers(id),
  INDEX idx_vehicle (vehicle_id),
  INDEX idx_date    (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE maintenance_records (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id     INT UNSIGNED NOT NULL,
  type           ENUM('routine','repair','inspection','emergency') NOT NULL,
  description    TEXT         NOT NULL,
  scheduled_date DATE         NOT NULL,
  completed_date DATE,
  status         ENUM('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  estimated_cost DECIMAL(12,2),
  actual_cost    DECIMAL(12,2),
  provider       VARCHAR(255),
  provider_phone VARCHAR(25),
  labor_cost     DECIMAL(12,2),
  parts_cost     DECIMAL(12,2),
  notes          TEXT,
  created_by     INT UNSIGNED,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  INDEX idx_vehicle (vehicle_id),
  INDEX idx_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sender_id    INT UNSIGNED,
  recipient_id INT UNSIGNED,
  type         ENUM('alert','info','success','warning') NOT NULL DEFAULT 'info',
  title        VARCHAR(255) NOT NULL,
  message      TEXT         NOT NULL,
  is_read      TINYINT(1)   NOT NULL DEFAULT 0,
  read_at      DATETIME,
  target_role  ENUM('all','manager','driver') DEFAULT 'all',
  action_url   VARCHAR(500),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id)    REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_recipient (recipient_id),
  INDEX idx_is_read   (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tracking (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id    INT UNSIGNED NOT NULL,
  trip_id       INT UNSIGNED,
  latitude      DECIMAL(10,7) NOT NULL,
  longitude     DECIMAL(10,7) NOT NULL,
  altitude      DECIMAL(8,2),
  speed         DECIMAL(6,2) DEFAULT 0,
  heading       DECIMAL(5,2),
  engine_status ENUM('on','off','unknown') DEFAULT 'unknown',
  mileage       INT UNSIGNED,
  recorded_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (trip_id)    REFERENCES trips(id) ON DELETE SET NULL,
  INDEX idx_vehicle  (vehicle_id),
  INDEX idx_recorded (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
