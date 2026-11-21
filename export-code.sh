#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

OUTPUT="my_full_code.txt"
echo "COMPLETE PROJECT CODE BUNDLE" > "$OUTPUT"
echo "Generated from current working directory: $(pwd)" >> "$OUTPUT"
echo "Generated at: $(date)" >> "$OUTPUT"
echo "" >> "$OUTPUT"

echo "==> Scanning for source files..."

find . \
  -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  ! -path "*/.fix-backup/*" \
  ! -path "*/.connect-backup/*" \
  ! -path "*/backups/*" \
  ! -name "*.txt" \
  ! -name "*.pdf" \
  ! -name "*.patch" \
  ! -name "*.bak*" \
  ! -name "*.rej" \
  ! -name "package-lock.json" \
  ! -name "yarn.lock" \
  ! -name "pnpm-lock.yaml" \
  ! -name "*.png" \
  ! -name "*.jpg" \
  ! -name "*.jpeg" \
  ! -name "*.webp" \
  ! -name "*.svg" \
  ! -name "*.ico" \
  ! -name "*.gif" \
  ! -name "*.woff" \
  ! -name "*.woff2" \
  ! -name "*.ttf" \
  ! -name ".DS_Store" \
  ! -name ".env" \
  ! -name ".env.local" \
  | sort -u \
  | while read -r file; do
    # Skip empty files
    if [ ! -s "$file" ]; then continue; fi
    echo "================================================================================" >> "$OUTPUT"
    echo "FILE: $file" >> "$OUTPUT"
    echo "================================================================================" >> "$OUTPUT"
    cat "$file" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
  done

# Count what got bundled
FILE_COUNT=$(grep -c "^FILE: " "$OUTPUT" || echo 0)
LINES=$(wc -l < "$OUTPUT")
SIZE=$(du -h "$OUTPUT" | cut -f1)

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  DONE."
echo ""
echo "  Output:       $OUTPUT"
echo "  Files:        $FILE_COUNT"
echo "  Total lines:  $LINES"
echo "  File size:    $SIZE"
echo ""
echo "  Excluded:"
echo "    • node_modules, .git, dist, backups"
echo "    • .env (secrets)"
echo "    • images and fonts"
echo "    • lock files and old dumps"
echo ""
echo "  To preview the file list:"
echo "    grep '^FILE:' $OUTPUT"
echo "════════════════════════════════════════════════════════════"
