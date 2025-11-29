-- name: TotalUsers :one
SELECT
  COUNT(*) as count
FROM
  users;

-- name: TotalBookings :one
SELECT
  COUNT(*) as total_count,
  COALESCE(SUM(cost), 0)::integer as total_cost
FROM
  bookings;

-- name: TotalPaidBookings :one
SELECT
  COUNT(*) as total_count,
  COALESCE(SUM(cost), 0)::integer as total_cost
FROM
  bookings
WHERE
  paid = true;

-- name: TotalCancelledBookings :one
SELECT
  COUNT(*) as total_count,
  COALESCE(SUM(cost), 0)::integer as total_cost
FROM
  bookings
WHERE
  status = 'cancelled';

-- name: TotalCompletedBookings :one
SELECT
  COUNT(*) as total_count,
  COALESCE(SUM(cost), 0)::integer as total_cost
FROM
  bookings
WHERE
  status = 'completed';

-- name: TotalConfirmedBookings :one
SELECT
  COUNT(*) as total_count,
  COALESCE(SUM(cost), 0)::integer as total_cost
FROM
  bookings
WHERE
  status = 'confirmed';

-- name: TotalCreatedBookings :one
SELECT
  COUNT(*) as total_count,
  COALESCE(SUM(cost), 0)::integer as total_cost
FROM
  bookings
WHERE
  status = 'created';

-- name: TotalOpenBookings :one
SELECT
  COUNT(*) as total_count,
  COALESCE(SUM(cost), 0)::integer as total_cost
FROM
  bookings
WHERE
  status != 'cancelled';

-- name: TotalOpenPaidBookings :one
SELECT
  COUNT(*) as total_count,
  COALESCE(SUM(cost), 0)::integer as total_cost
FROM
  bookings
WHERE
  status != 'cancelled'
  and paid = true;

-- name: TotalOpenNotPaidBookings :one
SELECT
  COUNT(*) as total_count,
  COALESCE(SUM(cost), 0)::integer as total_cost
FROM
  bookings
WHERE
  status != 'cancelled'
  and paid = false;

-- name: TotalOpenBookingsBy :many
SELECT
  date_trunc($1::text, a.datetime)::timestamp as date,
  COUNT(*) as count,
  COALESCE(sum(b.cost), 0)::integer as sum
FROM
  bookings as b
  RIGHT JOIN (
    SELECT
      booking_id,
      min(availability_slot_id) as availability_slot_id
    FROM
      booking_slots
    GROUP BY
      booking_id
  ) as bs on bs.booking_id = b.id
  LEFT JOIN availability as a on bs.availability_slot_id = a.id
GROUP BY
  date_trunc($1::text, a.datetime)::timestamp;

-- name: TotalOpenNotPaidBookingsBy :many
SELECT
  date_trunc($1::text, a.datetime)::timestamp as date,
  COUNT(*) as count,
  COALESCE(sum(b.cost), 0)::integer as sum
FROM
  bookings as b
  RIGHT JOIN (
    SELECT
      booking_id,
      min(availability_slot_id) as availability_slot_id
    FROM
      booking_slots
    GROUP BY
      booking_id
  ) as bs on bs.booking_id = b.id
  LEFT JOIN availability as a on bs.availability_slot_id = a.id
WHERE
  b.paid = false
GROUP BY
  date_trunc($1::text, a.datetime)::timestamp;

-- name: TotalOpenPaidBookingsBy :many
SELECT
  date_trunc($1::text, a.datetime)::timestamp as date,
  COUNT(*) as count,
  COALESCE(sum(b.cost), 0)::integer as sum
FROM
  bookings as b
  RIGHT JOIN (
    SELECT
      booking_id,
      min(availability_slot_id) as availability_slot_id
    FROM
      booking_slots
    GROUP BY
      booking_id
  ) as bs on bs.booking_id = b.id
  LEFT JOIN availability as a on bs.availability_slot_id = a.id
WHERE
  b.paid = true
GROUP BY
  date_trunc($1::text, a.datetime)::timestamp;

-- name: TotalCreatedBookingsBy :many
SELECT
  date_trunc($1::text, a.datetime)::timestamp as date,
  COUNT(*) as count,
  COALESCE(sum(b.cost), 0)::integer as sum
FROM
  bookings as b
  RIGHT JOIN (
    SELECT
      booking_id,
      min(availability_slot_id) as availability_slot_id
    FROM
      booking_slots
    GROUP BY
      booking_id
  ) as bs on bs.booking_id = b.id
  LEFT JOIN availability as a on bs.availability_slot_id = a.id
WHERE
  b.status = 'created'
GROUP BY
  date_trunc($1::text, a.datetime)::timestamp;

-- name: TotalCompletedBookingsBy :many
SELECT
  date_trunc($1::text, a.datetime)::timestamp as date,
  COUNT(*) as count,
  COALESCE(sum(b.cost), 0)::integer as sum
FROM
  bookings as b
  RIGHT JOIN (
    SELECT
      booking_id,
      min(availability_slot_id) as availability_slot_id
    FROM
      booking_slots
    GROUP BY
      booking_id
  ) as bs on bs.booking_id = b.id
  LEFT JOIN availability as a on bs.availability_slot_id = a.id
