#!/bin/bash

git config user.name "Travis CI"
git config user.email "travis@travis-ci.com"
npm version patch -m "Bump version to %s. [ci skip]"
npm run release
git push --quiet "https://$GH_TOKEN:x-oauth-basic@github.com/shockone/black-screen.git" HEAD:master --tags > /dev/null 2>&1

TAG_NAME=$(git describe --abbrev=0)
LAST_DRAFT_ID=$(curl "https://$GH_TOKEN:x-oauth-basic@api.github.com/repos/shockone/black-screen/releases" | python -c "import json,sys; array=json.load(sys.stdin); print array[0]['id'];")

curl --request PATCH "https://$GH_TOKEN:x-oauth-basic@api.github.com/repos/shockone/black-screen/releases/$LAST_DRAFT_ID" \
    -H "Content-Type: application/json" \
    -d "{\"body\":\"\", \"draft\": false, \"prerelease\": true, \"tag_name\": \"$TAG_NAME\"}"
