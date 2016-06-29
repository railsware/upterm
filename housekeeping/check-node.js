var exec = require('child_process').exec
var semver = require('semver')
var parallel = require('run-parallel')

var WANTED = require('../package.json').engines

var runVersionCommand = function (command, callback) {
  exec(command, function (err, stdin, stderr) {
    if (err) {
      callback(err)
    } else {
      if (stderr.length > 0) {
        callback(new Error(stderr.toString()))
      } else {
        callback(null, stdin.toString().trim())
      }
    }
  })
}

var getVersions = function (callback) {
  parallel({
    node: runVersionCommand.bind(null, 'node --version'),
    npm: runVersionCommand.bind(null, 'npm --version')
  }, function (err, versions) {
    if (err) {
      callback(err)
    } else {
      callback(null, {
        node: semver(versions.node),
        nodeWanted: new semver.Range(WANTED.node),
        nodeSatisfied: semver.satisfies(versions.node, WANTED.node),
        npm: semver(versions.npm),
        npmWanted: new semver.Range(WANTED.npm),
        npmSatisfied: semver.satisfies(versions.npm, WANTED.npm)
      })
    }
  })
}

var throwError = function (tool, current, wanted) {
  var message = 'Unsuported version of ' + tool + 'Your current version is ' + current + '. Wanted: ' + wanted
  throw new Error(message)
}

getVersions(function (err, versions) {
  if (err) {
    throw new Error(err)
  }
  if (!versions.npmSatisfied) {
    throwError('npm', versions.npm.version, versions.npmWanted.range)
  }
  if (!versions.nodeSatisfied) {
    throwError('node', versions.node.version, versions.nodeWanted.range)
  }
})