WHERE
  b.status = 'completed'
GROUP BY
  date_trunc($1::text, a.datetime)::timestamp;

-- name: TotalConfirmedBookingsBy :many
SELECT
  date_trunc($1::text, a.datetime)::timestamp as date,
  COUNT(*) as count,
  COALESCE(sum(b.cost), 0)::integer as sum
FROM
  bookings as b
  RIGHT JOIN (
    SELECT
      booking_id,
      min(availability_slot_id) as availability_slot_id
    FROM
      booking_slots
    GROUP BY
      booking_id
  ) as bs on bs.booking_id = b.id
  LEFT JOIN availability as a on bs.availability_slot_id = a.id
WHERE
  b.status = 'confirmed'
GROUP BY
  date_trunc($1::text, a.datetime)::timestamp;

-- name: TotalCancelledBookingsBy :many
SELECT
  date_trunc($1::text, bh.start_time)::timestamp as date,
  COUNT(*) as count,
  COALESCE(sum(b.cost), 0)::integer as sum
FROM
  bookings as b
  LEFT JOIN booking_history as bh on b.id = bh.booking_id
WHERE
  b.status = 'cancelled'
  and bh.status = 'cancelled'
GROUP BY
  date_trunc($1::text, bh.start_time)::timestamp;

-- name: TotalBookingsBy :many
SELECT
  COALESCE(o.date, c.date)::timestamp as date,
  COALESCE(c.count, 0)::integer + COALESCE(o.count, 0)::integer as count,
  COALESCE(c.sum, 0)::integer + COALESCE(o.sum, 0)::integer as sum
FROM
  (
    SELECT
      date_trunc($1::text, a.datetime)::timestamp as date,
      COUNT(*) as count,
      sum(b.cost) as sum
    FROM
      bookings as b
      RIGHT JOIN (
        SELECT
          booking_id,
          min(availability_slot_id) as availability_slot_id
        FROM
          booking_slots
        GROUP BY
          booking_id
      ) as bs on bs.booking_id = b.id
      LEFT JOIN availability as a on bs.availability_slot_id = a.id
    GROUP BY
      date_trunc($1::text, a.datetime)::timestamp
  ) as o
  FULL OUTER JOIN (
    SELECT
      date_trunc($1::text, bh.start_time)::timestamp as date,
      COUNT(*) as count,
      sum(b.cost) as sum
    FROM
      bookings as b
      LEFT JOIN booking_history as bh on b.id = bh.booking_id
    WHERE
      b.status = 'cancelled'
      and bh.status = 'cancelled'
    GROUP BY
      date_trunc($1::text, bh.start_time)::timestamp
  ) as c on o.date = c.date;

-- name: TotalPaidBookingsBy :many
SELECT
  COALESCE(o.date, c.date)::timestamp as date,
  COALESCE(c.count, 0)::integer + COALESCE(o.count, 0)::integer as count,
  COALESCE(c.sum, 0)::integer + COALESCE(o.sum, 0)::integer as sum
FROM
  (
    SELECT
      date_trunc($1::text, a.datetime)::timestamp as date,
      COUNT(*) as count,
      sum(b.cost) as sum
    FROM
      bookings as b
      RIGHT JOIN (
        SELECT
          booking_id,
          min(availability_slot_id) as availability_slot_id
        FROM
          booking_slots
        GROUP BY
          booking_id
      ) as bs on bs.booking_id = b.id
      LEFT JOIN availability as a on bs.availability_slot_id = a.id
    WHERE
      b.paid = true
    GROUP BY
      date_trunc($1::text, a.datetime)::timestamp
  ) as o
  FULL OUTER JOIN (
    SELECT
      date_trunc($1::text, bh.start_time)::timestamp as date,
      COUNT(*) as count,
      sum(b.cost) as sum
    FROM
      bookings as b
      LEFT JOIN booking_history as bh on b.id = bh.booking_id
    WHERE
      b.paid = true
      and b.status = 'cancelled'
      and bh.status = 'cancelled'
    GROUP BY
      date_trunc($1::text, bh.start_time)::timestamp
  ) as c on o.date = c.date;

-- name: MonthlyPaidDelta :one
with
  curr as (
    SELECT
      b.id,
      b.cost as cost
    FROM
      bookings as b
      LEFT JOIN booking_slots as bs on b.id = bs.booking_id
      LEFT JOIN availability as a on bs.availability_slot_id = a.id
    WHERE
      b.paid = true
      and (a.datetime > now() - interval '30 day')
    GROUP BY
      b.id
  ),
  prev as (
    SELECT
      b.id,
      b.cost as cost
    FROM
      bookings as b
      LEFT JOIN booking_slots as bs on b.id = bs.booking_id
      LEFT JOIN availability as a on bs.availability_slot_id = a.id
    WHERE
      b.paid = true
      and (a.datetime < now() - interval '30 day')
      and (a.datetime > now() - interval '60 day')
    GROUP BY
      b.id
  )
SELECT
  (
    SELECT
      COALESCE(sum(cost), 0)
    FROM
      curr
  ) - (
    SELECT
      COALESCE(sum(cost), 0)
    FROM
      prev
  ) as delta;
