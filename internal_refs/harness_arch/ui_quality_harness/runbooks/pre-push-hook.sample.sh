#!/usr/bin/env sh
set -eu

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

npm --prefix harness_lab/todo_frontend run typecheck
npm --prefix harness_lab/todo_frontend run check:ui-quality
