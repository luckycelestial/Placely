from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from datetime import datetime
import json
import os
import config

# Try to import Google OAuth libraries, but don't fail if they're missing
try:
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from google_auth_oauthlib.flow import Flow
    GOOGLE_OAUTH_AVAILABLE = True
except ImportError:
    GOOGLE_OAUTH_AVAILABLE = False

app = Flask(__name__, static_folder='client', template_folder='templates')
app.secret_key = os.environ.get('SECRET_KEY', 'placely-secret-key-2026')

# Disable HTTPS requirement for local development only
if os.environ.get('RAILWAY_ENVIRONMENT') != 'production':
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# Google OAuth Setup
GOOGLE_CLIENT_ID = getattr(config, 'GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID_HERE')
GOOGLE_CLIENT_SECRET = getattr(config, 'GOOGLE_CLIENT_SECRET', 'YOUR_GOOGLE_CLIENT_SECRET_HERE')

# Check if Google OAuth is properly configured
GOOGLE_OAUTH_ENABLED = (
    GOOGLE_OAUTH_AVAILABLE and
    GOOGLE_CLIENT_ID != 'YOUR_GOOGLE_CLIENT_ID_HERE' and 
    GOOGLE_CLIENT_SECRET != 'YOUR_GOOGLE_CLIENT_SECRET_HERE'
)

# Determine base URL for OAuth redirect
BASE_URL = os.environ.get('RAILWAY_PUBLIC_DOMAIN', 'localhost:5000')
REDIRECT_URI = f"https://{BASE_URL}/callback" if 'RAILWAY_PUBLIC_DOMAIN' in os.environ else "http://localhost:5000/callback"

# Only create client_secrets if OAuth is available
if GOOGLE_OAUTH_ENABLED:
    client_secrets = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [REDIRECT_URI]
        }
    }
else:
    client_secrets = {}

# Data
students = [
    {"id": 1, "name": "Aarav Kumar", "email": "aarav@college.edu", "codingProblems": 120, "internships": 2, "certifications": 3, "gradePoints": 8.7, "year": 3, "interest": "Placed", "dept": "CSE"},
    {"id": 2, "name": "Sneha Reddy", "email": "sneha@college.edu", "codingProblems": 80, "internships": 1, "certifications": 2, "gradePoints": 9.1, "year": 2, "interest": "Higher Studies", "dept": "IT"},
    {"id": 3, "name": "Rahul Singh", "email": "rahul@college.edu", "codingProblems": 200, "internships": 0, "certifications": 1, "gradePoints": 7.9, "year": 4, "interest": "Placed", "dept": "ECE"},
    {"id": 4, "name": "Priya Sharma", "email": "priya@college.edu", "codingProblems": 150, "internships": 1, "certifications": 4, "gradePoints": 8.3, "year": 3, "interest": "Uninterested", "dept": "CSE"},
    {"id": 5, "name": "Vikram Patel", "email": "vikram@college.edu", "codingProblems": 60, "internships": 2, "certifications": 2, "gradePoints": 8.9, "year": 2, "interest": "Interested", "dept": "ME"}
]

recently_placed = [
    {"name": "Priya Sharma", "package": 18.5, "company": "Google", "position": "Software Engineer", "graduationYear": 2024, "date": "2026-01-25"},
    {"name": "Aarav Kumar", "package": 16.8, "company": "Microsoft", "position": "SDE-2", "graduationYear": 2024, "date": "2026-01-20"},
    {"name": "Sneha Reddy", "package": 15.2, "company": "Amazon", "position": "Associate Engineer", "graduationYear": 2025, "date": "2026-01-18"}
]

upcoming_companies = [
    {"name": "Microsoft", "visitDate": "Feb 5, 2026", "position": "Software Engineer", "salary": "20-24 LPA", "ctc": "22 LPA"},
    {"name": "ServiceNow", "visitDate": "Feb 7, 2026", "position": "Developer", "salary": "18-22 LPA", "ctc": "20 LPA"},
    {"name": "Autodesk", "visitDate": "Feb 9, 2026", "position": "Software Developer", "salary": "19-23 LPA", "ctc": "21 LPA"},
    {"name": "Amazon", "visitDate": "Feb 11, 2026", "position": "SDE I", "salary": "17-21 LPA", "ctc": "19 LPA"},
    {"name": "Commvault Cloud", "visitDate": "Feb 13, 2026", "position": "Engineer", "salary": "16-20 LPA", "ctc": "18 LPA"},
    {"name": "JustPay", "visitDate": "Feb 15, 2026", "position": "Backend Engineer", "salary": "12-16 LPA", "ctc": "14 LPA"},
    {"name": "Wells Fargo", "visitDate": "Feb 17, 2026", "position": "Technology Analyst", "salary": "15-18 LPA", "ctc": "16.5 LPA"},
    {"name": "Global Knowledge", "visitDate": "Feb 19, 2026", "position": "Associate", "salary": "8-10 LPA", "ctc": "9 LPA"},
    {"name": "ThoughtWorks", "visitDate": "Feb 21, 2026", "position": "Developer", "salary": "14-18 LPA", "ctc": "16 LPA"},
    {"name": "Akaike", "visitDate": "Feb 23, 2026", "position": "Software Engineer", "salary": "12-15 LPA", "ctc": "13.5 LPA"},
]

