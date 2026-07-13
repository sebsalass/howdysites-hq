#!/bin/bash
# Howdy Sites HQ launcher — double-click to boot the dashboard.
# Pulls the latest team data, installs dependencies if needed, starts the app, opens the browser.
set -e
cd "$(dirname "$0")"

echo "=== Howdy Sites HQ ==="

# Finder-launched scripts don't load your shell profile, so nvm installs are
# invisible here unless we source nvm ourselves.
if ! command -v node >/dev/null 2>&1 && [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
fi

# Node check — point people at the installers instead of failing cryptically.
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js isn't installed. Two ways to fix that:"
  echo "  1) Easiest: download the LTS installer at https://nodejs.org and run it."
  echo "  2) Terminal: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash"
  echo "     then: \\. \"\$HOME/.nvm/nvm.sh\" && nvm install 24"
  echo "Then double-click this launcher again."
  read -n 1 -s -r -p "Press any key to close."
  exit 1
fi

echo "Pulling the latest from the team..."
git pull --rebase || echo "(pull failed — probably offline; starting with local data)"

cd dashboard
if [ ! -d node_modules ]; then
  echo "First boot — installing dependencies (one-time, ~a minute)..."
  npm install
fi

# Reuse an already-running dashboard instead of fighting over the port.
if curl -s -o /dev/null http://localhost:3000; then
  echo "Dashboard already running — opening it."
  open http://localhost:3000
  exit 0
fi

echo "Starting the dashboard at http://localhost:3000 ..."
echo "Keep this window open while you work. Ctrl+C (or close the window) to stop."
( sleep 4 && open http://localhost:3000 ) &
npm run dev
