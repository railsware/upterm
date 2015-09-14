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

	cd /black-screen_copy
	cp -R /black-screen/* /black-screen_copy/
	npm install -g selenium-standalone
	selenium-standalone install
	chown -R testrunner:users .
	sudo -u testrunner echo '{ "interactive": false }' > /home/testrunner/.bowerrc
	sudo -u testrunner npm install
	touch /.firstrun
else
	cp -R /black-screen/* /black-screen_copy/
fi

selenium-standalone start &
sleep 5
xvfb-run npm test --prefix /black-screen_copy
rm -rf pulse-*
