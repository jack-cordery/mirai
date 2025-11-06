-- name: GetAllBookings :many
SELECT
  *
FROM
  bookings;

-- name: GetAllBookingsWithJoinByID :many
WITH
  unit AS (
    SELECT
      $2::integer AS minutes
  ),
  cancelled_history AS (
    SELECT
      h.booking_id,
      (
        ARRAY_AGG(
          h.start_time
          ORDER BY
            h.changed_at DESC
        )
      ) [1] AS cancelled_start_time,
      (
        ARRAY_AGG(
          h.end_time
          ORDER BY
            h.changed_at DESC
        )
      ) [1] AS cancelled_end_time
    FROM
      booking_history h
    GROUP BY
      h.booking_id
  )
SELECT
  b.id,
  b.user_id,
  u.name AS user_name,
  u.surname AS user_surname,
  u.email AS user_email,
  u.last_login AS user_last_login,
  b.type_id,
  bt.title AS type_title,
  b.paid,
  b.cost,
  b.status,
  b.status_updated_at,
  b.status_updated_by,
  b.notes,
  b.created_at,
  b.last_edited,
  CASE
    WHEN b.status = 'cancelled' THEN ch.cancelled_start_time
    ELSE MIN(a.datetime)::timestamp
  END AS start_time,
  CASE
    WHEN b.status = 'cancelled' THEN ch.cancelled_end_time
    ELSE (
      MAX(a.datetime) + (
        SELECT
          minutes
        FROM
          unit
      ) * INTERVAL '1 minute'
    )::timestamp
  END AS end_time
FROM
  bookings b
  JOIN users u ON b.user_id = u.id
  JOIN booking_types bt ON b.type_id = bt.id
  LEFT JOIN booking_slots bs ON b.id = bs.booking_id
  LEFT JOIN availability a ON bs.availability_slot_id = a.id
  LEFT JOIN cancelled_history ch ON b.id = ch.booking_id
WHERE
  b.user_id = $1
GROUP BY
  b.id,
  b.user_id,
  u.name,
  u.surname,
  u.email,
  u.last_login,
  b.type_id,
  bt.title,
  b.paid,
  b.cost,
  b.status,
  b.status_updated_at,
  b.status_updated_by,
  b.notes,
  b.created_at,
  b.last_edited,
  ch.cancelled_start_time,
  ch.cancelled_end_time
ORDER BY
  b.created_at DESC;

-- name: GetAllBookingsWithJoin :many
WITH
  unit AS (
    SELECT
      $1::integer AS minutes
  ),
  cancelled_history AS (
    SELECT
      h.booking_id,
      (
        ARRAY_AGG(
          h.start_time
          ORDER BY
            h.changed_at DESC
        )
      ) [1] AS cancelled_start_time,
      (
        ARRAY_AGG(
          h.end_time
          ORDER BY
            h.changed_at DESC
        )
      ) [1] AS cancelled_end_time
    FROM
      booking_history h
    GROUP BY
      h.booking_id
  )
SELECT
  b.id,
  b.user_id,
  u.name AS user_name,
  u.surname AS user_surname,
  u.email AS user_email,
  u.last_login AS user_last_login,
  b.type_id,
  bt.title AS type_title,
  b.paid,
  b.cost,
  b.status,
  b.status_updated_at,
  b.status_updated_by,
  b.notes,
  b.created_at,
  b.last_edited,
  CASE
    WHEN b.status = 'cancelled' THEN ch.cancelled_start_time
    ELSE MIN(a.datetime)::timestamp
  END AS start_time,
  CASE
    WHEN b.status = 'cancelled' THEN ch.cancelled_end_time
    ELSE (
      MAX(a.datetime) + (
        SELECT
          minutes
        FROM
          unit
      ) * INTERVAL '1 minute'
    )::timestamp
  END AS end_time
FROM
  bookings b
  JOIN users u ON b.user_id = u.id
  JOIN booking_types bt ON b.type_id = bt.id
  LEFT JOIN booking_slots bs ON b.id = bs.booking_id
  LEFT JOIN availability a ON bs.availability_slot_id = a.id
  LEFT JOIN cancelled_history ch ON b.id = ch.booking_id
GROUP BY
  b.id,
  b.user_id,
  u.name,
  u.surname,
  u.email,
  u.last_login,
  b.type_id,
  bt.title,
  b.paid,
  b.cost,
  b.status,
  b.status_updated_at,
  b.status_updated_by,
  b.notes,
  b.created_at,
  b.last_edited,
  ch.cancelled_start_time,
  ch.cancelled_end_time
ORDER BY
  b.created_at DESC;

