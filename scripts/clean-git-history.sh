#!/bin/bash
#
# Git History Cleanup Script
# This script removes hardcoded secrets from git history
#
# WARNING: This rewrites git history. Make sure to:
# 1. Backup your repository first
# 2. Coordinate with team members
# 3. Force push after cleanup
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Git History Cleanup Script${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo -e "${RED}ERROR: git-filter-repo is not installed${NC}"
    echo ""
    echo "Install with:"
    echo "  pip3 install git-filter-repo"
    echo ""
    echo "Or on macOS:"
    echo "  brew install git-filter-repo"
    echo ""
    exit 1
fi

# Confirm with user
echo -e "${RED}WARNING: This will rewrite git history!${NC}"
echo ""
echo "This script will:"
echo "  1. Remove all .env files from history"
echo "  2. Remove hardcoded secrets"
echo "  3. Rewrite all commits"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Aborted."
    exit 1
fi

# Backup current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${GREEN}Creating backup branch: backup-before-cleanup${NC}"
git branch backup-before-cleanup 2>/dev/null || echo "Backup branch already exists"

# Create a temporary file with strings to replace
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE" << 'EOF'
SECRET_REMOVED==>SECRET_REMOVED
WEBHOOK_ID_REMOVED==>WEBHOOK_ID_REMOVED
EOF

echo ""
echo -e "${GREEN}Step 1: Removing .env files from history${NC}"
git filter-repo --path .env --invert-paths --force

echo ""
echo -e "${GREEN}Step 2: Replacing hardcoded secrets${NC}"
git filter-repo --replace-text "$TEMP_FILE" --force

# Cleanup
rm "$TEMP_FILE"

echo ""
echo -e "${GREEN}✅ Git history cleaned successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify the cleanup:"
echo "     git log -p --all | grep -i 'LARK_BOT_SECRET'"
echo ""
echo "  2. Force push to remote (coordinate with team first!):"
echo "     git push origin --force --all"
echo "     git push origin --force --tags"
echo ""
echo "  3. All team members must re-clone the repository"
echo ""
echo "Backup branch created: backup-before-cleanup"
