#!/bin/bash


# Why -i -t ? Because we get nice terminal colours... And could stop the test with ^C
# Could be deactivated if NONINTERACTIVE is set true, for e.g. ci or things like that
if [[ $NONINTERACTIVE != true ]]
       then
       RUNOPTIONS=" -i -t "
fi

IMAGE_NAME="black-screen_testrunner"
CONTAINER_NAME="bs-testrunner"


#test if command executen succeeds

function test {
  "$@"
  status=$?
  if [[ $status -ne 0 ]]
    then
    echo "Error while executing $1 with exit code $status"
    exit
  fi
  return
}


# Help?
if [[ $1 == "--help" ]]
  then
  echo "./run.sh [-f] [-b] [path/to/your/black-screen]"
  exit
fi


# Firstly mask the slashes to, because they break the script

if [[ -n $3 ]]
  then
  THIRD="`echo ${2//\//\\/}`"
fi

if [[ -n $2 ]]
  then
  SECOND="`echo ${2//\//\\/}`"
fi

if [[ -n $1 ]]
  then
  FIRST="`echo ${1//\//\\/}`"
fi

#Third argument?

if [[ -n "$THIRD" ]]
  then
  if [[ "$THIRD" == "-b" ]]
    then
    build=true
  elif [[ "$THIRD" == "-f" ]]
    then
    force=true
  else
    path="$THIRD"
  fi
fi



#Second argument?

if [[ -n "$SECOND" ]]
  then
  if [[ "$SECOND" == "-b" ]]
    then
    build=true
  elif [[ "$SECOND" == "-f" ]]
    then
    force=true
  else
    path="$SECOND"
  fi
fi



#First argument?

if [[ -n "$FIRST" ]]
  then
  if [[ "$FIRST" == "-b" ]]
    then
    build=true
  elif [[ "$FIRST" == "-f" ]]
    then
    force=true
  else
    path="$FIRST"
  fi
fi


# Rebuild the image? Means you need to rebuild the container...
if [[ -n $build ]]
  then
  force=true
fi



#grep the image

image=`docker images | grep "$IMAGE_NAME"`
if [[ ${#image} -lt 1 ]]
  then
  echo "No black-screen_testrunner image available"
  echo "building..."
  test docker build -t "$IMAGE_NAME" .
elif [[ -n "$build" ]]
  then
  echo "Rebuilding the image..."
  test docker rmi -f "$IMAGE_NAME"
  test docker build -t "$IMAGE_NAME" .
fi


#show the docker processe with the name bs-testrunner
id=`docker ps -aq -f name="$CONTAINER_NAME"`


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
  mount="-v `echo ${path//\//\\/}`:/black-screen"
else
  mount="" 
fi


# determine if there's a testrunner container available by checking the length of the id

if [[ ${#id} -gt 1 && -z $force ]]
  then
  echo "Restarting old container..."
  test docker restart "$CONTAINER_NAME"
  test docker attach "$CONTAINER_NAME"
elif [[ ${#id} -gt 1 ]]
  then
  echo "Force to rebuild the container"
  test docker rm -f "$CONTAINER_NAME"
  test docker run --name "$CONTAINER_NAME" $RUNOPTIONS -e FORCE=true $mount "$IMAGE_NAME"
elif [[ -n $force ]]
  then
  echo "Force to rebuild the container"
  test docker run --name "$CONTAINER_NAME" $RUNOPTIONS -e FORCE=true $mount "$IMAGE_NAME"
else
  echo "Run the container"
  test docker run --name "$CONTAINER_NAME" $RUNOPTIONS $mount "$IMAGE_NAME"
fi
