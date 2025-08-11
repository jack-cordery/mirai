#!/bin/bash


# test_get_user_by_email: test the userByEmail end point
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
        "surname": "Email",
        "email": "Jim.email@company.com"
      }' "$SERVER/user")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

user_id=$(echo "$body" | jq -r '.user_id')

# test GET on first POST

response=$(curl -s -w "\n%{http_code}" "$SERVER/userByEmail?email=Jim.email@company.com")
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status_with_cleanup "GET" "/userByEmail" "$status" "200" "$user_id"
assert_body_contains_with_cleanup "GET" "userByEmail" "$body" "Jim" "$user_id"
assert_body_contains_with_cleanup "GET" "userByEmail" "$body" "Email" "$user_id"
assert_body_contains_with_cleanup "GET" "userByEmail" "$body" "Jim.email@company.com" "$user_id"


