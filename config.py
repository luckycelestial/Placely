import os

# Google OAuth Configuration
# To get these credentials:
# 1. Go to https://console.cloud.google.com/
# 2. Create a new project or select existing one
# 3. Enable Google+ API
# 4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
# 5. Set Authorized redirect URIs to: http://localhost:5000/callback
# 6. Copy Client ID and Client Secret below

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID_HERE')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', 'YOUR_GOOGLE_CLIENT_SECRET_HERE')

# OAuth 2.0 scope for getting user profile information
GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
