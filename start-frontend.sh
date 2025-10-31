#!/bin/bash
# Get the script's directory and use relative path
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
npm run dev

