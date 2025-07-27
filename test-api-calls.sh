#/bin/bash

# test-api-calls: runs tests by calling specified end points and returns the results of the test


URL=localhost:8000
TEST_JSON=$1


function get {
	curl -s -w "\n%{http_code}" "$URL/$1/$2"

}

function post {
	curl -s -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-d "$2" \
		"$URL/$1"
}

function put {
	curl -s -w "\n%{http_code}" -H 'Content-Type: application/json' \
		-X PUT \
		-d "$3" \
		"$URL/$1/$2"
}

function delete {
	curl -s -w "\n%{http_code}" -X DELETE "$URL/$1/$2"
}

# i think instead we should write explicit tests i..e 
#
# function test_get_user {
# response=$(curl this)
# if [[ response == 200 ]]; then 
#	echo pass
#else 
#	echo fail
#
# }
# then we can just run each test and its cleaner and we have control and it doesnt require 
# a silly json 

# broadly speeking we want to test all the end-points
# so input-wise we would want a json that defines a series of calls with enpoint name, method and data 
# and then we would want some kind of cycle, ideally creating, reading, updating, reading, deleting
# so we need to figure out how to read in a json and loop over it and how to parse on the output of each one 
# so we can input it. For example when we create we want to keep the id to read and then. 

# get "user" 1 
#
# post "user" '{"name": "james", "surname": "mason", "email":"james@gmail.com"}'
#
# get "user" 2
#
jq -c '.tests[]' "$TEST_JSON" | while read -r test; do
	method=$(echo "$test" | jq -r '.method')
	resource=$(echo "$test" | jq -r '.resource')
	payload=$(echo "$test" | jq '.payload')

	echo "---------------$method/$resource----------------------"

	

	if [[ "$method" = "GET" ]]; then 
		response=$(get "$resource" "$id")
		body=$(echo "$response" | sed '$d')
		status=$(echo "$response" | tail -n1 )
		id=$(echo $body | jq -r ".${resource}_id")
	elif [[ "$method" = "POST" ]]; then
		response=$(post "$resource" "$payload")
		body=$(echo "$response" | sed '$d')
		status=$(echo "$response" | tail -n1 )
		id=$(echo $body | jq -r ".${resource}_id")
	elif [[ $method = "PUT" ]]; then
		response=$(put "$resource" "$id" "$payload")
		body=$(echo "$response" | sed '$d')
		status=$(echo "$response" | tail -n1 )
	elif [[ $method = "DELETE" ]]; then
		response=$(delete "$resource" "$id")
		body=$(echo "$response" | sed '$d')
		status=$(echo "$response" | tail -n1 )
	else 
		echo "invalid"
		exit 1
	fi
	echo "status $status"
	echo "---------------$method/$resource----------------------\n\n"
done
