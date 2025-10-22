/**
 * Backend date utility functions to handle timezone issues consistently
 * 
 * The problem: Using new Date().toISOString().split('T')[0] creates timezone-shifted dates
 * The solution: Always use local time components for date strings
 */

/**
 * Get today's date in YYYY-MM-DD format using server's local timezone
 * @returns {string} - Date in YYYY-MM-DD format
 */
function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format a Date object to YYYY-MM-DD string using local timezone
 * @param {Date} date - Date object to format
 * @returns {string} - Date in YYYY-MM-DD format
 */
function formatDateString(date) {
    if (!date || !(date instanceof Date)) {
        return getTodayString(); // fallback to today
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse a date string safely in local timezone
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} - Date object
 */
function parseDateString(dateString) {
    if (!dateString) return new Date();
    
    // If it's already a Date object, return it
    if (dateString instanceof Date) return dateString;
    
    // Force local timezone interpretation
    const str = String(dateString);
    if (str.includes('T') || str.includes(' ')) {
        return new Date(str);
    }
    
    // For date-only strings, append T00:00:00 to force local timezone
    return new Date(str + 'T00:00:00');
}

/**
 * Check if a date string represents today
 * @param {string} dateString - Date string to check
 * @returns {boolean}
 */
function isToday(dateString) {
    return dateString === getTodayString();
}

/**
 * Check if a date string represents a past date
 * @param {string} dateString - Date string to check
 * @returns {boolean}
 */
function isPastDate(dateString) {
    const today = getTodayString();
    return dateString < today;
}

/**
 * Check if a date string represents a future date
 * @param {string} dateString - Date string to check
 * @returns {boolean}
 */
function isFutureDate(dateString) {
    const today = getTodayString();
    return dateString > today;
}

module.exports = {
    getTodayString,
    formatDateString,
    parseDateString,
    isToday,
    isPastDate,
    isFutureDate
};