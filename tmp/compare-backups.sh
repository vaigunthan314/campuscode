#!/bin/sh
set -eu
cd "/Users/vaigunthansl/Desktop/Rebuild /"
paths="src/components/PageFlipBook.tsx
backups/how-book-20261030-004441/PageFlipBook.tsx
backups/how-book-visual-20261030-010810/PageFlipBook.tsx
backups/campuscode-repair-20261030-011800/PageFlipBook.tsx
backups/campuscode-repair-20261030-002400/PageFlipBook.tsx
backups/campuscode-repair-20261029-233923/PageFlipBook.tsx
backups/campuscode-repair-20261029-231508/PageFlipBook.tsx
backups/latest/PageFlipBook.tsx
PageFlipBook.tsx
src/components/PageFlipBook.tsx.bak"
printf "%-55s %8s  tail-sig\n" "path" "lines"
printf "%s\n" "$(printf '%0.s-' {1..55}) -----  ---------------------------------------------------------------"
for p in $paths; do
  if [ -f "$p" ]; then
    lines=$(wc -l < "$p")
    tail_sig=$(tail -n 2 "$p" | sed -n '1,2p' | tr '\n' ' ' | sed 's/ *$//')
    printf "%-55s %8s  %s\n" "$p" "$lines" "$tail_sig"
  else
    printf "%-55s %8s  %s\n" "$p" "MISSING" ""
  fi
done
