#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/apply-github-rulesets.sh Yutodesuy/nicchyo-platform
# Required auth scope:
#   administration:write (or equivalent permissions in fine-grained token)

if [[ $# -ne 1 ]]; then
	echo "Usage: $0 <owner/repo>"
	exit 1
fi

REPO="$1"
REQUIRED_CHECK_CONTEXT="${REQUIRED_CHECK_CONTEXT:-CI / Lint / Type Check / Test / Build}"

GH_BIN=""
if command -v gh >/dev/null 2>&1; then
	GH_BIN="$(command -v gh)"
elif command -v gh.exe >/dev/null 2>&1; then
	GH_BIN="$(command -v gh.exe)"
else
	echo "gh CLI is required"
	exit 1
fi

echo "Applying rulesets to ${REPO} ..."

make_temp_file() {
	if command -v mktemp >/dev/null 2>&1; then
		mktemp "${TMPDIR:-${TEMP:-${TMP:-.}}}/ruleset.XXXXXX.json"
	else
		echo "${TMPDIR:-${TEMP:-${TMP:-.}}}/ruleset.$$.json"
	fi
}

MAIN_RULESET_FILE="$(make_temp_file)"
DEVELOP_RULESET_FILE="$(make_temp_file)"

cleanup() {
	rm -f "${MAIN_RULESET_FILE}" "${DEVELOP_RULESET_FILE}"
}
trap cleanup EXIT

cat > "${MAIN_RULESET_FILE}" <<'JSON'
{
	"name": "main branch protection",
	"target": "branch",
	"enforcement": "active",
	"conditions": {
		"ref_name": {
			"include": ["refs/heads/main"],
			"exclude": []
		}
	},
	"rules": [
		{ "type": "deletion" },
		{ "type": "non_fast_forward" },
		{ "type": "required_linear_history" },
		{
			"type": "required_status_checks",
			"parameters": {
				"strict_required_status_checks_policy": true,
				"required_status_checks": [
					{ "context": "__REQUIRED_CHECK_CONTEXT__" }
				]
			}
		},
		{
			"type": "pull_request",
			"parameters": {
				"required_approving_review_count": 1,
				"dismiss_stale_reviews_on_push": true,
				"require_code_owner_review": true,
				"require_last_push_approval": true,
				"required_review_thread_resolution": true
			}
		}
	],
	"bypass_actors": []
}
JSON

cat > "${DEVELOP_RULESET_FILE}" <<'JSON'
{
	"name": "develop branch protection",
	"target": "branch",
	"enforcement": "active",
	"conditions": {
		"ref_name": {
			"include": ["refs/heads/develop"],
			"exclude": []
		}
	},
	"rules": [
		{ "type": "deletion" },
		{ "type": "non_fast_forward" },
		{ "type": "required_linear_history" },
		{
			"type": "required_status_checks",
			"parameters": {
				"strict_required_status_checks_policy": true,
				"required_status_checks": [
					{ "context": "__REQUIRED_CHECK_CONTEXT__" }
				]
			}
		},
		{
			"type": "pull_request",
			"parameters": {
				"required_approving_review_count": 1,
				"dismiss_stale_reviews_on_push": true,
				"require_code_owner_review": false,
				"require_last_push_approval": true,
				"required_review_thread_resolution": true
			}
		}
	],
	"bypass_actors": []
}
JSON

# Inject check context safely without depending on jq/python.
escaped_context="${REQUIRED_CHECK_CONTEXT//\//\\/}"
escaped_context="${escaped_context//&/\\&}"
sed -i "s/__REQUIRED_CHECK_CONTEXT__/${escaped_context}/g" "${MAIN_RULESET_FILE}" "${DEVELOP_RULESET_FILE}" 2>/dev/null || \
sed -i '' "s/__REQUIRED_CHECK_CONTEXT__/${escaped_context}/g" "${MAIN_RULESET_FILE}" "${DEVELOP_RULESET_FILE}"

MAIN_ID=$("${GH_BIN}" api "repos/${REPO}/rulesets" --jq '.[] | select(.name=="main branch protection") | .id' || true)

if [[ -n "${MAIN_ID}" ]]; then
	echo "Updating existing main ruleset: ${MAIN_ID}"
		"${GH_BIN}" api -X PUT "repos/${REPO}/rulesets/${MAIN_ID}" --input "${MAIN_RULESET_FILE}" >/dev/null
else
	echo "Creating main ruleset"
		"${GH_BIN}" api -X POST "repos/${REPO}/rulesets" --input "${MAIN_RULESET_FILE}" >/dev/null
fi

DEVELOP_ID=$("${GH_BIN}" api "repos/${REPO}/rulesets" --jq '.[] | select(.name=="develop branch protection") | .id' || true)

if [[ -n "${DEVELOP_ID}" ]]; then
	echo "Updating existing develop ruleset: ${DEVELOP_ID}"
	"${GH_BIN}" api -X PUT "repos/${REPO}/rulesets/${DEVELOP_ID}" --input "${DEVELOP_RULESET_FILE}" >/dev/null
else
	echo "Creating develop ruleset"
	"${GH_BIN}" api -X POST "repos/${REPO}/rulesets" --input "${DEVELOP_RULESET_FILE}" >/dev/null
fi

echo "Done. Current rulesets:"
"${GH_BIN}" api "repos/${REPO}/rulesets" --jq '.[] | {id,name,enforcement}'
