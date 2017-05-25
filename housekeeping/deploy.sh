#!/bin/bash
git config user.name "Travis CI"
git config user.email "travis@travis-ci.com"
npm version patch -m "Bump version to %s. [ci skip]"
git push --quiet "https://$GH_TOKEN:x-oauth-basic@github.com/railsware/upterm.git" HEAD:master --tags > /dev/null 2>&1
npm run release

NEW_RELEASE_TAG=$(git describe --abbrev=0)
echo "($?) Current release tag: $NEW_RELEASE_TAG"

PREVIOUS_RELEASE_TAG=$(git describe --abbrev=0 --tags "$NEW_RELEASE_TAG^")
echo "($?) Previous release tag: $PREVIOUS_RELEASE_TAG"

NEW_RELEASE_ID=$(curl "https://$GH_TOKEN:x-oauth-basic@api.github.com/repos/railsware/upterm/releases/latest" | python -c "import json,sys; obj=json.load(sys.stdin); print obj['id'];")
echo "($?) New release draft ID: $NEW_RELEASE_ID"

NEW_RELEASE_BODY=$(git log --oneline --no-merges $NEW_RELEASE_TAG...$PREVIOUS_RELEASE_TAG | python -c "import json,sys; print json.dumps(sys.stdin.read());")
echo "($?) Body:"
echo $NEW_RELEASE_BODY

curl --request PATCH "https://$GH_TOKEN:x-oauth-basic@api.github.com/repos/railsware/upterm/releases/$NEW_RELEASE_ID" \
    -H "Content-Type: application/json" \
    -d "{\"body\": $NEW_RELEASE_BODY}"
