#!/bin/bash


# test_post_get_update_delete_user : test the user end point
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
        "email": "Jim.smith@company.com"
      }' "$SERVER/user")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status "POST" "/user" "$status" "201"

user_id=$(echo "$body" | jq -r '.user_id')

# test GET on first POST

response=$(curl -s -w "\n%{http_code}" "$SERVER/user/$user_id")
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status_with_cleanup "GET" "/user" "$status" "200" "$user_id"
assert_body_contains_with_cleanup "GET" "/user" "$body" "Jim" "$user_id"
assert_body_contains_with_cleanup "GET" "/user" "$body" "Smith" "$user_id"
assert_body_contains_with_cleanup "GET" "/user" "$body" "Jim.smith@company.com" "$user_id"

# test PUT
response=$(curl -s -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-X PUT \
		-d '{
        "name": "Jamie",
        "surname": "Smith",
        "email": "jamie.smith@company.com"
      }' "$SERVER/user/$user_id")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

# test PUT
assert_status_with_cleanup "PUT" "/user" "$status" "201" "$user_id"

response=$(curl -s -w "\n%{http_code}" "$SERVER/user/$user_id")
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status_with_cleanup "GET" "/user" "$status" "200" "$user_id"

assert_body_contains_with_cleanup "GET" "/user" "$body" "Jamie" "$user_id"
assert_body_contains_with_cleanup "GET" "/user" "$body" "Smith" "$user_id"
assert_body_contains_with_cleanup "GET" "/user" "$body" "jamie.smith@company.com" "$user_id"

# test DELETE
response=$(curl -sS -w "\n%{http_code}" -X DELETE "$SERVER/user/$user_id")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status "DELETE" "/user" "$status" "204" 
