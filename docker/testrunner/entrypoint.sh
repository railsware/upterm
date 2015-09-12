#!/bin/bash
cd /black-screen

if [[ ! -e /.firstrun ]] && ( [[ ! -d /node_modules ]] || [[ -n $FORCE ]] )
	then

	if [[ ! -d /node_modules ]]
		then
		mkdir /node_modules
		ln -s * /node_modules/
	fi

	npm install -g selenium-standalone
	selenium-standalone install
	chown -R testrunner:users .
	sudo -u testrunner echo '{ "interactive": false }' > /home/testrunner/.bowerrc
	sudo -u testrunner npm install --prefix /node_modules
	touch /.firstrun
fi

selenium-standalone start &
sleep 5
xvfb-run npm test --prefix /node_modules
rm -rf pulse-*
