/**
 * Utility functions for the CSAT Dashboard
 */

// Normalize string for comparison
function norm(s) {
    return String(s || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

// Squash string - remove punctuation and fix typos
function squash(s) {
    const base = norm(s)
        .replace(/[()\-_/\\|:,.'"`[\]]/g, ' ')
        .replace(/\s+/g, ' ');
    return base
        .replace(/\bsub\s*catagory\b/g, 'sub category')
        .replace(/\bcatagory\b/g, 'category');
}

// Convert value to Date object
function toDate(val) {
    if (!val) return null;
    if (val instanceof Date) return val;
    const d = new Date(val);
    if (!isNaN(d)) return d;
    return null;
}

// Format date to ISO string (YYYY-MM-DD)
function toISO(d) {
    const tzOff = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOff * 60000);
    return local.toISOString().slice(0, 10);
}

// Format date for display
function formatDateForDisplay(d) {
    return d.toISOString().slice(0, 10);
}

// Escape HTML to prevent XSS
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[c]));
}

// Calculate delta percentage
function calculateDeltaPercent(current, previous) {
    if (previous === 0) {
        if (current === 0) return 0;
        return 100;
    }
    return ((current - previous) / previous) * 100;
}

// Calculate previous period dates
function calculatePreviousPeriodDates(startDate, endDate) {
    const currentStart = toDate(startDate);
    const currentEnd = toDate(endDate);

    if (!currentStart || !currentEnd) {
        return { prevStart: null, prevEnd: null, daysDiff: 0 };
    }

    const daysDiff = Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24)) + 1;

    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - daysDiff + 1);

    return {
        prevStart: toISO(prevStart),
        prevEnd: toISO(prevEnd),
        daysDiff: daysDiff
    };
}

// Parse CSV data efficiently
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const row = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                if (inQuotes && line[j + 1] === '"') {
                    currentValue += '"';
                    j++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                row.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        row.push(currentValue.trim());
        result.push(row);
    }
    
    return result;
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
