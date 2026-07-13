# Team setup — Michael & Parker

One-time setup, about 10 minutes. After this, running the dashboard is a double-click.

## 1. Accept the GitHub invite

Check your email (or go to github.com/sebsalass/howdysites-hq while logged in) and accept the collaborator invitation. Without this, nothing else works — the repo is private.

## 2. Install GitHub Desktop

Download from **desktop.github.com**, open it, and **sign in with your GitHub account**. This is what lets your Mac access our private repo — no terminal, no passwords to manage.

## 3. Clone the repo

In GitHub Desktop: **File → Clone Repository** → pick **sebsalass/howdysites-hq** from the list → Clone. Remember where it puts the folder (default: `~/Documents/GitHub/howdysites-hq`).

## 4. Install Node.js

Download the **LTS installer** from **nodejs.org**, run it, click through. (Node is what runs the dashboard on your machine.)

## 5. First boot

Open the `howdysites-hq` folder in Finder → **right-click `Howdy HQ.command` → Open → Open**. (The right-click dance is only needed the very first time — macOS is suspicious of new scripts.)

A window opens, does a first-time install (~a minute), and the dashboard appears in your browser at localhost:3000.

## Every day after

1. **Double-click `Howdy HQ.command`** — it grabs the latest team data automatically and opens the dashboard.
2. Work your leads.
3. Hit the **Sync** button (top right of the dashboard) when you finish — that's what shares your work with the other two. Not synced = invisible to the team.
4. Keep the launcher window open while you work; close it (or Ctrl+C) when you're done.

## If something breaks

- **"Pull failed" at boot** — usually means you have unsynced work; open the dashboard and hit Sync, or ask in the group chat.
- **Dashboard won't start** — quit the launcher window and double-click it again. Still broken? Open the repo folder in Claude Code and ask it what's wrong — CLAUDE.md gives it full context.
- **Anything else** — the docs live in the dashboard's Playbooks tab. Read your lane's playbook (`docs/03-roles.md` says who owns what).
