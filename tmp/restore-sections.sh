#!/bin/sh
set -eu
cd "/Users/vaigunthansl/Desktop/Rebuild /"
cp -f backups/latest/Sections.tsx src/components/Sections.tsx
echo "restored src/components/Sections.tsx from latest"
git diff -- src/components/Sections.tsx | sed -n '1,80p'
