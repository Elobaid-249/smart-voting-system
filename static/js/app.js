// API Base URL
const API_BASE = window.location.origin + '/api';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const voteNowBtn = document.getElementById('voteNowBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeModalButtons = document.querySelectorAll('.close-modal');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const votingDashboard = document.getElementById('votingDashboard');
const adminPanel = document.getElementById('adminPanel');
const voteAlert = document.getElementById('voteAlert');
const voteButtons = document.querySelectorAll('.vote-btn');

// Stats elements
const totalVotesEl = document.getElementById('totalVotes');
const fraudAlertsEl = document.getElementById('fraudAlerts');
const voterTurnoutEl = document.getElementById('voterTurnout');
const avgVotingTimeEl = document.getElementById('avgVotingTime');

// Application State
let currentUser = null;
let voteStartTime = null;
let charts = {};

//
// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Smart Voting System Initializing...');
    checkUserStatus();
    setupEventListeners();
    initializeDemoData();
});

function setupEventListeners() {
    // Authentication buttons
    if (loginBtn) loginBtn.addEventListener('click', () => showModal(loginModal));
    if (registerBtn) registerBtn.addEventListener('click', () => showModal(registerModal));
    if (voteNowBtn) voteNowBtn.addEventListener('click', handleVoteNow);
    
    // Modal controls
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Form switches
    if (switchToRegister) switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        switchToRegisterModal();
    });
    
    if (switchToLogin) switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchToLoginModal();
    });
    
    // Form submissions
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    
    // Voting buttons
    voteButtons.forEach(button => {
        button.addEventListener('click', handleVote);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) hideModal(loginModal);
        if (e.target === registerModal) hideModal(registerModal);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });
}

function initializeDemoData() {
    // Initialize with some demo stats
    updateAdminStats();
}

// Authentication Functions
async function checkUserStatus() {
    try {
        const response = await fetch(`${API_BASE}/user-status`);
        const data = await response.json();
        
        if (data.user) {
            currentUser = data.user;
            updateUIForUser();
            showAlert(`Welcome back, ${currentUser.name}!`, 'success');
        }
    } catch (error) {
        console.error('Error checking user status:', error);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            hideModal(loginModal);
            updateUIForUser();
            showAlert(`Welcome back, ${currentUser.name}!`, 'success');
            
            // Clear form
            loginForm.reset();
        } else {
            showAlert(data.message || 'Login failed. Please check your credentials.', 'danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please try again.', 'danger');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            hideModal(registerModal);
            updateUIForUser();
            showAlert('Registration successful! You can now vote.', 'success');
            
            // Clear form
            registerForm.reset();
        } else {
            showAlert(data.message || 'Registration failed', 'danger');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Network error. Please try again.', 'danger');
    }
}

