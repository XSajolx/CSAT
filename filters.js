/**
 * Filter handling for the CSAT Dashboard
 */

const statusEl = document.getElementById("statusMessage");
const filterBtn = document.getElementById("filterBtn");

// Set default dates (last 30 days)
function setDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    
    document.getElementById("startDate").value = toISO(start);
    document.getElementById("endDate").value = toISO(end);
}

// Get current filter values
function getFilterValues() {
    return {
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value,
        product: document.getElementById("productFilter").value,
        agent: document.getElementById("agentFilter").value,
        category: document.getElementById("categoryFilter").value
    };
}

// Validate filters
function validateFilters(filters) {
    if (!filters.startDate || !filters.endDate) {
        return { valid: false, message: "Please choose both start and end dates." };
    }
    
    if (new Date(filters.startDate) > new Date(filters.endDate)) {
        return { valid: false, message: "Start Date must be before End Date." };
    }
    
    return { valid: true };
}

// Show loading state
function showLoading() {
    if (filterBtn) filterBtn.disabled = true;
    if (statusEl) statusEl.innerHTML = '<span class="loader"></span> Loading data…';

    document.getElementById("csatScoreValue").textContent = "…";
    document.getElementById("totalCsatCount").textContent = "…";
    document.getElementById("highCsatCount").textContent = "…";
    document.getElementById("lowCsatCount").textContent = "…";

    resetDeltaIndicator("csatScoreDelta");
    resetDeltaIndicator("totalCsatDelta");
    resetDeltaIndicator("highCsatDelta");
    resetDeltaIndicator("lowCsatDelta");

    showChartLoading();
}

// Set status message
function setStatus(ok, msg) {
    if (filterBtn) filterBtn.disabled = false;
    
    if (statusEl) {
        statusEl.style.color = ok ? "#10b981" : "#ef4444";
        statusEl.textContent = msg;
        
        if (ok) {
            setTimeout(() => {
                statusEl.textContent = "";
            }, 4000);
        }
    }
}

// Refresh dashboard with current filters
async function refreshDashboard() {
    const filters = getFilterValues();
    const validation = validateFilters(filters);
    
    if (!validation.valid) {
        setStatus(false, validation.message);
        return;
    }

    showLoading();

    try {
        const data = await getDashboardData(filters);
        
        setStatus(true, "Data loaded successfully.");
        updateKpiBoxes(data.csatSummary);
        drawAllCharts(data);
        
    } catch (error) {
        const msg = error.message || error.toString() || "Unknown error";
        console.error("Dashboard Error:", msg, error);
        setStatus(false, "Dashboard failed to load: " + msg);
        
        showChartError(msg);
        
        document.getElementById("csatScoreValue").textContent = "0%";
        document.getElementById("totalCsatCount").textContent = "0";
        document.getElementById("highCsatCount").textContent = "0";
        document.getElementById("lowCsatCount").textContent = "0";

        updateDeltaIndicator("totalCsatDelta", 0, 0, 0, "totalCsat");
        updateDeltaIndicator("highCsatDelta", 0, 0, 0, "highCsat");
        updateDeltaIndicator("lowCsatDelta", 0, 0, 0, "lowCsat");
        updateCsatScoreDelta("csatScoreDelta", 0);
    }

    // Also refresh category chart if a category is selected
    refreshCategoryChart();
}

// Refresh category breakdown chart
async function refreshCategoryChart() {
    const filters = getFilterValues();
    const el = document.getElementById("categoryPieChart");

    if (!filters.category) {
        if (el) el.innerHTML = '<div class="placeholder">Select a category to see breakdown.</div>';
        return;
    }

    if (el) el.innerHTML = '<div class="placeholder"><span class="loader"></span> Loading category breakdown…</div>';

    try {
        const dataArray = await getCategoryBreakdown(filters);
        drawChart("categoryPieChart", "Drilled-in Report: " + filters.category, dataArray, "PieChart");
        
    } catch (error) {
        const msg = error.message || error.toString() || "Unknown error";
        console.error("Category pie error:", msg, error);
        if (el) el.innerHTML = '<div class="placeholder">Error: ' + escapeHtml(msg) + '</div>';
    }
}
