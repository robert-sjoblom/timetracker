// Background script to handle extension lifecycle
console.log('Time Tracker background script loaded');

// Clean up old data on startup
browser.runtime.onStartup.addListener(cleanupOldData);
browser.runtime.onInstalled.addListener(cleanupOldData);

async function cleanupOldData() {
    try {
        const result = await browser.storage.local.get('timeEntries');
        const timeEntries = result.timeEntries || {};
        
        // Remove entries older than 2 months
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        
        let hasChanges = false;
        Object.keys(timeEntries).forEach(dateKey => {
            const entryDate = new Date(dateKey);
            if (entryDate < twoMonthsAgo) {
                delete timeEntries[dateKey];
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            await browser.storage.local.set({ timeEntries });
        }
    } catch (error) {
        console.error('Error cleaning up old data:', error);
    }
}
