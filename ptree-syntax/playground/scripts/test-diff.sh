#!/bin/bash
# ============================================
# CLI Test: --diff option
# ============================================
#
# This script demonstrates the --diff option
# for previewing fixes without applying them.
#
# Usage: ./test-diff.sh
#
# Requirements: 17.3
# ============================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAYGROUND_DIR="$(dirname "$SCRIPT_DIR")"
PTREE_CLI="$PLAYGROUND_DIR/../bin/ptree.js"

# Create a temporary file for testing
TEMP_FILE=$(mktemp /tmp/ptree-diff-test.XXXXXX.ptree)

echo "=== ptree --diff option examples ==="
echo ""

# 1. Create a file with fixable issues
echo "1. Creating test file with fixable issues:"
cat > "$TEMP_FILE" << 'EOF'
@ptree: default
@style: unicode

MY_PROJECT//
├── readme.MD
├── document.TXT
├── script.JS
├── styles.CSS
└── Src/
    ├── index.TS
    ├── utils.TSX
    └── Config/
        └── settings.JSON
EOF
echo ""
cat "$TEMP_FILE"
echo ""

# 2. Preview fixes with --diff (text format)
echo "2. Preview fixes with --diff (unified diff format):"
echo "   Command: node $PTREE_CLI validate <file> --diff"
echo ""
node "$PTREE_CLI" validate "$TEMP_FILE" --diff || true
echo ""

# 3. Preview fixes with --diff and JSON format
echo "3. Preview fixes with --diff and JSON format:"
echo "   Command: node $PTREE_CLI validate <file> --diff --format json"
echo ""
node "$PTREE_CLI" validate "$TEMP_FILE" --diff --format json || true
echo ""

# 4. Show that original file is unchanged
echo "4. Original file is unchanged (--diff only previews):"
echo ""
cat "$TEMP_FILE"
echo ""

# 5. Test with a file that has no issues
echo "5. --diff with a file that has no issues:"
cat > "$TEMP_FILE" << 'EOF'
@ptree: default
@style: unicode

MY_PROJECT//
├── readme.md
├── document.txt
└── src/
    └── index.ts
EOF
echo ""
node "$PTREE_CLI" validate "$TEMP_FILE" --diff || true
echo ""

# 6. Test with a file that has no issues (JSON format)
echo "6. --diff with no issues (JSON format):"
echo ""
node "$PTREE_CLI" validate "$TEMP_FILE" --diff --format json || true
echo ""

# Cleanup
rm -f "$TEMP_FILE"

echo "=== End of --diff examples ==="
