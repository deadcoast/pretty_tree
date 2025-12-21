#!/bin/bash
# ============================================
# CLI Test: validate command
# ============================================
#
# This script demonstrates the ptree validate
# command with various options.
#
# Usage: ./test-validate.sh
#
# Requirements: 17.1, 17.3
# ============================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAYGROUND_DIR="$(dirname "$SCRIPT_DIR")"
PTREE_CLI="$PLAYGROUND_DIR/../bin/ptree.js"

echo "=== ptree validate command examples ==="
echo ""

# 1. Basic validation (valid file)
echo "1. Basic validation (valid file):"
echo "   Command: node $PTREE_CLI validate demos/01-basic-tree.ptree"
echo ""
node "$PTREE_CLI" validate "$PLAYGROUND_DIR/demos/01-basic-tree.ptree" || true
echo ""

# 2. Validation with errors
echo "2. Validation with errors (uppercase extensions):"
echo "   Command: node $PTREE_CLI validate rules/pt007-ext-lowercase.ptree"
echo ""
node "$PTREE_CLI" validate "$PLAYGROUND_DIR/rules/pt007-ext-lowercase.ptree" || true
echo ""

# 3. JSON output format
echo "3. JSON output format:"
echo "   Command: node $PTREE_CLI validate rules/pt007-ext-lowercase.ptree --format json"
echo ""
node "$PTREE_CLI" validate "$PLAYGROUND_DIR/rules/pt007-ext-lowercase.ptree" --format json || true
echo ""

# 4. Validation with spec profile
echo "4. Validation with spec profile:"
echo "   Command: node $PTREE_CLI validate profiles/spec-profile.ptree --profile spec"
echo ""
node "$PTREE_CLI" validate "$PLAYGROUND_DIR/profiles/spec-profile.ptree" --profile spec || true
echo ""

# 5. Validation with default profile
echo "5. Validation with default profile:"
echo "   Command: node $PTREE_CLI validate profiles/default-profile.ptree --profile default"
echo ""
node "$PTREE_CLI" validate "$PLAYGROUND_DIR/profiles/default-profile.ptree" --profile default || true
echo ""

# 6. Validation with workspace root
echo "6. Validation with workspace root (for config lookup):"
echo "   Command: node $PTREE_CLI validate demos/01-basic-tree.ptree --workspace-root ."
echo ""
node "$PTREE_CLI" validate "$PLAYGROUND_DIR/demos/01-basic-tree.ptree" --workspace-root "$PLAYGROUND_DIR" || true
echo ""

echo "=== End of validate examples ==="
