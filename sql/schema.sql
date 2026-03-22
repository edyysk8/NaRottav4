CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('passenger', 'driver', 'admin');
CREATE TYPE driver_status AS ENUM ('offline', 'online', 'busy', 'blocked');
CREATE TYPE ride_status AS ENUM ('searching', 'driver_assigned', 'driver_arriving', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'refunded', 'failed');
CREATE TYPE vehicle_type AS ENUM ('economy', 'comfort', 'premium', 'moto');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(140) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  phone VARCHAR(30) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating NUMERIC(3,2) DEFAULT 5.00,
  emergency_contact VARCHAR(140),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cnh_number VARCHAR(50),
  document_status VARCHAR(40) NOT NULL DEFAULT 'pending',
  status driver_status NOT NULL DEFAULT 'offline',
  rating NUMERIC(3,2) DEFAULT 5.00,
  acceptance_rate NUMERIC(5,2) DEFAULT 0,
  cancellation_rate NUMERIC(5,2) DEFAULT 0,
  current_location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_location ON drivers USING GIST (current_location);
CREATE INDEX idx_drivers_status ON drivers(status);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  brand VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  plate VARCHAR(20) UNIQUE NOT NULL,
  color VARCHAR(40),
  year INT,
  type vehicle_type NOT NULL DEFAULT 'economy',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES riders(id),
  driver_id UUID REFERENCES drivers(id),
  status ride_status NOT NULL DEFAULT 'searching',
  pickup_address TEXT,
  destination_address TEXT,
  pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,
  destination_location GEOGRAPHY(POINT, 4326) NOT NULL,
  route_geometry JSONB DEFAULT '{}'::jsonb,
  estimated_distance_km NUMERIC(10,2) DEFAULT 0,
  estimated_duration_min NUMERIC(10,2) DEFAULT 0,
  estimated_price NUMERIC(10,2) DEFAULT 0,
  final_price NUMERIC(10,2),
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT
);

CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_rider_id ON rides(rider_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);

CREATE TABLE ride_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  event_type VARCHAR(60) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID UNIQUE NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  driver_payout NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'BRL',
  method VARCHAR(30) NOT NULL DEFAULT 'pix',
  status payment_status NOT NULL DEFAULT 'pending',
  provider VARCHAR(60) DEFAULT 'sandbox',
  transaction_reference VARCHAR(120),
  provider_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_code VARCHAR(30) NOT NULL,
  base_fare NUMERIC(10,2) NOT NULL,
  per_km NUMERIC(10,2) NOT NULL,
  per_min NUMERIC(10,2) NOT NULL,
  minimum_fare NUMERIC(10,2) NOT NULL,
  platform_commission_pct NUMERIC(5,2) NOT NULL DEFAULT 20,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO pricing_rules (city_code, base_fare, per_km, per_min, minimum_fare, platform_commission_pct)
VALUES ('default', 4.50, 2.10, 0.40, 10.00, 20.00);
