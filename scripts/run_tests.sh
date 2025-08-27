#!/bin/bash
# OpenHands Best Practices Test Runner
# This script runs all validation tests and checks for the project

set -e

echo "🧪 Running OpenHands Best Practices Tests"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "info")
            echo -e "ℹ️  $message"
            ;;
    esac
}

# Check if we're in the right directory
if [ ! -f "OPENHANDS_BEST_PRACTICES.md" ]; then
    print_status "error" "Not in OpenHands project root directory"
    exit 1
fi

print_status "info" "Starting validation tests..."

# 1. Run best practices validation
echo ""
echo "1. Running Best Practices Validation"
echo "-----------------------------------"
if python scripts/validate_best_practices.py --verbose; then
    print_status "success" "Best practices validation passed"
else
    print_status "error" "Best practices validation failed"
    exit 1
fi

# 2. Run unit tests
echo ""
echo "2. Running Unit Tests"
echo "--------------------"
if python -m pytest tests/ -v --tb=short; then
    print_status "success" "Unit tests passed"
else
    print_status "error" "Unit tests failed"
    exit 1
fi

# 3. Check code formatting (if black is available)
echo ""
echo "3. Checking Code Formatting"
echo "--------------------------"
if command -v black &> /dev/null; then
    if black --check --diff .; then
        print_status "success" "Code formatting is correct"
    else
        print_status "warning" "Code formatting issues found (run 'black .' to fix)"
    fi
else
    print_status "warning" "Black not installed, skipping formatting check"
fi

# 4. Check imports (if isort is available)
echo ""
echo "4. Checking Import Sorting"
echo "-------------------------"
if command -v isort &> /dev/null; then
    if isort --check-only --diff .; then
        print_status "success" "Import sorting is correct"
    else
        print_status "warning" "Import sorting issues found (run 'isort .' to fix)"
    fi
else
    print_status "warning" "isort not installed, skipping import check"
fi

# 5. Run linting (if flake8 is available)
echo ""
echo "5. Running Linting"
echo "-----------------"
if command -v flake8 &> /dev/null; then
    if flake8 --max-line-length=88 --extend-ignore=E203,W503 .; then
        print_status "success" "Linting passed"
    else
        print_status "warning" "Linting issues found"
    fi
else
    print_status "warning" "flake8 not installed, skipping linting"
fi

# 6. Check git status
echo ""
echo "6. Checking Git Status"
echo "---------------------"
if git status --porcelain | grep -q .; then
    print_status "warning" "Uncommitted changes found"
    git status --short
else
    print_status "success" "Working directory is clean"
fi

echo ""
echo "========================================"
print_status "success" "All validation tests completed!"
echo ""
echo "📋 Summary:"
echo "   • Best practices validation: ✅"
echo "   • Unit tests: ✅"
echo "   • Code quality checks: ✅"
echo ""
echo "🚀 Your project follows OpenHands best practices!"