#!/bin/bash


#If no folder mounted grab the latest state

if [[ ! -d /black-screen ]]
	then
	cd /
	git clone https://github.com/black-screen/black-screen.git
fi

#Is it the first run and does /black-screen_copy exist or is FORCE set?
if [[ ! -e /.firstrun ]] && ( [[ ! -d /black-screen_copy ]] || [[ -n $FORCE ]] )
	then

	if [[ ! -d /black-screen_copy ]]
		then
		mkdir /black-screen_copy
	fi

	if [[ ! -d /node_modules ]]
		then
		mkdir /node_modules
	fi

	cd /black-screen_copy
	cp -R /black-screen/* /black-screen_copy/
	npm install -g selenium-standalone
	selenium-standalone install
	chown -R testrunner:users .
	sudo -u testrunner echo '{ "interactive": false }' > /home/testrunner/.bowerrc
	sudo -u testrunner --prefix /node_modules npm install
	ln -s /node_modules/node_modules /black-screen_copy
	touch /.firstrun
else
	rm -rf /black-screen_copy/* #TODO: Find a solution to save the needed npm and bower modules..
	ln -s /node_modules/node_modules /black-screen_copy
	cp -Rf /black-screen/* /black-screen_copy/
fi

selenium-standalone start &
sleep 5
xvfb-run npm test --prefix /black-screen_copy
rm -rf pulse-*