placed_students = [
    {"name": "Priya Sharma", "dept": "CSE", "package": 18.5, "company": "Google", "position": "Software Engineer", "graduationYear": 2024, "date": "2026-01-25", "codingProblems": 150, "internships": 1, "certifications": 4, "gradePoints": 8.3},
    {"name": "Aarav Kumar", "dept": "CSE", "package": 16.8, "company": "Microsoft", "position": "SDE-2", "graduationYear": 2024, "date": "2026-01-20", "codingProblems": 120, "internships": 2, "certifications": 3, "gradePoints": 8.7},
    {"name": "Sneha Reddy", "dept": "IT", "package": 15.2, "company": "Amazon", "position": "Associate Engineer", "graduationYear": 2025, "date": "2026-01-18", "codingProblems": 80, "internships": 1, "certifications": 2, "gradePoints": 9.1},
    {"name": "Rahul Singh", "dept": "ECE", "package": 14.5, "company": "Infosys", "position": "Systems Engineer", "graduationYear": 2024, "date": "2026-01-15", "codingProblems": 200, "internships": 0, "certifications": 1, "gradePoints": 7.9},
    {"name": "Vikram Patel", "dept": "ME", "package": 12.0, "company": "TCS", "position": "Digital Engineer", "graduationYear": 2025, "date": "2026-01-10", "codingProblems": 60, "internships": 2, "certifications": 2, "gradePoints": 8.9}
]

staff_credentials = {"email": "staff@college.edu", "password": "staff123"}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    login_type = data.get('type')
    email = data.get('email')
    password = data.get('password')
    
    if login_type == 'student':
        student = next((s for s in students if s['email'].lower() == email.lower()), None)
        if student:
            session['user'] = student
            session['is_staff'] = False
            return jsonify({'success': True, 'user': student, 'is_staff': False})
        return jsonify({'success': False, 'message': 'Student email not found'})
    else:
        if email == staff_credentials['email'] and password == staff_credentials['password']:
            session['is_staff'] = True
            return jsonify({'success': True, 'is_staff': True})
        return jsonify({'success': False, 'message': 'Invalid staff credentials'})

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/auth/google')
def google_login():
    """Initiate Google OAuth flow"""
    if not GOOGLE_OAUTH_ENABLED:
        return jsonify({'success': False, 'message': 'Google OAuth not configured'}), 400
    
    try:
        flow = Flow.from_client_config(
            client_secrets,
            scopes=['openid', 'https://www.googleapis.com/auth/userinfo.email', 
                    'https://www.googleapis.com/auth/userinfo.profile'],
            redirect_uri=url_for('callback', _external=True)
        )
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        session['state'] = state
        return jsonify({'auth_url': authorization_url})
    except Exception as e:
        return jsonify({'success': False, 'message': f'OAuth error: {str(e)}'}), 400

@app.route('/callback')
def callback():
    """Handle Google OAuth callback"""
    if not GOOGLE_OAUTH_ENABLED:
        return redirect('/?login=error&msg=Google OAuth not configured')
    
    try:
        state = session.get('state')
        flow = Flow.from_client_config(
            client_secrets,
            scopes=['openid', 'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/userinfo.profile'],
            state=state,
            redirect_uri=url_for('callback', _external=True)
        )
        
        # Fetch token using the authorization response
        flow.fetch_token(authorization_response=request.url)
        
        # Get user info from Google
        credentials = flow.credentials
        id_info = id_token.verify_oauth2_token(
            credentials.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        
        email = id_info.get('email')
        name = id_info.get('name')
        picture = id_info.get('picture')
        
        # Check if student exists with this email
        student = next((s for s in students if s['email'].lower() == email.lower()), None)
        
        if student:
            # Update student with Google profile info
            student['google_name'] = name
            student['google_picture'] = picture
            session['user'] = student
            session['is_staff'] = False
            session['google_authenticated'] = True
            return redirect('/?login=success')
        else:
            # Check if it's a college email domain
            if email.endswith('@college.edu'):
                return redirect('/?login=error&msg=Student not registered. Please contact admin.')
            else:
                return redirect('/?login=error&msg=Please use your college email.')
                
    except Exception as e:
        print(f"OAuth error: {str(e)}")
        return redirect('/?login=error&msg=Authentication failed. Please try again.')

@app.route('/api/check-session')
def check_session():
    """Check if user is logged in"""
    if 'user' in session:
        return jsonify({
            'logged_in': True,
            'user': session['user'],
            'is_staff': session.get('is_staff', False),
            'google_auth': session.get('google_authenticated', False)
        })
    return jsonify({'logged_in': False})

@app.route('/api/students')
def get_students():
    return jsonify(students)

@app.route('/api/students/<int:student_id>', methods=['PUT'])
def update_student(student_id):
    data = request.json
    student = next((s for s in students if s['id'] == student_id), None)
    if student:
        student.update(data)
        return jsonify({'success': True, 'student': student})
    return jsonify({'success': False, 'message': 'Student not found'})

@app.route('/api/recently-placed')
def get_recently_placed():
    return jsonify(recently_placed)

@app.route('/api/upcoming-companies')
def get_upcoming_companies():
    return jsonify(upcoming_companies)

@app.route('/api/placed-students')
def get_placed_students():
    return jsonify(placed_students)

@app.route('/api/analytics/year/<int:year>')
def get_year_analytics(year):
    year_students = [s for s in students if s['year'] == year]
    criteria = ['Placed', 'Interested', 'Uninterested', 'Higher Studies']
    counts = {c: sum(1 for s in year_students if s['interest'] == c) for c in criteria}
    return jsonify({'year': year, 'data': counts})

if __name__ == '__main__':
    # Use Railway's PORT environment variable, default to 5000 for local dev
    port = int(os.environ.get('PORT', 5000))
    # Bind to 0.0.0.0 to allow external connections (required for Railway)
    app.run(host='0.0.0.0', port=port, debug=False)
