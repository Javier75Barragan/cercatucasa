/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      role VARCHAR(20) DEFAULT 'customer',
      avatar_url TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL,
      category VARCHAR(100) NOT NULL,
      subcategories TEXT[] DEFAULT '{}',
      phone VARCHAR(20) NOT NULL,
      whatsapp VARCHAR(20),
      email VARCHAR(255),
      website TEXT,
      avatar_url TEXT,
      photos TEXT[] DEFAULT '{}',
      address TEXT,
      schedule JSONB,
      rating DECIMAL(2,1) DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      is_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vendor_locations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      accuracy DECIMAL(10, 2),
      is_active BOOLEAN DEFAULT true,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2),
      currency VARCHAR(3) DEFAULT 'USD',
      photos TEXT[] DEFAULT '{}',
      category VARCHAR(100) NOT NULL,
      is_available BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notification_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      category VARCHAR(100) NOT NULL,
      subcategories TEXT[] DEFAULT '{}',
      vendor_types TEXT[] DEFAULT '{}',
      radius_meters INTEGER DEFAULT 200,
      schedule_start TIME,
      schedule_end TIME,
      days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      photos TEXT[] DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      message TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      type VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP,
      resolved_by UUID REFERENCES users(id),
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents(latitude, longitude);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS incidents CASCADE;
    DROP TABLE IF EXISTS contact_requests CASCADE;
    DROP TABLE IF EXISTS reviews CASCADE;
    DROP TABLE IF EXISTS notification_alerts CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS vendor_locations CASCADE;
    DROP TABLE IF EXISTS vendors CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);
};
