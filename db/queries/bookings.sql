-- name: GetAllBookings :many
SELECT
  *
FROM
  bookings;

-- name: GetBookingById :one
SELECT
  *
FROM
  bookings
WHERE
  id = $1
LIMIT
  1;

-- name: GetEmployeeById :one
SELECT
  *
FROM
  employees
WHERE
  id = $1
LIMIT
  1;

-- name: GetUserById :one
SELECT
  *
FROM
  users
WHERE
  id = $1
LIMIT
  1;

-- name: GetAvailabilitySlotById :one
SELECT
  *
FROM
  availability
WHERE
  id = $1
LIMIT
  1;

-- name: GetBookingTypeById :one
SELECT
  *
FROM
  booking_types
WHERE
  id = $1
LIMIT
  1;

-- name: CreateBooking :one 
INSERT INTO
  bookings (
    user_id,
    availability_slot,
    type_id,
    paid,
    cost,
    notes
  )
VALUES
  ($1, $2, $3, $4, $5, $6)
RETURNING
  id;

-- name: UpdateBooking :one
UPDATE bookings
SET
  id = $1,
  user_id = $2,
  availability_slot = $3,
  type_id = $4,
  paid = $5,
  cost = $6,
  notes = $7,
  created_at = DEFAULT,
  last_edited = DEFAULT
WHERE
  id = $1
RETURNING
  id;

-- name: DeleteBooking :one
DELETE FROM bookings
WHERE
  id = $1
RETURNING
  id;

-- name: CreateEmployee :one 
INSERT INTO
  employees (name, surname, email, title, description)
VALUES
  ($1, $2, $3, $4, $5)
RETURNING
  id;

-- name: UpdateEmployee :one
UPDATE employees
SET
  id = $1,
  name = $2,
  surname = $3,
  email = $4,
  title = $5,
  description = $6,
  created_at = DEFAULT,
  last_login = DEFAULT
WHERE
  id = $1
RETURNING
  id;

-- name: DeleteEmployee :one
DELETE FROM employees
WHERE
  id = $1
RETURNING
  id;

-- name: CreateUser :one 
INSERT INTO
  users (name, surname, email)
VALUES
  ($1, $2, $3)
RETURNING
  id;

-- name: UpdateUser :one
UPDATE users
SET
  id = $1,
  name = $2,
  surname = $3,
  email = $4,
  created_at = DEFAULT,
  last_login = DEFAULT
WHERE
  id = $1
RETURNING
  id;

-- name: DeleteUser :one
DELETE FROM users
WHERE
  id = $1
RETURNING
  id;

-- name: CreateAvailabilitySlot :one 
INSERT INTO
  availability (
    employee_id,
    datetime,
    duration_units,
    duration_minutes,
    type_id
  )
VALUES
  ($1, $2, $3, $4, $5)
RETURNING
  id;

-- name: UpdateAvailabilitySlot :one
UPDATE availability
SET
  id = $1,
  employee_id = $2,
  datetime = $3,
  duration_units = $4,
  duration_minutes = $5,
  type_id = $6,
  created_at = DEFAULT,
  last_edited = DEFAULT
WHERE
  id = $1
RETURNING
  id;

-- name: DeleteAvailabilitySlot :one
DELETE FROM availability
WHERE
  id = $1
RETURNING
  id;

-- name: CreateBookingType :one 
INSERT INTO
  booking_types (title, description, fixed, cost)
VALUES
  ($1, $2, $3, $4)
RETURNING
  id;

-- name: UpdateBookingType :one
UPDATE booking_types
SET
  id = $1,
  title = $2,
  description = $3,
  fixed = $4,
  cost = $5,
  created_at = DEFAULT,
  last_edited = DEFAULT
WHERE
  id = $1
RETURNING
  id;

-- name: DeleteBookingType :one
DELETE FROM booking_types
WHERE
  id = $1
RETURNING
  id;

-- name: GetCostAndAvailability :one
WITH
  vals AS (
    SELECT
      (
        SELECT
          fixed
        FROM
          booking_types
        WHERE
          booking_types.id = $1
      ) AS fixed,
      (
        SELECT
          cost
        FROM
          booking_types
        WHERE
          booking_types.id = $1
      ) AS cost,
      (
        SELECT
          duration_units
        FROM
          availability
        WHERE
          availability.id = $2
      ) AS duration_units
  )
SELECT
  fixed,
  cost,
  duration_units
FROM
  vals
WHERE
  fixed IS NOT NULL
  AND cost IS NOT NULL
  AND duration_units IS NOT NULL;
