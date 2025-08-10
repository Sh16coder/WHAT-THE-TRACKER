// Timer Functions
let timer;
let timerMode = 'pomodoro';
let timeLeft = 25 * 60; // 25 minutes in seconds
let isRunning = false;
let startTime;
let endTime;

document.addEventListener('DOMContentLoaded', function() {
    // Timer mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            timerMode = this.dataset.mode;
            
            // Show/hide custom timer input
            document.getElementById('custom-timer').style.display = 
                timerMode === 'custom' ? 'block' : 'none';
                
            // Set default times
            switch(timerMode) {
                case 'pomodoro':
                    timeLeft = 25 * 60;
                    break;
                case 'stopwatch':
                    timeLeft = 0;
                    break;
                case 'custom':
                    timeLeft = parseInt(document.getElementById('custom-minutes').value) * 60;
                    break;
            }
            
            updateTimerDisplay();
        });
    });
    
    // Custom timer input
    document.getElementById('custom-minutes').addEventListener('change', function() {
        if (timerMode === 'custom') {
            timeLeft = parseInt(this.value) * 60;
            updateTimerDisplay();
        }
    });
    
    // Timer control buttons
    document.getElementById('start-timer').addEventListener('click', startTimer);
    document.getElementById('pause-timer').addEventListener('click', pauseTimer);
    document.getElementById('reset-timer').addEventListener('click', resetTimer);
    
    // Quick start buttons
    document.querySelectorAll('.timer-options .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const minutes = parseInt(this.dataset.minutes);
            timeLeft = minutes * 60;
            timerMode = 'custom';
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.mode-btn[data-mode="custom"]').classList.add('active');
            document.getElementById('custom-minutes').value = minutes;
            document.getElementById('custom-timer').style.display = 'block';
            updateTimerDisplay();
            startTimer();
            
            // Switch to timer tab
            document.querySelector('.nav-link[data-section="timer"]').click();
        });
    });
    
    // Add subject button
    document.getElementById('add-subject').addEventListener('click', function() {
        const newSubject = document.getElementById('new-subject').value.trim();
        if (newSubject) {
            const select = document.getElementById('subject-select');
            const option = document.createElement('option');
            option.value = newSubject;
            option.textContent = newSubject;
            select.appendChild(option);
            select.value = newSubject;
            document.getElementById('new-subject').value = '';
        }
    });
});

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    document.getElementById('timer-minutes').textContent = 
        minutes.toString().padStart(2, '0');
    document.getElementById('timer-seconds').textContent = 
        seconds.toString().padStart(2, '0');
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startTime = new Date();
        
        document.getElementById('start-timer').disabled = true;
        document.getElementById('pause-timer').disabled = false;
        
        timer = setInterval(() => {
            if (timerMode === 'stopwatch') {
                timeLeft++;
            } else {
                timeLeft--;
                
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    isRunning = false;
                    timeLeft = 0;
                    updateTimerDisplay();
                    document.getElementById('start-timer').disabled = false;
                    document.getElementById('pause-timer').disabled = true;
                    
                    // Play sound and show notification
                    playTimerSound();
                    showTimerNotification();
                    
                    // Save session
                    saveSession();
                }
            }
            
            updateTimerDisplay();
        }, 1000);
    }
}

function pauseTimer() {
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
        document.getElementById('start-timer').disabled = false;
        document.getElementById('pause-timer').disabled = true;
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    
    switch(timerMode) {
        case 'pomodoro':
            timeLeft = 25 * 60;
            break;
        case 'stopwatch':
            timeLeft = 0;
            break;
        case 'custom':
            timeLeft = parseInt(document.getElementById('custom-minutes').value) * 60;
            break;
    }
    
    updateTimerDisplay();
    document.getElementById('start-timer').disabled = false;
    document.getElementById('pause-timer').disabled = true;
}

function playTimerSound() {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    audio.play();
}

function showTimerNotification() {
    if (Notification.permission === 'granted') {
        new Notification('Timer Complete!', {
            body: 'Your study session has ended.',
            icon: 'images/logo.png'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('Timer Complete!', {
                    body: 'Your study session has ended.',
                    icon: 'images/logo.png'
                });
            }
        });
    }
}

function saveSession() {
    const user = auth.currentUser;
    if (!user) return;
    
    const subject = document.getElementById('subject-select').value;
    const notes = document.getElementById('session-notes').value;
    const duration = timerMode === 'stopwatch' ? timeLeft : (startTime ? Math.floor((new Date() - startTime) / 1000) : 0);
    
    if (duration <= 0) return;
    
    const sessionData = {
        userId: user.uid,
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString(),
        duration: duration,
        subject: subject,
        notes: notes,
        mode: timerMode
    };
    
    // Push to Realtime Database
    const newSessionRef = database.ref('sessions').push();
    newSessionRef.set(sessionData)
        .then(() => {
            // Clear notes
            document.getElementById('session-notes').value = '';
            
            // Update analytics
            updateAnalytics();
        })
        .catch(error => {
            console.error('Error saving session:', error);
        });
}
