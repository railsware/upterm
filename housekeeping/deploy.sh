#!/bin/bash

git config user.name "Travis CI"
git config user.email "travis@travis-ci.com"
npm version patch -m "Bump version to %s. [ci skip]"
npm run release
git push --quiet "https://$GH_TOKEN:x-oauth-basic@github.com/shockone/black-screen.git" HEAD:master --tags > /dev/null 2>&1

TAG_NAME=$(git describe --abbrev=0)
echo "($?) Current tag: $TAG_NAME"

PREVIOUS_TAG_NAME=$(git describe --abbrev=0 --tags "$TAG_NAME^")
echo "($?) Previous tag: $PREVIOUS_TAG_NAME"

LAST_DRAFT_ID=$(curl "https://$GH_TOKEN:x-oauth-basic@api.github.com/repos/shockone/black-screen/releases" | python -c "import json,sys; array=json.load(sys.stdin); print array[0]['id'];")
echo "($?) Last draft ID: $LAST_DRAFT_ID"

BODY=$(git log --oneline --no-merges $TAG_NAME...$PREVIOUS_TAG_NAME)
echo "($?) Body:"
echo $BODY

ESCAPED_BODY=$(echo $BODY | python -c "import json,sys; print json.dumps(sys.stdin.read())[1:-1];")
echo "($?) Escaped body:"
echo $ESCAPED_BODY

curl --request PATCH "https://$GH_TOKEN:x-oauth-basic@api.github.com/repos/shockone/black-screen/releases/$LAST_DRAFT_ID" \
    -H "Content-Type: application/json" \
    -d "{\"body\":\"$ESCAPED_BODY\", \"draft\": false, \"prerelease\": true, \"tag_name\": \"$TAG_NAME\"}"
