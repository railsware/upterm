#!/bin/bash
cd /black-screen
if [[ -z $STARTED ]] && ( [[ ! -d node_modules ]] || [[ -n $FORCE ]] )
	then
	selenium-standalone install
	chown -R testrunner:users .
	sudo -u testrunner echo '{ "interactive": false }' > /home/testrunner/.bowerrc
	sudo -u testrunner npm install
	STARTED=true	
fi

selenium-standalone start &
sleep 5
xvfb-run npm run test
rm -rf pulse-*
