#!/bin/bash

git config user.name "Travis CI"
git config user.email "travis@travis-ci.com"

npm version patch -m "Bump version to %s. [ci skip]"
NEW_VERSION=$(cat package.json | python -c "import json,sys; obj=json.load(sys.stdin); print obj['version']")
echo "($?) New version: $NEW_VERSION"

npm run release
git push --quiet "https://$GH_TOKEN:x-oauth-basic@github.com/vshatskyi/black-screen.git" HEAD:master --tags > /dev/null 2>&1

TAG_NAME=$(git describe --abbrev=0)
echo "($?) Current tag: $TAG_NAME"

PREVIOUS_TAG_NAME=$(git describe --abbrev=0 --tags "$TAG_NAME^")
echo "($?) Previous tag: $PREVIOUS_TAG_NAME"

BODY=$(git log --oneline --no-merges $TAG_NAME...$PREVIOUS_TAG_NAME | python -c "import json,sys; print json.dumps(sys.stdin.read());")
echo "($?) Body:"
echo $BODY

curl --request POST "https://$GH_TOKEN:x-oauth-basic@api.github.com/repos/vshatskyi/black-screen/releases" \
    -H "Content-Type: application/json" \
    -d "{\"body\": $BODY, \"tag_name\": \"$NEW_VERSION\", \"name\": \"$NEW_VERSION\"}"
