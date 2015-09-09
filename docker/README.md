# Docker

This folder contains all the docker images which you could use to make your life easier.

### *testrunner*
This image basically just executes the tests of black-screen.

It doesn't contain the source code, so you need to mount the git repo at **/black-screen**

##### Usage

**Change into the testrunner directory**

- build the container with ```docker build -t black-screen_testrunner . ```
- first startup: ```docker run --name bs-testrunner -v `pwd`/black-screen:/black-screen black-screen_testrunner ``` (Replace \`pwd\`/black-screen with your absolute path to the repo)
- restart of tests: ```docker restart bs-testrunner; docker attach bs-testrunner```

For all tasks are scripts available:
 - build: `./build.sh`
 - run/re-run `./run.sh`

Optional parameters for `./run.sh`:
- [-f]  Force to rebuild the container, for e.g. updating of node dependencies (normally restart the container if there's one available)
- [repodir] Specify the repository directory, default ist workingdir/black-screen (Could be an absolute or an relative path)

The order of the options is not relevant

**Example**
`./run.sh -f ./my/git/folder/black-screen`



**Additional Notes**:
The build and the first startup needs time, but any further start will run a lot faster. When you rebuild the image, keep in mind to use -f with `./run.sh`.


##### Components in *testrunner*:
- xorg
- node, npm
- java (for selenium)
- xvfb (for creating a fake display, needed for testing)
