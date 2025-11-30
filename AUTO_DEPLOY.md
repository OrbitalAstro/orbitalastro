# Auto-Deployment to Vercel

## 🚀 Overview

This repository is configured to automatically deploy to Vercel after successful commits on the `main` branch.

## How It Works

A Git `post-commit` hook has been set up that:
- ✅ Automatically deploys to Vercel after each commit on the `main` branch
- ✅ Deploys to **production** when on `main` branch
- ✅ Deploys to **preview** when on other branches (if `AUTO_DEPLOY=true` is set)
- ⚠️ Skips deployment if `SKIP_DEPLOY=1` is set

## Usage

### Normal Workflow

Just commit as usual:
```bash
git add .
git commit -m "Your commit message"
# Hook automatically deploys to Vercel (if on main branch)
```

### Skip Deployment for a Commit

If you want to commit without deploying:
```bash
# On Windows PowerShell
$env:SKIP_DEPLOY = "1"
git commit -m "Your commit message"

# On Git Bash / Linux / Mac
SKIP_DEPLOY=1 git commit -m "Your commit message"
```

### Deploy from Other Branches

To enable auto-deployment from branches other than `main`:
```bash
# On Windows PowerShell
$env:AUTO_DEPLOY = "true"
git commit -m "Your commit message"

# On Git Bash / Linux / Mac
AUTO_DEPLOY=true git commit -m "Your commit message"
```

## Manual Deployment

You can always deploy manually:
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Troubleshooting

### Vercel CLI Not Found

If you see "Vercel CLI not found", install it:
```bash
npm install -g vercel
```

### Hook Not Running

1. Verify the hook exists: `.git/hooks/post-commit`
2. Make sure it's executable (on Linux/Mac): `chmod +x .git/hooks/post-commit`
3. Check Git hooks path: `git config core.hooksPath`

### Disable Auto-Deployment

To permanently disable auto-deployment, rename or delete the hook:
```bash
# Rename (keeps backup)
mv .git/hooks/post-commit .git/hooks/post-commit.disabled

# Or delete
rm .git/hooks/post-commit
```

## Notes

- The hook only runs after **successful** commits
- Failed deployments won't prevent your commit from completing
- Deployment happens asynchronously and won't block your workflow
- Make sure you're logged into Vercel: `vercel login`

