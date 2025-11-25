-- name: TotalBookings :one
SELECT 
  COUNT(*) as total_count,
  SUM(cost) as total_cost
FROM
  bookings;

-- name: TotalCancelledBookings :one
SELECT 
  COUNT(*) as total_count,
  SUM(cost) as total_cost
FROM
  bookings
WHERE status = 'cancelled';

-- name: TotalCompletedBookings :one
SELECT 
  COUNT(*) as total_count,
  SUM(cost) as total_cost
FROM
  bookings
WHERE status = 'completed';

-- name: TotalConfirmedBookings :one
SELECT 
  COUNT(*) as total_count,
  SUM(cost) as total_cost
FROM
  bookings
WHERE status = 'confirmed';

-- name: TotalCreatedBookings :one
SELECT 
  COUNT(*) as total_count,
  SUM(cost) as total_cost
FROM
  bookings
WHERE status = 'created';

-- name: TotalOpenBookings :one
SELECT 
  COUNT(*) as total_count,
  SUM(cost) as total_cost
FROM
  bookings
WHERE status != 'cancelled';

-- name: TotalOpenPaidBookings :one
SELECT 
  COUNT(*) as total_count,
  SUM(cost) as total_cost
FROM
  bookings
WHERE status != 'cancelled' and paid=true;

-- name: TotalOpenNotPaidBookings :one
SELECT 
  COUNT(*) as total_count,
  SUM(cost) as total_cost
FROM
  bookings
WHERE status != 'cancelled' and paid=false;

