#!/bin/bash


#If no folder mounted grab the latest state

# Shortcut

function getdeps {
	cp -R /deps/node_modules "$@"/node_modules
	cp -R /deps/bower_components "$@"/bower_components
}

function copydeps {
	cp -R "$@"/node_modules /deps/node_modules
	cp -R "$@"/bower_components /deps/bower_components
}

function run {
	sudo -u testrunner "$@"
}



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


	#Copy files to a new directory to make sure nothing affects the host
	cp -R /black-screen/* /black-screen_copy/
	chown -R testrunner:users /black-screen_copy
	
	#copy package.json to the global npm location
	mkdir /deps
	chown -R testrunner:users /deps

	#Selenium
	npm install -g selenium-standalone
	selenium-standalone install

	run echo '{ "interactive": false }' > /home/testrunner/.bowerrc

	cd /black-screen_copy
	run npm install 

	copydeps "`pwd`"	

	touch /.firstrun
else
	rm -rf /black-screen_copy/*
	run cp -Rf /black-screen/* /black-screen_copy
	cd /black-screen_copy
	getdeps "`pwd`"
fi

selenium-standalone start &
sleep 5
cd /black-screen_copy
xvfb-run npm test
rm -rf pulse-*
