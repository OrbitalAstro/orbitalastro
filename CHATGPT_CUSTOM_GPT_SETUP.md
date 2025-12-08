# ChatGPT Custom GPT Setup Guide - OrbitalAstro API

Complete guide to configure your ChatGPT Custom GPT to interact with the OrbitalAstro API.

## 🔴 Step 1: Fix Vercel Authentication (REQUIRED FIRST)

Your API is currently protected by Vercel Deployment Protection. You MUST fix this first before ChatGPT can access it.

### Option A: Disable Protection (Recommended for Public API)

1. Go to: https://vercel.com/jo-divers-projects/orbitalastro-api/settings
2. Click **"Deployment Protection"** in the left menu
3. **Disable** protection for Production environment
4. Click **"Save"**

### Option B: Use Bypass Token (If you want to keep protection)

1. Go to: https://vercel.com/jo-divers-projects/orbitalastro-api/settings
2. Section **"Deployment Protection"**
3. Create a **Protection Bypass Token**
4. Update the server URL in `openapi.json` to include the token:
   ```
   https://orbitalastro-606wd6ee6-jo-divers-projects.vercel.app?x-vercel-protection-bypass=YOUR_TOKEN
   ```

**Test the API after fixing authentication:**
```powershell
Invoke-WebRequest -Uri "https://orbitalastro-606wd6ee6-jo-divers-projects.vercel.app/planets?date=2024-01-15" -Method GET
```

You should receive JSON, not an authentication page.

---

## 📋 Step 2: Configure Your ChatGPT Custom GPT

### 2.1 Create/Edit Your Custom GPT

1. Go to: https://chat.openai.com/gpts
2. Click **"Create"** or edit your existing GPT
3. Click **"Configure"** tab

### 2.2 Add Basic Information

**Name:** `OrbitalAstro Assistant` (or your preferred name)

**Description:**
```
An astrological assistant that uses the OrbitalAstro API to calculate planetary positions, astrological houses, and aspects using Swiss Ephemeris data.
```

**Instructions:**
```
You are an astrological assistant powered by the OrbitalAstro API. You help users:

1. Calculate planetary positions for any date/time
2. Determine astrological houses for specific locations
3. Analyze aspects between planets
4. Provide comprehensive astrological data using the /all endpoint

When users ask for astrological data:
- Always use the appropriate API endpoint
- For complete charts, prefer the /all endpoint
- Ask for missing required parameters (date, location if needed)
- Explain the results in clear, understandable terms
- Use the date format YYYY-MM-DD and time format HH:MM:SS

Available endpoints:
- /planets - Get planetary positions (requires: date)
- /houses - Get astrological houses (requires: date, latitude, longitude)
- /aspects - Get planetary aspects (requires: date)
- /all - Get all data at once (requires: date, optional: latitude, longitude)

Always be helpful and explain astrological concepts when asked.
```

### 2.3 Add API Action

1. Scroll down to **"Actions"** section
2. Click **"Create new action"**
3. Click **"Import from URL"** or **"Upload"**
4. **Copy the entire contents** of `openapi.json` file
5. **Paste it** into the schema field

**OR** if importing from URL:
- Make sure `openapi.json` is accessible via a public URL
- Enter the URL in the import field

### 2.4 Verify Server URL

Make sure the server URL in the schema points to:
```
https://orbitalastro-606wd6ee6-jo-divers-projects.vercel.app
```

(Remove the localhost server entry if you only want production)

### 2.5 Authentication

- **Authentication Type:** None (your API doesn't require auth tokens)
- If you used a bypass token, you'll need to add it to the URL as a query parameter

---

## 🧪 Step 3: Test Your Custom GPT

### Test Prompts:

1. **Simple planetary positions:**
   ```
   Get the planetary positions for January 15, 2024
   ```

2. **Complete astrological chart:**
   ```
   Calculate a complete astrological chart for January 15, 2024 at 2:30 PM in Paris, France (latitude 48.8566, longitude 2.3522)
   ```

3. **Using the /all endpoint:**
   ```
   Get all astrological data for today in New York (latitude 40.7128, longitude -74.0060)
   ```

4. **Specific planets:**
   ```
   Show me the positions of Sun, Moon, and Venus for my birthday: 1990-05-20
   ```

5. **Aspects:**
   ```
   What aspects are active on December 25, 2024?
   ```

---

## 🔧 Step 4: Troubleshooting

### Issue: "Failed to fetch" or Connection Error

**Solutions:**
1. ✅ Verify Vercel authentication is disabled (Step 1)
2. ✅ Check that the API URL is correct and accessible
3. ✅ Test the API directly with curl/PowerShell
4. ✅ Ensure the OpenAPI schema is valid JSON

### Issue: "Invalid parameters" or "Missing required parameter"

**Solutions:**
1. ✅ Check that date format is YYYY-MM-DD
2. ✅ Verify latitude/longitude are numbers (not strings)
3. ✅ Ensure time format is HH:MM:SS if provided

### Issue: GPT doesn't call the API

**Solutions:**
1. ✅ Verify the OpenAPI schema was imported correctly
2. ✅ Check that operationIds are present in the schema
3. ✅ Make sure the GPT instructions mention using the API
4. ✅ Try more explicit prompts like "Use the API to get..."

---

## 📝 Example API Calls the GPT Will Make

### Example 1: Get Planets
```
GET https://orbitalastro-606wd6ee6-jo-divers-projects.vercel.app/planets?date=2024-01-15&time=14:30:00
```

### Example 2: Get All Data (Your Preferred Endpoint)
```
GET https://orbitalastro-606wd6ee6-jo-divers-projects.vercel.app/all?date=2024-01-15&latitude=48.8566&longitude=2.3522&time=14:30:00
```

### Example 3: Get Houses
```
GET https://orbitalastro-606wd6ee6-jo-divers-projects.vercel.app/houses?date=2024-01-15&latitude=48.8566&longitude=2.3522&system=P
```

### Example 4: Get Aspects
```
GET https://orbitalastro-606wd6ee6-jo-divers-projects.vercel.app/aspects?date=2024-01-15&orb_tolerance=1.5
```

---

## 🎯 Quick Reference: Endpoint Parameters

### `/planets`
- ✅ Required: `date` (YYYY-MM-DD)
- ⚪ Optional: `time` (HH:MM:SS), `planets` (comma-separated list)

### `/houses`
- ✅ Required: `date`, `latitude`, `longitude`
- ⚪ Optional: `time`, `system` (P/K/R/C/E)

### `/aspects`
- ✅ Required: `date`
- ⚪ Optional: `time`, `orb_tolerance`

### `/all` ⭐ (Most Comprehensive)
- ✅ Required: `date`
- ⚪ Optional: `time`, `latitude`, `longitude`, `system`, `orb_tolerance`

---

## ✅ Checklist

Before using your Custom GPT:

- [ ] Vercel authentication is disabled OR bypass token is configured
- [ ] API is accessible and returns JSON (test with curl/PowerShell)
- [ ] OpenAPI schema (`openapi.json`) is copied into GPT Actions
- [ ] Server URL in schema points to production Vercel URL
- [ ] GPT instructions mention using the API
- [ ] Test with a simple prompt like "Get planets for 2024-01-15"

---

## 🚀 You're Ready!

Once all steps are complete, your ChatGPT Custom GPT will be able to:
- ✅ Calculate planetary positions
- ✅ Determine astrological houses
- ✅ Analyze planetary aspects
- ✅ Provide complete astrological charts using `/all` endpoint
- ✅ Answer astrological questions using real Swiss Ephemeris data

Happy astrological computing! 🌟

