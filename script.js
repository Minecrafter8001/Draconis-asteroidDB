async function fetchCSV() {
    const response = await fetch('asteroids.csv');
    const data = await response.text();
    return data;
}

function parseCSV(data) {
    const rows = data.split('\n').slice(1); // Split by newlines and skip the header
    return rows
        .map(row => row.trim()) // Trim whitespace from each row
        .filter(row => row.length > 0) // Skip empty rows
        .map(row => {
            const cols = row.split(',');
            if (cols.length < 7) {
                console.warn('Skipping incomplete row:', row);
                return null; // Skip rows with fewer than 7 columns
            }
            return {
                Region: cols[0],
                Type: cols[1],
                Composition: cols[2],
                X: parseFloat(cols[3]),
                Y: parseFloat(cols[4]),
                Z: parseFloat(cols[5]),
                Color: cols[6]
            };
        })
        .filter(asteroid => asteroid !== null); // Remove null entries
}

function calculateDistance(x, y, z, originX, originY, originZ) {
    return Math.sqrt((x - originX) ** 2 + (y - originY) ** 2 + (z - originZ) ** 2);
}

function filterAndSortAsteroids(asteroids, targetOres, originX, originY, originZ, maxDistance, amount) {
    return asteroids
        .filter(asteroid => {
            if (!asteroid.Composition) {
                console.warn('Missing Composition for asteroid:', asteroid);
                return false;
            }
            return targetOres.some(ore => asteroid.Composition.includes(ore));
        })
        .map(asteroid => {
            const distance = calculateDistance(asteroid.X, asteroid.Y, asteroid.Z, originX, originY, originZ);
            return { ...asteroid, distance };
        })
        .filter(asteroid => maxDistance === 0 || asteroid.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, amount);
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = results.map((result, index) => {
        const distanceOutput = result.distance > 1000 ? `${(result.distance / 1000).toFixed(2)} km` : `${result.distance.toFixed(0)} m`;
        return `
            <div class="result-item">
                <p><span class="distance">${index + 1}. Distance: ${distanceOutput}</span></p>
                <p>GPS: <span>${result.Region} ${result.Type}</span></p>
                <p>Composition: <span>${result.Composition}</span></p>
                <p>Coordinates: <span>${result.X}, ${result.Y}, ${result.Z}</span></p>
                <p>Color: <span style="color:${result.Color};">${result.Color}</span></p>
            </div>
        `;
    }).join('');
}


document.getElementById('search-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const targetOres = document.getElementById('target-ores').value.split(',');
    const originGPS = document.getElementById('origin-gps').value.split(':');
    const originX = parseFloat(originGPS[2]);
    const originY = parseFloat(originGPS[3]);
    const originZ = parseFloat(originGPS[4]);
    const maxDistance = parseFloat(document.getElementById('max-distance').value);
    const amount = parseInt(document.getElementById('amount').value, 10);

    const csvData = await fetchCSV();
    const asteroids = parseCSV(csvData);
    const results = filterAndSortAsteroids(asteroids, targetOres, originX, originY, originZ, maxDistance, amount);
    displayResults(results);
});
