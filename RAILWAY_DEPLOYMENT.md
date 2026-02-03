# Deploy Placely to Railway - 3 Methods

## Prerequisites
1. Create a Railway account at https://railway.app
2. Install Railway CLI (optional, for method 3)

---

## Method 1: Deploy from GitHub (Recommended)

### Step 1: Push Your Code to GitHub
```powershell
# Initialize git if not already done
git init

# Create .gitignore
echo "__pycache__/
*.py[cod]
.env
.venv
venv/
*.log" > .gitignore

# Add all files
git add .

# Commit
git commit -m "Initial commit - Placely app"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/placely.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway
1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub
4. Select your `placely` repository
5. Railway will auto-detect it's a Python app
6. Click "Deploy"

### Step 3: Configure Environment Variables
1. In Railway dashboard, click on your deployment
2. Go to "Variables" tab
3. Add these variables:
   - `GOOGLE_CLIENT_ID` = (your Google OAuth client ID)
   - `GOOGLE_CLIENT_SECRET` = (your Google OAuth secret)
   - `OAUTHLIB_INSECURE_TRANSPORT` = `1` (only for testing, remove in production)

### Step 4: Update Google OAuth Redirect URI
1. Go to Google Cloud Console
2. Update your OAuth redirect URIs to include:
   - `https://your-app-name.up.railway.app/callback`
3. Update JavaScript origins to:
   - `https://your-app-name.up.railway.app`

---

## Method 2: Deploy from Local Directory (No GitHub)

### Step 1: Install Railway CLI
```powershell
# Using npm (if you have Node.js)
npm i -g @railway/cli

# Or using scoop
scoop install railway
```

### Step 2: Login and Deploy
```powershell
# Login to Railway
railway login

# Initialize project
railway init

# Link to a new project
railway link

# Deploy
railway up
```

### Step 3: Set Environment Variables
```powershell
railway variables set GOOGLE_CLIENT_ID="your-client-id"
railway variables set GOOGLE_CLIENT_SECRET="your-client-secret"
railway variables set OAUTHLIB_INSECURE_TRANSPORT="1"
```

---

## Method 3: Deploy with Railway Button (One-Click)

### Step 1: Push to GitHub (same as Method 1)

### Step 2: Create Railway Template
Add this badge to your README.md:
```markdown
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/YOUR_USERNAME/placely)
```

---

## Important Post-Deployment Steps

### 1. Update config.py for Production
Replace the OAUTHLIB_INSECURE_TRANSPORT setting in app.py:
```python
# Only allow insecure transport in development
if os.environ.get('RAILWAY_ENVIRONMENT_NAME') != 'production':
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
```

### 2. Update Secret Key
Set a secure secret key as an environment variable:
```powershell
railway variables set SECRET_KEY="your-super-secret-random-string-here"
```

Then update app.py:
```python
app.secret_key = os.environ.get('SECRET_KEY', 'placely-secret-key-2026')
```

### 3. Update OAuth Redirect URLs
Your new redirect URL will be:
- `https://YOUR_APP_NAME.up.railway.app/callback`

Update this in:
- Google Cloud Console OAuth settings
- app.py (update the redirect_uris in client_secrets)

### 4. Custom Domain (Optional)
1. In Railway dashboard, go to "Settings"
2. Click "Generate Domain" or add your custom domain
3. Update all OAuth URLs to use your new domain

---

## Monitoring Your Deployment

### View Logs
```powershell
railway logs
```

### Access Railway Dashboard
- https://railway.app/dashboard
- View metrics, logs, and deployment status

### Get Public URL
```powershell
railway domain
```

---

## Troubleshooting

### Build Fails
- Check Railway logs for errors
- Verify requirements.txt has all dependencies
- Ensure Python version in runtime.txt is supported

### OAuth Errors
- Verify environment variables are set
- Check redirect URIs match exactly
- Ensure domain is added to Google Console

### App Not Starting
- Check Procfile is correct
- Verify gunicorn is in requirements.txt
- Check Railway logs for startup errors

---

## Quick Start (Fastest Method)

```powershell
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Deploy
railway init
railway up

# 4. Set variables
railway variables set GOOGLE_CLIENT_ID="your-id"
railway variables set GOOGLE_CLIENT_SECRET="your-secret"

# 5. Get your URL
railway domain
```

That's it! Your app will be live at the provided URL.
