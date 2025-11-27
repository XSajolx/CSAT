/**
 * Data fetching and processing for the CSAT Dashboard
 * Uses Google Sheets published as CSV for fast loading
 */

// Configuration - UPDATE THIS WITH YOUR SHEET URL
const CONFIG = {
    // Replace with your Google Sheet published CSV URL
    // To get this: File > Share > Publish to web > CSV format
    SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRs6zWG2ICe1yVN1Cs0_nNEhuvQLMPZ-Fdsanz6mvcgcqGb2Wm0y-1seBlM1M6gEBuWhbVGdcPBBuEs/pub?gid=1472062717&single=true&output=csv',
    
    // Cache duration in milliseconds (5 minutes)
    CACHE_DURATION: 5 * 60 * 1000
};

// Data cache
let dataCache = {
    rawData: null,
    headers: null,
    colIndex: null,
    timestamp: null
};

// Build column index from headers
function buildColIndex(headers) {
    const n = headers.map(norm);
    const q = headers.map(squash);

    function findExact(keys) {
        for (const k of keys) {
            let idx = n.indexOf(k);
            if (idx !== -1) return idx;
            idx = q.indexOf(k);
            if (idx !== -1) return idx;
        }
        return -1;
    }

    function findIncludes(keys) {
        for (let i = 0; i < q.length; i++) {
            const h = q[i];
            if (keys.every(k => h.includes(k))) return i;
        }
        return -1;
    }

    // Date
    const dateIdx = findExact(['date', 'created at', 'conversation date']);

    // CSAT
    const csatIdx = findExact(['conversation rating', 'rating', 'csat', 'csat score', 'conversation satisfaction']);

    // Country
    let countryIdx = findExact(['country', 'client country', 'user country', 'location']);
    if (countryIdx === -1) {
        countryIdx = findIncludes(['location']);
    }

    // Sub-category
    let subIdx = -1;
    subIdx = findIncludes(['concern regarding product', 'sub category', 'by ai']);
    if (subIdx === -1) subIdx = findIncludes(['concern regarding product', 'subcategory', 'by ai']);
    if (subIdx === -1) subIdx = findIncludes(['concern regarding product', 'sub category']);
    if (subIdx === -1) subIdx = findIncludes(['concern regarding product', 'category']);
    if (subIdx === -1) subIdx = findExact(['sub-category', 'subcategory', 'concern', 'issue', 'product concern']);

    // Product
    const productIdx = findExact(['product']);

    // Agent
    const agentIdx = findIncludes(['agent', 'name']);

    // Category
    let categoryIdx = findIncludes(['concern regarding product', 'catagory']);
    if (categoryIdx === -1) {
        categoryIdx = findIncludes(['concern regarding product', 'category']);
    }

    return {
        Date: dateIdx,
        CSAT: csatIdx,
        Country: countryIdx,
        SubCategory: subIdx,
        Product: productIdx,
        Agent: agentIdx,
        Category: categoryIdx
    };
}

