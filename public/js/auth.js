/**
 * Authentication Module for TaskFlow Pro
 * Handles user registration, login, and session management
 * Uses Backend API with Drizzle ORM database
 */

// API Base URL - dynamically use current host for production, localhost for development
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : `${window.location.protocol}//${window.location.host}/api`;

// ==================== Session Storage ====================
const SessionManager = {
    SESSION_KEY: 'taskManager_sessionToken',
    USER_KEY: 'taskManager_currentUser',

    setSession(sessionToken, user) {
        try {
            localStorage.setItem(this.SESSION_KEY, sessionToken);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            return true;
        } catch (error) {
            console.error('Failed to save session:', error);
            return false;
        }
    },

    getSessionToken() {
        return localStorage.getItem(this.SESSION_KEY);
    },

    getCurrentUser() {
        try {
            const data = localStorage.getItem(this.USER_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to get current user:', error);
            return null;
        }
    },

    clearSession() {
        localStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem(this.USER_KEY);
    }
};

// ==================== Validation Module ====================
const AuthValidation = {
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     */
    validatePassword(password) {
        const errors = [];
        
        if (password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        if (password.length > 100) {
            errors.push('Password cannot exceed 100 characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate username
     * @param {string} username - Username to validate
     * @returns {Object} Validation result
     */
    validateUsername(username) {
        const errors = [];
        
        if (username.length < 3) {
            errors.push('Username must be at least 3 characters');
        }
        if (username.length > 30) {
            errors.push('Username cannot exceed 30 characters');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.push('Username can only contain letters, numbers, and underscores');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate registration data
     * @param {Object} data - Registration data
     * @returns {Object} Validation result
     */
    validateRegistration(data) {
        const errors = [];

        if (!data.username) {
            errors.push('Username is required');
        } else {
            const usernameValidation = this.validateUsername(data.username);
            errors.push(...usernameValidation.errors);
        }

        if (!data.email) {
            errors.push('Email is required');
        } else if (!this.isValidEmail(data.email)) {
            errors.push('Please enter a valid email address');
        }

        if (!data.password) {
            errors.push('Password is required');
        } else {
            const passwordValidation = this.validatePassword(data.password);
            errors.push(...passwordValidation.errors);
        }

        if (data.password !== data.confirmPassword) {
            errors.push('Passwords do not match');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Validate login data
     * @param {Object} data - Login data
     * @returns {Object} Validation result
     */
    validateLogin(data) {
        const errors = [];

        if (!data.email) {
            errors.push('Email is required');
        } else if (!this.isValidEmail(data.email)) {
            errors.push('Please enter a valid email address');
        }

        if (!data.password) {
            errors.push('Password is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// ==================== API Module ====================
const AuthAPI = {
    /**
     * Make API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Object} Response data
     */
    async request(endpoint, options = {}) {
        try {
            const sessionToken = SessionManager.getSessionToken();
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            if (sessionToken) {
                headers['Authorization'] = `Bearer ${sessionToken}`;
            }

            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            return {
                success: false,
                message: 'Network error. Please check your connection.'
            };
        }
    },

    /**
     * Register new user
     * @param {Object} userData - User registration data
     * @returns {Object} Response
     */
    async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Response
     */
    async login(email, password) {
        return await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    /**
     * Logout user
     * @returns {Object} Response
     */
    async logout() {
        const sessionToken = SessionManager.getSessionToken();
        const result = await this.request('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ sessionToken })
        });
        return result;
    },

    /**
     * Get current user
     * @returns {Object} Response
     */
    async getCurrentUser() {
        return await this.request('/auth/me');
    },

    /**
     * Update profile
     * @param {Object} updates - Profile updates
     * @returns {Object} Response
     */
    async updateProfile(updates) {
        return await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },

    /**
     * Delete account
     * @returns {Object} Response
     */
    async deleteAccount() {
        return await this.request('/auth/account', {
            method: 'DELETE'
        });
    }
};

// ==================== Auth Controller ====================
const AuthController = {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Object} Result with success status and message
     */
    async register(userData) {
        // Validate input
        const validation = AuthValidation.validateRegistration(userData);
        if (!validation.isValid) {
            return {
                success: false,
                message: validation.errors.join('. ')
            };
        }

        // Call API
        const result = await AuthAPI.register({
            email: userData.email,
            password: userData.password,
            username: userData.username,
            firstName: userData.username,
            lastName: ''
        });

        if (result.success) {
            // Save session
            SessionManager.setSession(result.sessionToken, result.user);
            
            return {
                success: true,
                message: 'Account created successfully!',
                user: result.user
            };
        }

        return result;
    },

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Result with success status and message
     */
    async login(email, password) {
        // Validate input
        const validation = AuthValidation.validateLogin({ email, password });
        if (!validation.isValid) {
            return {
                success: false,
                message: validation.errors.join('. ')
            };
        }

        // Call API
        const result = await AuthAPI.login(email, password);

        if (result.success) {
            // Save session
            SessionManager.setSession(result.sessionToken, result.user);
            
            return {
                success: true,
                message: 'Login successful!',
                user: result.user
            };
        }

        return result;
    },

    /**
     * Logout current user
     */
    async logout() {
        await AuthAPI.logout();
        SessionManager.clearSession();
        window.location.href = 'login.html';
    },

    /**
     * Check if user is authenticated
     * @returns {boolean} Is authenticated
     */
    isAuthenticated() {
        return SessionManager.getSessionToken() !== null;
    },

    /**
     * Get current user
     * @returns {Object|null} Current user
     */
    getCurrentUser() {
        return SessionManager.getCurrentUser();
    },

    /**
     * Require authentication - redirect to login if not authenticated
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    /**
     * Redirect authenticated users away from auth pages
     */
    redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            window.location.href = 'index.html';
            return true;
        }
        return false;
    },

    /**
     * Verify session with server
     */
    async verifySession() {
        if (!this.isAuthenticated()) {
            return false;
        }

        const result = await AuthAPI.getCurrentUser();
        
        if (!result.success) {
            SessionManager.clearSession();
            return false;
        }

        // Update stored user data
        SessionManager.setSession(
            SessionManager.getSessionToken(),
            result.user
        );

        return true;
    }
};

// ==================== UI Handler ====================
const AuthUI = {
    /**
     * Initialize auth UI
     */
    init() {
        this.cacheElements();
        this.bindEvents();
    },

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            authMessage: document.getElementById('auth-message')
        };
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Login form
        if (this.elements.loginForm) {
            // Redirect if already logged in
            AuthController.redirectIfAuthenticated();
            
            this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        if (this.elements.registerForm) {
            // Redirect if already logged in
            AuthController.redirectIfAuthenticated();
            
            this.elements.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    },

    /**
     * Handle login form submission
     * @param {Event} e - Submit event
     */
    async handleLogin(e) {
        e.preventDefault();
        this.clearMessage();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const result = await AuthController.login(email, password);

        if (result.success) {
            this.showMessage(result.message, 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            this.showMessage(result.message, 'error');
        }
    },

    /**
     * Handle register form submission
     * @param {Event} e - Submit event
     */
    async handleRegister(e) {
        e.preventDefault();
        this.clearMessage();

        const userData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirm-password').value
        };

        const result = await AuthController.register(userData);

        if (result.success) {
            this.showMessage(result.message, 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            this.showMessage(result.message, 'error');
        }
    },

    /**
     * Show message
     * @param {string} message - Message text
     * @param {string} type - Message type (success/error)
     */
    showMessage(message, type) {
        if (!this.elements.authMessage) return;

        this.elements.authMessage.textContent = message;
        this.elements.authMessage.className = `auth-message ${type}`;
        this.elements.authMessage.style.display = 'block';
    },

    /**
     * Clear message
     */
    clearMessage() {
        if (!this.elements.authMessage) return;

        this.elements.authMessage.textContent = '';
        this.elements.authMessage.style.display = 'none';
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    AuthUI.init();
});
