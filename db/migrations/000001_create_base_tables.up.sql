CREATE TABLE IF NOT EXISTS employees (
  id serial PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  surname VARCHAR(40) NOT NULL,
  email VARCHAR(255) NOT NULL,
  title VARCHAR(40) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name, surname, title)
);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  surname VARCHAR(40) NOT NULL,
  email VARCHAR(255) NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name, surname, email)
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);

INSERT INTO
  roles (name, description)
VALUES
  ('ADMIN', 'Administrator with full access'),
  ('USER', 'Regular user with limited access');

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booking_types (
  id serial PRIMARY KEY,
  title VARCHAR(40) NOT NULL,
  description TEXT NOT NULL,
  fixed BOOL NOT NULL,
  cost INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_edited TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (title, description)
);

CREATE TABLE IF NOT EXISTS availability (
  id serial PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES employees (id) ON DELETE CASCADE,
  datetime TIMESTAMP NOT NULL,
  type_id INT NOT NULL REFERENCES booking_types (id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_edited TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (employee_id, datetime)
);

CREATE TABLE IF NOT EXISTS bookings (
  id serial PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type_id INT NOT NULL REFERENCES booking_types (id) ON DELETE CASCADE,
  paid BOOL NOT NULL,
  cost INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_edited TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_slots (
  booking_id INT NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  availability_slot_id INT NOT NULL REFERENCES availability (id) ON DELETE CASCADE,
  PRIMARY KEY (booking_id, availability_slot_id),
  UNIQUE (availability_slot_id)
);
