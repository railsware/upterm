#!/bin/bash
cd /black-screen
if [ -e .init ]
then
	chown -R testrunner:users .
	sudo -u testrunner echo '{ "interactive": false }' > /home/testrunner/.bowerrc
	sudo -u testrunner npm run install-all
fi
touch .init
selenium-standalone start &
sleep 5
xvfb-run npm run test
