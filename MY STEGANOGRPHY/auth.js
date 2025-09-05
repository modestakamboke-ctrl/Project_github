// Simple authentication system using localStorage
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const logoutBtn = document.getElementById('logout-btn');
    const errorMessage = document.getElementById('error-message');
    const regErrorMessage = document.getElementById('reg-error-message');

    // Check if user is already logged in
    if (localStorage.getItem('loggedInUser')) {
        loginContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
    }

    // Toggle between login and register forms
    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.login-form').classList.add('hidden');
        document.querySelector('.register-form').classList.remove('hidden');
    });

    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.register-form').classList.add('hidden');
        document.querySelector('.login-form').classList.remove('hidden');
    });

    // Login functionality
    loginBtn.addEventListener('click', function() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            errorMessage.textContent = 'Please enter both username and password';
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            localStorage.setItem('loggedInUser', JSON.stringify(user));
            loginContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            errorMessage.textContent = '';
        } else {
            errorMessage.textContent = 'Invalid username or password';
        }
    });

    // Register functionality
    registerBtn.addEventListener('click', function() {
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!username || !password || !confirmPassword) {
            regErrorMessage.textContent = 'Please fill in all fields';
            return;
        }

        if (password !== confirmPassword) {
            regErrorMessage.textContent = 'Passwords do not match';
            return;
        }

        if (password.length < 6) {
            regErrorMessage.textContent = 'Password must be at least 6 characters';
            return;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (users.some(u => u.username === username)) {
            regErrorMessage.textContent = 'Username already exists';
            return;
        }

        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));
        regErrorMessage.textContent = '';
        
        // Switch to login form after successful registration
        document.querySelector('.register-form').classList.add('hidden');
        document.querySelector('.login-form').classList.remove('hidden');
        document.getElementById('username').value = username;
        document.getElementById('password').value = '';
    });

    // Logout functionality
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('loggedInUser');
        appContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        document.querySelector('.login-form').classList.remove('hidden');
        document.querySelector('.register-form').classList.add('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    });
});