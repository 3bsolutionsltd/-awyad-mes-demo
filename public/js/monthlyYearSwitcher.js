/**
 * Year Switcher for Monthly Tracking
 * Allows user to switch between 2025 and 2026
 */

// Year switcher function
window.switchMonthlyYear = function(year) {
    window.currentMonthlyYear = year;
    // Re-render monthly tracking with new year
    if (window.renderMonthlyTracking) {
        window.renderMonthlyTracking();
    }
};

// Initialize to current year
if (!window.currentMonthlyYear) {
    window.currentMonthlyYear = new Date().getFullYear();
}
