-- name: CreateUser :one 
INSERT INTO
  users (name, surname, email, hashed_password)
VALUES
  ($1, $2, $3, $4)
RETURNING
  id;

-- name: UpdateUser :one
UPDATE users
SET
  id = $1,
  name = $2,
  surname = $3,
  email = $4,
  hashed_password = $5,
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

-- name: GetSessionByToken :one
SELECT
  *
FROM
  sessions
WHERE
  session_token = $1;

-- name: GetLatestSession :one
SELECT
  *
FROM
  sessions
WHERE
  user_id = $1 -- Replace 123 with the specific user ID
ORDER BY
  created_at DESC
LIMIT
  1;

-- name: CreateSession :one
INSERT INTO
  sessions (user_id, session_token, expires_at)
VALUES
  ($1, $2, $3)
RETURNING
  id;

-- name: DeleteSessionByToken :exec
DELETE FROM sessions
WHERE
  session_token = $1;

-- name: DeleteSessionsByUserID :exec
DELETE FROM sessions
WHERE
  user_id = $1;

-- name: DeleteExpiredSessions :exec
DELETE FROM sessions
WHERE
  expires_at < CURRENT_TIMESTAMP;

-- name: AssignRoleToUser :exec
INSERT INTO
  user_roles (user_id, role_id)
VALUES
  ($1, $2);

-- name: GetRolesForUser :many
SELECT
  r.name
FROM
  roles r
  JOIN user_roles ur ON ur.role_id = r.id
WHERE
  ur.user_id = $1;

-- name: GetRoleByName :one
SELECT
  id
FROM
  roles
WHERE
  name = $1;

-- name: CreateNewRoleRequest :one
INSERT INTO
  role_requests (user_id, requested_role_id, comment)
VALUES
  ($1, $2, $3)
RETURNING
  id;

-- name: UpdateRoleRequest :one
UPDATE role_requests
SET
  status = $2,
  approved_at = $3,
  comment = $4
WHERE
  id = $1
RETURNING
  id;

-- name: GetRoleRequestByID :one
SELECT
  *
FROM
  role_requests
WHERE
  id = $1
LIMIT
  1;

-- name: GetRoleRequestByUser :one
SELECT
  *
FROM
  role_requests
WHERE
  user_id = $1
  AND requested_role_id = $2
LIMIT
  1;

-- name: GetAllRoleRequests :one
SELECT
  *
FROM
  role_requests;
