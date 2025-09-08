#!/bin/bash


# test_post_get_update_delete_booking : test the booking end point
#
#
set -eou pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test_helpers.sh"
SERVER="$1"

# set-up - create employee/user and get ids, and setup booking type/availabillity_slot and get id
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

employee_id=$(echo "$body" | jq -r '.employee_id')


response=$(curl -sS -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-d '{
        "name": "Jack",
        "surname": "Daniels",
        "email": "Jack.daniels@company.com"
      }' "$SERVER/user")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

user_id=$(echo "$body" | jq -r '.user_id')

response=$(curl -sS -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-d '{
        "title": "haircut",
        "description": "cutting of hair",
        "fixed": false,
        "cost": 2400
      }' "$SERVER/booking_type")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

booking_type_id=$(echo "$body" | jq -r '.booking_type_id')

response=$(curl -sS -w "\n%{http_code}" -H 'Content-Type: application/json' \
	-d "{
	  \"employee_id\": $employee_id,
	  \"start_time\": \"2025-07-26T18:30:00Z\",
	  \"end_time\": \"2025-07-26T19:00:00Z\",
	  \"type_id\": $booking_type_id
	}" "$SERVER/availability")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

availability_id=$(echo "$body" | jq -r '.availability_slot_ids[0]')

# test POST
response=$(curl -sS -w "\n%{http_code}" -H 'Content-Type: application/json' \
	-d "{
	  \"user_id\": "$user_id",
	  \"availability_slots\": ["$availability_id"],
	  \"type_id\": "$booking_type_id",
	  \"notes\": \"some notes\"
	}" "$SERVER/booking")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status "POST" "/booking" "$status" "201"

booking_id=$(echo "$body" | jq -r '.booking_id')

# test GET on first POST

response=$(curl -s -w "\n%{http_code}" "$SERVER/booking/$booking_id")
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status_with_cleanup "GET" "/booking" "$status" "200" "$booking_id"
assert_body_contains_with_cleanup "GET" "/booking" "$body" "$user_id" "$booking_id"
assert_body_contains_with_cleanup "GET" "/booking" "$body" "$availability_id" "$booking_id"
assert_body_contains_with_cleanup "GET" "/booking" "$body" "$booking_type_id" "$booking_id"
assert_body_contains_with_cleanup "GET" "/booking" "$body" "some notes" "$booking_id"

# test PUT
response=$(curl -s -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-X PUT \
	-d "{
	  \"user_id\": "$user_id",
	  \"availability_slot\": "$availability_id",
	  \"type_id\": "$booking_type_id",
	  \"notes\": \"some other notes\"
	}" "$SERVER/booking/$booking_id")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

# test PUT
assert_status_with_cleanup "PUT" "/booking" "$status" "201" "$booking_id"

response=$(curl -s -w "\n%{http_code}" "$SERVER/booking/$booking_id")
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status_with_cleanup "GET" "/booking" "$status" "200" "$booking_id"
assert_body_contains_with_cleanup "GET" "/booking" "$body" "$user_id" "$booking_id"
assert_body_contains_with_cleanup "GET" "/booking" "$body" "$availability_id" "$booking_id"
assert_body_contains_with_cleanup "GET" "/booking" "$body" "$booking_type_id" "$booking_id"
assert_body_contains_with_cleanup "GET" "/booking" "$body" "some other notes" "$booking_id"

# test DELETE
response=$(curl -sS -w "\n%{http_code}" -X DELETE "$SERVER/booking/$booking_id")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status "DELETE" "/booking" "$status" "204" 

# clean-up
echo "cleaning up test..."

response=$(curl -sS -w "\n%{http_code}" -X DELETE "$SERVER/availability/$availability_id")
response=$(curl -sS -w "\n%{http_code}" -X DELETE "$SERVER/booking_type/$booking_type_id")
response=$(curl -sS -w "\n%{http_code}" -X DELETE "$SERVER/employee/$employee_id")
response=$(curl -sS -w "\n%{http_code}" -X DELETE "$SERVER/user/$user_id")
