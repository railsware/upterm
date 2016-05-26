#!/bin/bash

node_modules/.bin/tsc --watch > /dev/tty &
WATCH_PID=$!
npm run electron
kill $WATCH_PID
