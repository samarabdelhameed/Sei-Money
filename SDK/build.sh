#!/bin/bash

# Sei Money SDK Build Script
# This script builds the SDK and runs tests

set -e

echo "🚀 Building Sei Money SDK..."

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm version: $(npm -v)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed successfully"
else
    print_status "Dependencies already installed"
fi

# Clean previous build
print_status "Cleaning previous build..."
npm run clean

# Run linting
print_status "Running ESLint..."
if npm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting found issues. Continuing with build..."
fi

# Run tests
print_status "Running tests..."
if npm test; then
    print_success "All tests passed"
else
    print_error "Tests failed. Please fix the issues before building."
    exit 1
fi

# Build the project
print_status "Building TypeScript..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Check build output
if [ -d "dist" ]; then
    print_status "Build output:"
    ls -la dist/
    
    # Check if main files exist
    if [ -f "dist/index.js" ] && [ -f "dist/index.d.ts" ]; then
        print_success "Main build files created successfully"
    else
        print_error "Main build files are missing"
        exit 1
    fi
else
    print_error "Build output directory 'dist' not found"
    exit 1
fi

# Run example (optional)
if [ "$1" = "--run-example" ]; then
    print_status "Running example..."
    node dist/example.js
fi

print_success "🎉 SDK build completed successfully!"
print_status "You can now use the SDK from the 'dist' directory"
print_status "To install globally: npm install -g ."
print_status "To publish to npm: npm publish"
