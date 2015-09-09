#!/bin/bash


RUNOPTIONS=" -i =t "


#Processing the second argument

if [[ -n $2 ]]
  then
  if [[ $2 -eq "-f" ]]
    then
    force=true
  elif [[ $1 -eq "-f" ]]
    then
    path=$2
  else
    echo "unrecognized option"
    echo "available options: ./run.sh [-f] [repodir]"
    exit
  fi
fi

#Processing the first argument
if [[ -n $1  ]]
  then
  if [[ $1 -ne "-f" ]]
    then
    path=$1
  elif [[ $1 -eq "-f" ]]
    then
    force=true
  else
    echo "unrecognized option"
    echo "available options: ./run.sh [-f] [repodir]"
    exit
  fi
fi


#grep the black-screen_testrunner image
image=`docker images | grep black-screen_testrunner`
if [[ ${#image} -lt 1 ]]
  then
  echo "No black-screen_testrunner image available"
  echo "Please buld it with ./build.sh"
  exit
fi

#show the docker processe with the name bs-testrunner
id=`docker ps -aq -f name=bs-testrunner`


#Determine if it's an absolute or relative path, substitute if neccessary
if [[ -n $path ]]
  then
  if [[ ${path:0:1} -eq "." ]]
    then
    path=`pwd`/$path
  fi
fi


#a path is given, but the container is already runnig? Sorry, we couldn't get further :-(
if [[ -n $path && ${#id} -gt 1 && ! $force ]]
  then
  echo "Sorry, you could not change your repo location in a running container"
  exit
fi

#check if a path is given (arg 1)
if [[ -n $path  ]]
  then
  black-screen_path="$path"
else
  blackscreen_path=`pwd`/black-screen
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
