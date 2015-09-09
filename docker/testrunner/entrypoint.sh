#!/bin/bash
cd /black-screen

if [[ ! -e /.firstrun ]] && ( [[ ! -d node_modules ]] || [[ -n $FORCE ]] )
	then
	npm install -g selenium-standalone
	selenium-standalone install
	chown -R testrunner:users .
	sudo -u testrunner echo '{ "interactive": false }' > /home/testrunner/.bowerrc
	sudo -u testrunner npm install
	touch /.firstrun
fi

selenium-standalone start &
sleep 5
xvfb-run npm run test
rm -rf pulse-*
