#!/bin/bash


# test_post_get_update_delete_availability : test the availability end point
#
#
set -eou pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/test_helpers.sh"
SERVER="$1"


# set-up - create employee and get id, and setup booking type and get id
response=$(curl -sS -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-d '{
        "name": "Jimmy",
        "surname": "Smith",
        "email": "Jimmy.smith@company.com",
        "title": "Manager",
	"description": "good worker"
      }' "$SERVER/employee")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

employee_id=$(echo "$body" | jq -r '.employee_id')

echo $employee_id

response=$(curl -sS -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-d '{
        "title": "not a haircut",
        "description": "cutting of hair",
        "fixed": false,
        "cost": 2400
      }' "$SERVER/booking_type")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

booking_type_id=$(echo "$body" | jq -r '.booking_type_id')
echo $booking_type_id

# test POST
response=$(curl -sS -w "\n%{http_code}" -H 'Content-Type: application/json' \
	-d "{
	  \"employee_id\": $employee_id,
	  \"start_time\": \"2025-07-26T18:30:00Z\",
	  \"end_time\": \"2025-07-26T19:30:00Z\",
	  \"type_id\": $booking_type_id
	}" "$SERVER/availability")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status "POST" "/availability" "$status" "201"

availability_id_1=$(echo "$body" | jq -r '.availability_slot_ids[0]')
availability_id_2=$(echo "$body" | jq -r '.availability_slot_ids[1]')

# test GET on first POST

response=$(curl -s -w "\n%{http_code}" "$SERVER/availability/$availability_id_1")
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status_with_cleanup "GET" "/availability" "$status" "200" "$availability_id_1"
assert_body_contains_with_cleanup "GET" "/availability" "$body" "$employee_id" "$availability_id_1"
assert_body_contains_with_cleanup "GET" "/availability" "$body" "2025-07-26T18:30:00" "$availability_id_1"
assert_body_contains_with_cleanup "GET" "/availability" "$body" "2" "$availability_id_1"
assert_body_contains_with_cleanup "GET" "/availability" "$body" "$booking_type_id" "$availability_id_1"

response=$(curl -s -w "\n%{http_code}" "$SERVER/availability/$availability_id_2")
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status_with_cleanup "GET" "/availability" "$status" "200" "$availability_id_2"
assert_body_contains_with_cleanup "GET" "/availability" "$body" "$employee_id" "$availability_id_2"
assert_body_contains_with_cleanup "GET" "/availability" "$body" "2025-07-26T19:00:00" "$availability_id_2"
assert_body_contains_with_cleanup "GET" "/availability" "$body" "2" "$availability_id_2"
assert_body_contains_with_cleanup "GET" "/availability" "$body" "$booking_type_id" "$availability_id_2"
# test PUT
response=$(curl -s -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-X PUT \
	-d "{
	  \"employee_id\": $employee_id,
	  \"datetime\": \"2024-07-26T18:30:00Z\",
	  \"type_id\": $booking_type_id
	}" "$SERVER/availability/$availability_id_1")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

# test PUT
assert_status_with_cleanup "PUT" "/availability" "$status" "201" "$availability_id_1"

response=$(curl -s -w "\n%{http_code}" "$SERVER/availability/$availability_id_1")
body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status_with_cleanup "GET" "/availability" "$status" "200" "$availability_id_1"

assert_body_contains_with_cleanup "GET" "/availability" "$body" "$employee_id" "$availability_id_1"
assert_body_contains_with_cleanup "GET" "/availability" "$body" "2024-07-26T18:30:00" "$availability_id_1"
assert_body_contains_with_cleanup "GET" "/availability" "$body" "5" "$availability_id_1"
assert_body_contains_with_cleanup "GET" "/availability" "$body" "$booking_type_id" "$availability_id_1"

# test DELETE
response=$(curl -sS -w "\n%{http_code}" -X DELETE "$SERVER/availability/$availability_id_1")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status "DELETE" "/availability" "$status" "204" 

response=$(curl -sS -w "\n%{http_code}" -X DELETE "$SERVER/availability/$availability_id_2")

body=$(echo "$response" | sed '$d')
status=$(echo "$response" | tail -n1)

assert_status "DELETE" "/availability" "$status" "204" 
# clean-up
echo "cleaning up test..."
response=$(curl -sS -w "\n%{http_code}" -X DELETE "$SERVER/employee/$employee_id")
echo $response
response=$(curl -sS -w "\n%{http_code}" -X DELETE "$SERVER/booking_type/$booking_type_id")
echo $response
