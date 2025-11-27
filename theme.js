/**
 * Theme management for the CSAT Dashboard
 */

let isDayMode = false;

// Toggle between day and night mode
function toggleTheme() {
    isDayMode = document.getElementById('themeToggle').checked;
    document.body.classList.toggle('day-mode', isDayMode);
    
    // Save preference to localStorage
    localStorage.setItem('dashboardTheme', isDayMode ? 'day' : 'night');
    
    // Redraw charts with new theme colors
    redrawAllCharts();
}

// Load saved theme preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('dashboardTheme');
    if (savedTheme === 'day') {
        isDayMode = true;
        document.getElementById('themeToggle').checked = true;
        document.body.classList.add('day-mode');
    }
}

// Get chart colors based on current theme
function getChartColors() {
    return {
        titleColor: isDayMode ? '#1e293b' : '#e5e7eb',
        axisColor: isDayMode ? '#64748b' : '#9ca3af',
        annotationColor: isDayMode ? '#1e293b' : '#e5e7eb',
        gridlineColor: isDayMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(156, 163, 175, 0.5)',
        legendColor: isDayMode ? '#1e293b' : '#e5e7eb'
    };
}
