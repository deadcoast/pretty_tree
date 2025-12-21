#!/bin/bash
# ============================================
# CLI Test: gen command
# ============================================
#
# This script demonstrates the ptree gen
# command with profile and name-type options.
#
# Usage: ./test-gen.sh
#
# Requirements: 17.1, 17.3
# ============================================

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAYGROUND_DIR="$(dirname "$SCRIPT_DIR")"
PTREE_CLI="$PLAYGROUND_DIR/../bin/ptree.js"

echo "=== ptree gen command examples ==="
echo ""

# 1. Basic generation (default profile)
echo "1. Basic generation (default profile, unicode style):"
echo "   Command: node $PTREE_CLI gen demos --max-depth 2"
echo ""
node "$PTREE_CLI" gen "$PLAYGROUND_DIR/demos" --max-depth 2
echo ""

# 2. Generation with spec profile
echo "2. Generation with spec profile:"
echo "   Command: node $PTREE_CLI gen demos --profile spec --version 1.0.0 --max-depth 2"
echo ""
node "$PTREE_CLI" gen "$PLAYGROUND_DIR/demos" --profile spec --version 1.0.0 --max-depth 2
echo ""

# 3. Generation with ASCII style
echo "3. Generation with ASCII style:"
echo "   Command: node $PTREE_CLI gen demos --style ascii --max-depth 2"
echo ""
node "$PTREE_CLI" gen "$PLAYGROUND_DIR/demos" --style ascii --max-depth 2
echo ""

# 4. Generation with custom NAME_TYPEs
echo "4. Generation with custom NAME_TYPEs (High_Type for dirs, smol-type for files):"
echo "   Command: node $PTREE_CLI gen demos --name-type DIR:High_Type,FILE:smol-type --max-depth 2"
echo ""
node "$PTREE_CLI" gen "$PLAYGROUND_DIR/demos" --name-type "DIR:High_Type,FILE:smol-type" --max-depth 2
echo ""

# 5. Generation with SCREAM_TYPE for directories
echo "5. Generation with SCREAM_TYPE for directories:"
echo "   Command: node $PTREE_CLI gen demos --name-type DIR:SCREAM_TYPE --max-depth 2"
echo ""
node "$PTREE_CLI" gen "$PLAYGROUND_DIR/demos" --name-type "DIR:SCREAM_TYPE" --max-depth 2
echo ""

# 6. Generation with snake_type for files
echo "6. Generation with snake_type for files:"
echo "   Command: node $PTREE_CLI gen demos --name-type FILE:snake_type --max-depth 2"
echo ""
node "$PTREE_CLI" gen "$PLAYGROUND_DIR/demos" --name-type "FILE:snake_type" --max-depth 2
echo ""

# 7. Generation with custom version
echo "7. Generation with custom version:"
echo "   Command: node $PTREE_CLI gen demos --profile spec --version 2.5.0 --max-depth 1"
echo ""
node "$PTREE_CLI" gen "$PLAYGROUND_DIR/demos" --profile spec --version 2.5.0 --max-depth 1
echo ""

# 8. Available NAME_TYPEs reference
echo "8. Available NAME_TYPEs:"
echo "   - SCREAM_TYPE: EXAMPLE_NAME (uppercase with underscores)"
echo "   - High_Type:   Example_Name (capitalized words with underscores)"
echo "   - Cap-Type:    Example-Name (capitalized words with hyphens)"
echo "   - CamelType:   ExampleName  (PascalCase, no delimiter)"
echo "   - smol-type:   example-name (lowercase with hyphens)"
echo "   - snake_type:  example_name (lowercase with underscores)"
echo ""

echo "=== End of gen examples ==="
