// Firebase Realtime Database configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaPXiofuCKdgmGgha8eIuVlLyzwJ0yZCk",
  authDomain: "studytracker-cc817.firebaseapp.com",
  databaseURL: "https://studytracker-cc817-default-rtdb.firebaseio.com",
  projectId: "studytracker-cc817",
  storageBucket: "studytracker-cc817.firebasestorage.app",
  messagingSenderId: "232046780704",
  appId: "1:232046780704:web:8451890f47181731c6f745"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// Generate a unique share ID
function generateShareId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Format duration for display
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Format time for stats (hours and minutes only)
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