-- name: GetBookingWithJoin :one
WITH
  unit AS (
    SELECT
      $1::integer AS minutes
  ),
  cancelled_history AS (
    SELECT
      h.booking_id,
      (
        ARRAY_AGG(
          h.start_time
          ORDER BY
            h.changed_at DESC
        )
      ) [1] AS cancelled_start_time,
      (
        ARRAY_AGG(
          h.end_time
          ORDER BY
            h.changed_at DESC
        )
      ) [1] AS cancelled_end_time
    FROM
      booking_history h
    GROUP BY
      h.booking_id
  )
SELECT
  b.id,
  b.user_id,
  u.name AS user_name,
  u.surname AS user_surname,
  u.email AS user_email,
  u.last_login AS user_last_login,
  b.type_id,
  bt.title AS type_title,
  b.paid,
  b.cost,
  b.status,
  b.status_updated_at,
  b.status_updated_by,
  b.notes,
  b.created_at,
  b.last_edited,
  CASE
    WHEN b.status = 'cancelled' THEN ch.cancelled_start_time
    ELSE MIN(a.datetime)::timestamp
  END AS start_time,
  CASE
    WHEN b.status = 'cancelled' THEN ch.cancelled_end_time
    ELSE (
      MAX(a.datetime) + (
        SELECT
          minutes
        FROM
          unit
      ) * INTERVAL '1 minute'
    )::timestamp
  END AS end_time
FROM
  bookings b
  JOIN users u ON b.user_id = u.id
  JOIN booking_types bt ON b.type_id = bt.id
  LEFT JOIN booking_slots bs ON b.id = bs.booking_id
  LEFT JOIN availability a ON bs.availability_slot_id = a.id
  LEFT JOIN cancelled_history ch ON b.id = ch.booking_id
WHERE
  b.id = $2
GROUP BY
  b.id,
  b.user_id,
  u.name,
  u.surname,
  u.email,
  u.last_login,
  b.type_id,
  bt.title,
  b.paid,
  b.cost,
  b.status,
  b.status_updated_at,
  b.status_updated_by,
  b.notes,
  b.created_at,
  b.last_edited,
  ch.cancelled_start_time,
  ch.cancelled_end_time
ORDER BY
  b.created_at DESC;

-- name: GetBookingById :one
SELECT
  b.id,
  b.user_id,
  b.type_id,
  b.paid,
  b.cost,
  b.status,
  b.status_updated_at,
  b.status_updated_by,
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

-- name: PostManualPayment :exec 
UPDATE bookings
SET
  paid = true
WHERE
  id = $1;

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
  unit AS (
    SELECT
      $7::integer AS minutes
  ),
  new_booking as (
    INSERT INTO
      bookings (
        user_id,
        type_id,
        paid,
        cost,
        notes,
        status_updated_by
      )
    VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        (
          SELECT
            email
          FROM
            users
          WHERE
            users.id = $1
        )
      )
    RETURNING
      id
  ),
  slot_insert AS (
    INSERT INTO
      booking_slots (booking_id, availability_slot_id)
    SELECT
      id,
      unnest($6::int[])
    FROM
      new_booking
    RETURNING
      booking_id,
      availability_slot_id
  ),
  slot_times AS (
    SELECT
      s.booking_id,
      MIN(a.datetime)::timestamp AS start_time,
      (
        MAX(a.datetime) + (
          (
            SELECT
              minutes
            from
              unit
          ) * INTERVAL '1 minute'
        )
      )::timestamp AS end_time
    FROM
      slot_insert s
      JOIN availability a ON s.availability_slot_id = a.id
    GROUP BY
      s.booking_id
  )
SELECT
  nb.id AS booking_id,
  st.start_time,
  st.end_time
FROM
  new_booking nb
  JOIN slot_times st ON nb.id = st.booking_id;

-- name: UpdateBooking :one
UPDATE bookings
SET
  user_id = $2,
  type_id = $3,
  paid = $4,
  cost = $5,
  notes = $6,
  status_updated_by = $7,
  last_edited = DEFAULT
WHERE
  id = $1
RETURNING
  id;

-- name: UpdateBookingStatus :exec
UPDATE bookings
SET
  status = $2,
  status_updated_by = $3,
  status_updated_at = DEFAULT
WHERE
  id = $1;

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

-- name: CreateBookingHistory :exec
INSERT INTO
  booking_history (
    booking_id,
    start_time,
    end_time,
    status,
    changed_by_email
  )
VALUES
  ($1, $2, $3, $4, $5);

-- name: FreeAvailabilitySlot :exec
DELETE FROM booking_slots
WHERE
  booking_id = $1;

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
