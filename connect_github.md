# Connect GitHub to Vercel via CLI - Steps Required

## The Issue
The Vercel CLI cannot directly authorize GitHub because it requires OAuth authentication which must be done through a web browser.

## Solution: Two-Step Process

### Step 1: Authorize GitHub via Web (Required First)
1. The project page should have opened in your browser (from `vercel open`)
2. If not, go to: https://vercel.com/jo-divers-projects/orbitalastro-api/settings/git
3. Click **"Connect Git Repository"** or **"Connect GitHub"**
4. You'll be redirected to GitHub to authorize Vercel
5. Authorize Vercel to access your repositories
6. Select the repository: `OrbitalAstro/orbitalastro`
7. Click **"Connect"**

### Step 2: Verify Connection via CLI
After Step 1 is complete, verify the connection:

```bash
vercel git connect
```

Or check the connection status:
```bash
vercel pull
```

## Alternative: If Repository is Already Connected
If GitHub is already connected but the CLI can't see it, try:

```bash
# Disconnect and reconnect
vercel git disconnect
vercel git connect https://github.com/OrbitalAstro/orbitalastro.git
```

## Why This Happens
- GitHub OAuth requires browser-based authentication for security
- The CLI can only connect repositories that are already authorized
- First-time GitHub connections must be done through the web interface

## After Connection
Once connected, every push to GitHub will automatically trigger a Vercel deployment!






