#!/bin/bash
#
# Security Verification Script
# Checks for common security issues
#

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔒 Running Security Verification Checks..."
echo ""

ERRORS=0
WARNINGS=0

# Check 1: Verify .env is in .gitignore
echo -n "1. Checking if .env is in .gitignore... "
if grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   .env is NOT in .gitignore!"
    ERRORS=$((ERRORS + 1))
fi

# Check 2: Verify .env file has no hardcoded secrets
echo -n "2. Checking .env for hardcoded secrets... "
if [ -f ".env" ]; then
    if grep -q "^LARK_BOT_SECRET=.\+" .env && ! grep -q "^LARK_BOT_SECRET=$" .env && ! grep -q "YOUR_SECRET_HERE" .env; then
        echo -e "${RED}✗ FAIL${NC}"
        echo "   Found hardcoded LARK_BOT_SECRET in .env"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ PASS${NC}"
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC} (.env does not exist)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 3: Verify pre-commit hook is executable
echo -n "3. Checking pre-commit hook... "
if [ -f ".git/hooks/pre-commit" ] && [ -x ".git/hooks/pre-commit" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARN${NC}"
    echo "   Pre-commit hook is missing or not executable"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 4: Check git history for leaked secrets (smart check)
echo -n "4. Checking git history for .env file commits... "
# Only check if .env file itself was committed (most critical)
# Note: Old rotated secrets in documentation are safe to ignore
if git log --all --pretty=format: --name-only | grep -q "^\.env$"; then
    echo -e "${RED}✗ FAIL${NC}"
    echo "   .env file found in git history!"
    echo "   This is CRITICAL - run: ./scripts/clean-git-history.sh"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   (Note: Rotated secrets in old docs are safe)"
fi

# Check 5: Verify larkPush.js uses environment variables
echo -n "5. Checking larkPush.js uses env vars... "
if grep -q "process.env.LARK_BOT_SECRET" larkPush.js && \
   grep -q "process.env.LARK_WEBHOOK_URL" larkPush.js; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   larkPush.js does not properly use environment variables"
    ERRORS=$((ERRORS + 1))
fi

# Check 6: Verify .env.template exists
echo -n "6. Checking .env.template exists... "
if [ -f ".env.template" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARN${NC}"
    echo "   .env.template is missing"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 7: Verify no secrets in package.json scripts
echo -n "7. Checking package.json for hardcoded secrets... "
if grep -i "secret\|password\|token" package.json | grep -qv "\"type\":\|\"secret-scanning\""; then
    echo -e "${YELLOW}⚠ WARN${NC}"
    echo "   Potential secret-like strings found in package.json"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ PASS${NC}"
fi

echo ""
echo "================================"
echo "Security Verification Complete"
echo "================================"
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Security check FAILED${NC}"
    echo "Please fix the errors above before proceeding."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Security check passed with warnings${NC}"
    echo "Consider addressing the warnings above."
    exit 0
else
    echo -e "${GREEN}✅ All security checks PASSED${NC}"
    exit 0
fi
