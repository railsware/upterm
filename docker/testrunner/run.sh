#!/bin/bash


# Why -i -t ? Because we get nice terminal colours... And could stop the test with ^C
RUNOPTIONS=" -i -t "



# Firstly mask the /es to, because they break the script

if [[ -n $2 ]]
  then
  SECOND="`echo ${2//\//\\/}`"
fi

if [[ -n $1 ]]
  then
  FIRST="`echo ${1//\//\\/}`"
fi


# Second Argument available?

if [[ -n "$SECOND" ]]
  then
  if [[ "$SECOND" == "-f" ]]
    then
    force=true
  elif [[ "$FIRST" == "-f" ]]
    then
    path=$SECOND
  else
    echo "unrecognized option"
    echo "available options: ./run.sh [-f] [repodir]"
    exit
  fi
fi



#Processing the first argument

if [[ -n "$FIRST"  ]]
  then
  if [[ "$FIRST" == "-f" ]]
    then
    force=true
  else
    path=$FIRST
  fi
fi


#grep the black-screen_testrunner image
image=`docker images | grep black-screen_testrunner`
if [[ ${#image} -lt 1 ]]
  then
  echo "No black-screen_testrunner image available"
  echo "building..."
  docker build -t black-screen_testrunner .
fi

#show the docker processe with the name bs-testrunner
id=`docker ps -aq -f name=bs-testrunner`


#Determine if it's an absolute or relative path, substitute if neccessary
if [[ -n $path ]]
  then
  path_available=true
  if [[ ${path:0:2} == './' ]]
    then
    path="`pwd`/$path"
  fi
fi


#a path is given, but the container is already runnig? Sorry, we couldn't continue :-(
if [[ -n $path_available && ${#id} -gt 1 && ! $force ]]
  then
  echo "Sorry, you could not change your repo location in a running container"
  exit
fi

#check if a path is given (arg 1), if not take default
if [[ -n $path_available  ]]
  then
  blackscreen_path="`echo ${path//\//\\/}`"
else
  blackscreen_path="`pwd`/black-screen"
fi


# determine if there's a testrunner container available by checking the length of the id

if [[ ${#id} -gt 1 && -z $force ]]
  then
  echo "Restarting old container..."
  docker restart bs-testrunner
  docker attach bs-testrunner
elif [[ ${#id} -gt 1 ]]
  then
  echo "Force to rebuild the container"
  docker rm -f bs-testrunner
  docker run --name bs-testrunner $RUNOPTIONS -e FORCE=true -v "$blackscreen_path":/black-screen black-screen_testrunner
elif [[ -n $force ]]
  then
  echo "Force to rebuild the container"
  docker run --name bs-testrunner $RUNOPTIONS -e FORCE=true -v "$blackscreen_path":/black-screen black-screen_testrunner
else
  echo "Run the container"
  docker run --name bs-testrunner $RUNOPTIONS -v "$blackscreen_path":/black-screen black-screen_testrunner
fi
