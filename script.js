// ====================================================================
// Configuration: REPLACE THESE WITH YOUR ACTUAL GOOGLE SHEET IDs!
// ====================================================================
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // e.g., '1ABc2dEFghIJKlmnopQrsTUVwXyZ0123456789'
const GID = 'YOUR_GID_HERE';                      // e.g., '0' for the first sheet, or '123456789'

// The URL for the Google Visualization API Query endpoint
const DATA_SOURCE_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;

// ====================================================================
// Function to fetch and parse the Google Sheet JSON
// ====================================================================
async function fetchAndParseData() {
    try {
        const response = await fetch(DATA_SOURCE_URL);
        const text = await response.text();
        
        // The Google Visualization API returns a JSON response wrapped in a function call.
        // We need to strip this wrapper to get the clean JSON object.
        const jsonText = text.substring(47).slice(0, -2);
        const dataObject = JSON.parse(jsonText);
        
        const rows = dataObject.table.rows;
        const columns = dataObject.table.cols;
        const headers = columns.map(col => col.label).filter(label => label); // Get non-empty headers

        let parsedData = [];

        // Loop through the data rows
        for (const row of rows) {
            let record = {};
            // Loop through the cells in the row and map them to their header name
            for (let i = 0; i < headers.length; i++) {
                const header = headers[i];
                // The c property holds the cell data; v is the value. Handle potential null cells.
                const cellValue = row.c[i] ? row.c[i].v : '';
                record[header] = cellValue;
            }
            parsedData.push(record);
        }

        return parsedData;

    } catch (error) {
        console.error("Error fetching or parsing Google Sheets data:", error);
        document.getElementById('data-table-container').innerHTML = 
            '<p style="color: red;">Error loading live data. Please check the Spreadsheet ID, GID, and ensure the sheet is published to the web.</p>';
        return [];
    }
}

// ====================================================================
// Filtering and Rendering Functions (mostly unchanged)
// ====================================================================

function filterData(data, searchTerm) {
    const term = String(searchTerm).toLowerCase().trim();
    if (!term) return [];

    return data.filter(row => {
        // Ensure values are treated as strings for robust searching
        const code = String(row['Employee Code'] || '').toLowerCase();
        const name = String(row['Employee Name'] || '').toLowerCase();

        return code.includes(term) || name.includes(term);
    });
}

function renderResults(filteredData) {
    const tableContainer = document.getElementById('data-table-container');
    const totalHoursContainer = document.getElementById('total-hours-container');

    // Clear previous results
    tableContainer.innerHTML = '';
    totalHoursContainer.innerHTML = '';

    if (filteredData.length === 0) {
        tableContainer.innerHTML = '<p>No data found for your search term.</p>';
        return;
    }

    // --- 1. Create the Table ---
    const table = document.createElement('table');
    // We assume the first row of filtered data has the column headers defined
    const headers = Object.keys(filteredData[0]); 

    // Create Table Header
    let thead = '<thead><tr>';
    headers.forEach(header => {
        thead += `<th>${header}</th>`;
    });
    thead += '</tr></thead>';

    // Create Table Body and calculate total hours
    let tbody = '<tbody>';
    let totalHours = 0;
    
    filteredData.forEach(row => {
        tbody += '<tr>';
        headers.forEach(header => {
            const value = row[header] || '';
            tbody += `<td>${value}</td>`;
        });
        tbody += '</tr>';

        // Sum the 'Hours' column
        // The value is already a number from the Google Sheet response, 
        // but we use parseFloat to be safe.
        const hours = parseFloat(row['Hours']); 
        if (!isNaN(hours)) {
            totalHours += hours;
        }
    });
    tbody += '</tbody>';

    table.innerHTML = thead + tbody;
    tableContainer.appendChild(table);

    // --- 2. Display Total Hours ---
    totalHoursContainer.innerHTML = `Total Hours Found: <strong>${totalHours.toFixed(2)}</strong>`;
}


// --- Main Execution Block ---
document.addEventListener('DOMContentLoaded', async () => {
    // Show a loading message while we fetch the live data
    document.getElementById('data-table-container').innerHTML = '<p>Loading data from Google Sheet...</p>';
    
    let allEmployeeData = await fetchAndParseData();
    
    // Clear the loading message only if data was loaded (parsedData is not empty)
    if (allEmployeeData.length > 0) {
        document.getElementById('data-table-container').innerHTML = '<p class="placeholder">Search to see your data.</p>';
        console.log("Data loaded successfully:", allEmployeeData.length, "rows.");
    }

    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    const handleSearch = () => {
        const searchTerm = searchInput.value;
        const filtered = filterData(allEmployeeData, searchTerm);
        renderResults(filtered);
    };

    // Attach search function to button click and 'Enter' key press
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
});
