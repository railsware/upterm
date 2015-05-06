import Base = require('./Base');
import Json = require('./Json');
import GitDiff = require('./GitDiff');
import Invocation = require('../Invocation');

var list: Array<{new (invocation: Invocation): Base}> = [Json, GitDiff];

export = list;
