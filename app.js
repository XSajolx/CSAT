/**
 * Main application initialization for the CSAT Dashboard
 */

// Initialize the dashboard when Google Charts is loaded
google.charts.load("current", { packages: ["corechart"] });
google.charts.setOnLoadCallback(initDashboard);

// Main initialization function
function initDashboard() {
    // Load theme preference
    loadThemePreference();
    
    // Set default date filters
    setDefaultDates();
    
    // Load initial data
    refreshDashboard();
    
    // Attach resize handler for responsive charts
    attachResizeHandler();
    
    console.log("CSAT Dashboard initialized successfully");
}

// Handle window resize for responsive charts
function attachResizeHandler() {
    let resizeTimer;
    
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            redrawAllCharts();
        }, 150);
    });
}

// Make functions available globally for onclick handlers
window.toggleTheme = toggleTheme;
window.refreshDashboard = refreshDashboard;
window.refreshCategoryChart = refreshCategoryChart;
