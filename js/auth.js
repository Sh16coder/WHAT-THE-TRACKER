// Authentication Functions
document.addEventListener('DOMContentLoaded', function() {
    // Toggle between login and signup forms
    document.getElementById('show-signup').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
    });
    
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    });
    
    // Login
    document.getElementById('login-btn').addEventListener('click', login);
    
    // Signup
    document.getElementById('signup-btn').addEventListener('click', signup);
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Check auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            document.getElementById('auth-section').style.display = 'none';
            document.getElementById('app-section').style.display = 'block';
            
            // Initialize the app
            initApp(user);
        } else {
            // User is signed out
            document.getElementById('auth-section').style.display = 'flex';
            document.getElementById('app-section').style.display = 'none';
        }
    });
});

function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            // Login successful
        })
        .catch(error => {
            alert(error.message);
        });
}

function signup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Add user to Realtime Database
            return database.ref('users/' + userCredential.user.uid).set({
                name: name,
                email: email,
                createdAt: new Date().toISOString()
            });
        })
        .then(() => {
            // Signup successful
        })
        .catch(error => {
            alert(error.message);
        });
}

function logout() {
    auth.signOut()
        .then(() => {
            // Logout successful
        })
        .catch(error => {
            alert(error.message);
        });
}
