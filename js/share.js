// Share functionality
document.addEventListener('DOMContentLoaded', function() {
  const shareBtn = document.getElementById('share-btn');
  const sharePanel = document.getElementById('share-panel');
  const shareLink = document.getElementById('share-link');
  const copyBtn = document.getElementById('copy-link');
  const twitterShare = document.getElementById('share-twitter');
  const facebookShare = document.getElementById('share-facebook');
  const whatsappShare = document.getElementById('share-whatsapp');
  
  let shareId = null;
  
  // Toggle share panel
  shareBtn.addEventListener('click', function() {
    sharePanel.style.display = sharePanel.style.display === 'none' ? 'block' : 'none';
    
    // Generate share link if not already done
    if (!shareId) {
      generateShareLink();
    }
  });
  
  // Copy link to clipboard
  copyBtn.addEventListener('click', function() {
    shareLink.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
  });
  
  // Social sharing
  twitterShare.addEventListener('click', function(e) {
    e.preventDefault();
    const text = `Check out my study progress! ${shareLink.value}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  });
  
  facebookShare.addEventListener('click', function(e) {
    e.preventDefault();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink.value)}`, '_blank');
  });
  
  whatsappShare.addEventListener('click', function(e) {
    e.preventDefault();
    const text = `Check out my study progress! ${shareLink.value}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  });
  
  // Check if this is a shared view
  checkSharedView();
});

function generateShareLink() {
  const user = auth.currentUser;
  if (!user) return;
  
  // Check if user already has a share ID
  database.ref(`users/${user.uid}/shareId`).once('value')
    .then(snapshot => {
      if (snapshot.exists()) {
        shareId = snapshot.val();
        updateShareLink();
      } else {
        // Create new share ID
        shareId = generateShareId();
        database.ref(`users/${user.uid}`).update({ shareId: shareId })
          .then(() => {
            updateShareLink();
          });
      }
    });
}

function updateShareLink() {
  const shareLink = document.getElementById('share-link');
  const currentUrl = window.location.href.split('?')[0];
  shareLink.value = `${currentUrl}?share=${shareId}`;
}

function checkSharedView() {
  const urlParams = new URLSearchParams(window.location.search);
  const shareId = urlParams.get('share');
  
  if (shareId) {
    // This is a shared view
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    document.getElementById('public-profile').style.display = 'block';
    
    // Hide private UI elements
    document.querySelector('header').style.display = 'none';
    document.querySelector('nav').style.display = 'none';
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    
    // Load shared data
    loadSharedData(shareId);
  }
}

function loadSharedData(shareId) {
  // Find user with this share ID
  database.ref('users').orderByChild('shareId').equalTo(shareId).once('value')
    .then(snapshot => {
      if (snapshot.exists()) {
        const userData = Object.values(snapshot.val())[0];
        const userId = Object.keys(snapshot.val())[0];
        
        // Load public stats
        loadPublicStats(userId);
      } else {
        document.getElementById('public-profile').innerHTML = '<p>Invalid share link</p>';
      }
    });
}

function loadPublicStats(userId) {
  // Get all sessions for this user
  database.ref('sessions').orderByChild('userId').equalTo(userId).once('value')
    .then(snapshot => {
      if (snapshot.exists()) {
        const sessions = snapshot.val();
        const sessionCount = Object.keys(sessions).length;
        let totalSeconds = 0;
        
        // Calculate total time
        Object.values(sessions).forEach(session => {
          totalSeconds += session.duration || 0;
        });
        
        // Update UI
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        document.getElementById('public-total-time').textContent = `${hours}h ${minutes}m`;
        document.getElementById('public-session-count').textContent = sessionCount;
        
        // Create chart
        createPublicChart(sessions);
      } else {
        document.getElementById('public-total-time').textContent = '0h 0m';
        document.getElementById('public-session-count').textContent = '0';
      }
    });
}

function createPublicChart(sessions) {
  const timeData = {};
  
  // Group by month
  Object.values(sessions).forEach(session => {
    if (session.endTime) {
      const date = new Date(session.endTime);
      const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!timeData[month]) {
        timeData[month] = 0;
      }
      timeData[month] += (session.duration || 0) / 60; // Convert to minutes
    }
  });
  
  // Sort by date
  const sortedMonths = Object.keys(timeData).sort((a, b) => {
    return new Date(a) - new Date(b);
  });
  
  const timeValues = sortedMonths.map(month => timeData[month]);
  
  // Create chart
  const timeCtx = document.getElementById('public-time-chart').getContext('2d');
  new Chart(timeCtx, {
    type: 'bar',
    data: {
      labels: sortedMonths,
      datasets: [{
        label: 'Study Time (minutes)',
        data: timeValues,
        backgroundColor: 'rgba(74, 111, 165, 0.7)',
        borderColor: 'rgba(74, 111, 165, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
                                }
