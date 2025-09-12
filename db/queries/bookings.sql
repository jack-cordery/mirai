-- name: GetAllBookings :many
SELECT
  *
FROM
  bookings;

-- name: GetBookingById :one
SELECT
  b.id,
  b.user_id,
  b.type_id,
  b.paid,
  b.cost,
  b.notes,
  b.created_at,
  b.last_edited,
  array_agg(
    bs.availability_slot_id
    ORDER BY
      bs.availability_slot_id
  )::int[] AS slot_ids
FROM
  bookings b
  LEFT JOIN booking_slots bs ON b.id = bs.booking_id
WHERE
  b.id = $1
GROUP BY
  b.id
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

-- name: GetAllEmployees :many
SELECT
  *
FROM
  employees;

-- name: GetUserById :one
SELECT
  *
FROM
  users
WHERE
  id = $1
LIMIT
  1;

-- name: GetUserByEmail :one
SELECT
  *
FROM
  users
WHERE
  email = $1
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

-- name: GetAllAvailabilitySlots :many
SELECT
  *
FROM
  availability;

-- name: GetAllBookingTypes :many
SELECT
  *
FROM
  booking_types;

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
WITH
  new_booking as (
    INSERT INTO
      bookings (user_id, type_id, paid, cost, notes)
    VALUES
      ($1, $2, $3, $4, $5)
    RETURNING
      id
  )
INSERT INTO
  booking_slots (booking_id, availability_slot_id)
SELECT
  id,
  unnest($6::int[])
FROM
  new_booking
RETURNING
  booking_id;

-- name: UpdateBooking :one
UPDATE bookings
SET
  user_id = $2,
  type_id = $3,
  paid = $4,
  cost = $5,
  notes = $6,
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

-- name: CreateBookingSlot :exec
INSERT INTO
  booking_slots (booking_id, availability_slot_id)
VALUES
  ($1, $2);

-- name: UpdateBookingSlot :exec
UPDATE booking_slots
SET
  booking_id = $3,
  availability_slot_id = $4
WHERE
  booking_id = $1
  AND availability_slot_id = $2;

-- name: DeleteBookingSlot :exec
DELETE FROM booking_slots
WHERE
  booking_id = $1
  AND availability_slot_id = $2;

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
  availability (employee_id, datetime, type_id)
VALUES
  ($1, $2, $3)
RETURNING
  id;

-- name: UpdateAvailabilitySlot :one
UPDATE availability
SET
  id = $1,
  employee_id = $2,
  datetime = $3,
  type_id = $4,
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
