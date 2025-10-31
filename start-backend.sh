#!/bin/bash
# Get the script's directory and use relative path
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/backend"
/opt/homebrew/bin/python3.10 main.py

