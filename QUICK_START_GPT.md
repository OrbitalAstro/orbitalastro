# 🚀 Quick Start: ChatGPT Custom GPT Setup

## ⚡ 3-Step Setup

### Step 1: Fix Vercel Auth (2 minutes)
1. Go to: https://vercel.com/jo-divers-projects/orbitalastro-api/settings
2. Click **"Deployment Protection"**
3. **Disable** for Production
4. **Save**

### Step 2: Copy OpenAPI Schema (1 minute)
1. Open `openapi.json` file
2. Copy **ALL** contents (Ctrl+A, Ctrl+C)

### Step 3: Configure GPT (3 minutes)
1. Go to: https://chat.openai.com/gpts
2. Click **"Create"** → **"Configure"**
3. **Name:** `OrbitalAstro Assistant`
4. **Instructions:** Copy from `CHATGPT_CUSTOM_GPT_SETUP.md` (Step 2.2)
5. **Actions** → **"Create new action"**
6. **Paste** the OpenAPI schema
7. **Save**

## ✅ Test It!

Try: `"Get all astrological data for January 15, 2024 in Paris"`

The GPT should call `/all` endpoint automatically!

---

**Full guide:** See `CHATGPT_CUSTOM_GPT_SETUP.md` for detailed instructions.

