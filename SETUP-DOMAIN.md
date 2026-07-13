# Domain setup — howdysites.com on Cloudflare

**Owner: Michael.** The domain is bought and sitting in our Cloudflare account. This guide finishes the job: puts the website live on howdysites.com (auto-deploying from this repo) and sets up our howdy@howdysites.com email. About 20 minutes, all clicking, no code.

You need: a login to the Cloudflare account that holds the domain (get it from Sebastian) and your GitHub login (you're already a collaborator on this repo).

---

## Part 1 — Put the website live (Cloudflare Pages)

1. Log in at **dash.cloudflare.com**.
2. Left sidebar → **Workers & Pages** → **Create** button → pick the **Pages** tab → **Connect to Git**.
3. It asks you to connect GitHub. Sign in, and when GitHub asks what to share, choose **Only select repositories → sebsalass/howdysites-hq**. (Never grant all repos — the repo stays private either way; Cloudflare only gets read access to build it.)
4. Back in Cloudflare, select **howdysites-hq** from the list → **Begin setup**.
5. Build settings — exactly this, leave everything else alone:
   - **Project name:** `howdysites` (this names the temporary preview URL)
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** leave EMPTY
   - **Build output directory:** `site`
6. Click **Save and Deploy**. Wait ~1 minute; you'll get a preview URL like `howdysites.pages.dev`. Open it — you should see our green "Howdy." homepage. If you see it, the pipe from GitHub is working.
7. Now attach the real domain: on the project page → **Custom domains** tab → **Set up a custom domain** → type `howdysites.com` → Continue. Because the domain lives in this same Cloudflare account, it configures DNS itself — just click through and confirm.
8. Repeat step 7 once more for `www.howdysites.com` (so both work).
9. Wait a few minutes, then open **https://howdysites.com** in a private/incognito window. Green homepage + padlock icon = done.

**What you just built:** every time anyone pushes to this repo, the live site updates within about a minute. No FTP, no uploads, ever.

## Part 2 — Email: howdy@howdysites.com

1. In the Cloudflare dashboard, click the **howdysites.com** domain (from the account home) → left sidebar → **Email** → **Email Routing** → **Get started**.
2. Create a custom address: **howdy** @ howdysites.com.
3. Set the destination to the Gmail we're using for the business (ask Sebastian which one). Cloudflare sends that inbox a verification email — click the link in it.
4. When it prompts to add the email DNS records (MX + TXT), click **Add records automatically**.
5. Test: send an email from your personal account to howdy@howdysites.com and confirm it lands in the destination inbox.

This gives us receiving only, which is all the website needs (the site's buttons say "email howdy@howdysites.com"). Sending FROM that address (for outreach) is a separate later step — don't worry about it today.

## Part 3 — Tell the team it's done

1. Open the dashboard (double-click `Howdy HQ.command`).
2. Check the site works one more time on your phone.
3. Add a line to `memory/log.md` (or open the repo in Claude Code and say "log that the domain is live") and hit **Sync**.

## If something looks wrong

- **Preview URL shows an error instead of the homepage** → in the Pages project → Settings → Builds, confirm Build output directory is `site` (not `/site/index.html`, not empty).
- **howdysites.com shows a Cloudflare error page** → Custom domains tab: status should say Active. If it's been pending >15 minutes, remove the custom domain and add it again.
- **Verification email never arrives (Part 2)** → check spam, then try a different destination inbox.
- **Anything else** → screenshot it, open this repo in Claude Code, paste the screenshot and ask. CLAUDE.md gives it full context on our setup.
