/**
 * Test script to verify date handling logic
 * Run this to test the date parsing and day-of-week calculation
 */

console.log('=== DATE HANDLING TEST ===');

// Test the date parsing logic from the controller
function testDateParsing(dateString) {
    console.log(`\nTesting date: "${dateString}"`);
    
    // Method 1: Direct Date constructor (can cause timezone issues)
    const directDate = new Date(dateString);
    console.log(`Direct Date(): ${directDate.toISOString()} (Day: ${directDate.getDay()})`);
    
    // Method 2: Parse as YYYY-MM-DD to avoid timezone issues (our fix)
    const dateParts = dateString.split('-');
    const safeDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    console.log(`Safe parsing: ${safeDate.toISOString()} (Day: ${safeDate.getDay()})`);
    
    // Show the difference
    const dayDiff = safeDate.getDay() - directDate.getDay();
    console.log(`Day difference: ${dayDiff} ${dayDiff !== 0 ? '⚠️ TIMEZONE ISSUE!' : '✅ OK'}`);
    
    return safeDate;
}

// Test various dates
const testDates = [
    '2024-10-30', // Thursday
    '2024-10-31', // Friday
    '2024-11-01', // Saturday
    '2024-11-04', // Monday
    '2025-10-23', // Thursday (the problematic date from the screenshot)
];

testDates.forEach(testDateParsing);

console.log('\n=== DAY OF WEEK MAPPING ===');
console.log('0 = Sunday');
console.log('1 = Monday');
console.log('2 = Tuesday');
console.log('3 = Wednesday');
console.log('4 = Thursday');
console.log('5 = Friday');
console.log('6 = Saturday');

console.log('\n=== CURRENT DATE INFO ===');
const now = new Date();
console.log(`Current date: ${now.toISOString()}`);
console.log(`Current day of week: ${now.getDay()}`);
console.log(`Today string (YYYY-MM-DD): ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);