#!/usr/bin/env bash
set -euo pipefail

mode="${1:---tracked}"
blocked_path='^(backups?|exports?|screenshots?|transcripts?|logs?)/|(^|/)\.env($|\.)|\.jsonl$|\.log$|\.convex-export\.zip$'
secret_pattern='AIza[0-9A-Za-z_-]{30,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[0-9A-Za-z]{30,}|github_pat_[0-9A-Za-z_]{30,}|xox[baprs]-[0-9A-Za-z-]{10,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|sk-(live|test|proj)-[0-9A-Za-z_-]{16,}'

if [[ "$mode" == "--staged" ]]; then
  mapfile -d '' files < <(git diff --cached --name-only --diff-filter=ACMR -z)
  if ((${#files[@]} == 0)); then
    exit 0
  fi

  blocked=0
  for file in "${files[@]}"; do
    if [[ "$file" == ".env.example" ]]; then
      continue
    fi
    if [[ "$file" =~ $blocked_path ]]; then
      printf 'Blocked sensitive path: %s\n' "$file" >&2
      blocked=1
    fi
  done
  if ((blocked)); then
    printf 'Move sensitive data outside the repository or update the reviewed policy intentionally.\n' >&2
    exit 1
  fi

  if git diff --cached --no-ext-diff --unified=0 --no-color -- "${files[@]}" \
    | sed -n 's/^+//p' \
    | grep -E "$secret_pattern" >/dev/null; then
    printf 'Potential secret found in staged content. Commit blocked.\n' >&2
    exit 1
  fi
elif [[ "$mode" == "--tracked" ]]; then
  blocked_files="$(git ls-files | grep -E "$blocked_path" | grep -v '^\.env\.example$' || true)"
  if [[ -n "$blocked_files" ]]; then
    printf 'Sensitive paths are already tracked:\n%s\n' "$blocked_files" >&2
    exit 1
  fi
  if git grep -I -n -E "$secret_pattern" -- ':!package-lock.json' >/dev/null; then
    printf 'Potential secret found in tracked content. Run the scanner locally to inspect it.\n' >&2
    exit 1
  fi
else
  printf 'Usage: %s [--staged|--tracked]\n' "$0" >&2
  exit 2
fi

printf 'Sensitive-file and high-confidence secret scan passed.\n'
