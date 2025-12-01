#!/bin/bash
# Setup script to add Node.js and npm to Git Bash PATH
# Run this in Git Bash: source setup_gitbash.sh

# Add Node.js to PATH
export PATH="/c/Program Files/nodejs:$PATH"

# Add npm global packages to PATH
export PATH="$HOME/AppData/Roaming/npm:$PATH"

echo "Node.js and npm added to PATH for this session"
echo "To make this permanent, add these lines to ~/.bashrc:"
echo ""
echo "export PATH=\"/c/Program Files/nodejs:\$PATH\""
echo "export PATH=\"\$HOME/AppData/Roaming/npm:\$PATH\""



