#!/bin/bash


# test_post_get_update_delete_booking_type : test the booking_type end point
#
#
set -eou pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test_helpers.sh"
SERVER="$1"

# test POST
response=$(curl -sS -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-d '{
        "title": "haircut",
        "description": "cutting of hair",
        "fixed": false,
        "cost": 2400
      }' "$SERVER/booking_type")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status "POST" "/booking_type" "$status" "201"

booking_type_id=$(echo "$body" | jq -r '.booking_type_id')

# test GET on first POST

response=$(curl -s -w "\n%{http_code}" "$SERVER/booking_type/$booking_type_id")
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status_with_cleanup "GET" "/booking_type" "$status" "200" "$booking_type_id"
assert_body_contains_with_cleanup "GET" "/booking_type" "$body" "haircut" "$booking_type_id"
assert_body_contains_with_cleanup "GET" "/booking_type" "$body" "cutting of hair" "$booking_type_id"
assert_body_contains_with_cleanup "GET" "/booking_type" "$body" "2400" "$booking_type_id"
assert_body_contains_with_cleanup "GET" "/booking_type" "$body" "false" "$booking_type_id"

# test PUT
response=$(curl -s -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-X PUT \
		-d '{
		"title": "masssage",
		"description": "sports massage",
		"fixed": true,
		"cost": 5800
	      }' "$SERVER/booking_type/$booking_type_id")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

# test PUT
assert_status_with_cleanup "PUT" "/booking_type" "$status" "201" "$booking_type_id"

response=$(curl -s -w "\n%{http_code}" "$SERVER/booking_type/$booking_type_id")
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status_with_cleanup "GET" "/booking_type" "$status" "200" "$booking_type_id"

assert_body_contains_with_cleanup "GET" "/booking_type" "$body" "massage" "$booking_type_id"
assert_body_contains_with_cleanup "GET" "/booking_type" "$body" "sports" "$booking_type_id"
assert_body_contains_with_cleanup "GET" "/booking_type" "$body" "5800" "$booking_type_id"
assert_body_contains_with_cleanup "GET" "/booking_type" "$body" "true" "$booking_type_id"

# test DELETE
response=$(curl -sS -w "\n%{http_code}" -X DELETE "$SERVER/booking_type/$booking_type_id")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status "DELETE" "/booking_type" "$status" "204" 
