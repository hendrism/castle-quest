#!/bin/bash
# Setup script to install Node.js dependencies
set -e

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Installing Node.js and npm..."
  apt-get update && apt-get install -y nodejs npm
fi

npm install
