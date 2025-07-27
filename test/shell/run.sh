#!/bin/bash


# run.sh: Runs all of the tests in the shell directory

set -euo pipefail


SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXIT_CODE=0
SERVER="$1"

echo "Running shell API tests...$SCRIPT_DIR on server: $SERVER\n"

for test_file in "$SCRIPT_DIR"/*.sh; do
	base_name="$(basename "$test_file")"
	if [[ $base_name == "run.sh" || $base_name == "test_helpers.sh" ]]; then
		continue
	fi

	echo "-------------Running $base_name $SERVER----------------"


	if bash "$test_file" "$SERVER"; then 
		echo "PASSED: $base_name"
	else 
		echo "FAILED: $base_name"
		EXIT_CODE=1
	fi

	echo "------------------------------------------------"
done

if [[ $EXIT_CODE -eq 0 ]]; then
	echo "All tests passed!"
else
	echo "Some tests failed. Please see above for a breakdown"
fi

exit $EXIT_CODE

