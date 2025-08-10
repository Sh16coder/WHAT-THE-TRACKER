// Main App Initialization
function initApp(user) {
    // Set default tab to dashboard
    document.querySelector('.nav-link[data-section="dashboard"]').click();
    
    // Load user data
    database.ref(`users/${user.uid}`).once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                // You can display user info if needed
                // const userData = snapshot.val();
            }
        });
    
    // Initialize analytics
    updateAnalytics();
    
    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}
