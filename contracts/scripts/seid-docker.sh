#!/bin/bash

# SeiD Docker Wrapper Script
# This script wraps seid commands to run in Docker

set -e

# Docker image to use
DOCKER_IMAGE="ghcr.io/sei-protocol/sei-chain:latest"

# Function to run seid command in Docker
run_seid() {
    docker run --rm -it \
        -v $(pwd):/workspace \
        -w /workspace \
        --network host \
        $DOCKER_IMAGE \
        seid "$@"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Pull the image if not exists
if ! docker image inspect $DOCKER_IMAGE >/dev/null 2>&1; then
    echo "📦 Pulling Sei Docker image..."
    docker pull $DOCKER_IMAGE
fi

# Run the seid command
run_seid "$@"