var exec = require('child_process').exec
var semver = require('semver')
var parallel = require('run-parallel')

const WANTED = require('../package.json').engines

function runVersionCommand (command, callback) {
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

module.exports = function (callback) {
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
