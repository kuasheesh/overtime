// A simple function to load and parse CSV data
async function loadCSV(url) {
    // Note: We use the fetch API to get the CSV file
    const response = await fetch(url);
    const text = await response.text();

    // Papa Parse is excellent for handling CSV data
    return Papa.parse(text, {
        header: true, // Treat the first row as column headers
        skipEmptyLines: true
    });
}

// Function to filter the data based on search term
function filterData(data, searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];

    return data.filter(row => {
        // Check both 'Employee Code' and 'Employee Name'
        const code = String(row['Employee Code']).toLowerCase();
        const name = String(row['Employee Name']).toLowerCase();

        return code.includes(term) || name.includes(term);
    });
}

// Function to render the results table and total hours
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
    const headers = Object.keys(filteredData[0]); // Get headers from the first row

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
            const value = row[header] || ''; // Use empty string for missing data
            tbody += `<td>${value}</td>`;
        });
        tbody += '</tr>';

        // Sum the 'Hours' column
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
    // Inject the Papa Parse library dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js';
    document.head.appendChild(script);

    // Wait for Papa Parse to load
    await new Promise(resolve => script.onload = resolve);
    
    let allEmployeeData = [];
    
    try {
        const result = await loadCSV('employee_data.csv'); // Load the CSV file
        allEmployeeData = result.data;
        console.log("Data loaded successfully:", allEmployeeData.length, "rows.");

    } catch (error) {
        console.error("Error loading CSV file:", error);
        document.getElementById('data-table-container').innerHTML = 
            '<p style="color: red;">Error loading data. Make sure `employee_data.csv` is in the correct location.</p>';
        return; // Stop if data cannot be loaded
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
