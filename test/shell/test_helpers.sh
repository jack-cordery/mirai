#!/bin/bash


# test_helpers: functions that can be abstracted across tests 
#
#
set -eou pipefail


function assert_status() {
	local test_method="$1"
	local test_name="$2"
	local actual="$3"
	local expected="$4"

	
	if [[ "$actual" != "$expected" ]]; then
			echo "$test_method $test_name failed with $actual and $expected"
			exit 1 
	else 
			echo "$test_method $test_name passed with $actual!"
	fi

}


function assert_status_with_cleanup() {
	local test_method="$1"
	local test_name="$2"
	local actual="$3"
	local expected="$4"
	local clean_id="$5"

	
	if [[ "$actual" != "$expected" ]]; then
			echo "$test_method $test_name failed with $actual and expected $expected"
			curl -sS -X DELETE "$SERVER/$test_name/$clean_id"
			echo "cleaning db "$SERVER" complete..."
			exit 1 
	else 
			echo "$test_method $test_name passed with $actual!"
	fi
}

function assert_body_contains_with_cleanup() {
	local test_method="$1"
	local test_name="$2"
	local body="$3"
	local substring="$4"
	local clean_id="$5"
	if [[ "$body" != *"$substring"* ]]; then 
                echo "$test_method $test_name failed to return the correctly edited data, PUT or GET has failed with body: $body"
                echo "cleaning db..."
                curl -sS -X DELETE "$SERVER/$test_name/$clean_id"
                exit 1
	else 
		echo "$test_method $test_name passed contains condition!"
	fi
}

