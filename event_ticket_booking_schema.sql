-- Ticket Master PostgreSQL schema for backend image alicekayla/ticket-backend:1.3
-- Run against a new, empty database:
--   docker exec -i ticket-db psql -U postgres -d ticket_master < event_ticket_booking_schema.sql
--
-- The backend uses synchronize=false and migrationsRun=false. This file combines the
-- legacy event/ticket schema with the tracked TypeORM migrations for orders, payments
-- and organizer staff.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'ATTENDEE'
    CHECK (role IN ('ATTENDEE', 'ORGANIZER', 'CHECK_IN_STAFF', 'ADMIN')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE venues (
  venue_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  venue_name VARCHAR(150) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organizer_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  banner_url TEXT,
  event_type VARCHAR(50),
  venue_id BIGINT,
  venue VARCHAR(150) NOT NULL,
  location VARCHAR(255) NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  tickets_issued INTEGER NOT NULL DEFAULT 0 CHECK (tickets_issued >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED')),
  published_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_events_organizer
    FOREIGN KEY (organizer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_events_venue
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id) ON DELETE SET NULL,
  CONSTRAINT chk_events_dates CHECK (end_at > start_at),
  CONSTRAINT chk_events_issued_capacity CHECK (tickets_issued <= capacity)
);

CREATE INDEX idx_events_organizer ON events(organizer_id, created_at DESC);
CREATE INDEX idx_events_public ON events(status, start_at) WHERE status = 'PUBLISHED';
CREATE INDEX idx_events_venue ON events(venue_id);

CREATE TABLE ticket_types (
  ticket_type_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id BIGINT NOT NULL,
  type_name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'MWK',
  quantity_total INTEGER NOT NULL CHECK (quantity_total >= 0),
  quantity_sold INTEGER NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
  quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  per_order_limit INTEGER NOT NULL DEFAULT 10 CHECK (per_order_limit > 0),
  sales_start_at TIMESTAMPTZ,
  sales_end_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ticket_types_event
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  CONSTRAINT uq_ticket_types_event_name UNIQUE (event_id, type_name),
  CONSTRAINT chk_ticket_types_committed
    CHECK (quantity_sold + quantity_reserved <= quantity_total),
  CONSTRAINT chk_ticket_types_sales_period
    CHECK (sales_start_at IS NULL OR sales_end_at IS NULL OR sales_end_at > sales_start_at)
);

CREATE INDEX idx_ticket_types_event ON ticket_types(event_id, ticket_type_id);

CREATE TABLE tickets (
  ticket_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  event_id BIGINT NOT NULL,
  ticket_type_id BIGINT NOT NULL,
  customer_id BIGINT,
  qr_token UUID NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'ISSUED'
    CHECK (status IN ('ISSUED', 'USED', 'CANCELLED', 'REFUNDED')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checked_in_at TIMESTAMPTZ,
  order_item_id BIGINT,
  purchased_at TIMESTAMPTZ,
  payment_tx_ref VARCHAR(100),

  CONSTRAINT fk_tickets_event
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE RESTRICT,
  CONSTRAINT fk_tickets_ticket_type
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(ticket_type_id) ON DELETE RESTRICT,
  CONSTRAINT fk_tickets_customer
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_tickets_event ON tickets(event_id, ticket_type_id);
CREATE INDEX idx_tickets_customer ON tickets(customer_id, purchased_at DESC);
CREATE INDEX idx_tickets_qr_token ON tickets(qr_token);
CREATE INDEX idx_tickets_payment_tx_ref
  ON tickets(payment_tx_ref) WHERE payment_tx_ref IS NOT NULL;

CREATE TABLE ticket_validations (
  validation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id BIGINT,
  checked_by BIGINT,
  attempted_event_id BIGINT,
  result VARCHAR(20) NOT NULL CHECK (result IN ('ACCEPTED', 'REJECTED')),
  reason VARCHAR(50),
  validated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ticket_validations_ticket
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE SET NULL,
  CONSTRAINT fk_ticket_validations_staff
    FOREIGN KEY (checked_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_ticket_validations_event
    FOREIGN KEY (attempted_event_id) REFERENCES events(event_id) ON DELETE SET NULL,
  CONSTRAINT ticket_validations_result_reason_check CHECK (
    (result = 'ACCEPTED' AND reason IS NULL)
    OR (result = 'REJECTED' AND reason IN (
      'NOT_FOUND', 'ALREADY_USED', 'CANCELLED', 'WRONG_EVENT',
      'EVENT_CANCELLED', 'NOT_ASSIGNED'
    ))
  )
);

CREATE INDEX idx_ticket_validations_ticket ON ticket_validations(ticket_id);
CREATE INDEX idx_ticket_validations_staff ON ticket_validations(checked_by, validated_at DESC);

CREATE TABLE organizer_staff (
  staff_id BIGINT PRIMARY KEY
    REFERENCES users(user_id) ON DELETE CASCADE,
  organizer_id BIGINT NOT NULL
    REFERENCES users(user_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizer_staff_organizer ON organizer_staff(organizer_id);

CREATE TABLE staff_event_assignments (
  staff_id BIGINT NOT NULL
    REFERENCES organizer_staff(staff_id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL
    REFERENCES events(event_id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (staff_id, event_id)
);

CREATE INDEX idx_staff_assignments_event ON staff_event_assignments(event_id);

CREATE TABLE orders (
  order_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'MWK',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_event
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE RESTRICT
);

CREATE INDEX idx_orders_customer ON orders(customer_id, created_at DESC);
CREATE INDEX idx_orders_event ON orders(event_id);
CREATE INDEX idx_orders_pending_expiry ON orders(expires_at) WHERE status = 'PENDING';

CREATE TABLE order_items (
  order_item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL,
  ticket_type_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_ticket_type
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(ticket_type_id) ON DELETE RESTRICT,
  CONSTRAINT uq_order_items_order_ticket_type UNIQUE (order_id, ticket_type_id)
);

CREATE INDEX idx_order_items_ticket_type ON order_items(ticket_type_id);

ALTER TABLE tickets
  ADD CONSTRAINT fk_tickets_order_items
  FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id) ON DELETE SET NULL;

CREATE INDEX idx_tickets_order_item_id ON tickets(order_item_id);

CREATE TABLE payments (
  payment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL,
  tx_ref VARCHAR(100) NOT NULL UNIQUE,
  provider_reference VARCHAR(150),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'MWK',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED')),
  checkout_url TEXT,
  failure_reason TEXT,
  provider_metadata JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE RESTRICT
);

CREATE INDEX idx_payments_order ON payments(order_id, created_at DESC);
CREATE UNIQUE INDEX uq_payments_provider_reference
  ON payments(provider_reference) WHERE provider_reference IS NOT NULL;

CREATE TABLE ticket_payment_claims (
  tx_ref VARCHAR(100) PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  ticket_type_id BIGINT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'MWK',
  provider_reference VARCHAR(150),
  status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  tickets_claimed INTEGER NOT NULL DEFAULT 0 CHECK (tickets_claimed >= 0),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_payment_claims_customer
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_payment_claims_event
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE RESTRICT,
  CONSTRAINT fk_payment_claims_ticket_type
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(ticket_type_id) ON DELETE RESTRICT
);

CREATE INDEX idx_payment_claims_customer ON ticket_payment_claims(customer_id);

COMMIT;
