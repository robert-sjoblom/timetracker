// Storage helper functions
const storage = {
    async get(key) {
        return new Promise((resolve) => {
            browser.storage.local.get(key, (result) => {
                resolve(result[key] || null);
            });
        });
    }
};

// Initialize report page
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    setDefaultDates();
});

// Set up event listeners
function setupEventListeners() {
    document.getElementById('thisMonthBtn').addEventListener('click', setThisMonth);
    document.getElementById('generateBtn').addEventListener('click', generateReport);
}

// Set default dates (this month)
function setDefaultDates() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    document.getElementById('startDate').value = formatDateForInput(firstDay);
    document.getElementById('endDate').value = formatDateForInput(lastDay);
}

// Set this month preset
function setThisMonth() {
    setDefaultDates();
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// Generate and display report
async function generateReport() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    if (startDate > endDate) {
        alert('Start date must be before or equal to end date.');
        return;
    }
    
    const timeEntries = await storage.get('timeEntries') || {};
    const reportData = generateReportData(timeEntries, startDate, endDate);
    
    displayReport(reportData);
    displaySummary(reportData);
}

// Generate report data for date range
function generateReportData(timeEntries, startDate, endDate) {
    const reportData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dateString = currentDate.toDateString();
        const timeLogged = timeEntries[dateString] || 0;
        
        reportData.push({
            date: new Date(currentDate),
            dateString: dateString,
            timeLogged: timeLogged,
            formattedTime: timeLogged > 0 ? formatTime(timeLogged) : 'No time logged'
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return reportData.reverse(); // Show most recent first
}

// Display report in the UI
function displayReport(reportData) {
    const reportResults = document.getElementById('reportResults');
    
    if (reportData.length === 0) {
        reportResults.innerHTML = '<div class="p-4 text-center text-gray-500">No data found for the selected date range.</div>';
        return;
    }
    
    let html = '';
    
    reportData.forEach((entry, index) => {
        const dayName = entry.date.toLocaleDateString('en-US', { weekday: 'long' });
        const dateFormatted = entry.date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        html += `
            <div class="report-item">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-medium">${dayName}</div>
                        <div class="text-sm text-gray-600">${dateFormatted}</div>
                    </div>
                    <div class="text-lg font-medium ${entry.timeLogged > 0 ? '' : 'text-gray-500'}">
                        ${entry.formattedTime}
                    </div>
                </div>
            </div>
        `;
    });
    
    reportResults.innerHTML = html;
}

// Display summary statistics
function displaySummary(reportData) {
    const summaryDiv = document.getElementById('reportSummary');
    const totalDays = reportData.length;
    const activeDays = reportData.filter(entry => entry.timeLogged > 0).length;
    const totalTime = reportData.reduce((sum, entry) => sum + entry.timeLogged, 0);
    const averageTime = activeDays > 0 ? totalTime / activeDays : 0;
    
    document.getElementById('totalDays').textContent = totalDays;
    document.getElementById('activeDays').textContent = activeDays;
    document.getElementById('totalTime').textContent = formatTime(totalTime);
    document.getElementById('averageTime').textContent = formatTime(averageTime);
    
    summaryDiv.style.display = 'block';
}

// Format milliseconds to HH:MM
function formatTime(milliseconds) {
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
