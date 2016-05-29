#!/bin/bash

git config user.name "Travis CI"
git config user.email "travis@travis-ci.com"
npm version patch -m "Bump version to %s. [ci skip]"
npm run release
git push "https://$GH_TOKEN:x-oauth-basic@github.com/shockone/black-screen.git" master:master
git push "https://$GH_TOKEN:x-oauth-basic@github.com/shockone/black-screen.git" --tags
