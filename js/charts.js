/**
 * Chart rendering for the CSAT Dashboard
 */

const chartIds = [
    "csatTrendChart",
    "lowRatingChart",
    "topConcernsChart",
    "csatFunnelChart",
    "categoryPieChart"
];

// Store chart references for redrawing
const chartRefs = {};

// Draw a chart
function drawChart(elementId, title, dataArray, chartType) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    const colors = getChartColors();

    if (!Array.isArray(dataArray) || dataArray.length <= 1) {
        el.innerHTML = '<div class="placeholder">No data available for this filter.</div>';
        return;
    }

    let table;
    try {
        table = google.visualization.arrayToDataTable(dataArray, false);
    } catch (e) {
        console.error("DataTable conversion failed:", e);
        el.innerHTML = '<div class="placeholder">Chart data error.</div>';
        return;
    }

    const options = {
        title: title,
        height: 320,
        legend: { position: "none" },
        chartArea: { left: 70, top: 40, width: "80%", height: "70%" },
        animation: { duration: 300, easing: "out", startup: true },
        backgroundColor: "transparent",
        titleTextStyle: {
            color: colors.titleColor,
            fontSize: 16,
            bold: true,
            alignment: 'center'
        },
        hAxis: {
            textStyle: { color: colors.axisColor },
            titleTextStyle: { color: colors.titleColor }
        },
        vAxis: {
            textStyle: { color: colors.axisColor },
            titleTextStyle: { color: colors.titleColor }
        },
        tooltip: {
            isHtml: false,
            textStyle: {
                color: '#000000',
                fontSize: 13,
                bold: false
            }
        }
    };

    let chart;
    let processedTable = table;

    if (chartType === "LineChart") {
        options.hAxis.title = dataArray[0][0];
        options.hAxis.slantedText = true;
        options.hAxis.slantedTextAngle = 45;
        options.hAxis.showTextEvery = 1;
        options.hAxis.textStyle = { fontSize: 11, color: colors.axisColor };
        options.vAxis.title = dataArray[0][1];
        options.vAxis.viewWindowMode = "explicit";
        options.vAxis.textStyle = { fontSize: 11, color: colors.axisColor };
        options.pointSize = 5;
        options.dataOpacity = 0.9;
        options.height = 380;
        options.lineWidth = 2;
        options.chartArea = { left: 90, top: 70, width: "85%", height: "52%" };
        options.titleTextStyle = {
            color: colors.titleColor,
            fontSize: 17,
            bold: true,
            alignment: 'center'
        };

        // Add annotations
        const annotatedData = [dataArray[0].concat([{ role: 'annotation' }])];
        for (let i = 1; i < dataArray.length; i++) {
            annotatedData.push(dataArray[i].concat([dataArray[i][1].toFixed(2)]));
        }
        processedTable = google.visualization.arrayToDataTable(annotatedData, false);

        options.annotations = {
            textStyle: {
                fontSize: 10,
                color: colors.annotationColor,
                bold: true
            },
            alwaysOutside: false,
            stem: {
                color: 'transparent',
                length: 5
            }
        };

        chart = new google.visualization.LineChart(el);

    } else if (chartType === "PieChart") {
        options.legend = {
            position: "right",
            textStyle: { color: colors.legendColor, fontSize: 12 }
        };
        options.chartArea = { left: 20, top: 60, width: "90%", height: "70%" };
        options.titleTextStyle = {
            color: colors.titleColor,
            fontSize: 16,
            bold: true,
            alignment: 'center'
        };
        options.pieSliceText = 'value';
        options.pieSliceTextStyle = {
            color: '#ffffff',
            fontSize: 13,
            bold: true
        };
        options.tooltip = {
            text: 'both',
            textStyle: {
                color: '#000000',
                fontSize: 13,
                bold: false
            }
        };
        chart = new google.visualization.PieChart(el);

    } else {
        // BarChart
        options.vAxis.title = dataArray[0][0];
        options.vAxis.textStyle = { fontSize: 12, color: colors.axisColor };
        options.vAxis.titleTextStyle = { italic: false, color: colors.titleColor };
        options.vAxis.slantedText = false;
        options.vAxis.maxTextLines = 1;
        options.vAxis.minTextSpacing = 4;

        options.hAxis.title = dataArray[0][1];
        options.hAxis.minValue = 0;
        options.hAxis.textStyle = { fontSize: 12, color: colors.axisColor };
        options.hAxis.gridlines = { color: colors.gridlineColor, count: -1 };
        options.hAxis.baselineColor = colors.gridlineColor;
        options.bar = { groupWidth: "70%" };
        options.tooltip = {
            textStyle: {
                color: '#000000',
                fontSize: 13,
                bold: false
            }
        };
        options.titleTextStyle = {
            color: colors.titleColor,
            fontSize: 16,
            bold: true,
            alignment: 'center'
        };

        const isProductConcerns = title.includes("Product Concerns");
        const isFunnelChart = title.includes("CSAT Rating Distribution");
        const isLowRatingCountries = title.includes("Negative Rating Count");

        if (isProductConcerns) {
            options.chartArea = { left: 280, top: 60, width: "60%", height: "70%" };
        } else if (isFunnelChart) {
            options.chartArea = { left: 120, top: 60, width: "70%", height: "70%" };
        } else if (isLowRatingCountries) {
            const rowCount = dataArray.length - 1;
            const perRow = 32;
            const extra = 80;
            options.height = Math.max(320, rowCount * perRow + extra);
            options.chartArea = { left: 180, top: 60, width: "65%", height: "80%" };
        } else {
            options.chartArea = { left: 180, top: 60, width: "65%", height: "70%" };
        }

        // Add annotations for bar charts
        const annotatedData = [dataArray[0].concat([{ role: 'annotation' }])];
        for (let i = 1; i < dataArray.length; i++) {
            annotatedData.push(dataArray[i].concat([dataArray[i][1].toString()]));
        }
        processedTable = google.visualization.arrayToDataTable(annotatedData, false);

        options.annotations = {
            alwaysOutside: true,
            textStyle: {
                fontSize: 12,
                color: colors.annotationColor,
                bold: true,
                auraColor: 'none'
            }
        };

        chart = new google.visualization.BarChart(el);
    }

    chart.draw(processedTable, options);
    
    // Store reference for redrawing
    chartRefs[elementId] = {
        chart: chart,
        table: processedTable,
        options: options,
        type: chartType,
        dataArray: dataArray
    };
}

// Redraw all charts (used when theme changes or window resizes)
function redrawAllCharts() {
    chartIds.forEach((id) => {
        const ref = chartRefs[id];
        if (ref && ref.dataArray) {
            drawChart(id, ref.options.title, ref.dataArray, ref.type);
        }
    });
}

// Draw all charts with data
function drawAllCharts(data) {
    drawChart("csatTrendChart", "Date-wise CSAT Trend", data.csatTrend, "LineChart");
    drawChart("lowRatingChart", "Top Countries by Negative Rating Count", data.lowRatingCountries, "BarChart");
    drawChart("topConcernsChart", "Top 10 Product Concerns (Sub-category)", data.topConcerns, "BarChart");
    drawChart("csatFunnelChart", "CSAT Rating Distribution", data.csatFunnel, "BarChart");
}

// Show loading state on charts
function showChartLoading() {
    chartIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '<div class="placeholder"><span class="loader"></span> Fetching data…</div>';
        }
    });
}

// Show error on charts
function showChartError(message) {
    chartIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '<div class="placeholder">Error: ' + escapeHtml(message) + '</div>';
        }
    });
}
