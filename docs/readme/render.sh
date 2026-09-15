#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
source_dir="$repo_root/docs/readme"
output_dir="$source_dir/generated"

mkdir -p "$output_dir"

for obsolete in \
  tour-landing.svg \
  tour-classroom.svg \
  tour-upload.svg \
  tour-quiz.svg \
  tour-results.svg; do
  rm -f "$output_dir/$obsolete"
done

typst compile --creation-timestamp 0 "$source_dir/hero.typ" "$output_dir/hero.svg"
typst compile --creation-timestamp 0 "$source_dir/learning-loop.typ" "$output_dir/learning-loop.svg"
typst compile --creation-timestamp 0 "$source_dir/architecture.typ" "$output_dir/architecture.svg"

echo "Rendered README artwork in docs/readme/generated"
