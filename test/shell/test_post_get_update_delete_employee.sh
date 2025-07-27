#!/bin/bash


# test_post_get_update_delete_employee : test the employee end point
#
#
set -eou pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test_helpers.sh"
SERVER="$1"

# test POST
response=$(curl -sS -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-d '{
        "name": "Jim",
        "surname": "Smith",
        "email": "Jim.smith@company.com",
        "title": "Manager",
	"description": "good worker"
      }' "$SERVER/employee")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status "POST" "/employee" "$status" "201"

employee_id=$(echo "$body" | jq -r '.employee_id')
#
# test GET on first POST

response=$(curl -s -w "\n%{http_code}" "$SERVER/employee/$employee_id")
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status_with_cleanup "GET" "/employee" "$status" "200" "$employee_id"
assert_body_contains_with_cleanup "GET" "/employee" "$body" "Jim" "$employee_id"
assert_body_contains_with_cleanup "GET" "/employee" "$body" "Smith" "$employee_id"
assert_body_contains_with_cleanup "GET" "/employee" "$body" "Jim.smith@company.com" "$employee_id"

# test PUT
response=$(curl -s -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-X PUT \
		-d '{
        "name": "Jamie",
        "surname": "Smith",
        "email": "jamie.smith@company.com",
        "title": "Director",
	"description": "bad worker"

      }' "$SERVER/employee/$employee_id")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

# test PUT
assert_status_with_cleanup "PUT" "/employee" "$status" "201" "$employee_id"

response=$(curl -s -w "\n%{http_code}" "$SERVER/employee/$employee_id")
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status_with_cleanup "GET" "/employee" "$status" "200" "$employee_id"

assert_body_contains_with_cleanup "GET" "/employee" "$body" "Jamie" "$employee_id"
assert_body_contains_with_cleanup "GET" "/employee" "$body" "Smith" "$employee_id"
assert_body_contains_with_cleanup "GET" "/employee" "$body" "jamie.smith@company.com" "$employee_id"
assert_body_contains_with_cleanup "GET" "/employee" "$body" "Director" "$employee_id"
assert_body_contains_with_cleanup "GET" "/employee" "$body" "bad worker" "$employee_id"

# test DELETE
response=$(curl -sS -w "\n%{http_code}" -X DELETE "$SERVER/employee/$employee_id")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status "DELETE" "/employee" "$status" "204" 
