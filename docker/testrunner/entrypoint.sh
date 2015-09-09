#!/bin/bash
cd /black-screen
echo "FORCE: "$FORCE
if [[ ! -d node_modules ]] || [[ -n $FORCE ]]
	then
	selenium-standalone install
	chown -R testrunner:users .
	sudo -u testrunner echo '{ "interactive": false }' > /home/testrunner/.bowerrc
	sudo -u testrunner npm install
fi

if [[ -n $FORCE ]]
	then
	unset FORCE
fi

selenium-standalone start &
sleep 5
xvfb-run npm run test
rm -rf pulse-*
