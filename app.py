from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import random
from datetime import datetime, timedelta
import hashlib

app = Flask(__name__)
app.secret_key = 'smart_voting_system_secret_key_2023'
CORS(app)

# Simple data storage
users_db = {}
votes_db = {
    'candidates': {
        1: {'name': 'John Anderson', 'party': 'Progressive Alliance Party', 'votes': 0},
        2: {'name': 'Sarah Johnson', 'party': 'National Unity Party', 'votes': 0},
        3: {'name': 'Michael Chen', 'party': 'Green Future Party', 'votes': 0}
    },
    'total_votes': 0,
    'fraudulent_votes': 0
}

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def initialize_demo_data():
    # Admin user
    users_db['admin@smartvote.com'] = {
        'name': 'Administrator',
        'password': hash_password('admin123'),
        'is_admin': True,
        'voted': False
    }
    
    # Demo voter
    users_db['voter1@example.com'] = {
        'name': 'Alice Johnson',
        'password': hash_password('password123'),
        'is_admin': False,
        'voted': False
    }
    
    # Add some demo votes for realistic stats
    for _ in range(50):
        candidate_id = random.randint(1, 3)
        votes_db['candidates'][candidate_id]['votes'] += 1
        votes_db['total_votes'] += 1

def simple_fraud_detection(voting_duration):
    """Simple rule-based fraud detection (no ML required)"""
    # Very fast voting (< 3 seconds) - suspicious
    if voting_duration < 3:
        return True
    
    # Random chance of fraud for demo (5%)
    if random.random() < 0.05:
        return True
    
    return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if email in users_db and users_db[email]['password'] == hash_password(password):
        session['user'] = {
            'email': email,
            'name': users_db[email]['name'],
            'is_admin': users_db[email]['is_admin'],
            'voted': users_db[email]['voted']
        }
        return jsonify({'success': True, 'user': session['user']})
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if email in users_db:
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
    
    users_db[email] = {
        'name': name,
        'password': hash_password(password),
        'is_admin': False,
        'voted': False
    }
    
    session['user'] = {
        'email': email,
        'name': name,
        'is_admin': False,
        'voted': False
    }
    
    return jsonify({'success': True, 'user': session['user']})

@app.route('/api/vote', methods=['POST'])
def vote():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_email = session['user']['email']
    
    if users_db[user_email]['voted']:
        return jsonify({'success': False, 'message': 'You have already voted'}), 400
    
    data = request.json
    candidate_id = data.get('candidate_id')
    voting_duration = data.get('voting_duration', 0)
    
    if candidate_id not in votes_db['candidates']:
        return jsonify({'success': False, 'message': 'Invalid candidate'}), 400
    
    # Simple fraud detection
    is_fraudulent = simple_fraud_detection(voting_duration)
    
    if is_fraudulent:
        votes_db['fraudulent_votes'] += 1
        return jsonify({
            'success': False,
            'message': 'Suspicious voting activity detected by our security system!',
            'fraud_detected': True
        }), 400
    
    # Record the vote
    votes_db['candidates'][candidate_id]['votes'] += 1
    votes_db['total_votes'] += 1
    users_db[user_email]['voted'] = True
    session['user']['voted'] = True
    
    return jsonify({
        'success': True,
        'message': 'Vote recorded successfully!',
        'fraud_detected': False
    })

@app.route('/api/results')
def get_results():
    return jsonify(votes_db['candidates'])

@app.route('/api/stats')
def get_stats():
    total_votes = votes_db['total_votes']
    fraudulent_votes = votes_db['fraudulent_votes']
    voter_turnout = min(100, round((total_votes / 1000) * 100))  # Assuming 1000 voters
    
    return jsonify({
        'total_votes': total_votes,
        'fraudulent_votes': fraudulent_votes,
        'voter_turnout': voter_turnout,
        'avg_voting_time': 6.7  # Fixed demo value
    })

@app.route('/api/user-status')
def user_status():
    if 'user' in session:
        return jsonify({'user': session['user']})
    return jsonify({'user': None})

@app.route('/api/logout')
def logout():
    session.pop('user', None)
    return jsonify({'success': True})

if __name__ == '__main__':
    print("🚀 Starting Smart Voting System (Lightweight Version)...")
    initialize_demo_data()
    print("✅ System initialized successfully!")
    print("📊 Demo data loaded")
    print("🔒 Fraud detection: Rule-based (Active)")
    print("🌐 Server starting on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)