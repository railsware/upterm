#!/bin/bash

node_modules/.bin/tsc --watch > /dev/tty &
WATCH_PID=$!
NODE_ENV=development npm run electron
kill $WATCH_PID
