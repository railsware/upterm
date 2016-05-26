npm run watch-tsc &
WATCH_PID=$!
npm run electron
kill $WATCH_PID
