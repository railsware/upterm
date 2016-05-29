#!/bin/bash

git config user.name "Travis CI"
git config user.email "travis@travis-ci.com"
npm version patch -m "Bump version to %s. [ci skip]"
npm run release
git push --quiet "https://$GH_TOKEN:x-oauth-basic@github.com/shockone/black-screen.git" master:master > /dev/null 2>&1
git push --quiet "https://$GH_TOKEN:x-oauth-basic@github.com/shockone/black-screen.git" --tags > /dev/null 2>&1
