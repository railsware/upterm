const checkNode = require('./check-node')

const callback = (err, versions) => {
  if (err) {
    throw new Error(err)
  }
  if (!versions.npmSatisfied) {
    throw new Error('Unsuported version of NPM. Your current version is ' + versions.npm.version + '. Wanted: ' + versions.npmWanted.range)
  }
  if (!versions.nodeSatisfied) {
    throw new Error('Unsuported version of Node.JS. Your current version is ' + versions.node.version + '. Wanted: ' + versions.nodeWanted.range)
  }
}

checkNode(callback)
