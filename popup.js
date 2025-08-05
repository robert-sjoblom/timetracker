// Storage helper functions
const storage = {
    async get(key) {
        return new Promise((resolve) => {
            browser.storage.local.get(key, (result) => {
                resolve(result[key] || null);
            });
        });
    },
    
    async set(key, value) {
        return new Promise((resolve) => {
            browser.storage.local.set({ [key]: value }, resolve);
        });
    }
};

// Time tracking state
let isTracking = false;
let startTime = null;
let sessionTimer = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadState();
    updateUI();
    updateTodayTime();
    
    // Set up event listeners
    document.getElementById('toggleBtn').addEventListener('click', toggleTracking);
    document.getElementById('reportBtn').addEventListener('click', openReport);
    
    // Update session timer every second if tracking
    if (isTracking) {
        startSessionTimer();
    }
});

// Load tracking state from storage
async function loadState() {
    const state = await storage.get('trackingState');
    if (state) {
        isTracking = state.isTracking;
        startTime = state.startTime;
    }
}

// Save tracking state to storage
async function saveState() {
    await storage.set('trackingState', {
        isTracking,
        startTime
    });
}

// Toggle time tracking
async function toggleTracking() {
    if (isTracking) {
        // Stop tracking
        await stopTracking();
    } else {
        // Start tracking
        await startTracking();
    }
    
    updateUI();
    await saveState();
}

// Start time tracking
async function startTracking() {
    isTracking = true;
    startTime = Date.now();
    startSessionTimer();
}

// Stop time tracking
async function stopTracking() {
    if (!startTime) return;
    
    isTracking = false;
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Save the time entry
    await saveTimeEntry(startTime, duration);
    
    startTime = null;
    stopSessionTimer();
    
    // Update today's time display
    updateTodayTime();
}

// Save time entry to storage
async function saveTimeEntry(startTimestamp, duration) {
    const date = new Date(startTimestamp).toDateString();
    const timeEntries = await storage.get('timeEntries') || {};
    
    if (!timeEntries[date]) {
        timeEntries[date] = 0;
    }
    
    timeEntries[date] += duration;
    
    // Clean up old entries (older than 2 months)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    Object.keys(timeEntries).forEach(dateKey => {
        const entryDate = new Date(dateKey);
        if (entryDate < twoMonthsAgo) {
            delete timeEntries[dateKey];
        }
    });
    
    await storage.set('timeEntries', timeEntries);
}

// Update UI elements
function updateUI() {
    const toggleBtn = document.getElementById('toggleBtn');
    const statusText = document.getElementById('statusText');
    const currentTimeDiv = document.getElementById('currentTime');
    
    if (isTracking) {
        toggleBtn.textContent = 'Stop';
        toggleBtn.className = 'w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded transition cursor-pointer';
        statusText.textContent = 'Running';
        currentTimeDiv.classList.remove('hidden');
    } else {
        toggleBtn.textContent = 'Start';
        toggleBtn.className = 'w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded transition cursor-pointer';
        statusText.textContent = 'Stopped';
        currentTimeDiv.classList.add('hidden');
    }
}

// Start session timer
function startSessionTimer() {
    sessionTimer = setInterval(updateSessionTime, 1000);
    updateSessionTime();
}

// Stop session timer
function stopSessionTimer() {
    if (sessionTimer) {
        clearInterval(sessionTimer);
        sessionTimer = null;
    }
}

// Update session time display
function updateSessionTime() {
    if (!isTracking || !startTime) return;
    
    const elapsed = Date.now() - startTime;
    const sessionTimeElement = document.getElementById('sessionTime');
    sessionTimeElement.textContent = formatTime(elapsed);
}

// Update today's total time
async function updateTodayTime() {
    const today = new Date().toDateString();
    const timeEntries = await storage.get('timeEntries') || {};
    const todayTime = timeEntries[today] || 0;
    
    // Add current session time if tracking
    let totalTime = todayTime;
    if (isTracking && startTime) {
        totalTime += Date.now() - startTime;
    }
    
    const todayTimeElement = document.getElementById('todayTimeValue');
    todayTimeElement.textContent = formatTime(totalTime);
}

// Format milliseconds to HH:MM
function formatTime(milliseconds) {
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Open report in new tab
function openReport() {
    browser.tabs.create({
        url: browser.runtime.getURL('report.html')
    });
}
