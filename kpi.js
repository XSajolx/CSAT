/**
 * KPI card management for the CSAT Dashboard
 */

// Reset delta indicator to neutral state
function resetDeltaIndicator(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.className = "kpi-delta neutral";
    el.innerHTML = `
        <span class="arrow">—</span>
        <span class="delta-value">…</span>
        <span class="delta-label">vs prev period</span>
    `;
}

// Update delta indicator for count cards
function updateDeltaIndicator(elementId, deltaPercent, current, previous, tooltipPrefix) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let arrow, className;
    if (deltaPercent > 0) {
        arrow = "↑";
        className = "kpi-delta positive";
    } else if (deltaPercent < 0) {
        arrow = "↓";
        className = "kpi-delta negative";
    } else {
        arrow = "—";
        className = "kpi-delta neutral";
    }

    const absPercent = Math.abs(deltaPercent).toFixed(1);

    el.className = className;
    el.innerHTML = `
        <span class="arrow">${arrow}</span>
        <span class="delta-value">${absPercent}%</span>
        <span class="delta-label">vs prev period</span>
    `;

    // Update tooltip
    const currentEl = document.getElementById(tooltipPrefix + "Current");
    const previousEl = document.getElementById(tooltipPrefix + "Previous");
    
    if (currentEl) currentEl.textContent = current;
    if (previousEl) previousEl.textContent = previous;
}

// Update CSAT Score delta
function updateCsatScoreDelta(elementId, deltaPercent) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let arrow, className;
    if (deltaPercent > 0) {
        arrow = "↑";
        className = "kpi-delta positive";
    } else if (deltaPercent < 0) {
        arrow = "↓";
        className = "kpi-delta negative";
    } else {
        arrow = "—";
        className = "kpi-delta neutral";
    }

    const sign = deltaPercent > 0 ? "+" : "";
    const displayValue = sign + deltaPercent.toFixed(1);

    el.className = className;
    el.innerHTML = `
        <span class="arrow">${arrow}</span>
        <span class="delta-value">${displayValue}%</span>
        <span class="delta-label">vs prev period</span>
    `;
}

// Update all KPI boxes
function updateKpiBoxes(summary) {
    const csatScoreEl = document.getElementById("csatScoreValue");
    const totalEl = document.getElementById("totalCsatCount");
    const highEl = document.getElementById("highCsatCount");
    const lowEl = document.getElementById("lowCsatCount");

    if (!summary) {
        if (csatScoreEl) csatScoreEl.textContent = "0%";
        if (totalEl) totalEl.textContent = "0";
        if (highEl) highEl.textContent = "0";
        if (lowEl) lowEl.textContent = "0";
        
        updateDeltaIndicator("totalCsatDelta", 0, 0, 0, "totalCsat");
        updateDeltaIndicator("highCsatDelta", 0, 0, 0, "highCsat");
        updateDeltaIndicator("lowCsatDelta", 0, 0, 0, "lowCsat");
        updateCsatScoreDelta("csatScoreDelta", 0);
        return;
    }

    const total = summary.total || 0;
    const high = summary.high || 0;
    const low = summary.low || 0;

    const prevTotal = summary.prevTotal || 0;
    const prevHigh = summary.prevHigh || 0;
    const prevLow = summary.prevLow || 0;

    // Calculate CSAT scores
    let csatScore = 0;
    let prevCsatScore = 0;

    if (total > 0) {
        csatScore = (high / total) * 100;
        if (csatScoreEl) csatScoreEl.textContent = csatScore.toFixed(1) + "%";
    } else {
        if (csatScoreEl) csatScoreEl.textContent = "0%";
    }

    if (prevTotal > 0) {
        prevCsatScore = (prevHigh / prevTotal) * 100;
    }

    // Update CSAT Score delta
    const csatDelta = csatScore - prevCsatScore;
    updateCsatScoreDelta("csatScoreDelta", csatDelta);

    // Update counts
    if (totalEl) totalEl.textContent = total;
    if (highEl) highEl.textContent = high;
    if (lowEl) lowEl.textContent = low;

    // Calculate and update count deltas
    const totalDelta = calculateDeltaPercent(total, prevTotal);
    const highDelta = calculateDeltaPercent(high, prevHigh);
    const lowDelta = calculateDeltaPercent(low, prevLow);

    updateDeltaIndicator("totalCsatDelta", totalDelta, total, prevTotal, "totalCsat");
    updateDeltaIndicator("highCsatDelta", highDelta, high, prevHigh, "highCsat");
    updateDeltaIndicator("lowCsatDelta", lowDelta, low, prevLow, "lowCsat");
}
