document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const googleLoginBtn = document.getElementById('google-login');
    const facebookLoginBtn = document.getElementById('facebook-login');

    // Email/password login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = loginForm['email'].value;
        const password = loginForm['password'].value;
        const role = loginForm['role'].value;

        // Basic validation
        if (!role) {
            showError('Please select your role');
            return;
        }

        try {
            // Firebase authentication
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            console.log('User logged in:', user);

            // Redirect based on role
            if (role === 'admin') {
                window.location.href = '/admin-dashboard.html';  // Redirect to admin dashboard
            } else {
                window.location.href = '/dashboard.html';  // Redirect to student dashboard
            }
        } catch (error) {
            console.error('Login error:', error);
            showError(getUserFriendlyError(error.code));
        }
    });

    // Google login
    googleLoginBtn.addEventListener('click', async () => {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            console.log('Google login success:', result.user);
            
            // For social logins, you might want to check the role in your database
            // For now, redirecting to student dashboard
            window.location.href = '/dashboard.html';
        } catch (error) {
            console.error('Google login error:', error);
            showError(getUserFriendlyError(error.code));
        }
    });

    // Facebook login
    facebookLoginBtn.addEventListener('click', async () => {
        try {
            const provider = new firebase.auth.FacebookAuthProvider();
            const result = await auth.signInWithPopup(provider);
            console.log('Facebook login success:', result.user);
            
            // For social logins, you might want to check the role in your database
            // For now, redirecting to student dashboard
            window.location.href = '/dashboard.html';
        } catch (error) {
            console.error('Facebook login error:', error);
            showError(getUserFriendlyError(error.code));
        }
    });

    function showError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 5000);
    }

    function getUserFriendlyError(errorCode) {
        switch (errorCode) {
            case 'auth/invalid-email': return 'Invalid email address.';
            case 'auth/user-disabled': return 'This account has been disabled.';
            case 'auth/user-not-found': return 'No account found with this email.';
            case 'auth/wrong-password': return 'Incorrect password.';
            case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
            case 'auth/account-exists-with-different-credential': return 'Account exists with different sign-in method.';
            case 'auth/popup-closed-by-user': return 'Sign-in popup was closed.';
            default: return 'Login failed. Please try again.';
        }
    }
});