async function handleLogout() {
    try {
        const response = await fetch(`${API_BASE}/logout`);
        if (response.ok) {
            currentUser = null;
            updateUIForUser();
            showHomepage();
            showAlert('Logged out successfully', 'info');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Error during logout', 'danger');
    }
}

// Voting Functions
function handleVoteNow() {
    if (currentUser) {
        if (currentUser.voted) {
            showAlert('You have already voted! Thank you for participating.', 'warning');
            showResults();
        } else {
            showVotingDashboard();
        }
    } else {
        showModal(loginModal);
    }
}

function handleVote(e) {
    if (!currentUser) {
        showAlert('Please login to vote', 'danger');
        showModal(loginModal);
        return;
    }
    
    if (currentUser.voted) {
        showAlert('You have already voted!', 'warning');
        return;
    }
    
    const candidateId = e.target.getAttribute('data-candidate');
    const candidateName = e.target.closest('.candidate-card').querySelector('h3').textContent;
    const votingDuration = voteStartTime ? (Date.now() - voteStartTime) / 1000 : 5;
    
    // Confirm vote
    if (confirm(`Are you sure you want to vote for ${candidateName}? This action cannot be undone.`)) {
        castVote(candidateId, votingDuration);
    }
}

async function castVote(candidateId, votingDuration) {
    try {
        showAlert('Processing your vote...', 'info');
        
        const response = await fetch(`${API_BASE}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidate_id: parseInt(candidateId),
                voting_duration: votingDuration
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('✅ Your vote has been recorded successfully! Thank you for participating.', 'success');
            currentUser.voted = true;
            updateUIForUser();
            
            // Disable voting buttons and update UI
            voteButtons.forEach(btn => {
                btn.disabled = true;
                btn.textContent = 'Vote Cast';
                btn.style.backgroundColor = '#95a5a6';
            });
            
            // Update stats
            updateAdminStats();
            
            // Show results after voting
            setTimeout(() => {
                showResults();
            }, 3000);
            
        } else {
            if (data.fraud_detected) {
                showAlert('🚨 Suspicious voting activity detected. Your vote has been flagged for review by our AI system.', 'danger');
            } else {
                showAlert(data.message || 'Voting failed. Please try again.', 'danger');
            }
        }
    } catch (error) {
        console.error('Voting error:', error);
        showAlert('Network error. Please check your connection and try again.', 'danger');
    }
}

// UI Management Functions
function updateUIForUser() {
    const authButtons = document.querySelector('.auth-buttons');
    
    if (!authButtons) return;
    
    if (currentUser) {
        authButtons.innerHTML = `
            <span class="user-welcome">Welcome, ${currentUser.name}</span>
            ${currentUser.is_admin ? '<button id="adminBtn" class="admin-btn">Admin Panel</button>' : ''}
            <button id="logoutBtn" class="logout-btn">Logout</button>
        `;
        
        // Add event listeners for new buttons
        const adminBtn = document.getElementById('adminBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (adminBtn) {
            adminBtn.addEventListener('click', showAdminPanel);
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Update vote button text
        if (voteNowBtn) {
            if (currentUser.voted) {
                voteNowBtn.textContent = 'View Results';
                voteNowBtn.removeEventListener('click', handleVoteNow);
                voteNowBtn.addEventListener('click', showResults);
            } else {
                voteNowBtn.textContent = 'Vote Now';
                voteNowBtn.removeEventListener('click', showResults);
                voteNowBtn.addEventListener('click', handleVoteNow);
            }
        }
    } else {
        authButtons.innerHTML = `
            <button id="loginBtn" class="login-btn">Login</button>
            <button id="registerBtn" class="register-btn">Register</button>
        `;
        
        // Re-add event listeners
        document.getElementById('loginBtn').addEventListener('click', () => showModal(loginModal));
        document.getElementById('registerBtn').addEventListener('click', () => showModal(registerModal));
        
        if (voteNowBtn) {
            voteNowBtn.textContent = 'Vote Now';
            voteNowBtn.removeEventListener('click', showResults);
            voteNowBtn.addEventListener('click', handleVoteNow);
        }
    }
}

// Page Navigation Functions
function showHomepage() {
    document.querySelector('.hero').style.display = 'block';
    document.querySelector('.features').style.display = 'block';
    document.querySelector('.how-it-works').style.display = 'block';
    if (votingDashboard) votingDashboard.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'none';
}

function showVotingDashboard() {
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.features').style.display = 'none';
    document.querySelector('.how-it-works').style.display = 'none';
    if (votingDashboard) votingDashboard.style.display = 'block';
    if (adminPanel) adminPanel.style.display = 'none';
    
    // Start voting timer
    voteStartTime = Date.now();
    
    // Enable voting buttons if user hasn't voted
    if (currentUser && !currentUser.voted) {
        voteButtons.forEach(btn => {
            btn.disabled = false;
            btn.textContent = 'Vote Now';
            btn.style.backgroundColor = '';
        });
    }
    
    // Load current results
    loadResults();
}

function showAdminPanel() {
    if (!currentUser || !currentUser.is_admin) {
        showAlert('Access denied. Admin privileges required.', 'danger');
        return;
    }
    
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.features').style.display = 'none';
    document.querySelector('.how-it-works').style.display = 'none';
    if (votingDashboard) votingDashboard.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    
    // Initialize admin dashboard
    initializeAdminDashboard();
}

function showResults() {
    showVotingDashboard();
    showAlert('Election results are displayed below. Thank you for voting!', 'info');
    loadResults();
}

async function loadResults() {
    try {
        const response = await fetch(`${API_BASE}/results`);
        const results = await response.json();
        
        // Update candidate cards with vote counts
        Object.keys(results).forEach(candidateId => {
            const candidate = results[candidateId];
            const candidateElement = document.querySelector(`[data-candidate="${candidateId}"]`);
            if (candidateElement) {
                const card = candidateElement.closest('.candidate-card');
                const voteCountElement = card.querySelector('.vote-count') || createVoteCountElement(card);
                voteCountElement.textContent = `${candidate.votes} votes`;
            }
        });
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

function createVoteCountElement(card) {
    const voteCountElement = document.createElement('div');
    voteCountElement.className = 'vote-count';
    voteCountElement.style.cssText = `
        font-size: 1.2rem;
        font-weight: bold;
        color: #2c3e50;
        margin-top: 1rem;
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 8px;
    `;
    card.appendChild(voteCountElement);
    return voteCountElement;
}

// Admin Dashboard Functions
async function initializeAdminDashboard() {
    await updateAdminStats();
    initializeCharts();
    startRealTimeUpdates();
}

async function updateAdminStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const stats = await response.json();
        
        if (totalVotesEl) totalVotesEl.textContent = stats.total_votes.toLocaleString();
        if (fraudAlertsEl) fraudAlertsEl.textContent = stats.fraudulent_votes.toLocaleString();
        if (voterTurnoutEl) voterTurnoutEl.textContent = `${stats.voter_turnout}%`;
        if (avgVotingTimeEl) avgVotingTimeEl.textContent = `${stats.avg_voting_time}s`;
        
        // Update charts if they exist
        if (charts.voteChart) {
            updateVoteChart();
        }
        if (charts.fraudChart) {
            updateFraudChart();
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

function initializeCharts() {
    // Vote Distribution Chart
    const voteCtx = document.getElementById('voteChart');
    if (voteCtx) {
        charts.voteChart = new Chart(voteCtx, {
            type: 'bar',
            data: {
                labels: ['John Anderson', 'Sarah Johnson', 'Michael Chen'],
                datasets: [{
                    label: 'Votes',
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(155, 89, 182, 0.8)'
                    ],
                    borderColor: [
                        'rgba(52, 152, 219, 1)',
                        'rgba(46, 204, 113, 1)',
                        'rgba(155, 89, 182, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Vote Distribution by Candidate',
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Fraud Detection Chart
    const fraudCtx = document.getElementById('fraudChart');
    if (fraudCtx) {
        charts.fraudChart = new Chart(fraudCtx, {
            type: 'doughnut',
            data: {
                labels: ['Legitimate Votes', 'Flagged Votes'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.8)',
                        'rgba(231, 76, 60, 0.8)'
                    ],
                    borderColor: [
                        'rgba(46, 204, 113, 1)',
                        'rgba(231, 76, 60, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Fraud Detection Analysis',
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
    }
    
    // Update charts with initial data
    updateCharts();
}

async function updateCharts() {
    try {
        const patternsResponse = await fetch(`${API_BASE}/voting-patterns`);
        const patterns = await patternsResponse.json();
        
        // Update vote distribution chart
        if (charts.voteChart) {
            const votes = [
                patterns.candidate_distribution[1] || 0,
                patterns.candidate_distribution[2] || 0,
                patterns.candidate_distribution[3] || 0
            ];
            charts.voteChart.data.datasets[0].data = votes;
            charts.voteChart.update();
        }
        
        // Update fraud detection chart
        if (charts.fraudChart) {
            const totalLegitimate = Object.values(patterns.candidate_distribution).reduce((a, b) => a + b, 0);
            const totalFraud = patterns.fraud_by_hour ? Object.values(patterns.fraud_by_hour).reduce((a, b) => a + b, 0) : 0;
            
            charts.fraudChart.data.datasets[0].data = [totalLegitimate, totalFraud];
            charts.fraudChart.update();
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

function startRealTimeUpdates() {
    // Update stats every 10 seconds
    setInterval(updateAdminStats, 10000);
}

// Modal Functions
function showModal(modal) {
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function closeAllModals() {
    hideModal(loginModal);
    hideModal(registerModal);
}

function switchToRegisterModal() {
    hideModal(loginModal);
    showModal(registerModal);
}

function switchToLoginModal() {
    hideModal(registerModal);
    showModal(loginModal);
}

// Utility Functions
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Add to page
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Export functions for global access (if needed)
window.smartVotingSystem = {
    showAlert,
    updateAdminStats,
    showAdminPanel,
    showVotingDashboard
};

console.log('✅ Smart Voting System Frontend Loaded Successfully!');