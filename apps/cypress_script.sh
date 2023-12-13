#!/bin/sh
EXIT_CODE=0
npm run cy:run || EXIT_CODE=$?
# return $EXIT_CODE
echo $EXIT_CODE
exit $EXIT_CODE

