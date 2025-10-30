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

-- name: RemoveRoleToUser :exec
DELETE FROM user_roles
WHERE
  user_id = $1
  AND role_id = $2;

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

-- name: GetAllRoleRequests :many
SELECT
  *
FROM
  role_requests;

-- name: GetAllRoleRequestsWithJoin :many
SELECT
  rr.id AS id,
  rr.user_id AS requesting_user_id,
  rr.requested_role_id AS requested_role_id,
  rr.status AS status,
  rr.comment AS comment,
  rr.approved_by AS approving_user_id,
  rr.created_at AS created_at,
  rr.approved_at AS approved_at,
  -- Requesting user info
  ru.name AS requesting_user_name,
  ru.surname AS requesting_user_surname,
  ru.email AS requesting_user_email,
  ru.created_at AS requesting_user_created_at,
  ru.last_login AS requesting_user_last_login,
  -- Requested role info
  r.name AS requested_role_name,
  r.description AS requested_role_description,
  -- Approving user info
  au.name AS approving_user_name,
  au.surname AS approving_user_surname,
  au.email AS approving_user_email,
  au.created_at AS approving_user_created_at,
  au.last_login AS approving_user_last_login
FROM
  role_requests rr
  LEFT JOIN users ru ON rr.user_id = ru.id
  LEFT JOIN roles r ON rr.requested_role_id = r.id
  LEFT JOIN users au ON rr.approved_by = au.id;

-- name: ReviewRequest :one
UPDATE role_requests
SET
  status = $2,
  approved_by = $3,
  approved_at = CURRENT_TIMESTAMP
WHERE
  id = $1
RETURNING
  *;
