#!/bin/bash

# Sei Money SDK Deploy Script
# This script builds and publishes the SDK to npm

set -e

echo "🚀 Deploying Sei Money SDK..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the SDK root directory."
    exit 1
fi

# Check if we're logged into npm
if ! npm whoami &> /dev/null; then
    print_error "Not logged into npm. Please run 'npm login' first."
    exit 1
fi

print_success "Logged into npm as: $(npm whoami)"

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "Current branch is '$CURRENT_BRANCH', not 'main'"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled"
        exit 0
    fi
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "There are uncommitted changes:"
    git status --short
    
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled"
        exit 0
    fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Ask for new version
echo "Select version bump type:"
echo "1) patch (0.0.x) - bug fixes"
echo "2) minor (0.x.0) - new features"
echo "3) major (x.0.0) - breaking changes"
echo "4) custom version"
read -p "Enter choice (1-4): " -n 1 -r
echo

case $REPLY in
    1)
        NEW_VERSION=$(npm version patch --no-git-tag-version)
        print_status "Bumping patch version to: $NEW_VERSION"
        ;;
    2)
        NEW_VERSION=$(npm version minor --no-git-tag-version)
        print_status "Bumping minor version to: $NEW_VERSION"
        ;;
    3)
        NEW_VERSION=$(npm version major --no-git-tag-version)
        print_status "Bumping major version to: $NEW_VERSION"
        ;;
    4)
        read -p "Enter custom version (e.g., 1.2.3): " CUSTOM_VERSION
        NEW_VERSION=$(npm version $CUSTOM_VERSION --no-git-tag-version)
        print_status "Setting custom version to: $NEW_VERSION"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Build the project
print_status "Building project..."
if ! ./build.sh; then
    print_error "Build failed. Cannot proceed with deployment."
    exit 1
fi

# Run tests one more time
print_status "Running final tests..."
if ! npm test; then
    print_error "Tests failed. Cannot proceed with deployment."
    exit 1
fi

# Check if dist directory exists and has content
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    print_error "Build output is empty. Cannot proceed with deployment."
    exit 1
fi

# Show what will be published
print_status "Files to be published:"
ls -la dist/

# Confirm deployment
echo
print_warning "About to publish version $NEW_VERSION to npm"
read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Deployment cancelled"
    exit 0
fi

# Publish to npm
print_status "Publishing to npm..."
if npm publish; then
    print_success "Successfully published version $NEW_VERSION to npm"
else
    print_error "Failed to publish to npm"
    exit 1
fi

# Create git tag
print_status "Creating git tag..."
git add package.json package-lock.json
git commit -m "Bump version to $NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

# Push changes and tags
print_status "Pushing changes and tags..."
git push origin main
git push origin "v$NEW_VERSION"

print_success "🎉 Deployment completed successfully!"
print_status "Version $NEW_VERSION has been published to npm"
print_status "Git tag v$NEW_VERSION has been created and pushed"
print_status "You can now install with: npm install sei-money-sdk@$NEW_VERSION"

# Show npm package info
print_status "Package information:"
npm view sei-money-sdk
