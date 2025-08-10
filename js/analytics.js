// Analytics Functions
let timeChart;
let subjectChart;

function updateAnalytics() {
    updateStats();
    updateRecentSessions();
    updateCharts();
    updateSessionHistory();
}

function updateStats() {
    const user = auth.currentUser;
    if (!user) return;
    
    database.ref('sessions')
        .orderByChild('userId')
        .equalTo(user.uid)
        .once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                const sessions = snapshot.val();
                let todaySeconds = 0;
                let weekSeconds = 0;
                let totalSeconds = 0;
                
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                weekStart.setHours(0, 0, 0, 0);
                
                Object.values(sessions).forEach(session => {
                    if (session.endTime) {
                        const sessionDate = new Date(session.endTime);
                        const sessionSeconds = session.duration || 0;
                        
                        // Today
                        if (sessionDate >= todayStart) {
                            todaySeconds += sessionSeconds;
                        }
                        
                        // This week
                        if (sessionDate >= weekStart) {
                            weekSeconds += sessionSeconds;
                        }
                        
                        // Total
                        totalSeconds += sessionSeconds;
                    }
                });
                
                // Update UI
                document.getElementById('today-time').textContent = formatTime(todaySeconds);
                document.getElementById('week-time').textContent = formatTime(weekSeconds);
                document.getElementById('total-time').textContent = formatTime(totalSeconds);
            }
        });
}

function updateRecentSessions() {
    const user = auth.currentUser;
    if (!user) return;
    
    const sessionsList = document.getElementById('recent-sessions-list');
    sessionsList.innerHTML = '';
    
    database.ref('sessions')
        .orderByChild('userId')
        .equalTo(user.uid)
        .limitToLast(5)
        .once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                const sessions = snapshot.val();
                const sortedSessions = Object.values(sessions).sort((a, b) => {
                    return new Date(b.endTime) - new Date(a.endTime);
                });
                
                sortedSessions.forEach(session => {
                    const duration = formatDuration(session.duration);
                    const date = new Date(session.endTime).toLocaleDateString();
                    
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${date}</span>
                        <span>${duration}</span>
                        <span>${session.subject || 'No subject'}</span>
                    `;
                    
                    sessionsList.appendChild(li);
                });
            } else {
                sessionsList.innerHTML = '<li>No recent sessions</li>';
            }
        });
}

function updateCharts() {
    const user = auth.currentUser;
    if (!user) return;
    
    const timePeriod = document.getElementById('time-period').value;
    let startDate;
    const endDate = new Date();
    
    switch(timePeriod) {
        case 'week':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'month':
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case 'year':
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        case 'all':
            startDate = new Date(0); // Unix epoch
            break;
    }
    
    database.ref('sessions')
        .orderByChild('userId')
        .equalTo(user.uid)
        .once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                const sessions = snapshot.val();
                const timeData = {};
                const subjectData = {};
                
                Object.values(sessions).forEach(session => {
                    if (session.endTime) {
                        const sessionDate = new Date(session.endTime);
                        
                        if (sessionDate >= startDate && sessionDate <= endDate) {
                            // For time chart
                            let key;
                            if (timePeriod === 'week') {
                                key = sessionDate.toLocaleDateString('en-US', { weekday: 'short' });
                            } else if (timePeriod === 'month') {
                                key = `Week ${Math.ceil(sessionDate.getDate() / 7)}`;
                            } else if (timePeriod === 'year') {
                                key = sessionDate.toLocaleDateString('en-US', { month: 'short' });
                            } else {
                                key = sessionDate.toLocaleDateString('en-US');
                            }
                            
                            if (!timeData[key]) {
                                timeData[key] = 0;
                            }
                            timeData[key] += session.duration / 60; // Convert to minutes
                            
                            // For subject chart
                            const subject = session.subject || 'Unknown';
                            if (!subjectData[subject]) {
                                subjectData[subject] = 0;
                            }
                            subjectData[subject] += session.duration / 60; // Convert to minutes
                        }
                    }
                });
                
                // Update time chart
                const timeCtx = document.getElementById('time-chart').getContext('2d');
                const timeLabels = Object.keys(timeData);
                const timeValues = Object.values(timeData);
                
                if (timeChart) {
                    timeChart.destroy();
                }
                
                timeChart = new Chart(timeCtx, {
                    type: 'bar',
                    data: {
                        labels: timeLabels,
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
                
                // Update subject chart
                const subjectCtx = document.getElementById('subject-chart').getContext('2d');
                const subjectLabels = Object.keys(subjectData);
                const subjectValues = Object.values(subjectData);
                
                if (subjectChart) {
                    subjectChart.destroy();
                }
                
                subjectChart = new Chart(subjectCtx, {
                    type: 'pie',
                    data: {
                        labels: subjectLabels,
                        datasets: [{
                            data: subjectValues,
                            backgroundColor: [
                                'rgba(74, 111, 165, 0.7)',
                                'rgba(22, 96, 136, 0.7)',
                                'rgba(79, 195, 247, 0.7)',
                                'rgba(40, 167, 69, 0.7)',
                                'rgba(255, 193, 7, 0.7)',
                                'rgba(220, 53, 69, 0.7)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true
                    }
                });
            }
        });
}

function updateSessionHistory() {
    const user = auth.currentUser;
    if (!user) return;
    
    const sessionsBody = document.getElementById('sessions-body');
    sessionsBody.innerHTML = '';
    
    database.ref('sessions')
        .orderByChild('userId')
        .equalTo(user.uid)
        .limitToLast(20)
        .once('value')
        .then(snapshot => {
            if (snapshot.exists()) {
                const sessions = snapshot.val();
                const sortedSessions = Object.values(sessions).sort((a, b) => {
                    return new Date(b.endTime) - new Date(a.endTime);
                });
                
                sortedSessions.forEach(session => {
                    const date = new Date(session.endTime).toLocaleDateString();
                    const duration = formatDuration(session.duration);
                    const subject = session.subject || 'Unknown';
                    const notes = session.notes || '';
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${date}</td>
                        <td>${duration}</td>
                        <td>${subject}</td>
                        <td>${notes}</td>
                    `;
                    
                    sessionsBody.appendChild(tr);
                });
            } else {
                sessionsBody.innerHTML = '<tr><td colspan="4">No sessions found</td></tr>';
            }
        });
}

// Event listeners for analytics
document.addEventListener('DOMContentLoaded', function() {
    // Time period selector
    document.getElementById('time-period').addEventListener('change', updateCharts);
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });
            
            document.getElementById(this.dataset.section).style.display = 'block';
            
            if (this.dataset.section === 'analytics') {
                updateCharts();
                updateSessionHistory();
            } else if (this.dataset.section === 'dashboard') {
                updateStats();
                updateRecentSessions();
            }
        });
    });
});
