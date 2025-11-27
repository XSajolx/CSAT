# Dynamic CSAT Dashboard

A fast, responsive CSAT (Customer Satisfaction) Dashboard built with HTML, CSS, and JavaScript. Uses Google Charts for visualization and fetches data directly from Google Sheets.

![Dashboard Preview](preview.png)

## Features

- 📊 **Real-time Data**: Fetches data directly from Google Sheets (published as CSV)
- 🌓 **Dark/Light Mode**: Toggle between themes with preference saved locally
- 📱 **Fully Responsive**: Works on desktop, tablet, and mobile
- ⚡ **Fast Loading**: Client-side data processing with caching
- 📈 **Multiple Charts**: 
  - CSAT Trend Line Chart
  - Top Product Concerns Bar Chart
  - Countries by Negative Rating Bar Chart
  - CSAT Rating Distribution (Funnel)
  - Category Drill-down Pie Chart
- 🎯 **KPI Cards**: With period-over-period comparison
- 🔍 **Advanced Filtering**: By date range, product, agent, and category

## Setup Instructions

### 1. Prepare Your Google Sheet

1. Open your Google Sheet with CSAT data
2. Ensure it has the following columns (names can vary slightly):
   - Date (e.g., "Date", "Created At", "Conversation Date")
   - CSAT Rating (e.g., "Conversation Rating", "Rating", "CSAT")
   - Country (e.g., "Country", "Location", "Client Country")
   - Sub-category (e.g., "Concern regarding product (Sub-catagory) By AI")
   - Product (e.g., "Product")
   - Agent Name (e.g., "Agent Name (Auto Update)")
   - Category (e.g., "Concern regarding product (Catagory)")

### 2. Publish Sheet as CSV

1. In Google Sheets, go to **File > Share > Publish to web**
2. Select the sheet/tab with your data
3. Choose **CSV** as the format
4. Click **Publish**
5. Copy the generated URL

### 3. Configure the Dashboard

1. Open `js/data.js`
2. Update the `CONFIG.SHEET_CSV_URL` with your published CSV URL:

```javascript
const CONFIG = {
    SHEET_CSV_URL: 'YOUR_PUBLISHED_CSV_URL_HERE',
    CACHE_DURATION: 5 * 60 * 1000  // 5 minutes
};
