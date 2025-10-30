// ====================================================================
// Configuration: YOUR LIVE GOOGLE SHEET CSV URL
// ====================================================================
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTueKfhtvkCjeBDBNHQmANJV7f9t0Cuh87TQJyeM48_IIm3b90PTvI67Lipuu_3X6hp1zsqzDRt8dg4/pub?gid=0&single=true&output=csv';

let allEmployeeData = [];

// ====================================================================
// Function to load and parse CSV data using Papa Parse
// ====================================================================
function loadCSV(url) {
    return new Promise((resolve, reject) => {
        // Papa Parse automatically handles fetching and parsing the CSV from the URL
        Papa.parse(url, {
            download: true,       // Tell Papa Parse to download the file from the URL
            header: true,         // Treat the first row as column headers
            skipEmptyLines: true,
            complete: function(results) {
                if (results.errors.length) {
                    reject(results.errors);
                } else {
                    resolve(results.data);
                }
            },
            error: function(err) {
                reject(err);
            }
        });
    });
}

// ====================================================================
// Filtering and Rendering Functions (mostly unchanged)
// ====================================================================

function filterData(data, searchTerm) {
    const term = String(searchTerm).toLowerCase().trim();
    if (!term) return [];

    return data.filter(row => {
        // Ensure values are treated as strings for robust searching
        // We use the exact headers from your data: 'Employee Code' and 'Employee Name'
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
    // Get headers dynamically from the first valid row
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

        // Sum the 'Hours' column. Note: Papa Parse reads all values as strings, so we parse it.
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
    // 1. Inject the Papa Parse library dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js';
    document.head.appendChild(script);

    // 2. Wait for Papa Parse to load
    await new Promise(resolve => script.onload = resolve);
    
    // 3. Show a loading message
    document.getElementById('data-table-container').innerHTML = '<p>Loading data from Google Sheet...</p>';

    // 4. Load the data
    try {
        allEmployeeData = await loadCSV(CSV_URL); 
        
        // Remove rows where all essential columns are empty, if any.
        allEmployeeData = allEmployeeData.filter(row => row['Employee Code'] || row['Employee Name']);

        if (allEmployeeData.length > 0) {
            document.getElementById('data-table-container').innerHTML = '<p class="placeholder">Search to see your data.</p>';
            console.log("Data loaded successfully:", allEmployeeData.length, "rows.");
        } else {
             document.getElementById('data-table-container').innerHTML = '<p style="color: orange;">Data loaded, but no usable employee records found.</p>';
        }

    } catch (error) {
        console.error("Error loading CSV data:", error);
        document.getElementById('data-table-container').innerHTML = 
            '<p style="color: red;">Error loading live data. Please ensure the Google Sheet is published correctly and the URL is valid.</p>';
        return; // Stop execution if data fails to load
    }

    // 5. Setup search functionality
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    const handleSearch = () => {
        const searchTerm = searchInput.value;
        const filtered = filterData(allEmployeeData, searchTerm);
        renderResults(filtered);
    };

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
});
