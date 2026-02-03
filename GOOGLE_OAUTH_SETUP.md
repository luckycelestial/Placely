# Google OAuth Setup Instructions

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Name your project (e.g., "Placely Login")
5. Click "Create"

## Step 2: Enable Required APIs

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Search for "People API" and enable it

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" (or "Internal" if you have a Google Workspace)
   - Fill in the required fields:
     - App name: Placely
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Skip the "Scopes" section (click "Save and Continue")
   - Add test users if needed (add your college email)
   - Click "Save and Continue"

4. After configuring the consent screen:
   - Choose "Web application" as the application type
   - Name: "Placely Web Client"
   - Add Authorized JavaScript origins:
     - `http://localhost:5000`
   - Add Authorized redirect URIs:
     - `http://localhost:5000/callback`
   - Click "Create"

## Step 4: Configure Credentials in Your App

1. You'll see a popup with your Client ID and Client Secret
2. Copy these values
3. Open `config.py` in your project
4. Replace the placeholder values:
   ```python
   GOOGLE_CLIENT_ID = 'your-actual-client-id-here.apps.googleusercontent.com'
   GOOGLE_CLIENT_SECRET = 'your-actual-client-secret-here'
   ```

## Step 5: (Optional) Use Environment Variables

For better security, you can set environment variables instead:

**Windows PowerShell:**
```powershell
$env:GOOGLE_CLIENT_ID = "your-client-id-here"
$env:GOOGLE_CLIENT_SECRET = "your-client-secret-here"
```

**Windows Command Prompt:**
```cmd
set GOOGLE_CLIENT_ID=your-client-id-here
set GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## Step 6: Test the Integration

1. Restart your Flask app
2. Go to http://localhost:5000
3. Click "Sign in with Google"
4. Select your college email account
5. Grant permissions
6. You should be logged in!

## Important Notes

- The Google OAuth consent screen may show "This app isn't verified" - this is normal for development
- Click "Advanced" > "Go to Placely (unsafe)" to proceed during testing
- Only emails ending with `@college.edu` will be allowed to log in (as configured in the callback)
- To allow other email domains, modify the check in `app.py` line with `email.endswith('@college.edu')`

## Troubleshooting

### "redirect_uri_mismatch" error
- Make sure `http://localhost:5000/callback` is exactly in your authorized redirect URIs
- Check that you're accessing the app via `localhost` not `127.0.0.1`

### "invalid_client" error
- Double-check your Client ID and Client Secret in config.py
- Make sure there are no extra spaces or quotes

### Email not found error
- The email must match one of the student emails in the `students` list in `app.py`
- Add your test email to the students list for testing
