#!/bin/bash
# ============================================
# CLI Test: fix command (--fix and --write)
# ============================================
#
# This script demonstrates the ptree validate
# command with --fix and --write options.
#
# Usage: ./test-fix.sh
#
# Requirements: 17.1
# ============================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAYGROUND_DIR="$(dirname "$SCRIPT_DIR")"
PTREE_CLI="$PLAYGROUND_DIR/../bin/ptree.js"

# Create a temporary file for testing
TEMP_FILE=$(mktemp /tmp/ptree-fix-test.XXXXXX.ptree)

echo "=== ptree fix command examples ==="
echo ""

# 1. Show original file with errors
echo "1. Original file with uppercase extensions (PT007 errors):"
cat > "$TEMP_FILE" << 'EOF'
@ptree: default
@style: unicode

MY_PROJECT//
├── readme.MD
├── document.TXT
├── script.JS
└── Src/
    ├── index.TS
    └── utils.TSX
EOF
echo ""
cat "$TEMP_FILE"
echo ""

# 2. Validate to show errors
echo "2. Validation shows errors:"
echo "   Command: node $PTREE_CLI validate <file>"
echo ""
node "$PTREE_CLI" validate "$TEMP_FILE" || true
echo ""

# 3. Fix and output to stdout (without --write)
echo "3. Fix and output to stdout (without --write):"
echo "   Command: node $PTREE_CLI validate <file> --fix"
echo ""
node "$PTREE_CLI" validate "$TEMP_FILE" --fix || true
echo ""

# 4. Fix and write in-place
echo "4. Fix and write in-place:"
echo "   Command: node $PTREE_CLI validate <file> --fix --write"
echo ""
node "$PTREE_CLI" validate "$TEMP_FILE" --fix --write || true
echo ""

# 5. Show fixed file
echo "5. Fixed file contents:"
echo ""
cat "$TEMP_FILE"
echo ""

# 6. Validate fixed file (should pass)
echo "6. Validate fixed file (should pass):"
echo ""
node "$PTREE_CLI" validate "$TEMP_FILE" || true
echo ""

# Cleanup
rm -f "$TEMP_FILE"

echo "=== End of fix examples ==="
