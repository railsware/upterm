# Docker

This folder contains all the docker images which you could use to make your life easier.

### *testrunner*
This image basically just executes the tests of black-screen.

##### Usage

`./run.sh`

Optional parameters for `./run.sh`:
- [-f]  Force to rebuild the container, for e.g. updating of node dependencies (normally restart the container if there's one available)
- [repodir] Specify the repository directory, default ist workingdir/black-screen (Could be an absolute or an relative path)

The order of the options is not relevant. If the image isn't present, it will build it for you.

**Example**
`./run.sh -f ./my/git/folder/black-screen`



**Additional Notes**:
The build and the first startup needs time, but any further start will run a lot faster. When you rebuild the image, keep in mind to use -f with `./run.sh`.


##### Components in *testrunner*:
- xorg
- node, npm
- java (for selenium)
- xvfb (for creating a fake display, needed for testing)

#### TODO
- automatically detect if a rebuild is neccessary or not.