// Fetch data from Google Sheets
async function fetchSheetData() {
    // Check cache
    if (dataCache.rawData && dataCache.timestamp) {
        const age = Date.now() - dataCache.timestamp;
        if (age < CONFIG.CACHE_DURATION) {
            return {
                headers: dataCache.headers,
                dataRows: dataCache.rawData,
                colIndex: dataCache.colIndex
            };
        }
    }

    try {
        const response = await fetch(CONFIG.SHEET_CSV_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        
        if (!parsedData || parsedData.length < 2) {
            throw new Error('No data found in spreadsheet');
        }

        const headers = parsedData[0];
        const dataRows = parsedData.slice(1);
        const colIndex = buildColIndex(headers);

        // Validate required columns
        const missing = [];
        if (colIndex.Date === -1) missing.push('Date');
        if (colIndex.CSAT === -1) missing.push('CSAT');
        if (colIndex.Country === -1) missing.push('Country');
        if (colIndex.SubCategory === -1) missing.push('SubCategory');

        if (missing.length) {
            throw new Error('Missing required columns: ' + missing.join(', '));
        }

        // Update cache
        dataCache = {
            rawData: dataRows,
            headers: headers,
            colIndex: colIndex,
            timestamp: Date.now()
        };

        return { headers, dataRows, colIndex };

    } catch (error) {
        console.error('Error fetching sheet data:', error);
        throw error;
    }
}

// Filter data by date range
function filterByDateRange(dataRows, colIndex, startDate, endDate) {
    const filterStart = toDate(startDate);
    const filterEnd = toDate(endDate);

    if (!filterStart || !filterEnd) return dataRows;

    filterStart.setHours(0, 0, 0, 0);
    filterEnd.setHours(23, 59, 59, 999);

    return dataRows.filter(row => {
        const d = toDate(row[colIndex.Date]);
        return d && d >= filterStart && d <= filterEnd;
    });
}

// Apply product and agent filters
function applyFilters(data, colIndex, product, agent) {
    let filteredData = data;

    if (product && colIndex.Product !== -1) {
        const wantProd = norm(product);
        filteredData = filteredData.filter(row => norm(row[colIndex.Product]) === wantProd);
    }

    if (agent && colIndex.Agent !== -1) {
        const wantAgent = norm(agent);
        filteredData = filteredData.filter(row => norm(row[colIndex.Agent]) === wantAgent);
    }

    return filteredData;
}

// Process CSAT trend data
function processCsatTrend(data, colIndex) {
    const daily = {};
    
    data.forEach(row => {
        const d = toDate(row[colIndex.Date]);
        const csat = Number(row[colIndex.CSAT]);
        if (!d || isNaN(csat) || csat <= 0) return;
        
        const key = formatDateForDisplay(d);
        if (!daily[key]) daily[key] = { total: 0, count: 0 };
        daily[key].total += csat;
        daily[key].count += 1;
    });

    const out = [['Date', 'CSAT Rating']];
    Object.keys(daily).sort().forEach(k => {
        const { total, count } = daily[k];
        out.push([k, total / count]);
    });
    
    return out;
}

// Process low rating countries
function processLowRatingCountries(data, colIndex) {
    const counts = {};
    
    data.forEach(row => {
        const raw = row[colIndex.Country];
        const country = raw ? String(raw).trim() : '';
        const csat = Number(row[colIndex.CSAT]);

        if (!country || isNaN(csat) || csat <= 0) return;
        if (csat >= 1 && csat <= 3) {
            counts[country] = (counts[country] || 0) + 1;
        }
    });

    const list = Object.keys(counts)
        .map(c => ({ country: c, count: counts[c] }))
        .sort((a, b) => b.count - a.count);

    const out = [['Country', 'Negative Rating Count']];
    list.forEach(x => out.push([x.country, x.count]));
    
    return out;
}

// Process top concerns
function processTopConcerns(data, colIndex) {
    const counts = {};
    
    data.forEach(row => {
        const raw = row[colIndex.SubCategory];
        const name = raw ? String(raw).trim() : '';
        if (!name) return;
        counts[name] = (counts[name] || 0) + 1;
    });

    const list = Object.keys(counts)
        .map(k => ({ name: k, count: counts[k] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const out = [['Concern', 'Count']];
    list.forEach(x => out.push([x.name, x.count]));
    
    return out;
}

// Process CSAT funnel
function processCsatFunnel(data, colIndex) {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    data.forEach(row => {
        const csat = Number(row[colIndex.CSAT]);
        if (!isNaN(csat) && csat >= 1 && csat <= 5) {
            counts[csat] = (counts[csat] || 0) + 1;
        }
    });

    const out = [['Rating', 'Count']];
    [5, 4, 3, 2, 1].forEach(r => {
        const label = r + ' Star' + (r > 1 ? 's' : '');
        out.push([label, counts[r] || 0]);
    });

    return out;
}

// Calculate CSAT counts from funnel
function calculateCsatCounts(funnelData) {
    if (!funnelData || funnelData.length <= 1) {
        return { total: 0, high: 0, low: 0 };
    }

    const five = Number((funnelData[1] && funnelData[1][1]) || 0);
    const four = Number((funnelData[2] && funnelData[2][1]) || 0);
    const three = Number((funnelData[3] && funnelData[3][1]) || 0);
    const two = Number((funnelData[4] && funnelData[4][1]) || 0);
    const one = Number((funnelData[5] && funnelData[5][1]) || 0);

    const high = five + four;
    const low = three + two + one;
    const total = high + low;

    return { total, high, low };
}

// Process category pie chart
function processCategoryPie(data, colIndex, categoryName) {
    const out = [['Issue', 'Count']];

    if (!categoryName || colIndex.Category === -1 || colIndex.SubCategory === -1) {
        return out;
    }

    const wantCat = norm(categoryName);
    const counts = {};

    data.forEach(row => {
        const cat = row[colIndex.Category];
        const sub = row[colIndex.SubCategory];
        if (!cat || !sub) return;
        if (norm(cat) !== wantCat) return;

        const label = String(sub).trim();
        if (!label) return;

        counts[label] = (counts[label] || 0) + 1;
    });

    const entries = Object.keys(counts)
        .map(k => [k, counts[k]])
        .sort((a, b) => b[1] - a[1]);

    return out.concat(entries);
}

// Main function to get dashboard data
async function getDashboardData(filters) {
    const { dataRows, colIndex } = await fetchSheetData();

    // Filter by date range
    let currentPeriodData = filterByDateRange(dataRows, colIndex, filters.startDate, filters.endDate);

    // Apply product and agent filters
    currentPeriodData = applyFilters(currentPeriodData, colIndex, filters.product, filters.agent);

    // Calculate previous period data
    const { prevStart, prevEnd } = calculatePreviousPeriodDates(filters.startDate, filters.endDate);
    let prevPeriodData = [];
    let prevCounts = { total: 0, high: 0, low: 0 };

    if (prevStart && prevEnd) {
        prevPeriodData = filterByDateRange(dataRows, colIndex, prevStart, prevEnd);
        prevPeriodData = applyFilters(prevPeriodData, colIndex, filters.product, filters.agent);

        if (prevPeriodData.length > 0) {
            const prevFunnel = processCsatFunnel(prevPeriodData, colIndex);
            prevCounts = calculateCsatCounts(prevFunnel);
        }
    }

    // Process current period data
    const emptyResponse = {
        lowRatingCountries: [['Country', 'Negative Rating Count']],
        topConcerns: [['Concern', 'Count']],
        csatTrend: [['Date', 'CSAT Rating']],
        csatFunnel: [['Rating', 'Count']],
        csatSummary: {
            total: 0, high: 0, low: 0,
            prevTotal: prevCounts.total,
            prevHigh: prevCounts.high,
            prevLow: prevCounts.low
        }
    };

    if (currentPeriodData.length === 0) {
        return emptyResponse;
    }

    const currentFunnel = processCsatFunnel(currentPeriodData, colIndex);
    const currentCounts = calculateCsatCounts(currentFunnel);

    return {
        lowRatingCountries: processLowRatingCountries(currentPeriodData, colIndex),
        topConcerns: processTopConcerns(currentPeriodData, colIndex),
        csatTrend: processCsatTrend(currentPeriodData, colIndex),
        csatFunnel: currentFunnel,
        csatSummary: {
            total: currentCounts.total,
            high: currentCounts.high,
            low: currentCounts.low,
            prevTotal: prevCounts.total,
            prevHigh: prevCounts.high,
            prevLow: prevCounts.low
        }
    };
}

// Get category breakdown
async function getCategoryBreakdown(filters) {
    const { dataRows, colIndex } = await fetchSheetData();

    let filteredData = filterByDateRange(dataRows, colIndex, filters.startDate, filters.endDate);
    filteredData = applyFilters(filteredData, colIndex, filters.product, filters.agent);

    if (filteredData.length === 0) {
        return [['Issue', 'Count']];
    }

    return processCategoryPie(filteredData, colIndex, filters.category);
}
